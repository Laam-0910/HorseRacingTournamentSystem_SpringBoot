package com.horseracing.backend.service;

import com.horseracing.backend.dto.RaceDTO;
import com.horseracing.backend.dto.RaceMeetingDTO;
import com.horseracing.backend.entity.Race;
import com.horseracing.backend.entity.RaceMeeting;
import com.horseracing.backend.entity.Season;
import com.horseracing.backend.entity.SeasonClassRule;
import com.horseracing.backend.mapper.RaceMapper;
import com.horseracing.backend.mapper.RaceMeetingMapper;
import com.horseracing.backend.repository.RaceMeetingRepository;
import com.horseracing.backend.repository.RaceRepository;
import com.horseracing.backend.repository.SeasonClassRuleRepository;
import com.horseracing.backend.repository.SeasonRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Timestamp;
import java.util.Calendar;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;
import com.horseracing.backend.utils.DateTimeParser;

@Service
@RequiredArgsConstructor
public class RaceService {

    private final RaceRepository raceRepository;
    private final RaceMeetingRepository raceMeetingRepository;
    private final SeasonRepository seasonRepository;
    private final SeasonClassRuleRepository seasonClassRuleRepository;
    private final RaceMapper raceMapper;
    private final RaceMeetingMapper raceMeetingMapper;

    @jakarta.persistence.PersistenceContext
    private jakarta.persistence.EntityManager entityManager;

    public List<RaceDTO> getAllRaces() {
        Map<Integer, String> meetingMap = raceMeetingRepository.findAll().stream()
                .collect(Collectors.toMap(RaceMeeting::getId, RaceMeeting::getName));

        return raceRepository.findAll().stream()
                .map(r -> raceMapper.toDTO(r, meetingMap.get(r.getRaceMeetingId())))
                .collect(Collectors.toList());
    }

    public RaceDTO getRaceById(Integer id) {
        Race race = raceRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Race not found"));
        String meetingName = raceMeetingRepository.findById(race.getRaceMeetingId())
                .map(RaceMeeting::getName)
                .orElse(null);
        return raceMapper.toDTO(race, meetingName);
    }

    @Transactional
    public RaceDTO createRace(RaceDTO dto) {
        if (dto.getStartTime() == null) {
            throw new IllegalArgumentException("Start time is required");
        }

        Race race = raceMapper.toEntity(dto);

        // Auto-populate minRating and maxRating from SeasonClassRule
        if (race.getRaceMeetingId() != null && race.getClassLevel() != null) {
            Optional<RaceMeeting> meetingOpt = raceMeetingRepository.findById(race.getRaceMeetingId());
            if (meetingOpt.isPresent()) {
                Integer seasonId = meetingOpt.get().getSeasonId();
                if (seasonId != null) {
                    List<SeasonClassRule> rules = seasonClassRuleRepository.findBySeasonId(seasonId);
                    String normalizedLevel = race.getClassLevel().trim().toLowerCase();
                    if (!normalizedLevel.startsWith("class")) {
                        normalizedLevel = "class " + normalizedLevel;
                    }
                    for (SeasonClassRule rule : rules) {
                        String ruleLevel = rule.getClassLevel() != null ? rule.getClassLevel().trim().toLowerCase() : "";
                        if (ruleLevel.equals(normalizedLevel)) {
                            race.setMinRating(rule.getMinRating());
                            race.setMaxRating(rule.getMaxRating());
                            break;
                        }
                    }
                }
            }
        }

        // Tự động tính toán hạn đăng ký: mở trước 14 ngày, đóng trước 3 ngày
        Calendar cal = Calendar.getInstance();
        
        cal.setTime(race.getStartTime());
        cal.add(Calendar.DAY_OF_YEAR, -14);
        race.setRegistrationStartTime(new Timestamp(cal.getTimeInMillis()));

        cal.setTime(race.getStartTime());
        cal.add(Calendar.DAY_OF_YEAR, -3);
        race.setRegistrationEndTime(new Timestamp(cal.getTimeInMillis()));

        race.setStatus("SCHEDULED");
        Race savedRace = raceRepository.save(race);

        String meetingName = raceMeetingRepository.findById(savedRace.getRaceMeetingId())
                .map(RaceMeeting::getName)
                .orElse(null);

        return raceMapper.toDTO(savedRace, meetingName);
    }

    @Transactional
    public RaceDTO updateRace(Integer id, Map<String, Object> body) {
        Race race = raceRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Race not found"));

        if (body.get("startTime") != null) {
            race.setStartTime(DateTimeParser.parseTimestamp((String) body.get("startTime")));
        }
        if (body.get("registrationStartTime") != null) {
            race.setRegistrationStartTime(DateTimeParser.parseTimestamp((String) body.get("registrationStartTime")));
        }
        if (body.get("registrationEndTime") != null) {
            race.setRegistrationEndTime(DateTimeParser.parseTimestamp((String) body.get("registrationEndTime")));
        }
        if (body.get("distanceMeters") != null) {
            race.setDistanceMeters(Integer.parseInt(String.valueOf(body.get("distanceMeters"))));
        }
        if (body.get("trackType") != null) {
            race.setTrackType((String) body.get("trackType"));
        }
        if (body.get("purse") != null) {
            race.setPurse(new java.math.BigDecimal(String.valueOf(body.get("purse"))));
        }
        if (body.get("minEntries") != null) {
            race.setMinEntries(Integer.parseInt(String.valueOf(body.get("minEntries"))));
        }
        if (body.get("maxEntries") != null) {
            race.setMaxEntries(Integer.parseInt(String.valueOf(body.get("maxEntries"))));
        }
        if (body.get("youtubeLiveUrl") != null) {
            race.setYoutubeLiveUrl((String) body.get("youtubeLiveUrl"));
        }
        if (body.containsKey("stewardReport")) {
            race.setStewardReport((String) body.get("stewardReport"));
        }

        Race savedRace = raceRepository.save(race);
        String meetingName = raceMeetingRepository.findById(savedRace.getRaceMeetingId())
                .map(RaceMeeting::getName)
                .orElse(null);

        return raceMapper.toDTO(savedRace, meetingName);
    }

