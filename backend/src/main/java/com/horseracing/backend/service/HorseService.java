package com.horseracing.backend.service;

import com.horseracing.backend.dto.HorseDTO;
import com.horseracing.backend.entity.Horse;
import com.horseracing.backend.entity.User;
import com.horseracing.backend.mapper.HorseMapper;
import com.horseracing.backend.repository.HorseRepository;
import com.horseracing.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class HorseService {

    private final HorseRepository horseRepository;
    private final UserRepository userRepository;
    private final HorseMapper horseMapper;

    public List<HorseDTO> getAllHorses(String status, Integer ownerId) {
        List<Horse> horses;
        if (status != null) {
            horses = horseRepository.findByStatus(status);
        } else if (ownerId != null) {
            horses = horseRepository.findByOwnerId(ownerId);
        } else {
            horses = horseRepository.findAll();
        }

        Map<Integer, String> ownerMap = userRepository.findAll().stream()
                .collect(Collectors.toMap(User::getId, User::getUsername));

        return horses.stream()
                .map(h -> horseMapper.toDTO(h, ownerMap.get(h.getOwnerId())))
                .collect(Collectors.toList());
    }

    public HorseDTO getHorseById(Integer id) {
        Horse horse = horseRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Horse not found"));
        String ownerName = userRepository.findById(horse.getOwnerId())
                .map(User::getUsername)
                .orElse(null);
        return horseMapper.toDTO(horse, ownerName);
    }

    @Transactional
    public HorseDTO registerHorse(HorseDTO dto) {
        validateHorseAgeAndSex(dto.getDateOfBirth(), dto.getSex());
        validateAvatarSize(dto.getAvatar());
        Horse horse = horseMapper.toEntity(dto);
        horse.setStatus("PENDING"); // Ngựa mới đăng ký ở trạng thái PENDING
        horse.setCurrentRating(52);  // Điểm rating khởi điểm
        horse.setTotalRaces(0);
        horse.setTotalWins(0);

        Horse savedHorse = horseRepository.save(horse);
        String ownerName = userRepository.findById(savedHorse.getOwnerId())
                .map(User::getUsername)
                .orElse(null);
        return horseMapper.toDTO(savedHorse, ownerName);
    }

    @Transactional
    public void approveHorse(Integer id) {
        Horse horse = horseRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Horse not found"));
        horse.setStatus("ACTIVE");
        horseRepository.save(horse);
    }

    @Transactional
    public void rejectHorse(Integer id) {
        Horse horse = horseRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Horse not found"));
        horse.setStatus("REJECTED");
        horseRepository.save(horse);
    }

    @Transactional
    public HorseDTO updateHorse(Integer id, HorseDTO dto, Integer userId, Integer roleId) {
        validateHorseAgeAndSex(dto.getDateOfBirth(), dto.getSex());
        validateAvatarSize(dto.getAvatar());
        Horse horse = horseRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Horse not found"));

        if (roleId == 2 && !horse.getOwnerId().equals(userId)) {
            throw new SecurityException("You do not own this horse");
        }

        horse.setName(dto.getName());
        horse.setBreed(dto.getBreed());
        horse.setSex(dto.getSex());
        horse.setDateOfBirth(dto.getDateOfBirth());
        horse.setAvatar(dto.getAvatar());
        horse.setDescription(dto.getDescription());

        if (roleId == 1 && dto.getStatus() != null) {
            horse.setStatus(dto.getStatus());
        }

        if (dto.getCurrentRating() != null && !dto.getCurrentRating().equals(horse.getCurrentRating())) {
            if (roleId == 1) {
                horse.setCurrentRating(dto.getCurrentRating());
            } else {
                throw new SecurityException("Unauthorized to change rating. Only Admin can modify horse rating.");
            }
        }

        Horse saved = horseRepository.save(horse);
        String ownerName = userRepository.findById(saved.getOwnerId())
                .map(User::getUsername)
                .orElse(null);
        return horseMapper.toDTO(saved, ownerName);
    }

    private void validateHorseAgeAndSex(java.sql.Date dob, String sex) {
        if (dob == null || sex == null) return;
        java.time.LocalDate birthDate = dob.toLocalDate();
        java.time.LocalDate currentDate = java.time.LocalDate.now();
        int age = java.time.Period.between(birthDate, currentDate).getYears();

        if (age >= 4) {
            if ("Colt".equalsIgnoreCase(sex)) {
                throw new IllegalArgumentException("A Colt must be under 4 years old. For uncastrated male horses 4 years or older, please select 'Horse'.");
            }
            if ("Filly".equalsIgnoreCase(sex)) {
                throw new IllegalArgumentException("A Filly must be under 4 years old. For female horses 4 years or older, please select 'Mare'.");
            }
        } else {
            if ("Horse".equalsIgnoreCase(sex)) {
                throw new IllegalArgumentException("A Horse (uncastrated male) must be 4 years or older. For uncastrated male horses under 4 years, please select 'Colt'.");
            }
            if ("Mare".equalsIgnoreCase(sex)) {
                throw new IllegalArgumentException("A Mare must be 4 years or older. For female horses under 4 years, please select 'Filly'.");
            }
        }
    }

    private void validateAvatarSize(String avatar) {
        if (avatar != null && avatar.length() > 2097152) {
            throw new IllegalArgumentException("Avatar image size exceeds 1.5MB limit");
        }
    }
}
