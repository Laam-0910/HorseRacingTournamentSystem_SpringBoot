package com.horseracing.backend.service;

import com.horseracing.backend.dto.*;
import com.horseracing.backend.entity.*;
import com.horseracing.backend.mapper.*;
import com.horseracing.backend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.sql.Timestamp;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminUserService {

    private final RaceEntryRepository raceEntryRepository;
    private final HorseRepository horseRepository;
    private final JockeyRaceMeetingRegistrationRepository jockeyRegRepository;
    private final OwnerRaceMeetingRegistrationRepository ownerRegRepository;
    private final HorseRaceMeetingRegistrationRepository horseRegRepository;
    private final UserRepository userRepository;
    private final SystemConfigRepository systemConfigRepository;
    private final RaceRepository raceRepository;
    private final RaceMeetingRepository raceMeetingRepository;
    private final RaceRefereeRepository raceRefereeRepository;
    private final SeasonClassRuleRepository seasonClassRuleRepository;
    private final RaceInvitationRepository invitationRepository;

    private final RaceEntryMapper raceEntryMapper;
    private final HorseMapper horseMapper;
    private final RegistrationMapper registrationMapper;
    private final UserMapper userMapper;

    @Transactional(readOnly = true)
    public Map<String, Object> getPendingRegistrations() {
        List<User> allUsers = userRepository.findAll();
        List<Horse> allHorses = horseRepository.findAll();
        List<RaceMeeting> allMeetings = raceMeetingRepository.findAll();
        List<Race> allRaces = raceRepository.findAll();

        Map<Integer, User> userMap = allUsers.stream().collect(Collectors.toMap(User::getId, u -> u));
        Map<Integer, Horse> horseMap = allHorses.stream().collect(Collectors.toMap(Horse::getId, h -> h));
        Map<Integer, RaceMeeting> meetingMap = allMeetings.stream().collect(Collectors.toMap(RaceMeeting::getId, m -> m));
        Map<Integer, Race> raceMap = allRaces.stream().collect(Collectors.toMap(Race::getId, r -> r));

        // 1. Pending Race Entries
        List<RaceEntry> pendingEntries = raceEntryRepository.findAll().stream()
                .filter(e -> "PENDING_ADMIN".equalsIgnoreCase(e.getStatus())).toList();
        List<Map<String, Object>> entriesData = new ArrayList<>();

        // Prediction weights from config
        double weightHorse = Double.parseDouble(systemConfigRepository.findById("PREDICT_WEIGHT_HORSE").map(SystemConfig::getConfigValue).orElse("0.40"));
        double weightJockey = Double.parseDouble(systemConfigRepository.findById("PREDICT_WEIGHT_JOCKEY").map(SystemConfig::getConfigValue).orElse("0.25"));
        double weightClass = Double.parseDouble(systemConfigRepository.findById("PREDICT_WEIGHT_CLASS").map(SystemConfig::getConfigValue).orElse("0.20"));
        double weightForm = Double.parseDouble(systemConfigRepository.findById("PREDICT_WEIGHT_FORM").map(SystemConfig::getConfigValue).orElse("0.15"));

        Map<Integer, List<SeasonClassRule>> seasonRulesCache = new HashMap<>();

        for (RaceEntry entry : pendingEntries) {
            Map<String, Object> map = new HashMap<>();
            
            Horse horse = horseMap.get(entry.getHorseId());
            User owner = horse != null ? userMap.get(horse.getOwnerId()) : null;
            User jockey = userMap.get(entry.getJockeyId());
            Race race = raceMap.get(entry.getRaceId());
            RaceMeeting meeting = race != null ? meetingMap.get(race.getRaceMeetingId()) : null;

            map.put("entry", raceEntryMapper.toDTO(entry, horse != null ? horse.getName() : null, jockey != null ? jockey.getUsername() : null));
            map.put("horse", horseMapper.toDTO(horse, owner != null ? owner.getUsername() : null));
            map.put("owner", userMapper.toDTO(owner));
            map.put("jockey", userMapper.toDTO(jockey));
            
            // Map race details
            if (race != null) {
                map.put("race", RaceDTO.builder()
                        .id(race.getId())
                        .raceMeetingId(race.getRaceMeetingId())
                        .startTime(race.getStartTime())
                        .status(race.getStatus())
                        .classLevel(race.getClassLevel())
                        .distanceMeters(race.getDistanceMeters())
                        .trackType(race.getTrackType())
                        .minEntries(race.getMinEntries())
                        .build());
            } else {
                map.put("race", null);
            }
            map.put("meeting", meeting != null ? RaceMeetingDTO.builder().id(meeting.getId()).name(meeting.getName()).build() : null);

            // Calculate Prediction Scores
            double horseWinRateScore = 0;
            if (horse != null && horse.getTotalRaces() != null && horse.getTotalRaces() > 0) {
                horseWinRateScore = ((double) horse.getTotalWins() / horse.getTotalRaces()) * 100;
            }

            double jockeySkillScore = 0;
            if (jockey != null && jockey.getTotalRacesParticipated() != null && jockey.getTotalRacesParticipated() > 0) {
                jockeySkillScore = ((double) jockey.getTotalTop3Finishes() / jockey.getTotalRacesParticipated()) * 100;
            }

            double classScore = 20;
            String horseClass = "Class 5";
            if (horse != null && horse.getCurrentRating() != null && race != null) {
                int rating = horse.getCurrentRating();
                Integer seasonId = meeting != null ? meeting.getSeasonId() : null;
                List<SeasonClassRule> rules = null;
                if (seasonId != null) {
                    if (!seasonRulesCache.containsKey(seasonId)) {
                        seasonRulesCache.put(seasonId, seasonClassRuleRepository.findBySeasonId(seasonId));
                    }
                    rules = seasonRulesCache.get(seasonId);
                }

                SeasonClassRule matchedRule = null;
                if (rules != null) {
                    for (SeasonClassRule rule : rules) {
                        int min = rule.getMinRating() != null ? rule.getMinRating() : 0;
                        int max = rule.getMaxRating() != null ? rule.getMaxRating() : 999;
                        if (rating >= min && rating <= max) {
                            matchedRule = rule;
                            break;
                        }
                    }
                }

                if (matchedRule != null) {
                    horseClass = matchedRule.getClassLevel();
                    if ("Class 1".equalsIgnoreCase(horseClass)) classScore = 100;
                    else if ("Class 2".equalsIgnoreCase(horseClass)) classScore = 80;
                    else if ("Class 3".equalsIgnoreCase(horseClass)) classScore = 60;
                    else if ("Class 4".equalsIgnoreCase(horseClass)) classScore = 40;
                    else classScore = 20;
                } else {
                    if (rating >= 95) {
                        classScore = 100;
                        horseClass = "Class 1";
                    } else if (rating >= 80) {
                        classScore = 80;
                        horseClass = "Class 2";
                    } else if (rating >= 60) {
                        classScore = 60;
                        horseClass = "Class 3";
                    } else if (rating >= 40) {
                        classScore = 40;
                        horseClass = "Class 4";
                    } else {
                        classScore = 20;
                        horseClass = "Class 5";
                    }
                }
            }

            double recentFormScore = 0;
            if (horse != null) {
                List<RaceEntry> pastRaces = raceEntryRepository.findByHorseId(horse.getId());
                int racesCount = 0;
                double formPoints = 0;
                if (pastRaces != null) {
                    for (int i = pastRaces.size() - 1; i >= 0 && racesCount < 5; i--) {
                        RaceEntry past = pastRaces.get(i);
                        if (("COMPLETED".equalsIgnoreCase(past.getStatus()) || "FINISHED".equalsIgnoreCase(past.getStatus())) && past.getFinalPosition() != null) {
                            int pos = past.getFinalPosition();
                            if (pos == 1) formPoints += 10;
                            else if (pos == 2) formPoints += 7;
                            else if (pos == 3) formPoints += 5;
                            else if (pos == 4) formPoints += 3;
                            else if (pos == 5) formPoints += 1;
                            racesCount++;
                        }
                    }
                }
                recentFormScore = (formPoints / 50.0) * 100;
            }

            double predictionScore = (horseWinRateScore * weightHorse) +
                                     (jockeySkillScore * weightJockey) +
                                     (classScore * weightClass) +
                                     (recentFormScore * weightForm);

            map.put("horseWinRateScore", String.format(Locale.US, "%.2f", horseWinRateScore));
            map.put("jockeySkillScore", String.format(Locale.US, "%.2f", jockeySkillScore));
            map.put("classScore", String.format(Locale.US, "%.2f", classScore));
            map.put("horseClass", horseClass);
            map.put("recentFormScore", String.format(Locale.US, "%.2f", recentFormScore));
            map.put("predictionScore", String.format(Locale.US, "%.2f", predictionScore));

            entriesData.add(map);
        }

        // 2. Pending Horse Meeting Registrations
        List<HorseRaceMeetingRegistration> pendingHorseRegs = horseRegRepository.findAll().stream()
                .filter(r -> "PENDING".equals(r.getStatus())).toList();
        List<Map<String, Object>> pendingHorseRegsData = new ArrayList<>();
        for (HorseRaceMeetingRegistration reg : pendingHorseRegs) {
            Map<String, Object> map = new HashMap<>();
            Horse horse = horseMap.get(reg.getHorseId());
            User owner = horse != null ? userMap.get(horse.getOwnerId()) : null;
            RaceMeeting meeting = meetingMap.get(reg.getRaceMeetingId());

            map.put("registration", registrationMapper.toDTO(reg, horse != null ? horse.getName() : null, meeting != null ? meeting.getName() : null));
            map.put("horse", horseMapper.toDTO(horse, owner != null ? owner.getUsername() : null));
            map.put("owner", userMapper.toDTO(owner));
            map.put("meeting", meeting != null ? RaceMeetingDTO.builder().id(meeting.getId()).name(meeting.getName()).build() : null);
            pendingHorseRegsData.add(map);
        }

        // 3. Pending Jockey Meeting Registrations
        List<JockeyRaceMeetingRegistration> pendingJockeyRegs = jockeyRegRepository.findAll().stream()
                .filter(r -> "PENDING".equals(r.getStatus())).toList();
        List<Map<String, Object>> pendingJockeyRegsData = new ArrayList<>();
        for (JockeyRaceMeetingRegistration reg : pendingJockeyRegs) {
            Map<String, Object> map = new HashMap<>();
            User jockey = userMap.get(reg.getJockeyId());
            RaceMeeting meeting = meetingMap.get(reg.getRaceMeetingId());

            map.put("registration", registrationMapper.toDTO(reg, jockey != null ? jockey.getUsername() : null, meeting != null ? meeting.getName() : null));
            map.put("jockey", userMapper.toDTO(jockey));
            map.put("meeting", meeting != null ? RaceMeetingDTO.builder().id(meeting.getId()).name(meeting.getName()).build() : null);
            pendingJockeyRegsData.add(map);
        }

        // 3.5. Pending Owner Meeting Registrations
        List<OwnerRaceMeetingRegistration> pendingOwnerRegs = ownerRegRepository.findAll().stream()
                .filter(r -> "PENDING".equals(r.getStatus())).toList();
        List<Map<String, Object>> pendingOwnerRegsData = new ArrayList<>();
        for (OwnerRaceMeetingRegistration reg : pendingOwnerRegs) {
            Map<String, Object> map = new HashMap<>();
            User owner = userMap.get(reg.getOwnerId());
            RaceMeeting meeting = meetingMap.get(reg.getRaceMeetingId());

            map.put("registration", registrationMapper.toDTO(reg, owner != null ? owner.getUsername() : null, meeting != null ? meeting.getName() : null));
            map.put("owner", userMapper.toDTO(owner));
            map.put("meeting", meeting != null ? RaceMeetingDTO.builder().id(meeting.getId()).name(meeting.getName()).build() : null);
            pendingOwnerRegsData.add(map);
        }

        // 4. Pending System Horse Approvals
        List<Horse> pendingSystemHorses = horseRepository.findAll().stream()
                .filter(h -> "PENDING".equals(h.getStatus())).toList();
        List<Map<String, Object>> pendingSystemHorsesData = new ArrayList<>();
        for (Horse h : pendingSystemHorses) {
            Map<String, Object> map = new HashMap<>();
            User owner = userMap.get(h.getOwnerId());
            map.put("horse", horseMapper.toDTO(h, owner != null ? owner.getUsername() : null));
            map.put("owner", userMapper.toDTO(owner));
            pendingSystemHorsesData.add(map);
        }

        long totalPendingCount = pendingEntries.size() + pendingHorseRegs.size() + pendingJockeyRegs.size() + pendingOwnerRegs.size() + pendingSystemHorses.size();

        long approvedCount = 
                raceEntryRepository.findAll().stream().filter(e -> "APPROVED".equalsIgnoreCase(e.getStatus()) || "CONFIRMED".equalsIgnoreCase(e.getStatus())).count() +
                horseRegRepository.findAll().stream().filter(r -> "APPROVED".equalsIgnoreCase(r.getStatus())).count() +
                jockeyRegRepository.findAll().stream().filter(r -> "APPROVED".equalsIgnoreCase(r.getStatus())).count() +
                ownerRegRepository.findAll().stream().filter(r -> "APPROVED".equalsIgnoreCase(r.getStatus())).count() +
                horseRepository.findAll().stream().filter(h -> "ACTIVE".equalsIgnoreCase(h.getStatus())).count();

        long rejectedCount = 
                raceEntryRepository.findAll().stream().filter(e -> "REJECTED".equalsIgnoreCase(e.getStatus())).count() +
                horseRegRepository.findAll().stream().filter(r -> "REJECTED".equalsIgnoreCase(r.getStatus())).count() +
                jockeyRegRepository.findAll().stream().filter(r -> "REJECTED".equalsIgnoreCase(r.getStatus())).count() +
                ownerRegRepository.findAll().stream().filter(r -> "REJECTED".equalsIgnoreCase(r.getStatus())).count() +
                horseRepository.findAll().stream().filter(h -> "REJECTED".equalsIgnoreCase(h.getStatus())).count();

        Map<String, Object> response = new HashMap<>();
        response.put("entriesData", entriesData);
        response.put("pendingHorseRegsData", pendingHorseRegsData);
        response.put("pendingJockeyRegsData", pendingJockeyRegsData);
        response.put("pendingOwnerRegsData", pendingOwnerRegsData);
        response.put("pendingSystemHorsesData", pendingSystemHorsesData);
        response.put("awaitingDecisionCount", totalPendingCount);
        response.put("approvedCount", approvedCount);
        response.put("rejectedCount", rejectedCount);

        return response;
    }

    @Transactional
    public void approveRaceEntry(Integer id) {
        RaceEntry entry = raceEntryRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Race entry not found"));
        entry.setStatus("APPROVED");
        raceEntryRepository.save(entry);

        autoAssignGates(entry.getRaceId());
        autoCalculateWeights(entry.getRaceId());
    }

    @Transactional
    public void rejectRaceEntry(Integer id) {
        RaceEntry entry = raceEntryRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Race entry not found"));
        entry.setStatus("REJECTED");
        raceEntryRepository.save(entry);

        // Reject the corresponding invitation so the jockey is freed up
        invitationRepository.findByJockeyIdAndRaceIdAndHorseId(entry.getJockeyId(), entry.getRaceId(), entry.getHorseId())
                .stream()
                .filter(i -> "ACCEPTED".equalsIgnoreCase(i.getStatus()))
                .forEach(i -> {
                    i.setStatus("REJECTED");
                    invitationRepository.save(i);
                });

        autoCalculateWeights(entry.getRaceId());
    }

    @Transactional
    public void approveJockeyReg(Integer id) {
        JockeyRaceMeetingRegistration reg = jockeyRegRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Registration not found"));
        reg.setStatus("APPROVED");
        jockeyRegRepository.save(reg);
    }

    @Transactional
    public void rejectJockeyReg(Integer id) {
        JockeyRaceMeetingRegistration reg = jockeyRegRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Registration not found"));
        reg.setStatus("REJECTED");
        jockeyRegRepository.save(reg);
    }

    @Transactional
    public void approveOwnerReg(Integer id) {
        OwnerRaceMeetingRegistration reg = ownerRegRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Registration not found"));
        reg.setStatus("APPROVED");
        ownerRegRepository.save(reg);
    }

    @Transactional
    public void rejectOwnerReg(Integer id) {
        OwnerRaceMeetingRegistration reg = ownerRegRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Registration not found"));
        reg.setStatus("REJECTED");
        ownerRegRepository.save(reg);
    }

    @Transactional
    public void approveHorseReg(Integer id) {
        HorseRaceMeetingRegistration reg = horseRegRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Registration not found"));
        reg.setStatus("APPROVED");
        
        Optional<Horse> horseOpt = horseRepository.findById(reg.getHorseId());
        if (horseOpt.isPresent()) {
            Horse horse = horseOpt.get();
            horse.setStatus("ACTIVE");
            horseRepository.save(horse);
        }
        horseRegRepository.save(reg);
    }

    @Transactional
    public void rejectHorseReg(Integer id) {
        HorseRaceMeetingRegistration reg = horseRegRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Registration not found"));
        reg.setStatus("REJECTED");
        
        Optional<Horse> horseOpt = horseRepository.findById(reg.getHorseId());
        if (horseOpt.isPresent()) {
            Horse horse = horseOpt.get();
            horse.setStatus("INACTIVE");
            horseRepository.save(horse);
        }
        horseRegRepository.save(reg);
    }

    @Transactional
    public void approveSystemHorse(Integer id) {
        Horse horse = horseRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Horse not found"));
        horse.setStatus("ACTIVE");
        horseRepository.save(horse);
    }

    @Transactional
    public void rejectSystemHorse(Integer id) {
        Horse horse = horseRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Horse not found"));
        horse.setStatus("REJECTED");
        horseRepository.save(horse);
    }

    @Transactional
    public void autoAssignGates(Integer raceId) {
        if (raceId == null) return;
        List<RaceEntry> entries = raceEntryRepository.findByRaceId(raceId);
        List<RaceEntry> approvedEntries = entries.stream()
                .filter(e -> "APPROVED".equalsIgnoreCase(e.getStatus()))
                .toList();

        int count = approvedEntries.size();
        List<Integer> gates = new ArrayList<>();
        for (int i = 1; i <= Math.min(count, 12); i++) {
            gates.add(i);
        }
        Collections.shuffle(gates);

        for (int i = 0; i < approvedEntries.size(); i++) {
            RaceEntry entry = approvedEntries.get(i);
            if (i < gates.size()) {
                entry.setGateNumber(gates.get(i));
            } else {
                entry.setGateNumber(0);
            }
            raceEntryRepository.save(entry);
        }

        raceRepository.findById(raceId).ifPresent(race -> {
            if ("DECLARATION_CLOSED".equals(race.getStatus())) {
                race.setStatus("RACE_ASSIGNED");
                raceRepository.save(race);
            }
        });
    }

    @Transactional
    public void autoCalculateWeights(Integer raceId) {
        if (raceId == null) return;

        double maxTopWeight = systemConfigRepository.findById("MAX_TOP_WEIGHT")
                .map(c -> Double.parseDouble(c.getConfigValue())).orElse(60.0);
        double minBottomWeight = systemConfigRepository.findById("MIN_BOTTOM_WEIGHT")
                .map(c -> Double.parseDouble(c.getConfigValue())).orElse(52.0);
        double weightPerPoint = systemConfigRepository.findById("WEIGHT_PER_POINT")
                .map(c -> Double.parseDouble(c.getConfigValue())).orElse(0.5);
        double sexAllowance = systemConfigRepository.findById("SEX_ALLOWANCE")
                .map(c -> Double.parseDouble(c.getConfigValue())).orElse(1.5);

        List<RaceEntry> entries = raceEntryRepository.findByRaceId(raceId);
        if (entries == null || entries.isEmpty()) return;

        // Find R_max among APPROVED or PENDING_ADMIN entries
        int rMax = -1;
        for (RaceEntry entry : entries) {
            if ("APPROVED".equalsIgnoreCase(entry.getStatus()) || "PENDING_ADMIN".equalsIgnoreCase(entry.getStatus())) {
                Optional<Horse> horseOpt = horseRepository.findById(entry.getHorseId());
                if (horseOpt.isPresent() && horseOpt.get().getCurrentRating() != null) {
                    if (horseOpt.get().getCurrentRating() > rMax) {
                        rMax = horseOpt.get().getCurrentRating();
                    }
                }
            }
        }

        if (rMax == -1) {
            rMax = 52;
        }

        // Calculate weights
        for (RaceEntry entry : entries) {
            if ("APPROVED".equalsIgnoreCase(entry.getStatus()) || "PENDING_ADMIN".equalsIgnoreCase(entry.getStatus())) {
                Optional<Horse> horseOpt = horseRepository.findById(entry.getHorseId());
                Optional<User> jockeyOpt = userRepository.findById(entry.getJockeyId());

                int rating = horseOpt.map(h -> h.getCurrentRating() != null ? h.getCurrentRating() : 0).orElse(0);
                String sex = horseOpt.map(Horse::getSex).orElse("Gelding");
                double handicap = maxTopWeight - (rMax - rating) * weightPerPoint;
                if ("Filly".equalsIgnoreCase(sex) || "Mare".equalsIgnoreCase(sex)) {
                    handicap -= sexAllowance;
                }
                if (handicap < minBottomWeight) {
                    handicap = minBottomWeight;
                }

                double jockeyWeight = jockeyOpt.map(j -> j.getWeight() != null ? j.getWeight().doubleValue() : 50.0).orElse(50.0);
                double carried = Math.max(handicap, jockeyWeight);

                entry.setHandicapWeight(BigDecimal.valueOf(handicap));
                entry.setCarriedWeight(BigDecimal.valueOf(carried));
                raceEntryRepository.save(entry);
            }
        }
    }

    private Integer parseInteger(Object val) {
        if (val == null) return null;
        String s = String.valueOf(val).trim();
        if (s.isEmpty() || "null".equalsIgnoreCase(s) || "undefined".equalsIgnoreCase(s)) return null;
        return Integer.parseInt(s);
    }

    private BigDecimal parseBigDecimal(Object val) {
        if (val == null) return null;
        String s = String.valueOf(val).trim();
        if (s.isEmpty() || "null".equalsIgnoreCase(s) || "undefined".equalsIgnoreCase(s)) return null;
        return new BigDecimal(s);
    }

    @Transactional
    public void updateRacecard(Integer raceId, List<Map<String, Object>> body) {
        for (Map<String, Object> item : body) {
            Object idVal = item.get("entryId");
            if (idVal == null) {
                idVal = item.get("id");
            }
            Integer entryId = parseInteger(idVal);
            if (entryId == null) continue;

            Optional<RaceEntry> entryOpt = raceEntryRepository.findById(entryId);
            if (entryOpt.isPresent()) {
                RaceEntry entry = entryOpt.get();
                if (item.containsKey("gateNumber")) {
                    entry.setGateNumber(parseInteger(item.get("gateNumber")));
                }
                if (item.containsKey("carriedWeight")) {
                    entry.setCarriedWeight(parseBigDecimal(item.get("carriedWeight")));
                }
                if (item.containsKey("handicapWeight")) {
                    entry.setHandicapWeight(parseBigDecimal(item.get("handicapWeight")));
                }
                raceEntryRepository.save(entry);
            }
        }

        // Validate unique gate numbers for all APPROVED entries in this race
        List<RaceEntry> currentEntries = raceEntryRepository.findByRaceId(raceId);
        java.util.Set<Integer> assignedGates = new java.util.HashSet<>();
        for (RaceEntry entry : currentEntries) {
            if ("APPROVED".equalsIgnoreCase(entry.getStatus()) && entry.getGateNumber() != null && entry.getGateNumber() > 0) {
                if (!assignedGates.add(entry.getGateNumber())) {
                    throw new IllegalArgumentException("DUPLICATE_GATE_NUMBER");
                }
            }
        }

        raceRepository.findById(raceId).ifPresent(race -> {
            if ("DECLARATION_CLOSED".equals(race.getStatus())) {
                List<RaceEntry> entries = raceEntryRepository.findByRaceId(raceId);
                boolean allAssigned = true;
                for (RaceEntry entry : entries) {
                    if ("APPROVED".equalsIgnoreCase(entry.getStatus()) && (entry.getGateNumber() == null || entry.getGateNumber() <= 0)) {
                        allAssigned = false;
                        break;
                    }
                }
                if (allAssigned && !entries.isEmpty()) {
                    race.setStatus("RACE_ASSIGNED");
                    raceRepository.save(race);
                }
            }
        });
    }

    @Transactional
    public void assignReferee(Integer raceId, Integer refereeId) {
        Race targetRace = raceRepository.findById(raceId)
                .orElseThrow(() -> new IllegalArgumentException("Race not found"));

        if (targetRace.getStartTime() == null) {
            throw new IllegalArgumentException("Target race does not have a start time scheduled yet.");
        }

        // 1. Check if already assigned to this race
        List<RaceReferee> assignedToCurrentRace = raceRefereeRepository.findByRaceId(raceId);
        boolean isAlreadyAssigned = assignedToCurrentRace.stream()
                .anyMatch(rr -> rr.getRefereeId().equals(refereeId));
        if (isAlreadyAssigned) {
            throw new IllegalArgumentException("Referee is already assigned to this race.");
        }

        // 2. Check for time conflicts (overlapping races at the exact same start time, excluding cancelled races)
        List<RaceReferee> refereeAssignments = raceRefereeRepository.findByRefereeId(refereeId);
        for (RaceReferee assignment : refereeAssignments) {
            if (assignment.getRaceId().equals(raceId)) {
                continue;
            }
            Optional<Race> otherRaceOpt = raceRepository.findById(assignment.getRaceId());
            if (otherRaceOpt.isPresent()) {
                Race otherRace = otherRaceOpt.get();
                if (otherRace.getStartTime() != null && otherRace.getStartTime().equals(targetRace.getStartTime())) {
                    if (!"CANCELLED".equalsIgnoreCase(otherRace.getStatus()) && !"CANCELLED".equalsIgnoreCase(targetRace.getStatus())) {
                        throw new IllegalArgumentException("Referee is already assigned to another race starting at the exact same time (" 
                                + new java.text.SimpleDateFormat("dd-MM-yyyy HH:mm:ss").format(targetRace.getStartTime()) + ").");
                    }
                }
            }
        }

        RaceReferee rr = new RaceReferee();
        rr.setRaceId(raceId);
        rr.setRefereeId(refereeId);
        raceRefereeRepository.save(rr);
    }

    @Transactional
    public void removeReferee(Integer raceId, Integer refereeId) {
        raceRefereeRepository.deleteByRaceIdAndRefereeId(raceId, refereeId);
    }

    @Transactional(readOnly = true)
    public Map<Integer, List<UserDTO>> getRaceRefereesMap() {
        List<RaceReferee> allReferees = raceRefereeRepository.findAll();
        Map<Integer, List<UserDTO>> map = new HashMap<>();
        for (RaceReferee rr : allReferees) {
            userRepository.findById(rr.getRefereeId()).ifPresent(user -> {
                map.computeIfAbsent(rr.getRaceId(), k -> new ArrayList<>()).add(userMapper.toDTO(user));
            });
        }
        return map;
    }

    @Transactional
    public void cancelRace(Integer raceId) {
        Race race = raceRepository.findById(raceId)
                .orElseThrow(() -> new IllegalArgumentException("Race not found"));
        race.setStatus("CANCELLED");
        race.setYoutubeLiveUrl(null); // Automatically remove livestream URL when race is cancelled
        raceRepository.save(race);

        List<RaceEntry> entries = raceEntryRepository.findByRaceId(raceId);
        for (RaceEntry entry : entries) {
            entry.setStatus("REJECTED");
            entry.setGateNumber(0);
            entry.setCarriedWeight(null);
            entry.setHandicapWeight(null);
            raceEntryRepository.save(entry);
        }
    }
}
