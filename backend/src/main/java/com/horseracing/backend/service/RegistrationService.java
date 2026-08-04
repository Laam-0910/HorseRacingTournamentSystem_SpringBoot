package com.horseracing.backend.service;

import com.horseracing.backend.dto.HorseRaceMeetingRegistrationDTO;
import com.horseracing.backend.dto.JockeyRaceMeetingRegistrationDTO;
import com.horseracing.backend.dto.OwnerRaceMeetingRegistrationDTO;
import com.horseracing.backend.entity.*;
import com.horseracing.backend.mapper.RegistrationMapper;
import com.horseracing.backend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Timestamp;

/**
 * Lớp dịch vụ RegistrationService - Xử lý nghiệp vụ đăng ký tham gia Ngày hội đua (Race Meeting).
 * - Cho phép Nài ngựa đăng ký tham gia ngày đua (kiểm tra chống đăng ký trùng).
 * - Cho phép Chủ ngựa đăng ký tham gia ngày đua.
 * - Cho phép đăng ký Ngựa đua tham gia ngày đua (kiểm tra trạng thái giải nghệ RETIRED, chống trùng lặp).
 * - Các đơn đăng ký được lưu trữ dưới dạng giao dịch an toàn (Transactional).
 */
@Service
@RequiredArgsConstructor
public class RegistrationService {

    private final JockeyRaceMeetingRegistrationRepository jockeyRegRepository;
    private final OwnerRaceMeetingRegistrationRepository ownerRegRepository;
    private final HorseRaceMeetingRegistrationRepository horseRegRepository;
    private final RaceMeetingRepository raceMeetingRepository;
    private final SeasonRepository seasonRepository;
    private final UserRepository userRepository;
    private final HorseRepository horseRepository;
    private final WalletTransactionRepository walletTransactionRepository;
    private final RegistrationMapper registrationMapper; // Bộ ánh xạ thực thể đăng ký sang DTO

    private void validateMeetingForRegistration(RaceMeeting meeting) {
        if (meeting == null) {
            throw new IllegalArgumentException("Race meeting not found");
        }
        if (!"ACTIVE".equalsIgnoreCase(meeting.getStatus() != null ? meeting.getStatus() : "ACTIVE")) {
            throw new IllegalStateException("Cannot register: Race Meeting '" + meeting.getName() + "' is currently INACTIVE or closed for registration.");
        }
        Season season = seasonRepository.findById(meeting.getSeasonId()).orElse(null);
        if (season != null && ("CLOSED".equalsIgnoreCase(season.getStatus()) || "INACTIVE".equalsIgnoreCase(season.getStatus()))) {
            throw new IllegalStateException("Cannot register: Parent Season '" + season.getName() + "' is currently CLOSED.");
        }
    }

    // Đăng ký Nài ngựa tham gia Ngày hội đua (Hỗ trợ đăng ký lại nếu đơn cũ bị REJECTED)
    @Transactional
    public JockeyRaceMeetingRegistrationDTO registerJockey(Integer meetingId, Integer jockeyId) {
        RaceMeeting meeting = raceMeetingRepository.findById(meetingId)
                .orElseThrow(() -> new IllegalArgumentException("Race meeting not found"));
        validateMeetingForRegistration(meeting);

        User jockey = userRepository.findById(jockeyId)
                .orElseThrow(() -> new IllegalArgumentException("Jockey user not found"));

        java.util.Optional<JockeyRaceMeetingRegistration> existingOpt = jockeyRegRepository.findByRaceMeetingIdAndJockeyId(meetingId, jockeyId);
        if (existingOpt.isPresent()) {
            JockeyRaceMeetingRegistration existing = existingOpt.get();
            if ("REJECTED".equalsIgnoreCase(existing.getStatus())) {
                existing.setStatus("PENDING");
                existing.setRegisteredAt(new Timestamp(System.currentTimeMillis()));
                JockeyRaceMeetingRegistration saved = jockeyRegRepository.save(existing);
                return registrationMapper.toDTO(saved, jockey.getUsername(), meeting.getName());
            } else {
                throw new IllegalArgumentException("Jockey is already registered for this meeting");
            }
        }

        JockeyRaceMeetingRegistration reg = new JockeyRaceMeetingRegistration(); // Khởi tạo thực thể đăng ký nài
        reg.setRaceMeetingId(meetingId); // Gán mã ngày hội đua
        reg.setJockeyId(jockeyId); // Gán mã nài ngựa
        reg.setStatus("PENDING"); // Đặt trạng thái mặc định chờ duyệt
        reg.setRegisteredAt(new Timestamp(System.currentTimeMillis())); // Lưu thời điểm nộp đơn
        
        JockeyRaceMeetingRegistration saved = jockeyRegRepository.save(reg); // Lưu đơn vào DB
        
        String jockeyName = jockey.getUsername(); // Lấy tên nài ngựa
        String meetingName = meeting.getName(); // Lấy tên buổi đua
        
        return registrationMapper.toDTO(saved, jockeyName, meetingName); // Trả về DTO đăng ký nài
    }

