package com.horseracing.backend.service;

import com.horseracing.backend.dto.RaceDTO;
import com.horseracing.backend.dto.RaceMeetingDTO;
import com.horseracing.backend.entity.Race;
import com.horseracing.backend.entity.RaceMeeting;
import com.horseracing.backend.entity.Season;
import com.horseracing.backend.mapper.RaceMapper;
import com.horseracing.backend.mapper.RaceMeetingMapper;
import com.horseracing.backend.repository.RaceMeetingRepository;
import com.horseracing.backend.repository.RaceRepository;
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

@Service
@RequiredArgsConstructor
public class RaceService {

    private final RaceRepository raceRepository;
    private final RaceMeetingRepository raceMeetingRepository;
    private final SeasonRepository seasonRepository;
    private final RaceMapper raceMapper;
    private final RaceMeetingMapper raceMeetingMapper;

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
            String st = ((String) body.get("startTime")).replace('T', ' ');
            if (st.length() == 16) st += ":00";
            race.setStartTime(Timestamp.valueOf(st));
        }
        if (body.get("registrationStartTime") != null) {
            String rst = ((String) body.get("registrationStartTime")).replace('T', ' ');
            if (rst.length() == 16) rst += ":00";
            race.setRegistrationStartTime(Timestamp.valueOf(rst));
        }
        if (body.get("registrationEndTime") != null) {
            String ret = ((String) body.get("registrationEndTime")).replace('T', ' ');
            if (ret.length() == 16) ret += ":00";
            race.setRegistrationEndTime(Timestamp.valueOf(ret));
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

    public List<RaceDTO> getLiveRaces() {
        Map<Integer, String> meetingMap = raceMeetingRepository.findAll().stream()
                .collect(Collectors.toMap(RaceMeeting::getId, RaceMeeting::getName));

        return raceRepository.findByStatus("RUNNING").stream()
                .filter(r -> r.getYoutubeLiveUrl() != null && !r.getYoutubeLiveUrl().trim().isEmpty())
                .map(r -> raceMapper.toDTO(r, meetingMap.get(r.getRaceMeetingId())))
                .collect(Collectors.toList());
    }
}
