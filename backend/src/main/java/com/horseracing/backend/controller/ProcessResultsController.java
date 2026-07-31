package com.horseracing.backend.controller;

import com.horseracing.backend.dto.ConfirmResultsRequestDTO;
import com.horseracing.backend.service.ProcessResultsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Controller ProcessResultsController - Lớp kiểm soát các endpoint liên quan đến xử lý kết quả sau trận đấu.
 * - Nhập kết quả thứ hạng, thời gian chạy chính thức, báo cáo giám sát của trọng tài.
 * - Tự động hóa quá trình phân bổ tiền thưởng và tính toán cập nhật điểm rating cho ngựa đua.
 */
@RestController // Đánh dấu lớp là REST Controller chịu trách nhiệm định tuyến các yêu cầu HTTP
@RequestMapping("/api/results") // Định nghĩa URL gốc cho nhóm API quản lý kết quả thi đấu
@RequiredArgsConstructor // Tự động tạo constructor injection cho các dependency final
@CrossOrigin(origins = "*") // Hỗ trợ chia sẻ tài nguyên giữa các nguồn (CORS)
public class ProcessResultsController {

    private final ProcessResultsService processResultsService; // Dịch vụ xử lý kết quả và tính thưởng

    // Endpoint nhập kết quả chính thức cho cuộc đua
    @PostMapping("/confirm") // Tiếp nhận HTTP POST request tới đường dẫn /api/results/confirm
        public ResponseEntity<?> confirmResults(@RequestBody ConfirmResultsRequestDTO request) {
        try {
            // Gọi tầng nghiệp vụ để lưu trữ và tính toán kết quả cuộc đua, tiền thưởng và điểm rating
            processResultsService.confirmResults(request.getRaceId(), request.getStewardReport(), request.getResults());
            // Trả về kết quả thành công HTTP 200 OK với thông điệp xác nhận
            return ResponseEntity.ok(Map.of("success", true, "message", "Results processed successfully"));
        } catch (IllegalArgumentException e) {
            // Trả về mã lỗi 400 Bad Request nếu đầu vào không hợp lệ hoặc không đủ điều kiện xác nhận kết quả
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }
}