    // Đăng ký Chủ ngựa tham gia Ngày hội đua (Hỗ trợ đăng ký lại nếu đơn cũ bị REJECTED)
    @Transactional
    public OwnerRaceMeetingRegistrationDTO registerOwner(Integer meetingId, Integer ownerId) {
        RaceMeeting meeting = raceMeetingRepository.findById(meetingId)
                .orElseThrow(() -> new IllegalArgumentException("Race meeting not found"));
        validateMeetingForRegistration(meeting);

        User owner = userRepository.findById(ownerId)
                .orElseThrow(() -> new IllegalArgumentException("Owner user not found"));

        java.math.BigDecimal ticketPrice = meeting.getTicketPrice() != null ? meeting.getTicketPrice() : java.math.BigDecimal.ZERO;

        java.util.Optional<OwnerRaceMeetingRegistration> existingOpt = ownerRegRepository.findByRaceMeetingIdAndOwnerId(meetingId, ownerId);
        if (existingOpt.isPresent()) {
            OwnerRaceMeetingRegistration existing = existingOpt.get();
            if ("REJECTED".equalsIgnoreCase(existing.getStatus())) {
                if (ticketPrice.compareTo(java.math.BigDecimal.ZERO) > 0) {
                    java.math.BigDecimal balance = owner.getWalletBalance() != null ? owner.getWalletBalance() : java.math.BigDecimal.ZERO;
                    if (balance.compareTo(ticketPrice) < 0) {
                        throw new IllegalArgumentException("Insufficient wallet balance (" + balance + " VNĐ) to re-pay for meeting ticket (" + ticketPrice + " VNĐ). Please top up your wallet.");
                    }
                    owner.setWalletBalance(balance.subtract(ticketPrice));
                    userRepository.save(owner);

                    WalletTransaction txOwner = new WalletTransaction();
                    txOwner.setUserId(ownerId);
                    txOwner.setAmount(ticketPrice.negate());
                    txOwner.setTransactionType("TICKET_FEE");
                    txOwner.setDescription("Bought ticket for Race Meeting: " + meeting.getName() + " (Held in Escrow Vault)");
                    txOwner.setRaceMeetingId(meetingId);
                    txOwner.setCreatedAt(new Timestamp(System.currentTimeMillis()));
                    walletTransactionRepository.save(txOwner);
                }
                existing.setStatus("PENDING");
                existing.setRegisteredAt(new Timestamp(System.currentTimeMillis()));
                OwnerRaceMeetingRegistration saved = ownerRegRepository.save(existing);

                // Tự động khôi phục trạng thái PENDING cho tất cả các chiến mã thuộc sở hữu của Chủ ngựa đối với Buổi đua này
                java.util.List<Horse> ownerHorses = horseRepository.findByOwnerId(ownerId);
                for (Horse h : ownerHorses) {
                    horseRegRepository.findByRaceMeetingIdAndHorseId(meetingId, h.getId()).ifPresent(hReg -> {
                        hReg.setStatus("PENDING");
                        hReg.setRegisteredAt(new Timestamp(System.currentTimeMillis()));
                        horseRegRepository.save(hReg);
                    });
                }

                return registrationMapper.toDTO(saved, owner.getUsername(), meeting.getName());
            } else {
                throw new IllegalArgumentException("Owner is already registered for this meeting");
            }
        }

        if (ticketPrice.compareTo(java.math.BigDecimal.ZERO) > 0) {
            java.math.BigDecimal balance = owner.getWalletBalance() != null ? owner.getWalletBalance() : java.math.BigDecimal.ZERO;
            if (balance.compareTo(ticketPrice) < 0) {
                throw new IllegalArgumentException("Insufficient wallet balance (" + balance + " VNĐ) to pay for meeting ticket (" + ticketPrice + " VNĐ). Please top up your wallet.");
            }
            // Trừ tiền vé từ Ví HorseOwner
            owner.setWalletBalance(balance.subtract(ticketPrice));
            userRepository.save(owner);

            // Ghi log giao dịch trừ tiền vé của Owner (Lưu giữ tại Quỹ Ký Quỹ Escrow của RaceMeeting)
            WalletTransaction txOwner = new WalletTransaction();
            txOwner.setUserId(ownerId);
            txOwner.setAmount(ticketPrice.negate());
            txOwner.setTransactionType("TICKET_FEE");
            txOwner.setDescription("Bought ticket for Race Meeting: " + meeting.getName() + " (Held in Escrow Vault)");
            txOwner.setRaceMeetingId(meetingId);
            txOwner.setCreatedAt(new Timestamp(System.currentTimeMillis()));
            walletTransactionRepository.save(txOwner);
        }

        OwnerRaceMeetingRegistration reg = new OwnerRaceMeetingRegistration(); // Khởi tạo thực thể đăng ký chủ
        reg.setRaceMeetingId(meetingId); // Gán mã ngày hội đua
        reg.setOwnerId(ownerId); // Gán mã chủ sở hữu
        reg.setStatus("PENDING"); // Đặt trạng thái chờ duyệt
        reg.setRegisteredAt(new Timestamp(System.currentTimeMillis())); // Lưu thời điểm nộp đơn

        OwnerRaceMeetingRegistration saved = ownerRegRepository.save(reg); // Lưu đơn vào DB

        String ownerName = owner.getUsername(); // Lấy tên chủ sở hữu
        String meetingName = meeting.getName(); // Lấy tên buổi đua

        return registrationMapper.toDTO(saved, ownerName, meetingName); // Trả về DTO đăng ký chủ
    }

