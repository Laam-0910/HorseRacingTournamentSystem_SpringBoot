package com.horseracing.backend.service;

import com.horseracing.backend.dto.ViolationDTO;
import com.horseracing.backend.entity.*;
import com.horseracing.backend.mapper.ViolationMapper;
import com.horseracing.backend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RefereeService {

    private final RaceRepository raceRepository;
    private final RaceEntryRepository raceEntryRepository;
    private final ViolationRepository violationRepository;
    private final UserRepository userRepository;
    private final HorseRepository horseRepository;
    private final ViolationMapper violationMapper;
    private final RaceRefereeRepository raceRefereeRepository;
    private final RaceMeetingRepository raceMeetingRepository;

    @Transactional
    public void preRaceCheck(Integer raceId, List<Map<String, Object>> entriesData) {
        Race race = raceRepository.findById(raceId)
                .orElseThrow(() -> new IllegalArgumentException("Race not found"));

        // Validate minimum entries
        long activeCount = entriesData.stream()
                .filter(e -> !"REJECTED".equalsIgnoreCase((String) e.get("status")))
                .count();
        int minEntries = race.getMinEntries() != null ? race.getMinEntries() : 3;
        if (activeCount < minEntries) {
            throw new IllegalArgumentException("Cannot start race. Active entries (" + activeCount + ") is below minimum allowed (" + minEntries + ").");
        }

        // Validate that all participating entries have a gate number assigned
        List<RaceEntry> dbEntries = raceEntryRepository.findByRaceId(raceId);
        for (RaceEntry e : dbEntries) {
            String targetStatus = e.getStatus();
            for (Map<String, Object> entryData : entriesData) {
                Integer entryId = (Integer) entryData.get("entryId");
                if (e.getId().equals(entryId)) {
                    targetStatus = (String) entryData.get("status");
                    break;
                }
            }
            if (!"REJECTED".equalsIgnoreCase(targetStatus) && (e.getGateNumber() == null || e.getGateNumber() <= 0)) {
                throw new IllegalArgumentException("Cannot start race. Some horses do not have valid gate numbers.");
            }
        }

        // Update weigh-out weights and status
        for (Map<String, Object> entryData : entriesData) {
            Integer entryId = (Integer) entryData.get("entryId");
            Object weightVal = entryData.get("weighOutWeight");
            if (weightVal == null) {
                weightVal = entryData.get("carriedWeight");
            }
            BigDecimal weighOutWeight = BigDecimal.ZERO;
            if (weightVal != null) {
                String ws = weightVal.toString().trim();
                if (!ws.isEmpty() && !"null".equalsIgnoreCase(ws) && !"undefined".equalsIgnoreCase(ws)) {
                    weighOutWeight = new BigDecimal(ws);
                }
            }
            String status = (String) entryData.get("status"); // APPROVED, REJECTED (Scratched)

            Optional<RaceEntry> entryOpt = raceEntryRepository.findById(entryId);
            if (entryOpt.isPresent()) {
                RaceEntry entry = entryOpt.get();
                if (!"REJECTED".equalsIgnoreCase(status)) {
                    BigDecimal reqWeight = entry.getCarriedWeight() != null ? entry.getCarriedWeight() : new BigDecimal("52.0");
                    BigDecimal diff = weighOutWeight.subtract(reqWeight);
                    if (diff.compareTo(BigDecimal.ZERO) < 0) {
                        throw new IllegalArgumentException("Cannot confirm pre-check. Weighed weight (" + weighOutWeight + " kg) cannot be less than required weight (" + reqWeight + " kg) for entry ID " + entryId + ".");
                    }
                    if (diff.compareTo(new BigDecimal("1.0")) > 0) {
                        throw new IllegalArgumentException("Cannot confirm pre-check. Weighed weight (" + weighOutWeight + " kg) exceeds required weight (" + reqWeight + " kg) by more than 1.0 kg limit for entry ID " + entryId + ".");
                    }
                }
                entry.setCarriedWeight(weighOutWeight);
                entry.setStatus(status);
                raceEntryRepository.save(entry);
            }
        }

        race.setStatus("RACE_ASSIGNED");
        raceRepository.save(race);
    }

    @Transactional
    public void startRace(Integer raceId) {
        Race race = raceRepository.findById(raceId)
                .orElseThrow(() -> new IllegalArgumentException("Race not found"));
        if (!"RACE_ASSIGNED".equals(race.getStatus())) {
            throw new IllegalStateException("Race must be in RACE_ASSIGNED status to start (Pre-Race check must be completed first)");
        }
        race.setStatus("RUNNING");
        raceRepository.save(race);

        // Transition all APPROVED entries of this race to RUNNING
        List<RaceEntry> entries = raceEntryRepository.findByRaceId(raceId);
        for (RaceEntry entry : entries) {
            if ("APPROVED".equalsIgnoreCase(entry.getStatus())) {
                entry.setStatus("RUNNING");
                raceEntryRepository.save(entry);
            }
        }
    }

    @Transactional
    public ViolationDTO logViolation(ViolationDTO dto) {
        Violation violation = violationMapper.toEntity(dto);
        violation.setStatus("PENDING");

        // If severe violation, update RaceEntry status to DISQUALIFIED immediately
        if (dto.getPenalty() != null && (dto.getPenalty().contains("DQ") || dto.getPenalty().contains("DISQUALIFIED"))) {
            List<RaceEntry> entries = raceEntryRepository.findByRaceId(dto.getRaceId());
            for (RaceEntry entry : entries) {
                if (entry.getHorseId().equals(dto.getHorseId()) && entry.getJockeyId().equals(dto.getJockeyId())) {
                    entry.setStatus("DISQUALIFIED");
                    entry.setFinalPosition(null);
                    entry.setFinishTime("DQ");
                    entry.setRatingAdjustment(-2);
                    raceEntryRepository.save(entry);

                    // Update Horse rating (-2)
                    Optional<Horse> horseOpt = horseRepository.findById(dto.getHorseId());
                    if (horseOpt.isPresent()) {
                        Horse horse = horseOpt.get();
                        int curRating = horse.getCurrentRating() != null ? horse.getCurrentRating() : 52;
                        horse.setCurrentRating(Math.max(0, curRating - 2));
                        horseRepository.save(horse);
                    }
                    break;
                }
            }
            violation.setStatus("DISQUALIFIED_IMMEDIATELY");
        }

        Violation savedViolation = violationRepository.save(violation);

        // Trigger STEWARDS_INQUIRY if the race is RUNNING or FINISHED
        if (dto.getRaceId() != null) {
            Optional<Race> raceOpt = raceRepository.findById(dto.getRaceId());
            if (raceOpt.isPresent()) {
                Race race = raceOpt.get();
                String raceStatus = race.getStatus();
                if ("RUNNING".equals(raceStatus) || "FINISHED".equals(raceStatus)) {
                    race.setStatus("STEWARDS_INQUIRY");
                    raceRepository.save(race);
                }
            }
        }

        Map<Integer, String> userMap = userRepository.findAll().stream()
                .collect(Collectors.toMap(User::getId, User::getUsername));
        String horseName = horseRepository.findById(savedViolation.getHorseId())
                .map(Horse::getName)
                .orElse(null);

        return violationMapper.toDTO(savedViolation,
                horseName,
                userMap.get(savedViolation.getJockeyId()),
                userMap.get(savedViolation.getRefereeId()));
    }

    public List<ViolationDTO> getViolationsByRace(Integer raceId) {
        Map<Integer, String> userMap = userRepository.findAll().stream()
                .collect(Collectors.toMap(User::getId, User::getUsername));
        Map<Integer, String> horseMap = horseRepository.findAll().stream()
                .collect(Collectors.toMap(Horse::getId, Horse::getName));

        return violationRepository.findByRaceId(raceId).stream()
                .map(v -> violationMapper.toDTO(v, 
                        horseMap.get(v.getHorseId()), 
                        userMap.get(v.getJockeyId()), 
                        userMap.get(v.getRefereeId())))
                .collect(Collectors.toList());
     }

    @Transactional(readOnly = true)
    public Map<String, Object> getRefereeDashboard(Integer refereeId) {
        List<RaceReferee> duties = raceRefereeRepository.findByRefereeId(refereeId);
        List<Map<String, Object>> resolvedRaces = new java.util.ArrayList<>();
        int completedCount = 0;
        int pendingCount = 0;

        Map<Integer, User> userMap = userRepository.findAll().stream().collect(Collectors.toMap(User::getId, u -> u));
        Map<Integer, Horse> horseMap = horseRepository.findAll().stream().collect(Collectors.toMap(Horse::getId, h -> h));
        Map<Integer, RaceMeeting> meetingMap = raceMeetingRepository.findAll().stream().collect(Collectors.toMap(RaceMeeting::getId, m -> m));

        for (RaceReferee duty : duties) {
            Optional<Race> raceOpt = raceRepository.findById(duty.getRaceId());
            if (raceOpt.isPresent()) {
                Race race = raceOpt.get();
                Map<String, Object> resolved = new java.util.HashMap<>();
                resolved.put("id", race.getId());
                resolved.put("startTime", race.getStartTime());
                resolved.put("classLevel", race.getClassLevel());
                resolved.put("status", race.getStatus());
                resolved.put("distanceMeters", race.getDistanceMeters());
                resolved.put("trackType", race.getTrackType());
                resolved.put("purse", race.getPurse());
                resolved.put("minEntries", race.getMinEntries());
                resolved.put("maxEntries", race.getMaxEntries());

                RaceMeeting meeting = meetingMap.get(race.getRaceMeetingId());
                resolved.put("meetingName", meeting != null ? meeting.getName() : "Unknown Meeting");
                resolved.put("venue", meeting != null ? meeting.getVenue() : "Unknown Venue");

                // Check if gates are fully set
                List<RaceEntry> entries = raceEntryRepository.findByRaceId(race.getId());
                boolean gatesFullySet = true;
                if (entries == null || entries.isEmpty()) {
                    gatesFullySet = false;
                } else {
                    for (RaceEntry entry : entries) {
                        if (entry.getGateNumber() == null || entry.getGateNumber() <= 0) {
                            gatesFullySet = false;
                            break;
                        }
                    }
                }
                resolved.put("gatesFullySet", gatesFullySet);

                boolean preCheckCompleted = "RACE_ASSIGNED".equalsIgnoreCase(race.getStatus());
                resolved.put("preCheckCompleted", preCheckCompleted);

                // Load entries details
                List<Map<String, Object>> resolvedEntries = new java.util.ArrayList<>();
                if (entries != null) {
                    for (RaceEntry entry : entries) {
                        Map<String, Object> entryRes = new java.util.HashMap<>();
                        entryRes.put("entryId", entry.getId());
                        entryRes.put("gateNumber", entry.getGateNumber());
                        entryRes.put("carriedWeight", entry.getCarriedWeight());
                        entryRes.put("handicapWeight", entry.getHandicapWeight());
                        entryRes.put("status", entry.getStatus());
                        entryRes.put("finalPosition", entry.getFinalPosition());
                        entryRes.put("finishTime", entry.getFinishTime());

                        Horse horse = horseMap.get(entry.getHorseId());
                        entryRes.put("horseName", horse != null ? horse.getName() : "Unknown");
                        entryRes.put("horseRating", horse != null ? horse.getCurrentRating() : 0);

                        User jockey = userMap.get(entry.getJockeyId());
                        entryRes.put("jockeyName", jockey != null ? jockey.getUsername() : "Unknown");
                        entryRes.put("jockeyWeight", jockey != null ? jockey.getWeight() : BigDecimal.ZERO);

                        resolvedEntries.add(entryRes);
                    }
                }
                resolved.put("entries", resolvedEntries);

                // Fetch recorded violations
                List<Violation> violations = violationRepository.findByRaceId(race.getId());
                List<Map<String, Object>> resolvedViolations = new java.util.ArrayList<>();
                if (violations != null) {
                    for (Violation viol : violations) {
                        Map<String, Object> violRes = new java.util.HashMap<>();
                        violRes.put("id", viol.getId());
                        violRes.put("description", viol.getDescription());
                        violRes.put("penalty", viol.getPenalty());
                        violRes.put("status", viol.getStatus());

                        Horse horse = horseMap.get(viol.getHorseId());
                        violRes.put("horseName", horse != null ? horse.getName() : "Unknown");

                        User jockey = userMap.get(viol.getJockeyId());
                        violRes.put("jockeyName", jockey != null ? jockey.getUsername() : "Unknown");

                        resolvedViolations.add(violRes);
                    }
                }
                resolved.put("violations", resolvedViolations);

                resolvedRaces.add(resolved);

                if ("OFFICIAL".equalsIgnoreCase(race.getStatus()) || "RACE_EVENT_ENDED".equalsIgnoreCase(race.getStatus())) {
                    completedCount++;
                } else {
                    pendingCount++;
                }
            }
        }

        Map<String, Object> response = new java.util.HashMap<>();
        response.put("assignedRaces", resolvedRaces);
        response.put("completedCount", completedCount);
        response.put("pendingCount", pendingCount);
        return response;
    }

    @Transactional
    public void stopRace(Integer raceId, String stewardReport) {
        Race race = raceRepository.findById(raceId)
                .orElseThrow(() -> new IllegalArgumentException("Race not found"));
        race.setStatus("CANCELLED");
        race.setStewardReport(stewardReport);
        race.setYoutubeLiveUrl(null); // Automatically remove livestream URL on emergency stop
        raceRepository.save(race);

        List<RaceEntry> entries = raceEntryRepository.findByRaceId(raceId);
        for (RaceEntry entry : entries) {
            entry.setStatus("REJECTED");
            raceEntryRepository.save(entry);
        }
    }

    @Transactional
    public void confirmViolation(Integer violationId) {
        Violation violation = violationRepository.findById(violationId)
                .orElseThrow(() -> new IllegalArgumentException("Violation not found"));
        violation.setStatus("CONFIRMED");
        violationRepository.save(violation);

        // If no more PENDING violations for this race, reset race to FINISHED
        Integer raceId = violation.getRaceId();
        if (raceId != null) {
            List<Violation> remaining = violationRepository.findByRaceId(raceId);
            boolean hasPending = remaining.stream()
                    .anyMatch(v -> "PENDING".equals(v.getStatus()));
            if (!hasPending) {
                Optional<Race> raceOpt = raceRepository.findById(raceId);
                if (raceOpt.isPresent()) {
                    Race race = raceOpt.get();
                    if ("STEWARDS_INQUIRY".equals(race.getStatus())) {
                        race.setStatus("FINISHED");
                        raceRepository.save(race);
                    }
                }
            }
        }
    }

    @Transactional
    public void dismissViolation(Integer violationId) {
        Violation violation = violationRepository.findById(violationId)
                .orElseThrow(() -> new IllegalArgumentException("Violation not found"));
        violation.setStatus("DISMISSED");
        violationRepository.save(violation);

        // If no more PENDING violations for this race, reset race from STEWARDS_INQUIRY back to FINISHED
        Integer raceId = violation.getRaceId();
        if (raceId != null) {
            List<Violation> remaining = violationRepository.findByRaceId(raceId);
            boolean hasPending = remaining.stream()
                    .anyMatch(v -> "PENDING".equals(v.getStatus()));
            if (!hasPending) {
                Optional<Race> raceOpt = raceRepository.findById(raceId);
                if (raceOpt.isPresent()) {
                    Race race = raceOpt.get();
                    if ("STEWARDS_INQUIRY".equals(race.getStatus())) {
                        race.setStatus("FINISHED");
                        raceRepository.save(race);
                    }
                }
            }
        }
    }

    @Transactional
    public void stopEntry(Integer entryId) {
        RaceEntry entry = raceEntryRepository.findById(entryId)
                .orElseThrow(() -> new IllegalArgumentException("Race entry not found"));
        if (!"APPROVED".equalsIgnoreCase(entry.getStatus()) && !"RUNNING".equalsIgnoreCase(entry.getStatus())) {
            throw new IllegalStateException("Entry must be APPROVED or RUNNING to stop");
        }
        entry.setStatus("STOPPED");
        raceEntryRepository.save(entry);
    }

    @Transactional
    public void resumeEntry(Integer entryId) {
        RaceEntry entry = raceEntryRepository.findById(entryId)
                .orElseThrow(() -> new IllegalArgumentException("Race entry not found"));
        if (!"STOPPED".equalsIgnoreCase(entry.getStatus())) {
            throw new IllegalStateException("Entry must be STOPPED to resume");
        }
        entry.setStatus("RUNNING");
        raceEntryRepository.save(entry);
    }

    @Transactional
    public void disqualifyEntry(Integer entryId) {
        RaceEntry entry = raceEntryRepository.findById(entryId)
                .orElseThrow(() -> new IllegalArgumentException("Race entry not found"));
        entry.setStatus("DISQUALIFIED");
        entry.setFinalPosition(null);
        entry.setFinishTime("DQ");
        entry.setRatingAdjustment(-2);
        raceEntryRepository.save(entry);

        // Update Horse rating (-2)
        Optional<Horse> horseOpt = horseRepository.findById(entry.getHorseId());
        if (horseOpt.isPresent()) {
            Horse horse = horseOpt.get();
            int curRating = horse.getCurrentRating() != null ? horse.getCurrentRating() : 52;
            horse.setCurrentRating(Math.max(0, curRating - 2));
            horseRepository.save(horse);
        }
    }

    @Transactional
    public void suspendRace(Integer raceId, String stewardReport) {
        Race race = raceRepository.findById(raceId)
                .orElseThrow(() -> new IllegalArgumentException("Race not found"));
        if (!"RUNNING".equals(race.getStatus()) && !"STEWARDS_INQUIRY".equals(race.getStatus())) {
            throw new IllegalStateException("Race must be RUNNING or STEWARDS_INQUIRY to suspend");
        }
        race.setStatus("STOPPED");
        race.setStewardReport(stewardReport);
        raceRepository.save(race);
    }

    @Transactional
    public void resumeRace(Integer raceId) {
        Race race = raceRepository.findById(raceId)
                .orElseThrow(() -> new IllegalArgumentException("Race not found"));
        if (!"STOPPED".equals(race.getStatus())) {
            throw new IllegalStateException("Race must be STOPPED to resume");
        }
        race.setStatus("RUNNING");
        raceRepository.save(race);
    }
}
