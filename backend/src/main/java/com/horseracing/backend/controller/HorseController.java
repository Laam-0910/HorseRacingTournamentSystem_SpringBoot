package com.horseracing.backend.controller;

import com.horseracing.backend.dto.HorseDTO;
import com.horseracing.backend.service.HorseService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/horses")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
@Tag(
    name = "Horse Service",
    description = "🐎 **Cấu trúc Mô-đun Quản lý Chiến Mã (Horse Architecture)**\n\n" +
                  "📌 **CÁC CLASS MÃ NGUỒN LIÊN QUAN:**\n" +
                  "* **Controllers**: `HorseController.java`, `HorseOwnerController.java`\n" +
                  "* **Services**: `HorseService.java` (`HorseServiceImpl.java`), `HorseRetirementService.java`\n" +
                  "* **Repositories**: `HorseRepository.java`, `UserRepository.java`, `RaceEntryRepository.java`\n" +
                  "* **Entities**: `Horse.java` (gồm Name, Breed, Sex, CurrentRating, Avatar...)\n" +
                  "* **DTOs**: `HorseDTO.java`, `HorseRetirementRequestDTO.java`\n\n" +
                  "🔄 **LUỒNG XỬ LÝ NGHIỆP VỤ CHÍNH (BUSINESS FLOW):**\n" +
                  "1. Chủ ngựa gửi đơn đăng ký thông tin chiến mã mới vào hệ thống.\n" +
                  "2. Quản trị viên (Admin) xét duyệt hồ sơ ngựa (`PENDING` -> `ACTIVE` hoặc `REJECTED`).\n" +
                  "3. Ngựa khởi tạo với Rating cơ bản (52 điểm) và bắt đầu tham gia các giải đua theo phân hạng (Class 1 - Class 5).\n" +
                  "4. Sau mỗi trận đua, điểm Elo Rating và lịch sử tổng số trận thắng/thua được cập nhật tự động vào `Horse` entity."
)
public class HorseController {

    private final HorseService horseService;

    @GetMapping
    @Operation(summary = "Lấy danh sách tất cả các con ngựa", description = "📌 **Code Architecture**: `HorseController.getAllHorses()` -> `HorseService.getAllHorses()` -> `HorseRepository.findByStatus/findByOwnerId` -> Trả về `List<HorseDTO>`")
    public ResponseEntity<List<HorseDTO>> getAllHorses(@RequestParam(required = false) String status,
                                                       @RequestParam(required = false) Integer ownerId) {
        return ResponseEntity.ok(horseService.getAllHorses(status, ownerId));
    }

    @PostMapping
    @Operation(summary = "Đăng ký ngựa mới", description = "📌 **Code Architecture**: `HorseController.registerHorse()` -> `HorseService.registerHorse()` -> Lưu `Horse` Entity ở trạng thái `PENDING` chờ Admin duyệt")
    public ResponseEntity<?> registerHorse(@RequestBody HorseDTO horseDTO) {
        try {
            HorseDTO savedHorse = horseService.registerHorse(horseDTO);
            return ResponseEntity.ok(Map.of("success", true, "horse", savedHorse));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @PostMapping("/{id}/approve")
    @Operation(summary = "Phê duyệt hồ sơ ngựa (Admin)", description = "📌 **Code Architecture**: `HorseController.approveHorse()` -> `HorseService.approveHorse()` -> Đổi status ngựa sang `ACTIVE` và cấp Rating 52")
    public ResponseEntity<?> approveHorse(@PathVariable Integer id) {
        try {
            horseService.approveHorse(id);
            return ResponseEntity.ok(Map.of("success", true, "message", "Horse approved successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @PostMapping("/{id}/reject")
    @Operation(summary = "Từ chối hồ sơ ngựa (Admin)", description = "📌 **Code Architecture**: `HorseController.rejectHorse()` -> `HorseService.rejectHorse()` -> Đổi status ngựa sang `REJECTED`")
    public ResponseEntity<?> rejectHorse(@PathVariable Integer id) {
        try {
            horseService.rejectHorse(id);
            return ResponseEntity.ok(Map.of("success", true, "message", "Horse rejected successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @Autowired
    private com.horseracing.backend.repository.UserRepository userRepository;

    @PutMapping("/{id}")
    @Operation(summary = "Cập nhật thông tin ngựa", description = "📌 **Code Architecture**: `HorseController.updateHorse()` -> `HorseService.updateHorse()` -> Cập nhật tên, giống, mô tả, ảnh đại diện")
    public ResponseEntity<?> updateHorse(@PathVariable Integer id, @RequestBody HorseDTO horseDTO) {
        try {
            org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
            if (auth == null || !auth.isAuthenticated()) {
                return ResponseEntity.status(401).body(Map.of("success", false, "error", "Unauthorized"));
            }
            String username = auth.getName();
            com.horseracing.backend.entity.User user = userRepository.findByUsername(username)
                    .orElseThrow(() -> new IllegalArgumentException("User not found"));

            HorseDTO updated = horseService.updateHorse(id, horseDTO, user.getId(), user.getRoleId());
            return ResponseEntity.ok(Map.of("success", true, "horse", updated));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }
}
