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
    name = "06. Horse Management Service",
    description = "🐎 **BƯỚC 6: QUẢN LÝ CHIẾN MÃ (HORSE ARCHITECTURE)**\n\n" +
                  "📌 **CÁC CLASS MÃ NGUỒN LIÊN QUAN:**\n" +
                  "* **Controllers**: `HorseController.java`\n" +
                  "* **Services**: `HorseService.java` (`HorseServiceImpl.java`)\n" +
                  "* **Repositories**: `HorseRepository.java`, `UserRepository.java`\n" +
                  "* **Entities**: `Horse.java`\n" +
                  "* **DTOs**: `HorseDTO.java`\n\n" +
                  "🔄 **LUỒNG XỬ LÝ NGHIỆP VỤ CHÍNH (BUSINESS FLOW):**\n" +
                  "1. Chủ ngựa gửi đơn đăng ký hồ sơ chiến mã mới (`registerHorse`).\n" +
                  "2. Admin xét duyệt hồ sơ (`approveHorse`/`rejectHorse`). Ngựa được duyệt cấp Rating khởi điểm 52.\n" +
                  "3. Cập nhật thông tin chiến mã (`updateHorse`)."
)
public class HorseController {

    private final HorseService horseService;

    @GetMapping
    @Operation(summary = "GET: Lấy danh sách tất cả các con ngựa", description = "🔍 **Chạy thử Try It Out**: Bấm 'Try it out' -> Điền status hoặc ownerId -> 'Execute'.\n\n📌 **Code Architecture**: `HorseController.getAllHorses()` -> `HorseService.getAllHorses()`")
    public ResponseEntity<List<HorseDTO>> getAllHorses(@RequestParam(required = false) String status,
                                                       @RequestParam(required = false) Integer ownerId) {
        return ResponseEntity.ok(horseService.getAllHorses(status, ownerId));
    }

    @PostMapping
    @Operation(summary = "POST: Đăng ký chiến mã mới (Chủ ngựa)", description = "📝 **CẤU TRÚC CODE & LUỒNG XỬ LÝ POST API:**\n\n📌 **Code Architecture**: `HorseController.registerHorse()` -> `HorseService.registerHorse()` -> Trạng thái PENDING")
    public ResponseEntity<?> registerHorse(@RequestBody HorseDTO horseDTO) {
        try {
            HorseDTO savedHorse = horseService.registerHorse(horseDTO);
            return ResponseEntity.ok(Map.of("success", true, "horse", savedHorse));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @PostMapping("/{id}/approve")
    @Operation(summary = "POST: Phê duyệt hồ sơ ngựa (Admin)", description = "📝 **CẤU TRÚC CODE & LUỒNG XỬ LÝ POST API:**\n\n📌 **Code Architecture**: `HorseController.approveHorse()` -> `HorseService.approveHorse()` -> Trạng thái ACTIVE (Rating 52)")
    public ResponseEntity<?> approveHorse(@PathVariable Integer id) {
        try {
            horseService.approveHorse(id);
            return ResponseEntity.ok(Map.of("success", true, "message", "Horse approved successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @PostMapping("/{id}/reject")
    @Operation(summary = "POST: Từ chối hồ sơ ngựa (Admin)", description = "📝 **CẤU TRÚC CODE & LUỒNG XỬ LÝ POST API:**\n\n📌 **Code Architecture**: `HorseController.rejectHorse()` -> `HorseService.rejectHorse()` -> Trạng thái REJECTED")
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
    @Operation(summary = "PUT: Cập nhật thông tin chiến mã", description = "📝 **CẤU TRÚC CODE & LUỒNG XỬ LÝ PUT API:**\n\n📌 **Code Architecture**: `HorseController.updateHorse()` -> `HorseService.updateHorse()`")
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
