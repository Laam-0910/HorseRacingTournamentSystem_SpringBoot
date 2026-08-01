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

import java.math.BigDecimal;
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
        // Tạo Map ánh xạ từ ID Ngày hội đua sang Tên ngày hội đua
        Map<Integer, String> meetingMap = raceMeetingRepository.findAll().stream() // Truy vấn toàn bộ Ngày hội đua
                .collect(Collectors.toMap(RaceMeeting::getId, RaceMeeting::getName)); // Gom nhóm ID và Tên Ngày hội đua thành Map

        // Lấy tất cả trận đua từ DB và chuyển đổi sang DTO
        return raceRepository.findAll().stream() // Duyệt danh sách tất cả các trận đua
                .map(r -> raceMapper.toDTO(r, meetingMap.get(r.getRaceMeetingId()))) // Ánh xạ từng trận đua Race sang RaceDTO kèm tên ngày đua
                .collect(Collectors.toList()); // Thu thập kết quả trả về danh sách List<RaceDTO>
    }

    public RaceDTO getRaceById(Integer id) {
        Race race = raceRepository.findById(id) // Tìm kiếm bản ghi trận đua trong DB theo ID
                .orElseThrow(() -> new IllegalArgumentException("Race not found")); // Ném ngoại lệ nếu không tìm thấy trận đua
        String meetingName = raceMeetingRepository.findById(race.getRaceMeetingId()) // Tìm Tên ngày hội đua chứa trận đua này
                .map(RaceMeeting::getName) // Lấy tên Ngày hội đua
                .orElse(null); // Trả về null nếu không tìm thấy
        return raceMapper.toDTO(race, meetingName); // Chuyển đổi đối tượng Race thành RaceDTO
    }

    @Transactional
    public RaceDTO createRace(RaceDTO dto) {
        if (dto.getStartTime() == null) { // Kiểm tra thời gian xuất phát có được cung cấp hay không
            throw new IllegalArgumentException("Start time is required"); // Ném ngoại lệ nếu thời gian bắt đầu bị trống
        }
        validateRaceTimeMatchesMeeting(dto.getStartTime(), dto.getRaceMeetingId()); // Kiểm tra ngày giờ xuất phát trận đua phải trùng ngày với Ngày hội đua
        validateUniqueRaceTime(dto.getStartTime(), dto.getRaceMeetingId(), null); // Kiểm tra không trùng giờ xuất phát với các trận khác cùng Ngày hội đua
        validateLiveUrl(dto.getYoutubeLiveUrl()); // Kiểm tra định dạng đường dẫn Livestream YouTube hợp lệ

        Race race = raceMapper.toEntity(dto); // Chuyển đổi từ RaceDTO sang Race Entity

        // Auto-populate minRating and maxRating from SeasonClassRule
        if (race.getRaceMeetingId() != null && race.getClassLevel() != null) { // Kiểm tra nếu có thông tin Ngày hội đua và Hạng đua Class
            Optional<RaceMeeting> meetingOpt = raceMeetingRepository.findById(race.getRaceMeetingId()); // Tra cứu thông tin Ngày hội đua theo ID
            if (meetingOpt.isPresent()) { // Nếu tìm thấy Ngày hội đua
                Integer seasonId = meetingOpt.get().getSeasonId(); // Lấy mã Mùa giải của Ngày hội đua
                if (seasonId != null) { // Nếu Ngày hội đua thuộc về một Mùa giải
                    List<SeasonClassRule> rules = seasonClassRuleRepository.findBySeasonId(seasonId); // Lấy danh sách quy định hạng điểm Rating của mùa giải đó
                    String normalizedLevel = race.getClassLevel().trim().toLowerCase(); // Chuẩn hóa chuỗi tên Class về chữ thường
                    if (!normalizedLevel.startsWith("class")) { // Thêm tiền tố 'class' nếu thiếu
                        normalizedLevel = "class " + normalizedLevel; // Gán lại chuỗi chuẩn hóa
                    }
                    for (SeasonClassRule rule : rules) { // Duyệt qua từng quy định hạng điểm của mùa giải
                        String ruleLevel = rule.getClassLevel() != null ? rule.getClassLevel().trim().toLowerCase() : ""; // Chuẩn hóa tên hạng đua trong quy định
                        if (ruleLevel.equals(normalizedLevel)) { // Tìm thấy quy định trùng khớp hạng đua
                            race.setMinRating(rule.getMinRating()); // Gán điểm Rating tối thiểu
                            race.setMaxRating(rule.getMaxRating()); // Gán điểm Rating tối đa
                            
                            // Tự động điền tiền thưởng Purse nếu chưa nhập hoặc bằng 0
                            if (race.getPurse() == null || race.getPurse().compareTo(BigDecimal.ZERO) <= 0) {
                                if (rule.getMinPrize() != null && rule.getMinPrize().compareTo(BigDecimal.ZERO) > 0) {
                                    race.setPurse(rule.getMinPrize());
                                } else if (rule.getMaxPrize() != null && rule.getMaxPrize().compareTo(BigDecimal.ZERO) > 0) {
                                    race.setPurse(rule.getMaxPrize());
                                }
                            }
                            break; // Thoát vòng lặp tìm kiếm quy định
                        }
                    }
                }
            }
        }

        // Tự động tính toán hạn đăng ký nếu người dùng không điền: mở trước 14 ngày, đóng trước 3 ngày
        if (race.getRegistrationStartTime() == null) { // Nếu chưa có thời gian mở đăng ký
            Calendar cal = Calendar.getInstance(); // Khởi tạo đối tượng Calendar
            cal.setTime(race.getStartTime()); // Đặt mốc thời gian theo giờ xuất phát
            cal.add(Calendar.DAY_OF_YEAR, -14); // Lùi 14 ngày trước giờ xuất phát
            race.setRegistrationStartTime(new Timestamp(cal.getTimeInMillis())); // Đặt thời gian mở đăng ký
        }

        if (race.getRegistrationEndTime() == null) { // Nếu chưa có thời gian đóng đăng ký
            Calendar cal = Calendar.getInstance(); // Khởi tạo đối tượng Calendar
            cal.setTime(race.getStartTime()); // Đặt mốc thời gian theo giờ xuất phát
            cal.add(Calendar.DAY_OF_YEAR, -3); // Lùi 3 ngày trước giờ xuất phát
            race.setRegistrationEndTime(new Timestamp(cal.getTimeInMillis())); // Đặt thời gian đóng đăng ký
        }

        race.setStatus("SCHEDULED"); // Đặt trạng thái khởi tạo trận đua là SCHEDULED
        validateRaceEntriesLimits(race.getMinEntries(), race.getMaxEntries()); // Kiểm tra giới hạn số lượng ngựa tối thiểu và tối đa
        validateRacePurseAgainstMeetingBudget(race.getRaceMeetingId(), race.getPurse(), null);
        race.updatePrizeDistribution(); // Tự động tính toán phân chia tiền thưởng (Top 1: 50%, Top 2: 30%, Top 3: 20%)
        Race savedRace = raceRepository.save(race); // Lưu đối tượng trận đua vào cơ sở dữ liệu

        String meetingName = raceMeetingRepository.findById(savedRace.getRaceMeetingId()) // Tìm Tên Ngày hội đua để map vào DTO trả về
                .map(RaceMeeting::getName) // Lấy tên Ngày hội đua
                .orElse(null); // Nếu không có thì trả về null

        return raceMapper.toDTO(savedRace, meetingName); // Chuyển đổi đối tượng đã lưu sang RaceDTO
    }

    @Transactional
    public RaceDTO updateRace(Integer id, Map<String, Object> body) {
        Race race = raceRepository.findById(id) // Tìm trận đua trong DB theo ID
                .orElseThrow(() -> new IllegalArgumentException("Race not found")); // Ném ngoại lệ nếu không tìm thấy

        if (body.get("startTime") != null) { // Kiểm tra nếu có cập nhật thời gian xuất phát
            Timestamp newTime = DateTimeParser.parseTimestamp((String) body.get("startTime")); // Parse chuỗi thời gian sang Timestamp
            validateRaceTimeMatchesMeeting(newTime, race.getRaceMeetingId()); // Kiểm tra ngày xuất phát trùng với ngày của Ngày hội đua
            validateUniqueRaceTime(newTime, race.getRaceMeetingId(), id); // Kiểm tra không trùng mốc giờ với các trận đua khác
            race.setStartTime(newTime); // Cập nhật mốc giờ xuất phát mới
        }
        if (body.get("registrationStartTime") != null) { // Kiểm tra nếu có cập nhật thời gian mở đăng ký
            race.setRegistrationStartTime(DateTimeParser.parseTimestamp((String) body.get("registrationStartTime"))); // Cập nhật thời gian mở đăng ký
        }
        if (body.get("registrationEndTime") != null) { // Kiểm tra nếu có cập nhật thời gian đóng đăng ký
            race.setRegistrationEndTime(DateTimeParser.parseTimestamp((String) body.get("registrationEndTime"))); // Cập nhật thời gian đóng đăng ký
        }
        if (body.get("distanceMeters") != null) { // Kiểm tra nếu có cập nhật cự ly chạy
            race.setDistanceMeters(Integer.parseInt(String.valueOf(body.get("distanceMeters")))); // Cập nhật cự ly chạy (mét)
        }
        if (body.get("trackType") != null) { // Kiểm tra nếu có cập nhật loại đường chạy
            race.setTrackType((String) body.get("trackType")); // Cập nhật loại mặt đường đua (Cỏ/Đất/Khác)
        }
        if (body.get("purse") != null) { // Kiểm tra nếu có cập nhật quỹ tiền thưởng
            race.setPurse(new java.math.BigDecimal(String.valueOf(body.get("purse")))); // Cập nhật tổng quỹ tiền thưởng của trận đua
        }
        if (body.get("minEntries") != null) { // Kiểm tra nếu có cập nhật số ngựa tối thiểu
            race.setMinEntries(Integer.parseInt(String.valueOf(body.get("minEntries")))); // Cập nhật giới hạn số ngựa tối thiểu
        }
        if (body.get("maxEntries") != null) { // Kiểm tra nếu có cập nhật số ngựa tối đa
            race.setMaxEntries(Integer.parseInt(String.valueOf(body.get("maxEntries")))); // Cập nhật giới hạn số ngựa tối đa
        }
        if (body.get("youtubeLiveUrl") != null) { // Kiểm tra nếu có cập nhật đường dẫn phát trực tiếp
            String liveUrl = (String) body.get("youtubeLiveUrl"); // Lấy chuỗi đường dẫn URL
            validateLiveUrl(liveUrl); // Xác thực tính hợp lệ của link Livestream
            race.setYoutubeLiveUrl(liveUrl); // Cập nhật link Livestream YouTube
        }
        if (body.containsKey("streamMode")) { // Kiểm tra nếu có cập nhật chế độ stream
            String mode = (String) body.get("streamMode");
            if ("YOUTUBE".equals(mode) || "WEBCAM".equals(mode)) {
                race.setStreamMode(mode);
            }
        }
        if (body.containsKey("stewardReport")) { // Kiểm tra nếu có cập nhật báo cáo trọng tài
            race.setStewardReport((String) body.get("stewardReport")); // Cập nhật nội dung báo cáo giám sát
        }

        validateRaceEntriesLimits(race.getMinEntries(), race.getMaxEntries()); // Kiểm tra giới hạn số lượng ngựa đăng ký tham gia
        validateRacePurseAgainstMeetingBudget(race.getRaceMeetingId(), race.getPurse(), id); // Validate purse against parent RaceMeeting budget
        race.updatePrizeDistribution(); // Tự động cập nhật phân chia tiền thưởng
        Race savedRace = raceRepository.save(race); // Lưu các thay đổi của trận đua vào DB
        String meetingName = raceMeetingRepository.findById(savedRace.getRaceMeetingId()) // Trích xuất tên Ngày hội đua tương ứng
                .map(RaceMeeting::getName) // Lấy tên Ngày hội đua
                .orElse(null); // Mặc định null nếu không tồn tại

        return raceMapper.toDTO(savedRace, meetingName); // Chuyển đổi và trả về RaceDTO đã cập nhật
    }

    public List<RaceMeetingDTO> getAllMeetings() {
        // Tạo Map ánh xạ giữa ID Mùa giải và Tên mùa giải
        Map<Integer, String> seasonMap = seasonRepository.findAll().stream() // Truy vấn toàn bộ các mùa giải
                .collect(Collectors.toMap(Season::getId, Season::getName)); // Gom thành Map key: id, value: name

        // Lấy tất cả Ngày hội đua và chuyển thành DTO
        return raceMeetingRepository.findAll().stream() // Duyệt danh sách các Ngày hội đua
                .map(m -> raceMeetingMapper.toDTO(m, seasonMap.get(m.getSeasonId()))) // Ánh xạ từng Ngày hội đua sang RaceMeetingDTO
                .collect(Collectors.toList()); // Trả về danh sách List<RaceMeetingDTO>
    }

    private void validateMeetingDateInSeason(Integer seasonId, java.util.Date meetingDate) {
        if (seasonId == null || meetingDate == null) return; // Nếu thiếu thông tin seasonId hoặc meetingDate thì bỏ qua
        Season season = seasonRepository.findById(seasonId).orElse(null); // Tìm mùa giải tương ứng theo ID
        if (season == null) return; // Nếu không tìm thấy mùa giải thì bỏ qua
        if (season.getStartDate() != null && meetingDate.before(season.getStartDate())) { // Kiểm tra ngày diễn ra Ngày hội đua trước ngày bắt đầu mùa giải
            throw new IllegalArgumentException("Race Meeting date (" + meetingDate + ") cannot be before Season start date (" + season.getStartDate() + ")."); // Ném lỗi tham số không hợp lệ
        }
        if (season.getEndDate() != null) { // Kiểm tra nếu mùa giải có ngày kết thúc
            Calendar calEnd = Calendar.getInstance(); // Khởi tạo Calendar để thiết lập mốc cuối ngày
            calEnd.setTime(season.getEndDate()); // Đặt ngày theo ngày kết thúc mùa giải
            calEnd.set(Calendar.HOUR_OF_DAY, 23); // Đặt giờ là 23h
            calEnd.set(Calendar.MINUTE, 59); // Đặt phút là 59p
            calEnd.set(Calendar.SECOND, 59); // Đặt giây là 59s
            calEnd.set(Calendar.MILLISECOND, 999); // Đặt miligiây là 999ms
            if (meetingDate.after(calEnd.getTime())) { // Kiểm tra nếu Ngày hội đua diễn ra sau thời điểm kết thúc mùa giải
                throw new IllegalArgumentException("Race Meeting date (" + meetingDate + ") cannot be after Season end date (" + season.getEndDate() + ")."); // Ném lỗi tham số không hợp lệ
            }
        }
    }

    private void validateRaceEntriesLimits(Integer minEntries, Integer maxEntries) {
        int min = minEntries != null ? minEntries : 3; // Lấy giá trị minEntries hoặc mặc định là 3
        int max = maxEntries != null ? maxEntries : 14; // Lấy giá trị maxEntries hoặc mặc định là 14
        if (min <= 1) { // Kiểm tra nếu số lượng tối thiểu nhỏ hơn hoặc bằng 1
            throw new IllegalArgumentException("Minimum entries must be greater than 1."); // Ném lỗi quy định tối thiểu
        }
        if (max >= 15) { // Kiểm tra nếu số lượng tối đa vượt quá hoặc bằng 15
            throw new IllegalArgumentException("Maximum entries must be less than 15."); // Ném lỗi quy định tối đa
        }
        if (min > max) { // Kiểm tra nếu số lượng tối thiểu lớn hơn số lượng tối đa
            throw new IllegalArgumentException("Minimum entries (" + min + ") cannot be greater than maximum entries (" + max + ")."); // Ném lỗi logic so sánh min/max
        }
    }

    private static final BigDecimal MIN_MEETING_BUDGET = new BigDecimal("10000000"); // 10 triệu
    private static final BigDecimal MAX_MEETING_BUDGET = new BigDecimal("1000000000"); // 1 tỷ

    private void validateMeetingBudget(BigDecimal budget) {
        if (budget == null || budget.compareTo(MIN_MEETING_BUDGET) < 0) {
            throw new IllegalArgumentException("Total budget must be at least 10,000,000.");
        }
        if (budget.compareTo(MAX_MEETING_BUDGET) > 0) {
            throw new IllegalArgumentException("Total budget cannot exceed 1,000,000,000.");
        }
    }

    @Transactional
    public RaceMeetingDTO createMeeting(RaceMeetingDTO dto) {
        validateMeetingDateInSeason(dto.getSeasonId(), dto.getStartDate()); // Kiểm tra ngày của Ngày hội đua có nằm trong khoảng thời gian mùa giải
        validateMeetingBudget(dto.getTotalBudget()); // Kiểm tra ngân sách trong khoảng 10tr - 1 tỷ
        RaceMeeting meeting = raceMeetingMapper.toEntity(dto); // Chuyển đổi DTO sang Entity RaceMeeting
        RaceMeeting savedMeeting = raceMeetingRepository.save(meeting); // Lưu Ngày hội đua vào DB
        String seasonName = seasonRepository.findById(savedMeeting.getSeasonId()) // Tra cứu tên mùa giải tương ứng
                .map(Season::getName) // Lấy tên mùa giải
                .orElse(null); // Mặc định null nếu không tìm thấy
        return raceMeetingMapper.toDTO(savedMeeting, seasonName); // Trả về DTO của Ngày hội đua đã tạo
    }

    @Transactional
    public RaceMeetingDTO updateMeeting(Integer id, RaceMeetingDTO dto) {
        validateMeetingDateInSeason(dto.getSeasonId(), dto.getStartDate()); // Kiểm tra ngày Ngày hội đua phù hợp thời gian mùa giải
        validateMeetingBudget(dto.getTotalBudget()); // Kiểm tra ngân sách trong khoảng 10tr - 1 tỷ
        RaceMeeting meeting = raceMeetingRepository.findById(id) // Tìm Ngày hội đua theo ID
                .orElseThrow(() -> new IllegalArgumentException("Race Meeting not found with id: " + id)); // Ném ngoại lệ nếu không tồn tại
        meeting.setName(dto.getName()); // Cập nhật tên Ngày hội đua
        meeting.setVenue(dto.getVenue()); // Cập nhật địa điểm tổ chức
        meeting.setStartDate(dto.getStartDate()); // Cập nhật ngày bắt đầu tổ chức
        meeting.setSeasonId(dto.getSeasonId()); // Cập nhật mã Mùa giải tham chiếu
        if (dto.getTotalBudget() != null) { // Nếu có truyền vào tổng ngân sách mới
            meeting.setTotalBudget(dto.getTotalBudget()); // Cập nhật tổng ngân sách giải thưởng
        }
        RaceMeeting savedMeeting = raceMeetingRepository.save(meeting); // Lưu thông tin Ngày hội đua đã chỉnh sửa
        String seasonName = seasonRepository.findById(savedMeeting.getSeasonId()) // Tra cứu tên mùa giải tương ứng
                .map(Season::getName) // Lấy tên mùa giải
                .orElse(null); // Mặc định null nếu không tìm thấy
        return raceMeetingMapper.toDTO(savedMeeting, seasonName); // Trả về DTO Ngày hội đua sau khi cập nhật
    }

    @Transactional
    public void deleteMeeting(Integer id) {
        if (!raceMeetingRepository.existsById(id)) { // Kiểm tra xem Ngày hội đua có tồn tại trong DB không
            throw new IllegalArgumentException("Race Meeting not found with id: " + id); // Ném ngoại lệ nếu ID không tồn tại
        }

        // 1. Delete Violations associated with races of this meeting
        entityManager.createNativeQuery( // Xóa các bản ghi vi phạm thuộc các trận đua trong Ngày hội đua này
            "DELETE FROM Violation WHERE race_id IN (SELECT id FROM Race WHERE race_meeting_id = :meetingId)"
        ).setParameter("meetingId", id).executeUpdate(); // Gán tham số meetingId và thực thi truy vấn xóa

        // 2. Delete RaceEntries
        entityManager.createNativeQuery( // Xóa các bản ghi lượt đăng ký thi đấu thuộc Ngày hội đua này
            "DELETE FROM RaceEntry WHERE race_id IN (SELECT id FROM Race WHERE race_meeting_id = :meetingId)"
        ).setParameter("meetingId", id).executeUpdate(); // Gán tham số meetingId và thực thi câu lệnh SQL xóa

        // 3. Delete RaceInvitations
        entityManager.createNativeQuery( // Xóa các lời mời thi đấu liên quan đến các trận đua trong Ngày hội đua
            "DELETE FROM RaceInvitation WHERE race_id IN (SELECT id FROM Race WHERE race_meeting_id = :meetingId)"
        ).setParameter("meetingId", id).executeUpdate(); // Gán tham số meetingId và thực thi câu lệnh SQL xóa

        // 4. Delete RaceReferees
        entityManager.createNativeQuery( // Xóa danh sách phân công trọng tài liên quan đến Ngày hội đua
            "DELETE FROM RaceReferee WHERE race_id IN (SELECT id FROM Race WHERE race_meeting_id = :meetingId)"
        ).setParameter("meetingId", id).executeUpdate(); // Gán tham số meetingId và thực thi câu lệnh SQL xóa

        // 4.5. Delete ChatMessages
        entityManager.createNativeQuery( // Xóa lịch sử tin nhắn trò chuyện thuộc các trận đua trong Ngày hội đua này
            "DELETE FROM ChatMessage WHERE race_id IN (SELECT id FROM Race WHERE race_meeting_id = :meetingId)"
        ).setParameter("meetingId", id).executeUpdate();

        // 5. Delete Races
        entityManager.createNativeQuery( // Xóa toàn bộ các trận đua trực thuộc Ngày hội đua này
            "DELETE FROM Race WHERE race_meeting_id = :meetingId"
        ).setParameter("meetingId", id).executeUpdate(); // Gán tham số meetingId và thực thi câu lệnh SQL xóa

        // 6. Delete HorseRegistrations
        entityManager.createNativeQuery( // Xóa các đơn đăng ký tham gia Ngày hội đua của chiến mã
            "DELETE FROM HorseRaceMeetingRegistration WHERE race_meeting_id = :meetingId"
        ).setParameter("meetingId", id).executeUpdate(); // Gán tham số meetingId và thực thi câu lệnh SQL xóa

        // 7. Delete JockeyRegistrations
        entityManager.createNativeQuery( // Xóa các đơn đăng ký tham gia Ngày hội đua của nài ngựa
            "DELETE FROM JockeyRaceMeetingRegistration WHERE race_meeting_id = :meetingId"
        ).setParameter("meetingId", id).executeUpdate(); // Gán tham số meetingId và thực thi câu lệnh SQL xóa

        // 8. Delete OwnerRegistrations
        entityManager.createNativeQuery( // Xóa các đơn đăng ký tham gia Ngày hội đua của chủ ngựa
            "DELETE FROM OwnerRaceMeetingRegistration WHERE race_meeting_id = :meetingId"
        ).setParameter("meetingId", id).executeUpdate(); // Gán tham số meetingId và thực thi câu lệnh SQL xóa

        // 9. Delete the RaceMeeting itself
        raceMeetingRepository.deleteById(id); // Xóa bản ghi Ngày hội đua chính khỏi cơ sở dữ liệu
    }

    public List<RaceDTO> getLiveRaces() {
        // Tạo Map ánh xạ từ ID Ngày hội đua sang Tên ngày hội đua
        Map<Integer, String> meetingMap = raceMeetingRepository.findAll().stream() // Lấy toàn bộ các Ngày hội đua
                .collect(Collectors.toMap(RaceMeeting::getId, RaceMeeting::getName)); // Gom nhóm thành Map key: id, value: name

        // Lọc danh sách các trận đua đang ở trạng thái RUNNING, STEWARDS_INQUIRY hoặc có chế độ phát WEBCAM/YouTube
        return raceRepository.findAll().stream() // Tra cứu tất cả các trận đua
                .filter(r -> "RUNNING".equalsIgnoreCase(r.getStatus()) 
                          || "STEWARDS_INQUIRY".equalsIgnoreCase(r.getStatus()) 
                          || "WEBCAM".equalsIgnoreCase(r.getStreamMode()) 
                          || (r.getYoutubeLiveUrl() != null && !r.getYoutubeLiveUrl().trim().isEmpty())) // Lọc trận đua đang chạy hoặc có luồng phát
                .map(r -> raceMapper.toDTO(r, meetingMap.get(r.getRaceMeetingId()))) // Chuyển đổi sang RaceDTO kèm tên Ngày hội đua
                .collect(Collectors.toList()); // Trả về danh sách List<RaceDTO>
    }

    private void validateRaceTimeMatchesMeeting(Timestamp raceTime, Integer meetingId) {
        if (raceTime == null || meetingId == null) return; // Nếu thiếu mốc giờ hoặc ID Ngày hội đua thì bỏ qua
        RaceMeeting meeting = raceMeetingRepository.findById(meetingId) // Tra cứu thông tin Ngày hội đua từ DB
                .orElseThrow(() -> new IllegalArgumentException("Race Meeting not found")); // Ném ngoại lệ nếu không tìm thấy
        
        if (meeting.getStartDate() != null) { // Nếu Ngày hội đua có ngày bắt đầu hợp lệ
            Calendar cal1 = Calendar.getInstance(); // Khởi tạo Calendar cho mốc giờ trận đua
            cal1.setTime(raceTime); // Đặt thời gian theo mốc giờ xuất phát
            
            Calendar cal2 = Calendar.getInstance(); // Khởi tạo Calendar cho ngày của Ngày hội đua
            cal2.setTime(meeting.getStartDate()); // Đặt thời gian theo ngày của Ngày hội đua
            
            if (cal1.get(Calendar.YEAR) != cal2.get(Calendar.YEAR) || // So sánh Năm
                cal1.get(Calendar.MONTH) != cal2.get(Calendar.MONTH) || // So sánh Tháng
                cal1.get(Calendar.DAY_OF_MONTH) != cal2.get(Calendar.DAY_OF_MONTH)) { // So sánh Ngày
                
                java.text.SimpleDateFormat sdf = new java.text.SimpleDateFormat("dd-MM-yyyy"); // Định dạng hiển thị ngày dd-MM-yyyy
                throw new IllegalArgumentException("Race start time must be on the same date as the selected Race Meeting (" 
                        + sdf.format(meeting.getStartDate()) + ")"); // Ném ngoại lệ yêu cầu thời gian xuất phát phải cùng ngày với Ngày hội đua
            }
        }
    }

    private void validateLiveUrl(String url) {
        if (url != null && !url.trim().isEmpty()) { // Nếu chuỗi URL không rỗng
            String trimmed = url.trim(); // Loại bỏ khoảng trắng thừa ở 2 đầu
            if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) { // Kiểm tra URL có bắt đầu bằng http:// hoặc https:// không
                throw new IllegalArgumentException("Invalid livestream URL. It must start with http:// or https://"); // Ném ngoại lệ thông báo link livestream không hợp lệ
            }
        }
    }

    private void validateUniqueRaceTime(Timestamp raceTime, Integer meetingId, Integer excludeRaceId) {
        if (raceTime == null || meetingId == null) return; // Nếu thiếu mốc thời gian hoặc ID Ngày hội đua thì bỏ qua
        List<Race> existingRaces = raceRepository.findByRaceMeetingId(meetingId); // Lấy danh sách các trận đua thuộc Ngày hội đua này
        for (Race r : existingRaces) { // Duyệt qua từng trận đua hiện có
            if (excludeRaceId != null && r.getId().equals(excludeRaceId)) { // Bỏ qua chính trận đua đang được cập nhật (nếu có)
                continue; // Chuyển sang phần tử tiếp theo
            }
            if ("CANCELLED".equalsIgnoreCase(r.getStatus())) { // Bỏ qua các trận đua đã bị hủy
                continue; // Chuyển sang phần tử tiếp theo
            }
            if (r.getStartTime() != null && r.getStartTime().equals(raceTime)) { // Nếu trùng khớp mốc thời gian xuất phát
                throw new IllegalArgumentException("DUPLICATE_RACE_TIME"); // Ném ngoại lệ báo lỗi trùng giờ xuất phát
            }
        }
    }

    private void validateRacePurseAgainstMeetingBudget(Integer meetingId, BigDecimal newPurse, Integer excludeRaceId) {
        if (meetingId == null || newPurse == null || newPurse.compareTo(BigDecimal.ZERO) <= 0) {
            return;
        }
        Optional<RaceMeeting> meetingOpt = raceMeetingRepository.findById(meetingId);
        if (meetingOpt.isPresent()) {
            RaceMeeting meeting = meetingOpt.get();
            BigDecimal totalBudget = meeting.getTotalBudget() != null ? meeting.getTotalBudget() : BigDecimal.ZERO;
            List<Race> racesInMeeting = raceRepository.findByRaceMeetingId(meetingId);
            BigDecimal allocatedPurses = racesInMeeting.stream()
                    .filter(r -> excludeRaceId == null || !r.getId().equals(excludeRaceId))
                    .filter(r -> !"CANCELLED".equalsIgnoreCase(r.getStatus()))
                    .map(r -> r.getPurse() != null ? r.getPurse() : BigDecimal.ZERO)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            BigDecimal availableBudget = totalBudget.subtract(allocatedPurses);
            if (availableBudget.compareTo(BigDecimal.ZERO) < 0) {
                availableBudget = BigDecimal.ZERO;
            }
            if (newPurse.compareTo(availableBudget) > 0) {
                throw new IllegalArgumentException(String.format("Race purse ($%,.2f) exceeds remaining Race Meeting budget ($%,.2f).", newPurse, availableBudget));
            }
        }
    }
}