    // Đăng ký Ngựa đua tham gia Ngày hội đua (Hỗ trợ đăng ký lại nếu bị REJECTED trước đó)
    @Transactional
    public HorseRaceMeetingRegistrationDTO registerHorse(Integer meetingId, Integer horseId) {
        RaceMeeting meeting = raceMeetingRepository.findById(meetingId)
                .orElseThrow(() -> new IllegalArgumentException("Race meeting not found"));
        validateMeetingForRegistration(meeting);

        // Tra cứu thực thể ngựa đua trong DB
        Horse horse = horseRepository.findById(horseId)
                .orElseThrow(() -> new IllegalArgumentException("Horse not found"));

        // Chặn không cho phép ngựa đã giải nghệ (RETIRED) tham gia thi đấu
        if ("RETIRED".equalsIgnoreCase(horse.getStatus())) {
            throw new IllegalArgumentException("Retired horses cannot be registered for race meetings"); // Ném lỗi nếu ngựa đã giải nghệ
        }

        // Kiểm tra xem ngựa đua đã nộp đơn đăng ký cho ngày đua này trước đó chưa
        java.util.Optional<HorseRaceMeetingRegistration> existingOpt = horseRegRepository.findByRaceMeetingIdAndHorseId(meetingId, horseId);
        if (existingOpt.isPresent()) {
            HorseRaceMeetingRegistration existing = existingOpt.get();
            if ("REJECTED".equalsIgnoreCase(existing.getStatus())) {
                existing.setStatus("PENDING");
                existing.setRegisteredAt(new Timestamp(System.currentTimeMillis()));
                HorseRaceMeetingRegistration saved = horseRegRepository.save(existing);
                return registrationMapper.toDTO(saved, horse.getName(), raceMeetingRepository.findById(meetingId).map(RaceMeeting::getName).orElse(null));
            } else {
                throw new IllegalArgumentException("Horse is already registered for this meeting"); // Ném lỗi nếu đã đăng ký
            }
        }

        HorseRaceMeetingRegistration reg = new HorseRaceMeetingRegistration(); // Khởi tạo thực thể đăng ký ngựa
        reg.setRaceMeetingId(meetingId); // Gán mã ngày hội đua
        reg.setHorseId(horseId); // Gán mã chiến mã
        reg.setStatus("PENDING"); // Đặt trạng thái chờ duyệt
        reg.setRegisteredAt(new Timestamp(System.currentTimeMillis())); // Lưu thời điểm nộp đơn

        HorseRaceMeetingRegistration saved = horseRegRepository.save(reg); // Lưu đơn vào DB

        String horseName = horseRepository.findById(horseId).map(Horse::getName).orElse(null); // Lấy tên chiến mã
        String meetingName = raceMeetingRepository.findById(meetingId).map(RaceMeeting::getName).orElse(null); // Lấy tên buổi đua

        return registrationMapper.toDTO(saved, horseName, meetingName); // Trả về DTO đăng ký ngựa
    }
}
