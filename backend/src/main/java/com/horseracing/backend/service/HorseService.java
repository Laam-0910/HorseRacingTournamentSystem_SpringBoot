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

/**
 * Lớp dịch vụ HorseService - Quản lý chiến mã.
 * - Lấy danh sách ngựa lọc theo trạng thái hoạt động hoặc chủ sở hữu đính kèm tên chủ sở hữu.
 * - Cho phép đăng ký chiến mã mới (kiểm duyệt độ tuổi và giới tính của ngựa, giới hạn dung lượng ảnh đại diện 5MB).
 * - Tự động thiết lập trạng thái PENDING và rating 52 điểm mặc định cho ngựa mới.
 * - Phê duyệt (ACTIVE) hoặc từ chối (REJECTED) hồ sơ ngựa.
 * - Cập nhật thông tin chi tiết ngựa (kiểm tra quyền sở hữu đối với Chủ ngựa, quyền thay đổi rating của Admin).
 */
@Service
@RequiredArgsConstructor
public class HorseService {

    private final HorseRepository horseRepository;
    private final UserRepository userRepository;
    private final HorseMapper horseMapper;

    // Lấy toàn bộ danh sách ngựa đua, hỗ trợ bộ lọc và đính kèm tên chủ sở hữu
    public List<HorseDTO> getAllHorses(String status, Integer ownerId) {
        List<Horse> horses;
        if (status != null) {
            horses = horseRepository.findByStatus(status);
        } else if (ownerId != null) {
            horses = horseRepository.findByOwnerId(ownerId);
        } else {
            horses = horseRepository.findAll();
        }

        // Bản đồ hóa danh sách tài khoản để lấy tên chủ sở hữu nhanh hơn
        Map<Integer, String> ownerMap = userRepository.findAll().stream()
                .collect(Collectors.toMap(User::getId, User::getUsername));

        return horses.stream()
                .map(h -> horseMapper.toDTO(h, ownerMap.get(h.getOwnerId())))
                .collect(Collectors.toList());
    }

    // Tra cứu chi tiết ngựa theo ID
    public HorseDTO getHorseById(Integer id) {
        Horse horse = horseRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Horse not found"));
        String ownerName = userRepository.findById(horse.getOwnerId())
                .map(User::getUsername)
                .orElse(null);
        return horseMapper.toDTO(horse, ownerName);
    }

    // Đăng ký hồ sơ ngựa mới
    @Transactional
    public HorseDTO registerHorse(HorseDTO dto) {
        // Kiểm duyệt logic nhóm tuổi và giới tính ngựa
        validateHorseAgeAndSex(dto.getDateOfBirth(), dto.getSex());
        // Kiểm tra kích thước tệp ảnh base64 đại diện
        validateAvatarSize(dto.getAvatar());
        
        Horse horse = horseMapper.toEntity(dto);
        horse.setStatus("PENDING"); // Đặt trạng thái chờ duyệt
        horse.setCurrentRating(52);  // Gán điểm Elo rating khởi điểm mặc định là 52
        horse.setTotalRaces(0);
        horse.setTotalWins(0);

        Horse savedHorse = horseRepository.save(horse);
        String ownerName = userRepository.findById(savedHorse.getOwnerId())
                .map(User::getUsername)
                .orElse(null);
        return horseMapper.toDTO(savedHorse, ownerName);
    }

    // Phê duyệt hồ sơ ngựa đua hoạt động (Admin)
    @Transactional
    public void approveHorse(Integer id) {
        Horse horse = horseRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Horse not found"));
        horse.setStatus("ACTIVE"); // Cập nhật sang trạng thái ACTIVE
        horseRepository.save(horse);
    }

    // Từ chối hồ sơ ngựa đua đăng ký (Admin)
    @Transactional
    public void rejectHorse(Integer id) {
        Horse horse = horseRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Horse not found"));
        horse.setStatus("REJECTED"); // Cập nhật sang trạng thái REJECTED
        horseRepository.save(horse);
    }

    // Cập nhật thông tin chi tiết của chiến mã
    @Transactional
    public HorseDTO updateHorse(Integer id, HorseDTO dto, Integer userId, Integer roleId) {
        validateHorseAgeAndSex(dto.getDateOfBirth(), dto.getSex());
        validateAvatarSize(dto.getAvatar());
        
        Horse horse = horseRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Horse not found"));

        // Bảo mật: Nếu người dùng là Chủ ngựa (roleId = 2), kiểm tra xem có đúng là chủ của con ngựa này không
        if (roleId == 2 && !horse.getOwnerId().equals(userId)) {
            throw new SecurityException("You do not own this horse");
        }

        // Cập nhật các trường thông tin cơ bản
        horse.setName(dto.getName());
        horse.setBreed(dto.getBreed());
        horse.setSex(dto.getSex());
        horse.setDateOfBirth(dto.getDateOfBirth());
        horse.setAvatar(dto.getAvatar());
        horse.setDescription(dto.getDescription());

        // Chỉ Admin mới được thay đổi trạng thái hoạt động trực tiếp qua cập nhật
        if (roleId == 1 && dto.getStatus() != null) {
            horse.setStatus(dto.getStatus());
        }

        // Chỉ Admin mới được can thiệp sửa đổi điểm Elo Rating của ngựa đua
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

    // Kiểm tra tính hợp lệ về mối tương quan giữa tuổi và giới tính ngựa (Tuổi từ 2 đến 10)
    private void validateHorseAgeAndSex(java.sql.Date dob, String sex) {
        if (dob == null || sex == null) return;
        java.time.LocalDate birthDate = dob.toLocalDate();
        java.time.LocalDate currentDate = java.time.LocalDate.now();
        int age = java.time.Period.between(birthDate, currentDate).getYears();

        if (age < 2 || age > 10) {
            throw new IllegalArgumentException("Tuổi của ngựa đăng ký phải nằm trong khoảng từ 2 đến 10 tuổi (Horse age must be between 2 and 10 years old).");
        }

        if (age >= 4) {
            // Ngựa đực từ 4 tuổi trở lên không được gọi là Colt (phải gọi là Horse)
            if ("Colt".equalsIgnoreCase(sex)) {
                throw new IllegalArgumentException("A Colt must be under 4 years old. For uncastrated male horses 4 years or older, please select 'Horse'.");
            }
            // Ngựa cái từ 4 tuổi trở lên không được gọi là Filly (phải gọi là Mare)
            if ("Filly".equalsIgnoreCase(sex)) {
                throw new IllegalArgumentException("A Filly must be under 4 years old. For female horses 4 years or older, please select 'Mare'.");
            }
        } else {
            // Ngựa đực dưới 4 tuổi không được gọi là Horse (phải gọi là Colt)
            if ("Horse".equalsIgnoreCase(sex)) {
                throw new IllegalArgumentException("A Horse (uncastrated male) must be 4 years or older. For uncastrated male horses under 4 years, please select 'Colt'.");
            }
            // Ngựa cái dưới 4 tuổi không được gọi là Mare (phải gọi là Filly)
            if ("Mare".equalsIgnoreCase(sex)) {
                throw new IllegalArgumentException("A Mare must be 4 years or older. For female horses under 4 years, please select 'Filly'.");
            }
        }
    }

    // Kiểm duyệt giới hạn kích thước dung lượng ảnh base64 đại diện (Tránh quá tải DB)
    private void validateAvatarSize(String avatar) {
        if (avatar != null && avatar.length() > 7000000) {
            throw new IllegalArgumentException("Avatar image size exceeds 5MB limit");
        }
    }
}
