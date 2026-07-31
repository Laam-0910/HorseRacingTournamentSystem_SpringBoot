package com.horseracing.backend.scheduler;

import com.horseracing.backend.entity.Race;
import com.horseracing.backend.entity.RaceEntry;
import com.horseracing.backend.entity.RaceInvitation;
import com.horseracing.backend.repository.RaceRepository;
import com.horseracing.backend.repository.RaceEntryRepository;
import com.horseracing.backend.repository.RaceInvitationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Timestamp;
import java.util.List;
import java.util.Optional;

@Component
@RequiredArgsConstructor
@Slf4j
public class RaceStatusScheduler {

    private final RaceRepository raceRepository;
    private final RaceEntryRepository raceEntryRepository;
    private final RaceInvitationRepository raceInvitationRepository;

    @Scheduled(fixedDelay = 30000) // Chạy định kỳ mỗi 30 giây (30000ms)
    @Transactional
    public void updateRaceStatuses() {
        // Ghi log bắt đầu tiến trình định kỳ cập nhật trạng thái các trận đua
        log.info("Running scheduled task to update race statuses...");
        // Lấy tất cả các trận đua từ cơ sở dữ liệu
        List<Race> races = raceRepository.findAll();
        // Lấy thời điểm hiện tại dưới dạng Timestamp
        Timestamp current = new Timestamp(System.currentTimeMillis());

        // Duyệt qua danh sách tất cả các trận đua
        for (Race race : races) {
            // Lấy trạng thái hiện tại của trận đua
            String status = race.getStatus();
            // Chỉ kiểm tra các trận đua đang ở trạng thái SCHEDULED, DECLARATION_OPEN hoặc DECLARATION_CLOSED
            if ("SCHEDULED".equals(status) || "DECLARATION_OPEN".equals(status) || "DECLARATION_CLOSED".equals(status)) {
                // Lấy thời gian bắt đầu mở đăng ký
                Timestamp regStart = race.getRegistrationStartTime();
                // Lấy thời gian kết thúc đóng đăng ký
                Timestamp regEnd = race.getRegistrationEndTime();

                // Khởi tạo trạng thái mục tiêu mặc định là trạng thái hiện tại
                String targetStatus = status;
                // Nếu đã qua thời gian đóng đăng ký
                if (regEnd != null && current.compareTo(regEnd) >= 0) {
                    // Đếm số lượng lượt tham gia hợp lệ (chưa bị từ chối)
                    long entryCount = raceEntryRepository.findByRaceId(race.getId()).stream()
                            .filter(e -> !"REJECTED".equalsIgnoreCase(e.getStatus()))
                            .count();
                    // Lấy số lượng thí sinh tối thiểu yêu cầu (mặc định 3)
                    int min = race.getMinEntries() != null ? race.getMinEntries() : 3;
                    // Nếu số lượng thí sinh đăng ký nhỏ hơn số lượng tối thiểu yêu cầu
                    if (entryCount < min) {
                        // Chuyển trạng thái trận đua thành CANCELLED (Đã hủy)
                        targetStatus = "CANCELLED";
                    } else {
                        // Đóng cổng đăng ký (DECLARATION_CLOSED)
                        targetStatus = "DECLARATION_CLOSED";
                    }
                } else if (regStart != null && current.compareTo(regStart) >= 0) {
                    // Mở cổng đăng ký (DECLARATION_OPEN) nếu đã tới giờ mở đăng ký
                    targetStatus = "DECLARATION_OPEN";
                } else {
                    // Giữ ở trạng thái SCHEDULED
                    targetStatus = "SCHEDULED";
                }

                // Nếu trạng thái mục tiêu khác với trạng thái hiện tại
                if (!targetStatus.equals(status)) {
                    // Ghi log việc thay đổi trạng thái của trận đua
                    log.info("Race ID {} status changing from {} to {}", race.getId(), status, targetStatus);
                    // Cập nhật trạng thái mới cho trận đua
                    race.setStatus(targetStatus);
                    // Lưu trận đua vào cơ sở dữ liệu
                    raceRepository.save(race);

                    // Nếu trận đua bị hủy do thiếu số lượng thí sinh tối thiểu
                    if ("CANCELLED".equals(targetStatus)) {
                        // Lấy danh sách tất cả các lượt đăng ký thi đấu của trận đua này
                        List<RaceEntry> entries = raceEntryRepository.findByRaceId(race.getId());
                        // Duyệt từng lượt thi đấu và chuyển sang trạng thái REJECTED (Từ chối/Hủy)
                        for (RaceEntry entry : entries) {
                            entry.setStatus("REJECTED"); // Đặt trạng thái bị từ chối
                            entry.setGateNumber(0); // Đặt lại số cổng xuất phát về 0
                            entry.setCarriedWeight(null); // Đặt lại cân nặng
                            entry.setHandicapWeight(null); // Đặt lại handicap
                            raceEntryRepository.save(entry); // Lưu lượt thi đấu đã cập nhật
                        }
                    }
                }
            }
        }

        // Tự động hết hạn các lời mời đang ở trạng thái PENDING nếu thời gian đăng ký trận đua đã kết thúc
        List<RaceInvitation> pendingInvitations = raceInvitationRepository.findByStatus("PENDING");
        // Duyệt từng lời mời đang chờ xử lý
        for (RaceInvitation invitation : pendingInvitations) {
            // Tìm trận đua tương ứng của lời mời
            Optional<Race> raceOpt = raceRepository.findById(invitation.getRaceId());
            if (raceOpt.isPresent()) {
                Race race = raceOpt.get();
                // Nếu đã qua hạn chót đăng ký của trận đua
                if (race.getRegistrationEndTime() != null && current.compareTo(race.getRegistrationEndTime()) >= 0) {
                    // Ghi log chuyển trạng thái lời mời sang EXPIRED (Hết hạn)
                    log.info("Expiring pending invitation ID {} for race ID {} since registration end time has passed", invitation.getId(), race.getId());
                    invitation.setStatus("EXPIRED"); // Đặt trạng thái hết hạn
                    raceInvitationRepository.save(invitation); // Lưu lời mời đã cập nhật vào DB
                }
            }
        }
    }
}
