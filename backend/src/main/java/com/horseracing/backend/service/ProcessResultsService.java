package com.horseracing.backend.service;

import com.horseracing.backend.entity.*;
import com.horseracing.backend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service // Khai báo lớp này là một Spring Service quản lý logic nghiệp vụ
@RequiredArgsConstructor // Tự động inject các dependency final thông qua constructor
public class ProcessResultsService {

    private final RaceRepository raceRepository; // Kho dữ liệu quản lý các trận đua
    private final RaceEntryRepository raceEntryRepository; // Kho dữ liệu quản lý thông tin lượt đua của từng ngựa
    private final HorseRepository horseRepository; // Kho dữ liệu quản lý thông tin chiến mã
    private final UserRepository userRepository; // Kho dữ liệu quản lý người dùng (nài ngựa, chủ ngựa)

    @Transactional // Đảm bảo toàn bộ quá trình cập nhật kết quả trận đua được thực thi trong một Transaction
    public void confirmResults(Integer raceId, String stewardReport, List<Map<String, Object>> entriesResults) {
        // Tìm thông tin trận đua theo raceId trong cơ sở dữ liệu, nếu không thấy sẽ ném ngoại lệ
        Race race = raceRepository.findById(raceId)
                .orElseThrow(() -> new IllegalArgumentException("Race not found"));

        // Danh sách các trạng thái trận đua không hợp lệ để thực hiện nhập và xác nhận kết quả
        java.util.List<String> ineligibleStatuses = java.util.Arrays.asList(
                "SCHEDULED", "DECLARATION_OPEN", "DECLARATION_CLOSED", "RACE_ASSIGNED", "OFFICIAL", "CANCELLED"
        );
        // Kiểm tra xem trạng thái hiện tại của trận đua có nằm trong danh sách không hợp lệ hay không
        if (ineligibleStatuses.contains(race.getStatus())) {
            // Ném ngoại lệ báo lỗi nếu trạng thái trận đua chưa sẵn sàng hoặc đã hoàn tất/hủy
            throw new IllegalArgumentException("Cannot confirm results. The race is in status '" + race.getStatus() + "' and cannot be processed.");
        }

        // Lấy giá trị tổng quỹ tiền thưởng của trận đua, nếu null mặc định là 0
        BigDecimal purse = race.getPurse() != null ? race.getPurse() : BigDecimal.ZERO;

        // Vòng lặp thứ nhất: Kiểm tra tính hợp lệ của thời gian hoàn thành cho tất cả các lượt thi đấu
        for (Map<String, Object> res : entriesResults) {
            // Lấy ID lượt tham gia từ map kết quả
            Object entryIdObj = res.get("entryId");
            // Chuyển đổi entryId thành kiểu Integer nếu khác null
            Integer entryId = entryIdObj != null ? Integer.parseInt(entryIdObj.toString()) : null;
            // Lấy chuỗi thời gian hoàn thành lượt đua
            String finishTime = (String) res.get("finishTime");
            // Nếu entryId không rỗng, tiến hành kiểm tra bản ghi lượt đua
            if (entryId != null) {
                // Tìm bản ghi RaceEntry theo entryId trong CSDL
                Optional<RaceEntry> entryOpt = raceEntryRepository.findById(entryId);
                // Nếu tìm thấy lượt đua và ngựa chưa bị loại (DISQUALIFIED)
                if (entryOpt.isPresent() && !"DISQUALIFIED".equalsIgnoreCase(entryOpt.get().getStatus())) {
                    // Yêu cầu bắt buộc phải nhập thời gian hoàn thành nếu không bị loại
                    if (finishTime == null || finishTime.trim().isEmpty()) {
                        // Ném lỗi nếu thời gian hoàn thành bị bỏ trống
                        throw new IllegalArgumentException("Vui lòng nhập thời gian hoàn thành cho tất cả ngựa thi đấu trước khi hoàn tất trận đua.");
                    }
                    // Loại bỏ khoảng trắng thừa của chuỗi thời gian
                    String tStr = finishTime.trim();
                    // Kiểm tra định dạng thời gian (phải là "DQ" hoặc định dạng MM:SS / MM:SS.ms hợp lệ)
                    if (!"DQ".equalsIgnoreCase(tStr) && !tStr.matches("^\\d+:[0-5]\\d(\\.\\d{1,3})?$")) {
                        // Ném ngoại lệ thông báo định dạng thời gian không đúng quy định
                        throw new IllegalArgumentException("Thời gian hoàn thành ('" + finishTime + "') không hợp lệ. Số giây phải nằm trong khoảng 00-59 (Định dạng MM:SS hoặc MM:SS.ms, ví dụ: 1:48.35).");
                    }
                }
            }
        }

        // Vòng lặp thứ hai: Xử lý chi tiết kết quả, tính tiền thưởng và cập nhật chỉ số cho từng lượt đua
        for (Map<String, Object> res : entriesResults) {
            // Lấy ID lượt tham gia lượt đua
            Object entryIdObj = res.get("entryId");
            // Chuyển đổi entryIdObj sang kiểu Integer
            Integer entryId = entryIdObj != null ? Integer.parseInt(entryIdObj.toString()) : null;

            // Khởi tạo vị trí về đích mặc định là null
            Integer finalPosition = null;
            // Lấy đối tượng vị trí về đích từ kết quả truyền vào
            Object fpObj = res.get("finalPosition");
            // Kiểm tra nếu giá trị vị trí về đích khác null
            if (fpObj != null) {
                // Ép kiểu về chuỗi và xóa khoảng trắng thừa
                String fps = fpObj.toString().trim();
                // Kiểm tra chuỗi hợp lệ không rỗng, không phải 'null' hay 'undefined'
                if (!fps.isEmpty() && !"null".equalsIgnoreCase(fps) && !"undefined".equalsIgnoreCase(fps)) {
                    try {
                        // Chuyển đổi chuỗi vị trí về đích sang số nguyên
                        finalPosition = Integer.parseInt(fps);
                    } catch (NumberFormatException e) {
                        // Bỏ qua ngoại lệ nếu không chuyển đổi thành số được
                    }
                }
            }

            // Lấy chuỗi thời gian hoàn thành lượt đua
            String finishTime = (String) res.get("finishTime");
            // Lấy cân nặng thực tế sau khi kiểm tra lại (Weigh-in)
            Object weightVal = res.get("weighInWeight");
            // Khởi tạo cân nặng weigh-in mặc định bằng 0
            BigDecimal weighInWeight = BigDecimal.ZERO;
            // Nếu có giá trị cân nặng truyền lên
            if (weightVal != null) {
                // Ép kiểu chuỗi và xóa khoảng trắng
                String ws = weightVal.toString().trim();
                // Kiểm tra chuỗi cân nặng có hợp lệ không
                if (!ws.isEmpty() && !"null".equalsIgnoreCase(ws) && !"undefined".equalsIgnoreCase(ws)) {
                    // Chuyển đổi chuỗi thành BigDecimal
                    weighInWeight = new BigDecimal(ws);
                }
            }

            // Tìm thông tin RaceEntry tương ứng trong cơ sở dữ liệu
            Optional<RaceEntry> entryOpt = raceEntryRepository.findById(entryId);
            // Nếu tìm thấy đối tượng lượt thi đấu
            if (entryOpt.isPresent()) {
                // Lấy đối tượng RaceEntry ra từ Optional
                RaceEntry entry = entryOpt.get();
                
                // Nếu ngựa đã bị loại trong trận (DISQUALIFIED do vi phạm), giữ nguyên trạng thái
                if ("DISQUALIFIED".equals(entry.getStatus())) {
                    // Đặt vị trí về đích thành null
                    entry.setFinalPosition(null);
                    // Ghi nhận thời gian là "DQ" (Disqualified)
                    entry.setFinishTime("DQ");
                    // Không được nhận tiền thưởng
                    entry.setPrizeMoney(BigDecimal.ZERO);
                    
                    // Chỉ tăng số trận tham gia của ngựa, không trừ thêm điểm rating (rating đã được trừ khi ghi nhận vi phạm)
                    Optional<Horse> horseOpt = horseRepository.findById(entry.getHorseId());
                    // Nếu tìm thấy thông tin chiến mã
                    if (horseOpt.isPresent()) {
                        // Lấy đối tượng chiến mã
                        Horse horse = horseOpt.get();
                        // Tăng tổng số trận đua chiến mã đã tham gia thêm 1
                        horse.setTotalRaces(horse.getTotalRaces() + 1);
                        // Lưu thông tin chiến mã vào CSDL
                        horseRepository.save(horse);
                    }
                    // Lưu thông tin lượt thi đấu đã cập nhật
                    raceEntryRepository.save(entry);
                    // Chuyển sang xử lý lượt thi đấu tiếp theo
                    continue;
                }
                
                // Nếu trọng tài loại trực tiếp (manual DQ) ở bước xác nhận kết quả
                if ("DQ".equals(finishTime)) {
                    // Cập nhật trạng thái lượt thi đấu thành DISQUALIFIED
                    entry.setStatus("DISQUALIFIED");
                    // Xóa vị trí về đích
                    entry.setFinalPosition(null);
                    // Đặt thời gian hoàn thành là DQ
                    entry.setFinishTime("DQ");
                    // Đặt tiền thưởng bằng 0
                    entry.setPrizeMoney(BigDecimal.ZERO);
                    // Trừ 2 điểm rating vì bị loại thủ công
                    entry.setRatingAdjustment(-2);

                    // Tìm thông tin chiến mã để trừ điểm rating
                    Optional<Horse> horseOpt = horseRepository.findById(entry.getHorseId());
                    // Nếu chiến mã tồn tại
                    if (horseOpt.isPresent()) {
                        // Lấy đối tượng chiến mã
                        Horse horse = horseOpt.get();
                        // Tăng tổng số lượt đua đã tham gia lên 1
                        horse.setTotalRaces(horse.getTotalRaces() + 1);
                        // Tính toán điểm rating mới sau khi trừ điểm điều chỉnh
                        int newRating = horse.getCurrentRating() + entry.getRatingAdjustment();
                        // Cập nhật điểm rating mới (đảm bảo không nhỏ hơn 0)
                        horse.setCurrentRating(Math.max(0, newRating));
                        // Lưu thông tin chiến mã cập nhật vào CSDL
                        horseRepository.save(horse);
                    }
                    // Lưu thông tin lượt đua cập nhật vào CSDL
                    raceEntryRepository.save(entry);
                    // Chuyển sang lượt thi đấu tiếp theo
                    continue;
                }

                // Kiểm tra chênh lệch cân nặng sau trận đấu (Weighing-in underweight check)
                // Nếu cân nặng thực tế sau trận (weigh-in) nhẹ hơn mức đăng ký (carriedWeight) quá 0.5kg
                BigDecimal carriedWeight = entry.getCarriedWeight() != null ? entry.getCarriedWeight() : BigDecimal.ZERO;
                // Tính độ chênh lệch giữa khối lượng đăng ký gánh chì và khối lượng cân thực tế
                BigDecimal diff = carriedWeight.subtract(weighInWeight);
                // Nếu bị thiếu cân quá 0.5kg so với mức gánh chì đăng ký
                if (diff.compareTo(new BigDecimal("0.5")) > 0) {
                    // Đổi trạng thái lượt đua thành loại (DISQUALIFIED)
                    entry.setStatus("DISQUALIFIED");
                    // Hủy vị trí cán đích
                    entry.setFinalPosition(null);
                    // Ghi nhận thời gian chạy là DQ
                    entry.setFinishTime("DQ");
                    // Đặt tiền thưởng bằng 0
                    entry.setPrizeMoney(BigDecimal.ZERO);
                    // Trừ 2 điểm rating do gian lận cân nặng
                    entry.setRatingAdjustment(-2);
                } else {
                    // Nếu cân nặng hợp lệ, cập nhật trạng thái đã hoàn thành (FINISHED)
                    entry.setStatus("FINISHED");
                    // Thiết lập vị trí cán đích chính thức
                    entry.setFinalPosition(finalPosition);
                    // Thiết lập thời gian hoàn thành lượt chạy
                    entry.setFinishTime(finishTime);

                    // Phân chia tiền thưởng theo Class: Hạng 1 (50%), Hạng 2 (30%), Hạng 3 (20%)
                    BigDecimal prize = BigDecimal.ZERO;
                    // Khởi tạo mức điều chỉnh điểm rating
                    int ratingAdj = 0;
                    // Nếu đạt Hạng 1
                    if (finalPosition != null && finalPosition == 1) {
                        // Thưởng 50% tổng quỹ thưởng của trận đua
                        prize = purse.multiply(new BigDecimal("0.50"));
                        // Cộng 6 điểm rating cho quán quân
                        ratingAdj = 6;
                    } else if (finalPosition != null && finalPosition == 2) { // Nếu đạt Hạng 2
                        // Thưởng 30% tổng quỹ thưởng
                        prize = purse.multiply(new BigDecimal("0.30"));
                        // Cộng 3 điểm rating cho á quân
                        ratingAdj = 3;
                    } else if (finalPosition != null && finalPosition == 3) { // Nếu đạt Hạng 3
                        // Thưởng 20% tổng quỹ thưởng
                        prize = purse.multiply(new BigDecimal("0.20"));
                        // Cộng 1 điểm rating cho hạng 3
                        ratingAdj = 1;
                    } else { // Các thứ hạng khác
                        // Không thay đổi điểm rating
                        ratingAdj = 0;
                    }

                    // Gán tiền thưởng đã tính vào lượt đua
                    entry.setPrizeMoney(prize);
                    // Gán điểm rating điều chỉnh vào lượt đua
                    entry.setRatingAdjustment(ratingAdj);

                    // Phân bổ thưởng vào ví tiền (Wallet balance): 20% cho Nài ngựa (Jockey), 80% cho Chủ ngựa (Owner)
                    if (prize.compareTo(BigDecimal.ZERO) > 0) {
                        BigDecimal jockeyShare = prize.multiply(new BigDecimal("0.20"));
                        BigDecimal ownerShare = prize.multiply(new BigDecimal("0.80"));

                        // Nạp tiền vào ví của Nài ngựa
                        Optional<User> jOpt = userRepository.findById(entry.getJockeyId());
                        if (jOpt.isPresent()) {
                            User jUser = jOpt.get();
                            BigDecimal currentBal = jUser.getWalletBalance() != null ? jUser.getWalletBalance() : BigDecimal.ZERO;
                            jUser.setWalletBalance(currentBal.add(jockeyShare));
                            userRepository.save(jUser);
                        }

                        // Nạp tiền vào ví của Chủ ngựa
                        Optional<Horse> hOpt = horseRepository.findById(entry.getHorseId());
                        if (hOpt.isPresent() && hOpt.get().getOwnerId() != null) {
                            Optional<User> oOpt = userRepository.findById(hOpt.get().getOwnerId());
                            if (oOpt.isPresent()) {
                                User oUser = oOpt.get();
                                BigDecimal currentBal = oUser.getWalletBalance() != null ? oUser.getWalletBalance() : BigDecimal.ZERO;
                                oUser.setWalletBalance(currentBal.add(ownerShare));
                                userRepository.save(oUser);
                            }
                        }
                    }

                    // Cập nhật chỉ số thống kê của Nài ngựa (Jockey)
                    Optional<User> jockeyOpt = userRepository.findById(entry.getJockeyId());
                    // Nếu Nài ngựa tồn tại trong CSDL
                    if (jockeyOpt.isPresent()) {
                        // Lấy đối tượng tài khoản Nài ngựa
                        User jockey = jockeyOpt.get();
                        // Tăng tổng số trận tham gia của nài ngựa lên 1
                        jockey.setTotalRacesParticipated((jockey.getTotalRacesParticipated() != null ? jockey.getTotalRacesParticipated() : 0) + 1);
                        // Nếu lọt vào top 3 chung cuộc
                        if (finalPosition != null && finalPosition <= 3) {
                            // Tăng số lần lọt top 3 của nài ngựa lên 1
                            jockey.setTotalTop3Finishes((jockey.getTotalTop3Finishes() != null ? jockey.getTotalTop3Finishes() : 0) + 1);
                        }
                        // Phân chia tiền thưởng đạt giải: Kỵ sĩ (Jockey) nhận 20%, Chủ ngựa (Owner) nhận 80% (đã nạp ở trên)
                        // Lưu thông tin Nài ngựa vào CSDL
                        userRepository.save(jockey);
                    }
                }

                // Cập nhật chỉ số thống kê của Chiến mã (Horse)
                Optional<Horse> horseOpt = horseRepository.findById(entry.getHorseId());
                if (horseOpt.isPresent()) {
                    Horse horse = horseOpt.get();
                    // Tăng tổng số trận đua của chiến mã lên 1
                    horse.setTotalRaces(horse.getTotalRaces() + 1);
                    // Nếu chiến mã đạt vị trí số 1 và không bị loại
                    if (finalPosition != null && finalPosition == 1 && !"DISQUALIFIED".equals(entry.getStatus())) {
                        // Tăng tổng số trận thắng của chiến mã lên 1
                        horse.setTotalWins(horse.getTotalWins() + 1);
                    }
                    // Tính toán rating mới (không để âm)
                    int newRating = horse.getCurrentRating() + entry.getRatingAdjustment();
                    // Cập nhật điểm rating mới cho chiến mã
                    horse.setCurrentRating(Math.max(0, newRating));
                    // Lưu thông tin chiến mã vào CSDL
                    horseRepository.save(horse);
                }

                // Lưu bản ghi lượt thi đấu đã hoàn tất cập nhật vào CSDL
                raceEntryRepository.save(entry);
            }
        }

        // Cập nhật báo cáo giám sát của trọng tài cho trận đua
        race.setStewardReport(stewardReport);
        // Đổi trạng thái trận đua thành OFFICIAL (kết quả chính thức)
        race.setStatus("OFFICIAL");
        // Tự động xóa liên kết xem trực tiếp livestream khi trận đua kết thúc
        race.setYoutubeLiveUrl(null);
        // Lưu thông tin trận đua đã cập nhật vào CSDL
        raceRepository.save(race);
    }
}
