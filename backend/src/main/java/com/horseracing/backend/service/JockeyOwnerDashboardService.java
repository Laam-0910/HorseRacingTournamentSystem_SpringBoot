package com.horseracing.backend.service;

import com.horseracing.backend.dto.*;
import com.horseracing.backend.entity.*;
import com.horseracing.backend.mapper.*;
import com.horseracing.backend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class JockeyOwnerDashboardService {

    private final UserRepository userRepository;
    private final HorseRepository horseRepository;
    private final RaceRepository raceRepository;
    private final RaceMeetingRepository raceMeetingRepository;
    private final RaceEntryRepository raceEntryRepository;
    private final RaceInvitationRepository invitationRepository;
    private final JockeyRaceMeetingRegistrationRepository jockeyRegRepository;
    private final OwnerRaceMeetingRegistrationRepository ownerRegRepository;
    private final HorseRaceMeetingRegistrationRepository horseRegRepository;
    private final ViolationRepository violationRepository;

    private final UserMapper userMapper;
    private final HorseMapper horseMapper;
    private final RaceMeetingMapper raceMeetingMapper;
    private final RegistrationMapper registrationMapper;
    private final RaceInvitationMapper invitationMapper;
    private final RaceEntryMapper raceEntryMapper;

    @Transactional(readOnly = true)
    public Map<String, Object> getJockeyDashboard(Integer jockeyId) {
        List<RaceMeeting> meetings = raceMeetingRepository.findAll();
        List<JockeyRaceMeetingRegistration> myRegs = jockeyRegRepository.findByJockeyId(jockeyId);

        Set<Integer> registeredMeetingIds = new HashSet<>();
        Map<Integer, String> regStatuses = new HashMap<>();
        for (JockeyRaceMeetingRegistration reg : myRegs) {
            registeredMeetingIds.add(reg.getRaceMeetingId());
            regStatuses.put(reg.getRaceMeetingId(), reg.getStatus());
        }

        // Calculate stats
        List<RaceEntry> entries = raceEntryRepository.findByJockeyId(jockeyId);
        int totalRaces = 0;
        int totalWins = 0;
        int top3 = 0;
        double earnings = 0.0;

        for (RaceEntry e : entries) {
            if ("FINISHED".equalsIgnoreCase(e.getStatus())) {
                totalRaces++;
                if (e.getFinalPosition() != null) {
                    if (e.getFinalPosition() == 1) {
                        totalWins++;
                    }
                    if (e.getFinalPosition() <= 3) {
                        top3++;
                    }
                }
                if (e.getPrizeMoney() != null) {
                    earnings += e.getPrizeMoney().doubleValue() * 0.10;
                }
            }
        }

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalRaces", totalRaces);
        stats.put("totalWins", totalWins);
        stats.put("top3", top3);
        stats.put("winRate", totalRaces > 0 ? ((double) totalWins / totalRaces) * 100 : 0.0);
        stats.put("earnings", earnings);

        // Notifications
        List<Map<String, Object>> notificationList = new ArrayList<>();
        Map<Integer, String> meetingNameMap = meetings.stream().collect(Collectors.toMap(RaceMeeting::getId, RaceMeeting::getName));

        for (JockeyRaceMeetingRegistration reg : myRegs) {
            String meetingName = meetingNameMap.getOrDefault(reg.getRaceMeetingId(), "Buổi đua");
            Map<String, Object> notif = new HashMap<>();
            notif.put("id", "jockey-" + reg.getId());
            notif.put("meetingId", reg.getRaceMeetingId());
            if ("PENDING".equals(reg.getStatus())) {
                notif.put("title", "Đăng ký buổi đua");
                notif.put("message", "Đơn đăng ký tham gia " + meetingName + " của bạn đang chờ duyệt.");
                notif.put("type", "pending");
            } else if ("APPROVED".equals(reg.getStatus())) {
                notif.put("title", "Đăng ký được chấp nhận");
                notif.put("message", "Đơn đăng ký tham gia " + meetingName + " của bạn đã được CHẤP NHẬN!");
                notif.put("type", "approved");
            } else if ("REJECTED".equals(reg.getStatus())) {
                notif.put("title", "Đăng ký bị từ chối");
                notif.put("message", "Đơn đăng ký tham gia " + meetingName + " của bạn đã bị TỪ CHỐI.");
                notif.put("type", "rejected");
            }
            notificationList.add(notif);
        }

        List<Race> upcomingRaces = raceRepository.findAll();
        for (Race race : upcomingRaces) {
            if ("SCHEDULED".equalsIgnoreCase(race.getStatus()) || "DECLARATION_OPEN".equalsIgnoreCase(race.getStatus())) {
                String meetingName = meetingNameMap.getOrDefault(race.getRaceMeetingId(), "Buổi đua");
                Map<String, Object> notif = new HashMap<>();
                notif.put("id", "race-setup-" + race.getId());
                notif.put("title", "Đường đua mới được thiết lập");
                notif.put("message", "Trận đấu " + race.getClassLevel() + " tại " + meetingName + " được lên lịch vào lúc " + race.getStartTime() + ".");
                notif.put("type", "pending");
                notificationList.add(notif);
            }
        }

        Map<String, Object> response = new HashMap<>();
        response.put("meetings", meetings.stream().map(m -> raceMeetingMapper.toDTO(m, null)).toList());
        response.put("registeredMeetingIds", registeredMeetingIds);
        response.put("regStatuses", regStatuses);
        response.put("jockeyStats", stats);
        response.put("notifications", notificationList);

        return response;
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getJockeyMounts(Integer jockeyId) {
        List<RaceEntry> entries = raceEntryRepository.findByJockeyId(jockeyId);
        List<Map<String, Object>> resolved = new ArrayList<>();

        Map<Integer, User> userMap = userRepository.findAll().stream().collect(Collectors.toMap(User::getId, u -> u));
        Map<Integer, Horse> horseMap = horseRepository.findAll().stream().collect(Collectors.toMap(Horse::getId, h -> h));
        Map<Integer, Race> raceMap = raceRepository.findAll().stream().collect(Collectors.toMap(Race::getId, r -> r));
        Map<Integer, RaceMeeting> meetingMap = raceMeetingRepository.findAll().stream().collect(Collectors.toMap(RaceMeeting::getId, m -> m));

        for (RaceEntry entry : entries) {
            Map<String, Object> map = new HashMap<>();
            map.put("id", entry.getId());
            map.put("horseId", entry.getHorseId());
            map.put("raceId", entry.getRaceId());
            map.put("gateNumber", entry.getGateNumber());
            map.put("carriedWeight", entry.getCarriedWeight());
            map.put("status", entry.getStatus());
            map.put("finalPosition", entry.getFinalPosition());
            map.put("finishTime", entry.getFinishTime());
            map.put("prizeMoney", entry.getPrizeMoney());

            Horse horse = horseMap.get(entry.getHorseId());
            map.put("horseName", horse != null ? horse.getName() : "Unknown Horse");

            Race race = raceMap.get(entry.getRaceId());
            if (race != null) {
                map.put("classLevel", race.getClassLevel());
                map.put("startTime", race.getStartTime());
                RaceMeeting meeting = meetingMap.get(race.getRaceMeetingId());
                map.put("meetingName", meeting != null ? meeting.getName() : "Unknown Event");

                // Load competitors
                List<RaceEntry> allRaceEntries = raceEntryRepository.findByRaceId(race.getId());
                List<Map<String, Object>> competitors = new ArrayList<>();
                for (RaceEntry compEntry : allRaceEntries) {
                    if (!compEntry.getId().equals(entry.getId()) &&
                            ("APPROVED".equalsIgnoreCase(compEntry.getStatus()) ||
                             "PENDING_ADMIN".equalsIgnoreCase(compEntry.getStatus()) ||
                             "FINISHED".equalsIgnoreCase(compEntry.getStatus()))) {
                        Map<String, Object> comp = new HashMap<>();
                        comp.put("gate", compEntry.getGateNumber());
                        Horse cHorse = horseMap.get(compEntry.getHorseId());
                        comp.put("horseName", cHorse != null ? cHorse.getName() : "Unknown");
                        User cJockey = userMap.get(compEntry.getJockeyId());
                        comp.put("jockeyName", cJockey != null ? cJockey.getUsername() : "Unknown");
                        competitors.add(comp);
                    }
                }
                map.put("competitors", competitors);
            } else {
                map.put("classLevel", "N/A");
                map.put("startTime", null);
                map.put("meetingName", "N/A");
                map.put("competitors", new ArrayList<>());
            }
            resolved.add(map);
        }

        return resolved;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getOwnerDashboard(Integer ownerId) {
        List<RaceMeeting> meetings = raceMeetingRepository.findAll();
        List<OwnerRaceMeetingRegistration> myRegs = ownerRegRepository.findByOwnerId(ownerId);

        Set<Integer> registeredMeetingIds = new HashSet<>();
        Map<Integer, String> regStatuses = new HashMap<>();
        for (OwnerRaceMeetingRegistration reg : myRegs) {
            registeredMeetingIds.add(reg.getRaceMeetingId());
            regStatuses.put(reg.getRaceMeetingId(), reg.getStatus());
        }

        List<Horse> myHorses = horseRepository.findByOwnerId(ownerId);
        List<Horse> activeHorses = myHorses.stream().filter(h -> h.getStatus() != null && "ACTIVE".equalsIgnoreCase(h.getStatus().trim())).toList();

        Map<Integer, List<Map<String, Object>>> meetingRegisteredHorses = new HashMap<>();
        Map<Integer, List<HorseDTO>> meetingUnregisteredHorses = new HashMap<>();

        for (RaceMeeting meeting : meetings) {
            List<Map<String, Object>> regHorsesList = new ArrayList<>();
            List<HorseDTO> unregHorsesList = new ArrayList<>();

            for (Horse horse : activeHorses) {
                Optional<HorseRaceMeetingRegistration> hRegOpt = horseRegRepository.findByRaceMeetingIdAndHorseId(meeting.getId(), horse.getId());
                if (hRegOpt.isPresent()) {
                    Map<String, Object> hRegMap = new HashMap<>();
                    hRegMap.put("horse", horseMapper.toDTO(horse, null));
                    hRegMap.put("status", hRegOpt.get().getStatus() != null ? hRegOpt.get().getStatus().trim() : null);
                    hRegMap.put("regId", hRegOpt.get().getId());
                    regHorsesList.add(hRegMap);
                } else {
                    unregHorsesList.add(horseMapper.toDTO(horse, null));
                }
            }
            meetingRegisteredHorses.put(meeting.getId(), regHorsesList);
            meetingUnregisteredHorses.put(meeting.getId(), unregHorsesList);
        }

        Map<Integer, List<HorseDTO>> meetingHorses = new HashMap<>();
        Map<Integer, List<UserDTO>> meetingJockeys = new HashMap<>();

        for (RaceMeeting meeting : meetings) {
            // Find approved horses for this meeting belonging to this owner
            List<HorseRaceMeetingRegistration> approvedHorseRegs = horseRegRepository.findAll().stream()
                    .filter(r -> r.getRaceMeetingId().equals(meeting.getId()) && "APPROVED".equalsIgnoreCase(r.getStatus()))
                    .toList();
            List<HorseDTO> hList = new ArrayList<>();
            for (HorseRaceMeetingRegistration reg : approvedHorseRegs) {
                horseRepository.findById(reg.getHorseId())
                        .filter(h -> h.getOwnerId() != null && h.getOwnerId().equals(ownerId) && !"RETIRED".equalsIgnoreCase(h.getStatus()))
                        .ifPresent(h -> hList.add(horseMapper.toDTO(h, null)));
            }
            meetingHorses.put(meeting.getId(), hList);

            // Find approved jockeys for this meeting
            List<JockeyRaceMeetingRegistration> approvedJockeyRegs = jockeyRegRepository.findAll().stream()
                    .filter(r -> r.getRaceMeetingId().equals(meeting.getId()) && "APPROVED".equalsIgnoreCase(r.getStatus()))
                    .toList();
            List<UserDTO> jList = new ArrayList<>();
            for (JockeyRaceMeetingRegistration reg : approvedJockeyRegs) {
                userRepository.findById(reg.getJockeyId()).ifPresent(u -> jList.add(userMapper.toDTO(u)));
            }
            meetingJockeys.put(meeting.getId(), jList);
        }

        // Compute bookedJockeysMap and bookedHorsesMap for each race to filter out busy entities
        List<RaceEntry> allEntries = raceEntryRepository.findAll();
        List<Race> allRaces = raceRepository.findAll();
        Map<Integer, Race> allRacesMap = allRaces.stream().collect(Collectors.toMap(Race::getId, r -> r));

        Map<Integer, List<RaceEntry>> activeEntriesByRace = allEntries.stream()
                .filter(e -> !"REJECTED".equalsIgnoreCase(e.getStatus()) && e.getJockeyId() != null)
                .collect(Collectors.groupingBy(RaceEntry::getRaceId));

        Map<Integer, List<RaceEntry>> approvedEntriesByJockey = allEntries.stream()
                .filter(e -> ("APPROVED".equalsIgnoreCase(e.getStatus()) || "CONFIRMED".equalsIgnoreCase(e.getStatus())) && e.getJockeyId() != null)
                .collect(Collectors.groupingBy(RaceEntry::getJockeyId));

        Map<Integer, List<RaceEntry>> activeEntriesByRaceForHorse = allEntries.stream()
                .filter(e -> !"REJECTED".equalsIgnoreCase(e.getStatus()) && e.getHorseId() != null)
                .collect(Collectors.groupingBy(RaceEntry::getRaceId));

        Map<Integer, List<RaceEntry>> approvedEntriesByHorse = allEntries.stream()
                .filter(e -> ("APPROVED".equalsIgnoreCase(e.getStatus()) || "CONFIRMED".equalsIgnoreCase(e.getStatus())) && e.getHorseId() != null)
                .collect(Collectors.groupingBy(RaceEntry::getHorseId));

        Map<Integer, List<Integer>> bookedJockeysMap = new HashMap<>();
        Map<Integer, List<Integer>> bookedHorsesMap = new HashMap<>();

        for (Race race : allRaces) {
            Set<Integer> bookedJockeyIds = new HashSet<>();
            Set<Integer> bookedHorseIds = new HashSet<>();

            // 1. Jockeys with active entries in this race (e.g. accepted invite waiting for admin approval)
            List<RaceEntry> raceEntries = activeEntriesByRace.getOrDefault(race.getId(), Collections.emptyList());
            for (RaceEntry entry : raceEntries) {
                bookedJockeyIds.add(entry.getJockeyId());
            }

            // 2. Jockeys with approved entries in other races at the same time
            if (race.getStartTime() != null) {
                for (Map.Entry<Integer, List<RaceEntry>> entry : approvedEntriesByJockey.entrySet()) {
                    Integer jockeyId = entry.getKey();
                    for (RaceEntry e : entry.getValue()) {
                        if (!e.getRaceId().equals(race.getId())) {
                            Race otherRace = allRacesMap.get(e.getRaceId());
                            if (otherRace != null && otherRace.getStartTime() != null &&
                                    otherRace.getStartTime().equals(race.getStartTime())) {
                                bookedJockeyIds.add(jockeyId);
                                break;
                            }
                        }
                    }
                }
            }

            // 3. Horses with active entries in this race
            List<RaceEntry> horseRaceEntries = activeEntriesByRaceForHorse.getOrDefault(race.getId(), Collections.emptyList());
            for (RaceEntry entry : horseRaceEntries) {
                bookedHorseIds.add(entry.getHorseId());
            }

            // 4. Horses with approved entries in other races at the same time
            if (race.getStartTime() != null) {
                for (Map.Entry<Integer, List<RaceEntry>> entry : approvedEntriesByHorse.entrySet()) {
                    Integer horseId = entry.getKey();
                    for (RaceEntry e : entry.getValue()) {
                        if (!e.getRaceId().equals(race.getId())) {
                            Race otherRace = allRacesMap.get(e.getRaceId());
                            if (otherRace != null && otherRace.getStartTime() != null &&
                                    otherRace.getStartTime().equals(race.getStartTime())) {
                                bookedHorseIds.add(horseId);
                                break;
                            }
                        }
                    }
                }
            }

            bookedJockeysMap.put(race.getId(), new ArrayList<>(bookedJockeyIds));
            bookedHorsesMap.put(race.getId(), new ArrayList<>(bookedHorseIds));
        }

        double sumPositions = 0.0;
        int finishedEntriesCount = 0;
        for (Horse h : activeHorses) {
            List<RaceEntry> entries = raceEntryRepository.findByHorseId(h.getId());
            for (RaceEntry e : entries) {
                if ("FINISHED".equalsIgnoreCase(e.getStatus())) {
                    if (e.getFinalPosition() != null) {
                        sumPositions += e.getFinalPosition();
                        finishedEntriesCount++;
                    }
                }
            }
        }
        double averagePlace = finishedEntriesCount > 0 ? (sumPositions / finishedEntriesCount) : 0.0;

        long pendingRegsCount = horseRegRepository.findAll().stream()
                .filter(r -> "PENDING".equalsIgnoreCase(r.getStatus()))
                .filter(r -> {
                    Optional<Horse> h = horseRepository.findById(r.getHorseId());
                    return h.isPresent() && h.get().getOwnerId().equals(ownerId);
                })
                .count();

        Map<String, Object> response = new HashMap<>();
        response.put("meetings", meetings.stream().map(m -> raceMeetingMapper.toDTO(m, null)).toList());
        response.put("registeredMeetingIds", registeredMeetingIds);
        response.put("regStatuses", regStatuses);
        response.put("meetingRegisteredHorses", meetingRegisteredHorses);
        response.put("meetingUnregisteredHorses", meetingUnregisteredHorses);
        response.put("meetingHorses", meetingHorses);
        response.put("meetingJockeys", meetingJockeys);
        response.put("activeHorses", activeHorses.stream().map(h -> horseMapper.toDTO(h, null)).toList());
        response.put("totalHorses", activeHorses.size());
        response.put("averagePlace", averagePlace > 0 ? averagePlace : null);
        response.put("pendingRegistrations", pendingRegsCount);
        response.put("racesCompleted", finishedEntriesCount);
        response.put("bookedJockeysMap", bookedJockeysMap);
        response.put("bookedHorsesMap", bookedHorsesMap);

        return response;
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getOwnerStable(Integer ownerId) {
        List<Horse> horses = horseRepository.findByOwnerId(ownerId);
        List<Map<String, Object>> resolved = new ArrayList<>();

        Map<Integer, Race> raceMap = raceRepository.findAll().stream().collect(Collectors.toMap(Race::getId, r -> r));
        Map<Integer, RaceMeeting> meetingMap = raceMeetingRepository.findAll().stream().collect(Collectors.toMap(RaceMeeting::getId, m -> m));

        for (Horse h : horses) {
            Map<String, Object> map = new HashMap<>();
            map.put("horse", horseMapper.toDTO(h, null));

            List<RaceEntry> entries = raceEntryRepository.findByHorseId(h.getId());
            int totalRaces = 0;
            int totalWins = 0;
            double totalPrize = 0.0;
            double sumPos = 0.0;
            int finishedRaces = 0;
            List<Map<String, Object>> history = new ArrayList<>();

            for (RaceEntry e : entries) {
                if ("FINISHED".equalsIgnoreCase(e.getStatus())) {
                    finishedRaces++;
                    totalRaces++;
                    if (e.getFinalPosition() != null) {
                        sumPos += e.getFinalPosition();
                        if (e.getFinalPosition() == 1) {
                            totalWins++;
                        }
                    }
                    if (e.getPrizeMoney() != null) {
                        totalPrize += e.getPrizeMoney().doubleValue();
                    }

                    Map<String, Object> histMap = new HashMap<>();
                    histMap.put("position", e.getFinalPosition());
                    histMap.put("time", e.getFinishTime());
                    histMap.put("prize", e.getPrizeMoney());
                    histMap.put("adjustment", e.getRatingAdjustment());

                    Race race = raceMap.get(e.getRaceId());
                    if (race != null) {
                        histMap.put("classLevel", race.getClassLevel());
                        histMap.put("startTime", race.getStartTime());
                        RaceMeeting mt = meetingMap.get(race.getRaceMeetingId());
                        histMap.put("meetingName", mt != null ? mt.getName() : "Unknown");
                    }
                    history.add(histMap);
                }
            }

            map.put("totalRaces", totalRaces);
            map.put("totalWins", totalWins);
            map.put("totalPrize", totalPrize);
            map.put("avgPosition", finishedRaces > 0 ? (sumPos / finishedRaces) : 0.0);
            map.put("history", history);

            resolved.add(map);
        }

        return resolved;
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getJockeyViolations(Integer jockeyId) {
        List<Violation> viols = violationRepository.findByJockeyId(jockeyId);
        List<Map<String, Object>> resolved = new ArrayList<>();

        Map<Integer, User> userMap = userRepository.findAll().stream().collect(Collectors.toMap(User::getId, u -> u));
        Map<Integer, Horse> horseMap = horseRepository.findAll().stream().collect(Collectors.toMap(Horse::getId, h -> h));
        Map<Integer, Race> raceMap = raceRepository.findAll().stream().collect(Collectors.toMap(Race::getId, r -> r));
        Map<Integer, RaceMeeting> meetingMap = raceMeetingRepository.findAll().stream().collect(Collectors.toMap(RaceMeeting::getId, m -> m));

        for (Violation v : viols) {
            Map<String, Object> map = new HashMap<>();
            map.put("id", v.getId());
            map.put("description", v.getDescription());
            map.put("penalty", v.getPenalty());
            map.put("status", v.getStatus() != null ? v.getStatus().trim() : null);
            map.put("type", "Rules Violation");

            Horse horse = horseMap.get(v.getHorseId());
            map.put("horseName", horse != null ? horse.getName() : "Unknown Horse");

            Race race = raceMap.get(v.getRaceId());
            if (race != null) {
                map.put("raceName", race.getClassLevel());
                map.put("date", race.getStartTime() != null ? race.getStartTime().toString() : "N/A");
                
                RaceMeeting mt = meetingMap.get(race.getRaceMeetingId());
                if (mt != null) {
                    map.put("raceName", race.getClassLevel() + " at " + mt.getName());
                }
            } else {
                map.put("raceName", "Unknown Race");
                map.put("date", "N/A");
            }

            User ref = userMap.get(v.getRefereeId());
            map.put("refereeName", ref != null ? ref.getUsername() : "Unknown Referee");

            resolved.add(map);
        }

        return resolved;
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getOwnerResults(Integer ownerId) {
        List<Horse> horses = horseRepository.findByOwnerId(ownerId);
        List<Map<String, Object>> resultsList = new ArrayList<>();

        Map<Integer, Race> raceMap = raceRepository.findAll().stream().collect(Collectors.toMap(Race::getId, r -> r));
        Map<Integer, RaceMeeting> meetingMap = raceMeetingRepository.findAll().stream().collect(Collectors.toMap(RaceMeeting::getId, m -> m));

        for (Horse h : horses) {
            List<RaceEntry> entries = raceEntryRepository.findByHorseId(h.getId());
            for (RaceEntry e : entries) {
                if ("FINISHED".equalsIgnoreCase(e.getStatus())) {
                    Map<String, Object> map = new HashMap<>();
                    map.put("startTime", null);
                    map.put("meetingName", "—");
                    map.put("classLevel", "—");
                    
                    Race race = raceMap.get(e.getRaceId());
                    if (race != null) {
                        map.put("startTime", race.getStartTime());
                        map.put("classLevel", race.getClassLevel());
                        RaceMeeting mt = meetingMap.get(race.getRaceMeetingId());
                        if (mt != null) {
                            map.put("meetingName", mt.getName());
                        }
                    }
                    map.put("horseName", h.getName());
                    map.put("horseId", h.getId());
                    map.put("position", e.getFinalPosition());
                    map.put("finishTime", e.getFinishTime());
                    map.put("ratingAdjustment", e.getRatingAdjustment());
                    map.put("prizeMoney", e.getPrizeMoney() != null ? e.getPrizeMoney().doubleValue() : 0.0);
                    resultsList.add(map);
                }
            }
        }

        resultsList.sort((r1, r2) -> {
            Object t1 = r1.get("startTime");
            Object t2 = r2.get("startTime");
            if (t1 == null && t2 == null) return 0;
            if (t1 == null) return 1;
            if (t2 == null) return -1;
            return t2.toString().compareTo(t1.toString());
        });

        return resultsList;
    }
}
