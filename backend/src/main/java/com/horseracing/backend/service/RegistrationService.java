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

@Service
@RequiredArgsConstructor
public class RegistrationService {

    private final JockeyRaceMeetingRegistrationRepository jockeyRegRepository;
    private final OwnerRaceMeetingRegistrationRepository ownerRegRepository;
    private final HorseRaceMeetingRegistrationRepository horseRegRepository;
    private final RaceMeetingRepository raceMeetingRepository;
    private final UserRepository userRepository;
    private final HorseRepository horseRepository;
    private final RegistrationMapper registrationMapper;

    @Transactional
    public JockeyRaceMeetingRegistrationDTO registerJockey(Integer meetingId, Integer jockeyId) {
        // Kiểm tra xem đã đăng ký chưa
        if (jockeyRegRepository.findByRaceMeetingIdAndJockeyId(meetingId, jockeyId).isPresent()) {
            throw new IllegalArgumentException("Jockey is already registered for this meeting");
        }

        JockeyRaceMeetingRegistration reg = new JockeyRaceMeetingRegistration();
        reg.setRaceMeetingId(meetingId);
        reg.setJockeyId(jockeyId);
        reg.setStatus("PENDING");
        reg.setRegisteredAt(new Timestamp(System.currentTimeMillis()));
        
        JockeyRaceMeetingRegistration saved = jockeyRegRepository.save(reg);
        
        String jockeyName = userRepository.findById(jockeyId).map(User::getUsername).orElse(null);
        String meetingName = raceMeetingRepository.findById(meetingId).map(RaceMeeting::getName).orElse(null);
        
        return registrationMapper.toDTO(saved, jockeyName, meetingName);
    }

    @Transactional
    public OwnerRaceMeetingRegistrationDTO registerOwner(Integer meetingId, Integer ownerId) {
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

    @Transactional
    public HorseRaceMeetingRegistrationDTO registerHorse(Integer meetingId, Integer horseId) {
        Horse horse = horseRepository.findById(horseId)
                .orElseThrow(() -> new IllegalArgumentException("Horse not found"));

        if ("RETIRED".equalsIgnoreCase(horse.getStatus())) {
            throw new IllegalArgumentException("Retired horses cannot be registered for race meetings");
        }

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
