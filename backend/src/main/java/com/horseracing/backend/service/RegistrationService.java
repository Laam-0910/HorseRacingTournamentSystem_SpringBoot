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
    private final UserRepository userRepository;
    private final HorseRepository horseRepository;
    private final RegistrationMapper registrationMapper; // Bộ ánh xạ thực thể đăng ký sang DTO

    // Đăng ký Nài ngựa tham gia Ngày hội đua
    @Transactional
    public JockeyRaceMeetingRegistrationDTO registerJockey(Integer meetingId, Integer jockeyId) {
        // Kiểm tra xem kỵ sĩ đã nộp đơn đăng ký cho ngày đua này trước đó chưa
        if (jockeyRegRepository.findByRaceMeetingIdAndJockeyId(meetingId, jockeyId).isPresent()) {
            throw new IllegalArgumentException("Jockey is already registered for this meeting");
        }

        JockeyRaceMeetingRegistration reg = new JockeyRaceMeetingRegistration();
        reg.setRaceMeetingId(meetingId);
        reg.setJockeyId(jockeyId);
        reg.setStatus("PENDING"); // Đặt trạng thái mặc định chờ duyệt
        reg.setRegisteredAt(new Timestamp(System.currentTimeMillis())); // Lưu thời điểm nộp đơn
        
        JockeyRaceMeetingRegistration saved = jockeyRegRepository.save(reg);
        
        String jockeyName = userRepository.findById(jockeyId).map(User::getUsername).orElse(null);
        String meetingName = raceMeetingRepository.findById(meetingId).map(RaceMeeting::getName).orElse(null);
        
        return registrationMapper.toDTO(saved, jockeyName, meetingName);
    }

    // Đăng ký Chủ ngựa tham gia Ngày hội đua
    @Transactional
    public OwnerRaceMeetingRegistrationDTO registerOwner(Integer meetingId, Integer ownerId) {
        // Kiểm tra xem chủ ngựa đã nộp đơn đăng ký cho ngày đua này trước đó chưa
        if (ownerRegRepository.findByRaceMeetingIdAndOwnerId(meetingId, ownerId).isPresent()) {
            throw new IllegalArgumentException("Owner is already registered for this meeting");
        }

        OwnerRaceMeetingRegistration reg = new OwnerRaceMeetingRegistration();
        reg.setRaceMeetingId(meetingId);
        reg.setOwnerId(ownerId);
        reg.setStatus("PENDING");
        reg.setRegisteredAt(new Timestamp(System.currentTimeMillis()));

        OwnerRaceMeetingRegistration saved = ownerRegRepository.save(reg);

        String ownerName = userRepository.findById(ownerId).map(User::getUsername).orElse(null);
        String meetingName = raceMeetingRepository.findById(meetingId).map(RaceMeeting::getName).orElse(null);

        return registrationMapper.toDTO(saved, ownerName, meetingName);
    }

    // Đăng ký Ngựa đua tham gia Ngày hội đua
    @Transactional
    public HorseRaceMeetingRegistrationDTO registerHorse(Integer meetingId, Integer horseId) {
        // Tra cứu thực thể ngựa đua trong DB
        Horse horse = horseRepository.findById(horseId)
                .orElseThrow(() -> new IllegalArgumentException("Horse not found"));

        // Chặn không cho phép ngựa đã giải nghệ (RETIRED) tham gia thi đấu
        if ("RETIRED".equalsIgnoreCase(horse.getStatus())) {
            throw new IllegalArgumentException("Retired horses cannot be registered for race meetings");
        }

        // Kiểm tra xem ngựa đua đã nộp đơn đăng ký cho ngày đua này trước đó chưa
        if (horseRegRepository.findByRaceMeetingIdAndHorseId(meetingId, horseId).isPresent()) {
            throw new IllegalArgumentException("Horse is already registered for this meeting");
        }

        HorseRaceMeetingRegistration reg = new HorseRaceMeetingRegistration();
        reg.setRaceMeetingId(meetingId);
        reg.setHorseId(horseId);
        reg.setStatus("PENDING");
        reg.setRegisteredAt(new Timestamp(System.currentTimeMillis()));

        HorseRaceMeetingRegistration saved = horseRegRepository.save(reg);

        String horseName = horseRepository.findById(horseId).map(Horse::getName).orElse(null);
        String meetingName = raceMeetingRepository.findById(meetingId).map(RaceMeeting::getName).orElse(null);

        return registrationMapper.toDTO(saved, horseName, meetingName);
    }
}
