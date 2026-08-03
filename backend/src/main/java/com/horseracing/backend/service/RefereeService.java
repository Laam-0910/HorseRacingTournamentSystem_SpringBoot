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
import com.horseracing.backend.entity.WalletTransaction;
import com.horseracing.backend.repository.WalletTransactionRepository;
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
    private final WalletTransactionRepository walletTransactionRepository;
    private final RaceInvitationRepository invitationRepository;
    private final AdminUserService adminUserService;

    @Transactional
    public void preRaceCheck(Integer raceId, List<Map<String, Object>> entriesData) {
        Race race = raceRepository.findById(raceId) // Tìm kiếm thông tin trận đua theo raceId
                .orElseThrow(() -> new IllegalArgumentException("Race not found")); // Ném ngoại lệ nếu không tìm thấy trận đua

        // Auto-recalculate handicap & carried weights using latest SystemConfig parameters
        adminUserService.autoCalculateWeights(raceId);

        // Validate minimum entries (excluding REJECTED and SUSPENDED_DEFICIT)
        long activeCount = entriesData.stream() // Duyệt qua danh sách dữ liệu các lượt đăng ký
                .filter(e -> !"REJECTED".equalsIgnoreCase((String) e.get("status")) && !"SUSPENDED_DEFICIT".equalsIgnoreCase((String) e.get("status"))) // Lọc các lượt không bị từ chối/hủy/tạm dừng nợ ví
                .count(); // Đếm tổng số lượt hợp lệ
        int minEntries = race.getMinEntries() != null ? race.getMinEntries() : 3; // Lấy hạn mức số lượt tối thiểu (mặc định 3)
        if (activeCount < minEntries) { // Nếu số lượt hợp lệ nhỏ hơn hạn mức tối thiểu
            throw new IllegalArgumentException("Cannot start race. Active entries (" + activeCount + ") is below minimum allowed (" + minEntries + ")."); // Ném ngoại lệ không đủ điều kiện khởi tranh
        }

        // Validate that all participating entries have a gate number assigned
        List<RaceEntry> dbEntries = raceEntryRepository.findByRaceId(raceId); // Lấy danh sách lượt đăng ký thi đấu từ DB theo raceId
        for (RaceEntry e : dbEntries) { // Duyệt từng lượt đăng ký trong DB
            String targetStatus = e.getStatus(); // Lấy trạng thái hiện tại
            for (Map<String, Object> entryData : entriesData) { // Duyệt qua danh sách dữ liệu cập nhật từ client
                Integer entryId = (Integer) entryData.get("entryId"); // Lấy entryId từ map dữ liệu
                if (e.getId().equals(entryId)) { // Nếu trùng khớp entryId
                    targetStatus = (String) entryData.get("status"); // Cập nhật trạng thái mục tiêu
                    break; // Thoát vòng lặp tìm kiếm
                }
            }
            if (!"REJECTED".equalsIgnoreCase(targetStatus) && !"SUSPENDED_DEFICIT".equalsIgnoreCase(targetStatus) && (e.getGateNumber() == null || e.getGateNumber() <= 0)) { // Kiểm tra nếu không bị từ chối/tạm hoãn mà chưa gán số cổng xuất phát hợp lệ
                throw new IllegalArgumentException("Cannot start race. Some active horses do not have valid gate numbers."); // Ném ngoại lệ yêu cầu gán số cổng xuất phát
            }
        }

        // Update weigh-out weights and status
        for (Map<String, Object> entryData : entriesData) { // Duyệt dữ liệu từng lượt thi đấu để cập nhật cân nặng
            Integer entryId = (Integer) entryData.get("entryId"); // Lấy mã lượt thi đấu entryId
            Object weightVal = entryData.get("weighOutWeight"); // Lấy giá trị cân nặng thực tế weighOutWeight
            if (weightVal == null) { // Nếu weighOutWeight null
                weightVal = entryData.get("carriedWeight"); // Dùng tạm carriedWeight
            }
            BigDecimal weighOutWeight = BigDecimal.ZERO; // Khởi tạo mốc cân nặng ban đầu là 0
            if (weightVal != null) { // Nếu có giá trị cân nặng
                String ws = weightVal.toString().trim(); // Chuyển sang chuỗi và xóa khoảng trắng
                if (!ws.isEmpty() && !"null".equalsIgnoreCase(ws) && !"undefined".equalsIgnoreCase(ws)) { // Kiểm tra chuỗi hợp lệ
                    weighOutWeight = new BigDecimal(ws); // Chuyển chuỗi sang BigDecimal
                }
            }
            String status = (String) entryData.get("status"); // APPROVED, REJECTED (Scratched)

            Optional<RaceEntry> entryOpt = raceEntryRepository.findById(entryId); // Tìm bản ghi RaceEntry trong DB
            if (entryOpt.isPresent()) { // Nếu tìm thấy lượt thi đấu
                RaceEntry entry = entryOpt.get(); // Lấy đối tượng RaceEntry
                if (!"REJECTED".equalsIgnoreCase(status)) { // Nếu lượt thi đấu không bị từ chối
                    BigDecimal reqWeight = entry.getCarriedWeight() != null ? entry.getCarriedWeight() : new BigDecimal("52.0"); // Lấy cân nặng yêu cầu (mặc định 52kg)
                    BigDecimal diff = weighOutWeight.subtract(reqWeight); // Tính chênh lệch giữa cân thực tế và cân yêu cầu
                    if (diff.compareTo(BigDecimal.ZERO) < 0) { // Nếu cân thực tế nhỏ hơn cân quy định
                        throw new IllegalArgumentException("Cannot confirm pre-check. Weighed weight (" + weighOutWeight + " kg) cannot be less than required weight (" + reqWeight + " kg) for entry ID " + entryId + "."); // Ném ngoại lệ thiếu cân
                    }
                    if (diff.compareTo(new BigDecimal("1.0")) > 0) { // Nếu cân thực tế thừa quá 1.0kg cho phép
                        throw new IllegalArgumentException("Cannot confirm pre-check. Weighed weight (" + weighOutWeight + " kg) exceeds required weight (" + reqWeight + " kg) by more than 1.0 kg limit for entry ID " + entryId + "."); // Ném ngoại lệ dư cân quá mức
                    }
                }
                entry.setCarriedWeight(weighOutWeight); // Gán mốc cân nặng thực tế đã cân
                entry.setStatus(status); // Cập nhật trạng thái cho lượt thi đấu
                raceEntryRepository.save(entry); // Lưu thông tin lượt thi đấu vào DB
            }
        }

        race.setStatus("RACE_ASSIGNED"); // Cập nhật trạng thái trận đua sang RACE_ASSIGNED
        raceRepository.save(race); // Lưu thông tin trận đua vào DB
    }

    @Transactional
    public void startRace(Integer raceId) {
        Race race = raceRepository.findById(raceId) // Tìm trận đua theo raceId
                .orElseThrow(() -> new IllegalArgumentException("Race not found")); // Ném ngoại lệ nếu không tìm thấy trận đua
        if (!"RACE_ASSIGNED".equals(race.getStatus())) { // Kiểm tra nếu trận đua chưa hoàn tất kiểm tra pre-race
            throw new IllegalStateException("Race must be in RACE_ASSIGNED status to start (Pre-Race check must be completed first)"); // Ném ngoại lệ yêu cầu hoàn thành pre-check
        }
        race.setStatus("RUNNING"); // Chuyển trạng thái trận đua sang RUNNING (đang diễn ra)
        raceRepository.save(race); // Lưu trạng thái trận đua mới vào DB

        // Transition all APPROVED entries of this race to RUNNING
        List<RaceEntry> entries = raceEntryRepository.findByRaceId(raceId); // Lấy tất cả lượt thi đấu của trận đua này
        for (RaceEntry entry : entries) { // Duyệt từng lượt thi đấu
            if ("APPROVED".equalsIgnoreCase(entry.getStatus())) { // Nếu lượt thi đấu đã được duyệt (APPROVED)
                entry.setStatus("RUNNING"); // Đổi trạng thái lượt thi đấu sang RUNNING
                raceEntryRepository.save(entry); // Lưu lượt thi đấu đã cập nhật vào DB
            }
        }
    }

    @Transactional
    public ViolationDTO logViolation(ViolationDTO dto) {
        Violation violation = violationMapper.toEntity(dto); // Chuyển DTO vi phạm sang Entity Violation
        violation.setStatus("PENDING"); // Đặt trạng thái ban đầu của vi phạm là PENDING

        // If severe violation, update RaceEntry status to DISQUALIFIED immediately
        if (dto.getPenalty() != null && (dto.getPenalty().contains("DQ") || dto.getPenalty().contains("DISQUALIFIED"))) { // Kiểm tra nếu hình phạt là truất quyền thi đấu (DQ)
            List<RaceEntry> entries = raceEntryRepository.findByRaceId(dto.getRaceId()); // Lấy các lượt tham gia của trận đua
            for (RaceEntry entry : entries) { // Duyệt từng lượt tham gia
                if (entry.getHorseId().equals(dto.getHorseId()) && entry.getJockeyId().equals(dto.getJockeyId())) { // Nếu khớp mã ngựa và mã nài
                    entry.setStatus("DISQUALIFIED"); // Cập nhật trạng thái lượt thi đấu sang DISQUALIFIED
                    entry.setFinalPosition(null); // Xóa vị trí cán đích
                    entry.setFinishTime("DQ"); // Đánh dấu thời gian cán đích là DQ
                    entry.setRatingAdjustment(-2); // Trừ 2 điểm Elo Rating
                    raceEntryRepository.save(entry); // Lưu cập nhật lượt thi đấu vào DB

                    // Update Horse rating (-2)
                    Optional<Horse> horseOpt = horseRepository.findById(dto.getHorseId()); // Tra cứu thông tin con ngựa vi phạm
                    if (horseOpt.isPresent()) { // Nếu tìm thấy ngựa
                        Horse horse = horseOpt.get(); // Lấy đối tượng Horse
                        int curRating = horse.getCurrentRating() != null ? horse.getCurrentRating() : 52; // Lấy điểm rating hiện tại (hoặc 52)
                        horse.setCurrentRating(Math.max(0, curRating - 2)); // Trừ 2 điểm rating (tối thiểu là 0)
                        horseRepository.save(horse); // Lưu cập nhật điểm rating cho ngựa
                    }
                    break; // Thoát vòng lặp tìm lượt thi đấu
                }
            }
            violation.setStatus("DISQUALIFIED_IMMEDIATELY"); // Cập nhật trạng thái biên bản vi phạm sang DISQUALIFIED_IMMEDIATELY
        }

        Violation savedViolation = violationRepository.save(violation); // Lưu bản ghi vi phạm vào cơ sở dữ liệu

        // Tự động trừ tiền phạt vào ví của Kỵ sĩ/Chủ sở hữu vi phạm
        applyFineToUserWallet(savedViolation.getJockeyId(), savedViolation.getPenalty(), savedViolation.getDescription());

        // Trigger STEWARDS_INQUIRY if the race is RUNNING or FINISHED
        if (dto.getRaceId() != null) { // Kiểm tra nếu có raceId
            Optional<Race> raceOpt = raceRepository.findById(dto.getRaceId()); // Tra cứu thông tin trận đua
            if (raceOpt.isPresent()) { // Nếu tìm thấy trận đua
                Race race = raceOpt.get(); // Lấy đối tượng Race
                String raceStatus = race.getStatus(); // Lấy trạng thái trận đua hiện tại
                if ("RUNNING".equals(raceStatus) || "FINISHED".equals(raceStatus)) { // Nếu trận đua đang chạy hoặc vừa kết thúc
                    race.setStatus("STEWARDS_INQUIRY"); // Đổi trạng thái trận đua sang STEWARDS_INQUIRY (Điều tra của Ban Giám sát)
                    raceRepository.save(race); // Lưu trạng thái mới của trận đua vào DB
                }
            }
        }

        Map<Integer, String> userMap = userRepository.findAll().stream() // Truy vấn toàn bộ người dùng để lấy tên
                .collect(Collectors.toMap(User::getId, User::getUsername)); // Gom nhóm thành Map key: id, value: username
        String horseName = horseRepository.findById(savedViolation.getHorseId()) // Tra cứu tên con ngựa vi phạm
                .map(Horse::getName) // Lấy tên ngựa
                .orElse(null); // Mặc định null nếu không tìm thấy

        return violationMapper.toDTO(savedViolation, // Chuyển đổi đối tượng vi phạm đã lưu sang DTO
                horseName,
                userMap.get(savedViolation.getJockeyId()),
                userMap.get(savedViolation.getRefereeId()));
    }

    public List<ViolationDTO> getViolationsByRace(Integer raceId) {
        Map<Integer, String> userMap = userRepository.findAll().stream() // Truy vấn tất cả người dùng
                .collect(Collectors.toMap(User::getId, User::getUsername)); // Gom nhóm Map key: id, value: username
        Map<Integer, String> horseMap = horseRepository.findAll().stream() // Truy vấn tất cả chiến mã
                .collect(Collectors.toMap(Horse::getId, Horse::getName)); // Gom nhóm Map key: id, value: name

        return violationRepository.findByRaceId(raceId).stream() // Lấy danh sách vi phạm theo raceId
                .map(v -> violationMapper.toDTO(v, // Ánh xạ từng bản ghi vi phạm sang ViolationDTO
                        horseMap.get(v.getHorseId()), 
                        userMap.get(v.getJockeyId()), 
                        userMap.get(v.getRefereeId())))
                .collect(Collectors.toList()); // Trả về danh sách List<ViolationDTO>
     }

    @Transactional(readOnly = true)
    public Map<String, Object> getRefereeDashboard(Integer refereeId) {
        List<RaceReferee> duties = raceRefereeRepository.findByRefereeId(refereeId); // Lấy danh sách phân công nhiệm vụ trọng tài theo refereeId
        List<Map<String, Object>> resolvedRaces = new java.util.ArrayList<>(); // Danh sách chứa thông tin các trận đua đã xử lý
        int completedCount = 0; // Đếm số trận đua hoàn thành
        int pendingCount = 0; // Đếm số trận đua đang chờ xử lý

        Map<Integer, User> userMap = userRepository.findAll().stream().collect(Collectors.toMap(User::getId, u -> u)); // Tạo map tra cứu User theo ID
        Map<Integer, Horse> horseMap = horseRepository.findAll().stream().collect(Collectors.toMap(Horse::getId, h -> h)); // Tạo map tra cứu Horse theo ID
        Map<Integer, RaceMeeting> meetingMap = raceMeetingRepository.findAll().stream().collect(Collectors.toMap(RaceMeeting::getId, m -> m)); // Tạo map tra cứu RaceMeeting theo ID

        for (RaceReferee duty : duties) { // Duyệt từng nhiệm vụ phân công
            Optional<Race> raceOpt = raceRepository.findById(duty.getRaceId()); // Tra cứu thông tin trận đua
            if (raceOpt.isPresent()) { // Nếu tìm thấy trận đua
                Race race = raceOpt.get(); // Lấy đối tượng Race
                Map<String, Object> resolved = new java.util.HashMap<>(); // Tạo map lưu thông tin chi tiết trận đua
                resolved.put("id", race.getId()); // Đưa mã trận đua vào map
                resolved.put("startTime", race.getStartTime()); // Đưa thời gian xuất phát vào map
                resolved.put("classLevel", race.getClassLevel()); // Đưa hạng đua vào map
                resolved.put("status", race.getStatus()); // Đưa trạng thái trận đua vào map
                resolved.put("distanceMeters", race.getDistanceMeters()); // Đưa cự ly thi đấu vào map
                resolved.put("trackType", race.getTrackType()); // Đưa loại mặt đường đua vào map
                resolved.put("purse", race.getPurse()); // Đưa quỹ tiền thưởng vào map
                resolved.put("minEntries", race.getMinEntries()); // Đưa số ngựa tối thiểu vào map
                resolved.put("maxEntries", race.getMaxEntries()); // Đưa số ngựa tối đa vào map
                resolved.put("youtubeLiveUrl", race.getYoutubeLiveUrl()); // Đưa link Livestream vào map

                RaceMeeting meeting = meetingMap.get(race.getRaceMeetingId()); // Tra cứu Ngày hội đua tương ứng
                resolved.put("meetingName", meeting != null ? meeting.getName() : "Unknown Meeting"); // Đưa tên Ngày hội đua vào map
                resolved.put("venue", meeting != null ? meeting.getVenue() : "Unknown Venue"); // Đưa địa điểm vào map

                // Check if gates are fully set
                List<RaceEntry> entries = raceEntryRepository.findByRaceId(race.getId()); // Lấy danh sách lượt tham gia của trận đua
                boolean gatesFullySet = true; // Khởi tạo cờ kiểm tra gán cổng xuất phát
                if (entries == null || entries.isEmpty()) { // Nếu chưa có lượt tham gia nào
                    gatesFullySet = false; // Đặt cờ gán cổng chưa xong
                } else {
                    for (RaceEntry entry : entries) { // Duyệt qua các lượt thi đấu
                        if (entry.getGateNumber() == null || entry.getGateNumber() <= 0) { // Nếu có lượt chưa được gán số cổng
                            gatesFullySet = false; // Đặt cờ gán cổng chưa xong
                            break; // Thoát vòng lặp kiểm tra
                        }
                    }
                }
                resolved.put("gatesFullySet", gatesFullySet); // Lưu trạng thái gán cổng vào map

                boolean preCheckCompleted = "RACE_ASSIGNED".equalsIgnoreCase(race.getStatus()); // Kiểm tra đã hoàn thành pre-check chưa
                resolved.put("preCheckCompleted", preCheckCompleted); // Lưu trạng thái pre-check vào map

                // Load entries details
                List<Map<String, Object>> resolvedEntries = new java.util.ArrayList<>(); // Khởi tạo danh sách chi tiết các lượt tham gia
                if (entries != null) {
                    for (RaceEntry entry : entries) { // Duyệt từng lượt thi đấu
                        Map<String, Object> entryRes = new java.util.HashMap<>(); // Map lưu chi tiết 1 lượt thi đấu
                        entryRes.put("entryId", entry.getId()); // Mã lượt thi đấu
                        entryRes.put("gateNumber", entry.getGateNumber()); // Số cổng xuất phát
                        entryRes.put("carriedWeight", entry.getCarriedWeight()); // Cân nặng thực mang
                        entryRes.put("handicapWeight", entry.getHandicapWeight()); // Cân nặng chấp (Handicap)
                        entryRes.put("status", entry.getStatus()); // Trạng thái lượt thi đấu
                        entryRes.put("finalPosition", entry.getFinalPosition()); // Vị trí cán đích
                        entryRes.put("finishTime", entry.getFinishTime()); // Thời gian hoàn thành

                        Horse horse = horseMap.get(entry.getHorseId()); // Lấy thông tin con ngựa
                        entryRes.put("horseName", horse != null ? horse.getName() : "Unknown"); // Tên ngựa
                        entryRes.put("horseRating", horse != null ? horse.getCurrentRating() : 0); // Điểm Rating của ngựa

                        User jockey = userMap.get(entry.getJockeyId()); // Lấy thông tin nài ngựa
                        entryRes.put("jockeyName", jockey != null ? jockey.getUsername() : "Unknown"); // Tên nài ngựa
                        entryRes.put("jockeyWeight", jockey != null ? jockey.getWeight() : BigDecimal.ZERO); // Cân nặng nài ngựa

                        resolvedEntries.add(entryRes); // Thêm lượt thi đấu vào danh sách
                    }
                }
                resolved.put("entries", resolvedEntries); // Đưa danh sách lượt thi đấu vào map trận đua

                // Fetch recorded violations
                List<Violation> violations = violationRepository.findByRaceId(race.getId()); // Lấy danh sách vi phạm trong trận đua
                List<Map<String, Object>> resolvedViolations = new java.util.ArrayList<>(); // Khởi tạo danh sách chi tiết các vi phạm
                if (violations != null) {
                    for (Violation viol : violations) { // Duyệt từng vi phạm
                        Map<String, Object> violRes = new java.util.HashMap<>(); // Map lưu thông tin 1 vi phạm
                        violRes.put("id", viol.getId()); // Mã biên bản vi phạm
                        violRes.put("description", viol.getDescription()); // Mô tả hành vi vi phạm
                        violRes.put("penalty", viol.getPenalty()); // Hình thức xử phạt
                        violRes.put("status", viol.getStatus()); // Trạng thái xử lý biên bản

                        Horse horse = horseMap.get(viol.getHorseId()); // Lấy thông tin con ngựa vi phạm
                        violRes.put("horseName", horse != null ? horse.getName() : "Unknown"); // Tên ngựa

                        User jockey = userMap.get(viol.getJockeyId()); // Lấy thông tin nài ngựa vi phạm
                        violRes.put("jockeyName", jockey != null ? jockey.getUsername() : "Unknown"); // Tên nài ngựa

                        resolvedViolations.add(violRes); // Thêm vi phạm vào danh sách
                    }
                }
                resolved.put("violations", resolvedViolations); // Đưa danh sách vi phạm vào map trận đua

                resolvedRaces.add(resolved); // Thêm trận đua vào danh sách trả về

                if ("OFFICIAL".equalsIgnoreCase(race.getStatus()) || "RACE_EVENT_ENDED".equalsIgnoreCase(race.getStatus())) { // Nếu trận đua đã chính thức kết thúc
                    completedCount++; // Tăng số trận đã hoàn thành
                } else {
                    pendingCount++; // Tăng số trận đang chờ xử lý
                }
            }
        }

        Map<String, Object> response = new java.util.HashMap<>(); // Tạo map kết quả tổng hợp
        response.put("assignedRaces", resolvedRaces); // Danh sách các trận đua được phân công
        response.put("completedCount", completedCount); // Tổng số trận hoàn thành
        response.put("pendingCount", pendingCount); // Tổng số trận đang chờ
        return response; // Trả về đối tượng Map response
    }

    @Transactional
    public void stopRace(Integer raceId, String stewardReport) {
        Race race = raceRepository.findById(raceId) // Tra cứu trận đua theo raceId
                .orElseThrow(() -> new IllegalArgumentException("Race not found")); // Ném ngoại lệ nếu không tìm thấy trận đua
        // Chỉ cho phép dừng khẩn cấp khi trận đua đang RUNNING, STOPPED hoặc STEWARDS_INQUIRY
        if (!"RUNNING".equals(race.getStatus()) && !"STOPPED".equals(race.getStatus()) && !"STEWARDS_INQUIRY".equals(race.getStatus())) {
            throw new IllegalStateException("Race must be RUNNING, STOPPED or STEWARDS_INQUIRY to perform an emergency stop. Current status: " + race.getStatus());
        }
        race.setStatus("CANCELLED"); // Đổi trạng thái trận đua sang CANCELLED (bị hủy)
        race.setStewardReport(stewardReport); // Lưu lý do dừng khẩn cấp vào báo cáo trọng tài
        race.setYoutubeLiveUrl(null); // Xóa URL livestream khi dừng khẩn cấp
        raceRepository.save(race); // Lưu trận đua đã cập nhật vào DB

        List<RaceEntry> entries = raceEntryRepository.findByRaceId(raceId); // Lấy danh sách lượt thi đấu của trận đua
        for (RaceEntry entry : entries) { // Duyệt qua từng lượt thi đấu
            // Chỉ hủy các entry chưa có kết quả cuối (DISQUALIFIED / FINISHED giữ nguyên)
            String es = entry.getStatus();
            if ("APPROVED".equals(es) || "RUNNING".equals(es) || "STOPPED".equals(es) || "PENDING_ADMIN".equals(es)) {
                entry.setStatus("REJECTED"); // Đổi trạng thái lượt thi đấu sang REJECTED
                raceEntryRepository.save(entry); // Lưu lượt thi đấu đã cập nhật vào DB
            }
        }
    }

    @Transactional
    public void confirmViolation(Integer violationId) {
        Violation violation = violationRepository.findById(violationId)
                .orElseThrow(() -> new IllegalArgumentException("Violation not found"));
        violation.setStatus("CONFIRMED");
        violationRepository.save(violation);

        // Deduct Fine penalty from Jockey's or Horse Owner's wallet if penalty string contains a fine amount
        if (violation.getPenalty() != null && violation.getPenalty().toLowerCase().contains("fine")) {
            try {
                String pen = violation.getPenalty();
                java.util.regex.Matcher matcher = java.util.regex.Pattern.compile("\\$?(\\d+(?:\\.\\d+)?)").matcher(pen);
                if (matcher.find()) {
                    BigDecimal fineAmount = new BigDecimal(matcher.group(1));
                    if (fineAmount.compareTo(BigDecimal.ZERO) > 0) {
                        boolean isOwnerFine = pen.toLowerCase().contains("owner");
                        Integer targetUserId = null;

                        if (isOwnerFine && violation.getHorseId() != null) {
                            Optional<Horse> hOpt = horseRepository.findById(violation.getHorseId());
                            if (hOpt.isPresent()) {
                                targetUserId = hOpt.get().getOwnerId();
                            }
                        }
                        if (targetUserId == null) {
                            targetUserId = violation.getJockeyId();
                        }

                        if (targetUserId != null) {
                            Optional<User> uOpt = userRepository.findById(targetUserId);
                            if (uOpt.isPresent()) {
                                User targetUser = uOpt.get();
                                BigDecimal cur = targetUser.getWalletBalance() != null ? targetUser.getWalletBalance() : BigDecimal.ZERO;
                                BigDecimal newBal = cur.subtract(fineAmount);
                                targetUser.setWalletBalance(newBal);
                                targetUser.setBalance(newBal);
                                userRepository.save(targetUser);

                                WalletTransaction txFine = new WalletTransaction();
                                txFine.setUserId(targetUser.getId());
                                txFine.setAmount(fineAmount.negate());
                                txFine.setTransactionType("VIOLATION_FINE");
                                txFine.setDescription("Fine penalty deducted for race violation #" + violationId + ": " + violation.getDescription());
                                txFine.setCreatedAt(new java.sql.Timestamp(System.currentTimeMillis()));
                                walletTransactionRepository.save(txFine);

                                // If wallet balance is negative (< 0), put upcoming un-run entries on SUSPENDED_DEFICIT hold (preserves invitation data)
                                if (newBal.compareTo(BigDecimal.ZERO) < 0) {
                                    if (targetUser.getRoleId() != null && targetUser.getRoleId() == 2) {
                                        List<Horse> ownerHorses = horseRepository.findByOwnerId(targetUser.getId());
                                        List<Integer> hIds = ownerHorses.stream().map(Horse::getId).collect(Collectors.toList());
                                        if (!hIds.isEmpty()) {
                                            List<RaceEntry> upcoming = raceEntryRepository.findAll().stream()
                                                    .filter(e -> hIds.contains(e.getHorseId()) && ("PENDING_ADMIN".equalsIgnoreCase(e.getStatus()) || "APPROVED".equalsIgnoreCase(e.getStatus())))
                                                    .collect(Collectors.toList());
                                            for (RaceEntry e : upcoming) {
                                                e.setStatus("SUSPENDED_DEFICIT");
                                                raceEntryRepository.save(e);
                                            }
                                        }
                                    } else {
                                        List<RaceEntry> upcoming = raceEntryRepository.findByJockeyId(targetUser.getId());
                                        for (RaceEntry e : upcoming) {
                                            if ("PENDING_ADMIN".equalsIgnoreCase(e.getStatus()) || "APPROVED".equalsIgnoreCase(e.getStatus())) {
                                                e.setStatus("SUSPENDED_DEFICIT");
                                                raceEntryRepository.save(e);
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            } catch (Exception ex) {
                // Ignore parsing exception
            }
        }

        // Tự động trừ tiền phạt vào ví người vi phạm khi biên bản được xác nhận
        applyFineToUserWallet(violation.getJockeyId(), violation.getPenalty(), violation.getDescription());

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
        Violation violation = violationRepository.findById(violationId) // Tra cứu biên bản vi phạm theo ID
                .orElseThrow(() -> new IllegalArgumentException("Violation not found")); // Ném ngoại lệ nếu không tìm thấy
        violation.setStatus("DISMISSED"); // Đổi trạng thái biên bản vi phạm sang DISMISSED (bác bỏ)
        violationRepository.save(violation); // Lưu thay đổi biên bản vi phạm vào DB

        // If no more PENDING violations for this race, reset race from STEWARDS_INQUIRY back to FINISHED
        Integer raceId = violation.getRaceId(); // Lấy mã trận đua liên quan
        if (raceId != null) {
            List<Violation> remaining = violationRepository.findByRaceId(raceId); // Lấy các vi phạm thuộc trận đua
            boolean hasPending = remaining.stream() // Duyệt qua danh sách vi phạm
                    .anyMatch(v -> "PENDING".equals(v.getStatus())); // Kiểm tra xem còn vi phạm PENDING nào không
            if (!hasPending) { // Nếu đã xử lý hết các vi phạm PENDING
                Optional<Race> raceOpt = raceRepository.findById(raceId); // Tra cứu trận đua
                if (raceOpt.isPresent()) {
                    Race race = raceOpt.get(); // Lấy đối tượng Race
                    if ("STEWARDS_INQUIRY".equals(race.getStatus())) { // Nếu trận đua đang tạm hoãn điều tra
                        race.setStatus("FINISHED"); // Đổi trạng thái trận đua trở lại FINISHED
                        raceRepository.save(race); // Lưu trận đua vào cơ sở dữ liệu
                    }
                }
            }
        }
    }

    @Transactional
    public void stopEntry(Integer entryId) {
        RaceEntry entry = raceEntryRepository.findById(entryId) // Tìm lượt thi đấu theo entryId
                .orElseThrow(() -> new IllegalArgumentException("Race entry not found")); // Ném ngoại lệ nếu không tìm thấy
        if (!"APPROVED".equalsIgnoreCase(entry.getStatus()) && !"RUNNING".equalsIgnoreCase(entry.getStatus())) { // Kiểm tra nếu lượt thi đấu không ở trạng thái APPROVED hoặc RUNNING
            throw new IllegalStateException("Entry must be APPROVED or RUNNING to stop"); // Ném ngoại lệ yêu cầu lượt thi đấu phải ở trạng thái cho phép dừng
        }
        entry.setStatus("STOPPED"); // Đổi trạng thái lượt thi đấu sang STOPPED
        raceEntryRepository.save(entry); // Lưu lượt thi đấu đã dừng vào DB
    }

    @Transactional
    public void resumeEntry(Integer entryId) {
        RaceEntry entry = raceEntryRepository.findById(entryId) // Tìm lượt thi đấu theo entryId
                .orElseThrow(() -> new IllegalArgumentException("Race entry not found")); // Ném ngoại lệ nếu không tìm thấy
        if (!"STOPPED".equalsIgnoreCase(entry.getStatus())) { // Kiểm tra nếu lượt thi đấu không ở trạng thái STOPPED
            throw new IllegalStateException("Entry must be STOPPED to resume"); // Ném ngoại lệ yêu cầu trạng thái phải là STOPPED mới được tiếp tục
        }
        entry.setStatus("RUNNING"); // Đổi trạng thái lượt thi đấu trở lại RUNNING
        raceEntryRepository.save(entry); // Lưu lượt thi đấu vào DB
    }

    @Transactional
    public void disqualifyEntry(Integer entryId) {
        RaceEntry entry = raceEntryRepository.findById(entryId) // Tra cứu lượt thi đấu theo entryId
                .orElseThrow(() -> new IllegalArgumentException("Race entry not found")); // Ném ngoại lệ nếu không tìm thấy
        entry.setStatus("DISQUALIFIED"); // Đổi trạng thái lượt thi đấu sang DISQUALIFIED (truất quyền)
        entry.setFinalPosition(null); // Hủy vị trí cán đích
        entry.setFinishTime("DQ"); // Đặt ghi nhận thời gian chạy là DQ
        entry.setRatingAdjustment(-2); // Trừ 2 điểm Elo Rating của lượt đua
        raceEntryRepository.save(entry); // Lưu cập nhật lượt thi đấu vào DB

        // Update Horse rating (-2)
        Optional<Horse> horseOpt = horseRepository.findById(entry.getHorseId()); // Tra cứu thông tin con ngựa
        if (horseOpt.isPresent()) { // Nếu tìm thấy con ngựa
            Horse horse = horseOpt.get(); // Lấy đối tượng Horse
            int curRating = horse.getCurrentRating() != null ? horse.getCurrentRating() : 52; // Lấy điểm rating hiện tại
            horse.setCurrentRating(Math.max(0, curRating - 2)); // Trừ 2 điểm rating của chiến mã (không âm)
            horseRepository.save(horse); // Lưu thay đổi điểm rating của con ngựa vào DB
        }
    }

    @Transactional
    public void suspendRace(Integer raceId, String stewardReport) {
        Race race = raceRepository.findById(raceId) // Tìm trận đua theo raceId
                .orElseThrow(() -> new IllegalArgumentException("Race not found")); // Ném ngoại lệ nếu không tìm thấy
        if (!"RUNNING".equals(race.getStatus()) && !"STEWARDS_INQUIRY".equals(race.getStatus())) { // Kiểm tra nếu trận đua không ở trạng thái RUNNING hoặc STEWARDS_INQUIRY
            throw new IllegalStateException("Race must be RUNNING or STEWARDS_INQUIRY to suspend"); // Ném ngoại lệ nếu trạng thái không hợp lệ để tạm dừng
        }
        race.setStatus("STOPPED"); // Chuyển trạng thái trận đua sang STOPPED (tạm dừng)
        race.setStewardReport(stewardReport); // Lưu báo cáo lý do tạm dừng của Ban Giám sát
        raceRepository.save(race); // Lưu đối tượng trận đua vào DB

        List<RaceEntry> entries = raceEntryRepository.findByRaceId(raceId); // Lấy danh sách tất cả các lượt đua trong trận
        for (RaceEntry entry : entries) { // Duyệt từng lượt đua
            String es = entry.getStatus();
            if ("RUNNING".equals(es) || "APPROVED".equals(es)) { // Chuyển trạng thái lượt đua của ngựa đang chạy sang STOPPED
                entry.setStatus("STOPPED"); // Đổi trạng thái lượt thi đấu sang STOPPED
                raceEntryRepository.save(entry); // Lưu lượt thi đấu vào DB
            }
        }
    }

    @Transactional
    public void resumeRace(Integer raceId) {
        Race race = raceRepository.findById(raceId) // Tìm trận đua theo raceId
                .orElseThrow(() -> new IllegalArgumentException("Race not found")); // Ném ngoại lệ nếu không tìm thấy trận đua
        if (!"STOPPED".equals(race.getStatus())) { // Kiểm tra nếu trận đua không ở trạng thái STOPPED
            throw new IllegalStateException("Race must be STOPPED to resume"); // Ném ngoại lệ yêu cầu trận đua phải ở trạng thái STOPPED
        }
        race.setStatus("RUNNING"); // Đổi trạng thái trận đua trở lại RUNNING
        raceRepository.save(race); // Lưu đối tượng trận đua vào DB

        List<RaceEntry> entries = raceEntryRepository.findByRaceId(raceId); // Lấy danh sách tất cả các lượt đua trong trận
        for (RaceEntry entry : entries) { // Duyệt từng lượt đua
            if ("STOPPED".equals(entry.getStatus())) { // Khôi phục các con ngựa đang tạm dừng
                entry.setStatus("RUNNING"); // Đổi trạng thái lượt thi đấu trở lại RUNNING
                raceEntryRepository.save(entry); // Lưu lượt thi đấu vào DB
            }
        }
    }

    private void applyFineToUserWallet(Integer userId, String penaltyStr, String description) {
        if (userId == null || penaltyStr == null) return;
        java.math.BigDecimal fineAmount = java.math.BigDecimal.ZERO;
        String cleanPenalty = penaltyStr.replace(",", "");
        java.util.regex.Matcher m = java.util.regex.Pattern.compile("(\\d+(?:\\.\\d+)?)").matcher(cleanPenalty);
        if (m.find()) {
            try {
                fineAmount = new java.math.BigDecimal(m.group(1));
            } catch (Exception e) {}
        }
        if (fineAmount.compareTo(java.math.BigDecimal.ZERO) <= 0) {
            if (penaltyStr.toUpperCase().contains("FINE") || penaltyStr.toUpperCase().contains("PHẠT")) {
                fineAmount = new java.math.BigDecimal("50000");
            }
        }

        if (fineAmount.compareTo(java.math.BigDecimal.ZERO) > 0) {
            final java.math.BigDecimal fine = fineAmount;
            userRepository.findById(userId).ifPresent(user -> {
                java.math.BigDecimal curBal = user.getWalletBalance() != null ? user.getWalletBalance() : java.math.BigDecimal.ZERO;
                java.math.BigDecimal newBal = curBal.subtract(fine);
                user.setWalletBalance(newBal);
                user.setBalance(newBal);
                userRepository.save(user);

                WalletTransaction tx = new WalletTransaction();
                tx.setUserId(userId);
                tx.setAmount(fine.negate());
                tx.setTransactionType("REFEREE_FINE");
                tx.setDescription("Referee Violation Fine: " + (description != null ? description : "Violation") + " (" + penaltyStr + ")");
                tx.setCreatedAt(new java.sql.Timestamp(System.currentTimeMillis()));
                walletTransactionRepository.save(tx);
            });
        }
    }
}
