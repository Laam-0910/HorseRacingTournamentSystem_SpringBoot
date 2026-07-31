package com.horseracing.backend.controller;

import com.horseracing.backend.dto.HorseDTO;
import com.horseracing.backend.service.HorseService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Controller HorseController - Lớp kiểm soát các endpoint liên quan đến quản lý ngựa đua ( chiến mã).
 * - Tra cứu danh sách ngựa lọc theo trạng thái (status) hoặc chủ sở hữu (ownerId).
 * - Cho phép chủ ngựa đăng ký ngựa mới (chờ duyệt).
 * - Cho phép Admin phê duyệt (Approve) ngựa, tự động gán điểm rating mặc định ban đầu là 52.
 * - Cho phép Admin từ chối (Reject) hồ sơ ngựa không đạt chuẩn.
 * - Cho phép chủ sở hữu cập nhật thông tin chi tiết ngựa (Tên, Giống, Ảnh, Giới tính).
 */
@RestController
@RequestMapping("/api/horses")
@RequiredArgsConstructor
@CrossOrigin(origins = "*") // Hỗ trợ CORS
public class HorseController {

    private final HorseService horseService; // Dịch vụ quản lý ngựa đua

    @Autowired
    private com.horseracing.backend.repository.UserRepository userRepository; // Kho lưu trữ người dùng để xác minh quyền sở hữu

    // Lấy danh sách toàn bộ ngựa đua lọc theo trạng thái hoặc chủ sở hữu
    @GetMapping
        public ResponseEntity<List<HorseDTO>> getAllHorses(@RequestParam(required = false) String status,
                                                       @RequestParam(required = false) Integer ownerId) {
        return ResponseEntity.ok(horseService.getAllHorses(status, ownerId)); // Trả về danh sách ngựa đua đã lọc theo trạng thái hoặc chủ sở hữu
    }

    // Đăng ký hồ sơ ngựa mới (Chủ ngựa gửi yêu cầu)
    @PostMapping
        public ResponseEntity<?> registerHorse(@RequestBody HorseDTO horseDTO) {
        try { // Khối xử lý ngoại lệ khi đăng ký ngựa mới
            HorseDTO savedHorse = horseService.registerHorse(horseDTO); // Gọi service đăng ký thông tin ngựa đua mới
            return ResponseEntity.ok(Map.of("success", true, "horse", savedHorse)); // Trả về HTTP 200 kèm thông tin ngựa vừa đăng ký thành công
        } catch (Exception e) { // Xử lý nếu xảy ra lỗi trong quá trình đăng ký
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage())); // Trả về HTTP 400 Bad Request kèm thông báo lỗi
        }
    }

    // Admin phê duyệt hồ sơ ngựa đua để đưa vào trạng thái ACTIVE thi đấu
    @PostMapping("/{id}/approve")
        public ResponseEntity<?> approveHorse(@PathVariable Integer id) {
        try { // Khối xử lý ngoại lệ khi phê duyệt hồ sơ ngựa
            horseService.approveHorse(id); // Gọi service thực hiện phê duyệt hồ sơ ngựa
            return ResponseEntity.ok(Map.of("success", true, "message", "Horse approved successfully")); // Trả về HTTP 200 thông báo phê duyệt thành công
        } catch (Exception e) { // Bắt ngoại lệ nếu xử lý phê duyệt thất bại
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage())); // Trả về HTTP 400 Bad Request kèm lý do lỗi
        }
    }

    // Admin từ chối hồ sơ ngựa đua
    @PostMapping("/{id}/reject")
        public ResponseEntity<?> rejectHorse(@PathVariable Integer id) {
        try { // Khối xử lý ngoại lệ khi từ chối hồ sơ ngựa
            horseService.rejectHorse(id); // Gọi service thực hiện từ chối hồ sơ ngựa
            return ResponseEntity.ok(Map.of("success", true, "message", "Horse rejected successfully")); // Trả về HTTP 200 thông báo từ chối thành công
        } catch (Exception e) { // Bắt ngoại lệ nếu xử lý từ chối thất bại
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage())); // Trả về HTTP 400 Bad Request kèm lý do lỗi
        }
    }

    // Cập nhật thông tin chiến mã (Yêu cầu xác thực tài khoản)
    @PutMapping("/{id}")
        public ResponseEntity<?> updateHorse(@PathVariable Integer id, @RequestBody HorseDTO horseDTO) {
        try { // Khối xử lý ngoại lệ khi cập nhật thông tin ngựa
            // Xác thực phiên làm việc người dùng hiện tại
            org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication(); // Lấy đối tượng Authentication từ SecurityContext
            if (auth == null || !auth.isAuthenticated()) { // Kiểm tra nếu người dùng chưa xác thực thành công
                return ResponseEntity.status(401).body(Map.of("success", false, "error", "Unauthorized")); // Trả về HTTP 401 Unauthorized nếu chưa đăng nhập
            }
            String username = auth.getName(); // Trích xuất tên tài khoản của người dùng từ đối tượng auth
            com.horseracing.backend.entity.User user = userRepository.findByUsername(username) // Truy vấn thông tin người dùng từ DB theo username
                    .orElseThrow(() -> new IllegalArgumentException("User not found")); // Ném ngoại lệ nếu không tìm thấy người dùng trong DB

            // Gọi tầng nghiệp vụ kiểm tra quyền và thực hiện cập nhật
            HorseDTO updated = horseService.updateHorse(id, horseDTO, user.getId(), user.getRoleId()); // Thực hiện cập nhật thông tin ngựa với ID người dùng và roleId tương ứng
            return ResponseEntity.ok(Map.of("success", true, "horse", updated)); // Trả về HTTP 200 kèm DTO ngựa đã cập nhật
        } catch (Exception e) { // Bắt ngoại lệ nếu cập nhật thất bại
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage())); // Trả về HTTP 400 Bad Request kèm lý do lỗi
        }
    }
}
