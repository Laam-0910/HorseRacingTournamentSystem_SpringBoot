package com.horseracing.backend.controller;

import com.horseracing.backend.dto.SeasonClassRuleDTO;
import com.horseracing.backend.dto.SeasonDTO;
import com.horseracing.backend.service.SeasonService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Controller SeasonController - Lớp kiểm soát các endpoint liên quan đến mùa giải đua (Season).
 * - Cung cấp thông tin danh sách toàn bộ mùa giải.
 * - Cung cấp các quy định phân hạng điểm rating tương ứng với từng mùa giải được chỉ định.
 */
@RestController // Khai báo lớp này là một Spring REST Controller để tiếp nhận request
@RequestMapping("/api/seasons") // Định nghĩa tiền tố đường dẫn URL là /api/seasons
@RequiredArgsConstructor // Tự động tạo constructor injection cho thuộc tính final seasonService
@CrossOrigin(origins = "*") // Cho phép gọi API chéo miền (CORS) từ bất kỳ origin nào
public class SeasonController {

    private final SeasonService seasonService; // Khai báo dịch vụ xử lý nghiệp vụ mùa giải

    // Lấy toàn bộ danh sách các mùa giải đua có trong hệ thống
    @GetMapping // Xử lý yêu cầu HTTP GET gửi tới URL /api/seasons
        public ResponseEntity<List<SeasonDTO>> getAllSeasons() {
        // Trả về danh sách DTO của các mùa giải cùng trạng thái HTTP 200 OK
        return ResponseEntity.ok(seasonService.getAllSeasons());
    }

    // Lấy quy định phân hạng điểm (rating) của một mùa giải theo khóa chính seasonId
    @GetMapping("/{seasonId}/rules") // Xử lý yêu cầu HTTP GET gửi tới URL /api/seasons/{seasonId}/rules
        public ResponseEntity<List<SeasonClassRuleDTO>> getSeasonRules(@PathVariable Integer seasonId) {
        // Trả về danh sách DTO quy định hạng thi đấu của mùa giải tương ứng và mã HTTP 200 OK
        return ResponseEntity.ok(seasonService.getSeasonRules(seasonId));
    }
}
