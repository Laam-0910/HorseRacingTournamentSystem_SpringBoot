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
    @Operation(
        summary = "GET: Lấy danh sách tất cả các con ngựa",
        description = "🔍 **CHẠY THỬ TRY IT OUT**: Bấm 'Try it out' -> Điền status hoặc ownerId -> 'Execute'.\n\n" +
                      "📌 **CÁC CLASS MÃ NGUỒN XỬ LÝ:**\n" +
                      "* **Controller**: `HorseController.getAllHorses()`\n" +
                      "* **Service**: `HorseService.getAllHorses()` (`HorseServiceImpl.java`)\n" +
                      "* **Repository**: `HorseRepository.findByStatus/findByOwnerId()`\n" +
                      "* **Entity**: `Horse.java`\n" +
                      "* **DTO Response**: `List<HorseDTO>`\n\n" +
                      "🔄 **LUỒNG TRA CỨU NGHIỆP VỤ:**\n" +
                      "1. Tiếp nhận tham số lọc theo trạng thái (`status`) hoặc Chủ sở hữu (`ownerId`).\n" +
                      "2. Truy vấn danh sách chiến mã trong cơ sở dữ liệu MSSQL.\n" +
                      "3. Đóng gói kết quả thành `List<HorseDTO>` và trả về cho Client."
    )
    public ResponseEntity<List<HorseDTO>> getAllHorses(@RequestParam(required = false) String status,
                                                       @RequestParam(required = false) Integer ownerId) {
        return ResponseEntity.ok(horseService.getAllHorses(status, ownerId));
    }

    @PostMapping
    @Operation(
        summary = "POST: Đăng ký chiến mã mới (Chủ ngựa)",
        description = "📝 **CẤU TRÚC CODE & LUỒNG XỬ LÝ POST API:**\n\n" +
                      "📌 **CÁC CLASS MÃ NGUỒN XỬ LÝ:**\n" +
                      "* **Controller**: `HorseController.registerHorse()`\n" +
                      "* **Service**: `HorseService.registerHorse()` (`HorseServiceImpl.java`)\n" +
                      "* **Repository**: `HorseRepository.save()`\n" +
                      "* **Entity**: `Horse.java`\n" +
                      "* **DTO Request**: `HorseDTO` (`name`, `breed`, `sex`, `birthDate`, `ownerId`, `avatar`)\n" +
                      "* **DTO Response**: `Map<String, Object>` (`{\"success\": true, \"horse\": HorseDTO}`)\n\n" +
                      "🔄 **LUỒNG XỬ LÝ NGHIỆP VỤ DETAILED:**\n" +
                      "1. Chủ ngựa nhập thông tin chiến mã mới (Tên, Giống, Giới tính, Ảnh đại diện).\n" +
                      "2. Hệ thống kiểm tra trùng tên ngựa trong DB.\n" +
                      "3. Lưu chiến mã ở trạng thái `PENDING` chờ Admin phê duyệt."
    )
    public ResponseEntity<?> registerHorse(@RequestBody HorseDTO horseDTO) {
        try {
            HorseDTO savedHorse = horseService.registerHorse(horseDTO);
            return ResponseEntity.ok(Map.of("success", true, "horse", savedHorse));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @PostMapping("/{id}/approve")
    @Operation(
        summary = "POST: Phê duyệt hồ sơ ngựa (Admin)",
        description = "📝 **CẤU TRÚC CODE & LUỒNG XỬ LÝ POST API:**\n\n" +
                      "📌 **CÁC CLASS MÃ NGUỒN XỬ LÝ:**\n" +
                      "* **Controller**: `HorseController.approveHorse()`\n" +
                      "* **Service**: `HorseService.approveHorse()` (`HorseServiceImpl.java`)\n" +
                      "* **Repository**: `HorseRepository.save()`\n" +
                      "* **Entity**: `Horse.java`\n\n" +
                      "🔄 **LUỒNG XỬ LÝ NGHIỆP VỤ DETAILED:**\n" +
                      "1. Admin kiểm tra tính hợp lệ hồ sơ chiến mã.\n" +
                      "2. Đổi trạng thái ngựa từ `PENDING` sang `ACTIVE`.\n" +
                      "3. Cấp điểm Elo Rating khởi điểm mặc định (52 điểm) cho chiến mã."
    )
    public ResponseEntity<?> approveHorse(@PathVariable Integer id) {
        try {
            horseService.approveHorse(id);
            return ResponseEntity.ok(Map.of("success", true, "message", "Horse approved successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @PostMapping("/{id}/reject")
    @Operation(
        summary = "POST: Từ chối hồ sơ ngựa (Admin)",
        description = "📝 **CẤU TRÚC CODE & LUỒNG XỬ LÝ POST API:**\n\n" +
                      "📌 **CÁC CLASS MÃ NGUỒN XỬ LÝ:**\n" +
                      "* **Controller**: `HorseController.rejectHorse()`\n" +
                      "* **Service**: `HorseService.rejectHorse()` (`HorseServiceImpl.java`)\n" +
                      "* **Repository**: `HorseRepository.save()`\n\n" +
                      "🔄 **LUỒNG XỬ LÝ NGHIỆP VỤ DETAILED:**\n" +
                      "1. Admin từ chối hồ sơ ngựa không đủ tiêu chuẩn.\n" +
                      "2. Đổi trạng thái ngựa sang `REJECTED`."
    )
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
    @Operation(
        summary = "PUT: Cập nhật thông tin chiến mã",
        description = "📝 **CẤU TRÚC CODE & LUỒNG XỬ LÝ PUT API:**\n\n" +
                      "📌 **CÁC CLASS MÃ NGUỒN XỬ LÝ:**\n" +
                      "* **Controller**: `HorseController.updateHorse()`\n" +
                      "* **Service**: `HorseService.updateHorse()` (`HorseServiceImpl.java`)\n" +
                      "* **Repository**: `HorseRepository.save()`\n" +
                      "* **DTO Request**: `HorseDTO` (`name`, `breed`, `avatar`, `sex`)\n\n" +
                      "🔄 **LUỒNG XỬ LÝ NGHIỆP VỤ DETAILED:**\n" +
                      "1. Kiểm tra quyền sở hữu của Chủ ngựa hoặc quyền Admin.\n" +
                      "2. Cập nhật thông tin chi tiết con ngựa vào cơ sở dữ liệu."
    )
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