    public List<RaceMeetingDTO> getAllMeetings() {
        Map<Integer, String> seasonMap = seasonRepository.findAll().stream()
                .collect(Collectors.toMap(Season::getId, Season::getName));

        return raceMeetingRepository.findAll().stream()
                .map(m -> raceMeetingMapper.toDTO(m, seasonMap.get(m.getSeasonId())))
                .collect(Collectors.toList());
    }

    @Transactional
    public RaceMeetingDTO createMeeting(RaceMeetingDTO dto) {
        RaceMeeting meeting = raceMeetingMapper.toEntity(dto);
        if (meeting.getTotalBudget() == null) {
            meeting.setTotalBudget(java.math.BigDecimal.ZERO);
        }
        RaceMeeting savedMeeting = raceMeetingRepository.save(meeting);
        String seasonName = seasonRepository.findById(savedMeeting.getSeasonId())
                .map(Season::getName)
                .orElse(null);
        return raceMeetingMapper.toDTO(savedMeeting, seasonName);
    }

    @Transactional
    public RaceMeetingDTO updateMeeting(Integer id, RaceMeetingDTO dto) {
        RaceMeeting meeting = raceMeetingRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Race Meeting not found with id: " + id));
        meeting.setName(dto.getName());
        meeting.setVenue(dto.getVenue());
        meeting.setStartDate(dto.getStartDate());
        meeting.setSeasonId(dto.getSeasonId());
        if (dto.getTotalBudget() != null) {
            meeting.setTotalBudget(dto.getTotalBudget());
        }
        RaceMeeting savedMeeting = raceMeetingRepository.save(meeting);
        String seasonName = seasonRepository.findById(savedMeeting.getSeasonId())
                .map(Season::getName)
                .orElse(null);
        return raceMeetingMapper.toDTO(savedMeeting, seasonName);
    }

    @Transactional
    public void deleteMeeting(Integer id) {
        if (!raceMeetingRepository.existsById(id)) {
            throw new IllegalArgumentException("Race Meeting not found with id: " + id);
        }

        // 1. Delete Violations associated with races of this meeting
        entityManager.createNativeQuery(
            "DELETE FROM Violation WHERE race_id IN (SELECT id FROM Race WHERE race_meeting_id = :meetingId)"
        ).setParameter("meetingId", id).executeUpdate();

        // 2. Delete RaceEntries
        entityManager.createNativeQuery(
            "DELETE FROM RaceEntry WHERE race_id IN (SELECT id FROM Race WHERE race_meeting_id = :meetingId)"
        ).setParameter("meetingId", id).executeUpdate();

        // 3. Delete RaceInvitations
        entityManager.createNativeQuery(
            "DELETE FROM RaceInvitation WHERE race_id IN (SELECT id FROM Race WHERE race_meeting_id = :meetingId)"
        ).setParameter("meetingId", id).executeUpdate();

        // 4. Delete RaceReferees
        entityManager.createNativeQuery(
            "DELETE FROM RaceReferee WHERE race_id IN (SELECT id FROM Race WHERE race_meeting_id = :meetingId)"
        ).setParameter("meetingId", id).executeUpdate();

        // 5. Delete Races
        entityManager.createNativeQuery(
            "DELETE FROM Race WHERE race_meeting_id = :meetingId"
        ).setParameter("meetingId", id).executeUpdate();

        // 6. Delete HorseRegistrations
        entityManager.createNativeQuery(
            "DELETE FROM HorseRaceMeetingRegistration WHERE race_meeting_id = :meetingId"
        ).setParameter("meetingId", id).executeUpdate();

        // 7. Delete JockeyRegistrations
        entityManager.createNativeQuery(
            "DELETE FROM JockeyRaceMeetingRegistration WHERE race_meeting_id = :meetingId"
        ).setParameter("meetingId", id).executeUpdate();

        // 8. Delete OwnerRegistrations
        entityManager.createNativeQuery(
            "DELETE FROM OwnerRaceMeetingRegistration WHERE race_meeting_id = :meetingId"
        ).setParameter("meetingId", id).executeUpdate();

        // 9. Delete the RaceMeeting itself
        raceMeetingRepository.deleteById(id);
    }

    public List<RaceDTO> getLiveRaces() {
        Map<Integer, String> meetingMap = raceMeetingRepository.findAll().stream()
                .collect(Collectors.toMap(RaceMeeting::getId, RaceMeeting::getName));

        return raceRepository.findByStatus("RUNNING").stream()
                .filter(r -> r.getYoutubeLiveUrl() != null && !r.getYoutubeLiveUrl().trim().isEmpty())
                .map(r -> raceMapper.toDTO(r, meetingMap.get(r.getRaceMeetingId())))
                .collect(Collectors.toList());
    }
}
