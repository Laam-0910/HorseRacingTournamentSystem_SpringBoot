package com.horseracing.backend.controller;

import com.horseracing.backend.dto.AiChatRequestDTO;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestTemplate;

/**
 * Controller AIProxyController - Lớp Proxy chuyển tiếp cuộc gọi đến dịch vụ Python AI (Reverse Proxy).
 * - Chuyển tiếp câu hỏi trò chuyện chatbot AI đến API Google Gemini (thông qua Python gateway).
 * - Chuyển tiếp yêu cầu dự đoán xác suất chiến thắng của các chiến mã cho một trận đấu cụ thể.
 * - Hỗ trợ cơ chế catch-all (getProxy, postProxy) để ủy quyền toàn bộ các API Python AI khác.
 */
@RestController
@RequestMapping({"/api/ai", "/ai"})
@CrossOrigin(origins = "*") // Hỗ trợ CORS đa nguồn
public class AIProxyController {

    // Nạp đường dẫn URL của dịch vụ Python AI từ file application.properties (mặc định là http://localhost:5000)
    @Value("${ai.service.url:http://localhost:5000}")
    private String aiBaseUrl;

    // Sử dụng RestTemplate để thực hiện HTTP Client chuyển tiếp yêu cầu
    private final RestTemplate restTemplate = new RestTemplate();

    // Hàm tiện ích phân tích URI nhận được từ servlet request để dựng URL chuyển tiếp đến Python Flask
    private String buildUrl(HttpServletRequest request) {
        String path = request.getRequestURI().replaceFirst("^/api/ai", "").replaceFirst("^/ai", "");
        String url = aiBaseUrl + (path.startsWith("/") ? path : "/" + path);
        if (request.getQueryString() != null) {
            url += "?" + request.getQueryString();
        }
        return url;
    }

    // Chuyển tiếp câu hỏi Chatbot AI sang Flask gateway
    @PostMapping("/chat")
        public ResponseEntity<String> chat(@RequestBody AiChatRequestDTO body) {
        // Dựng đường dẫn URL đích kết nối tới endpoint /chat của Microservice Python Flask AI
        String url = aiBaseUrl + "/chat";
        // Khởi tạo đối tượng HttpHeaders để thiết lập kiểu nội dung Content-Type
        HttpHeaders headers = new HttpHeaders();
        // Thiết lập loại dữ liệu gửi đi là JSON chuẩn (application/json)
        headers.setContentType(MediaType.APPLICATION_JSON);
        // Đóng gói payload AiChatRequestDTO và HttpHeaders vào HttpEntity
        HttpEntity<AiChatRequestDTO> entity = new HttpEntity<>(body, headers);

        try {
            // Thực hiện gửi yêu cầu HTTP POST sang Python Flask và nhận phản hồi dạng chuỗi JSON nguyên bản
            return restTemplate.postForEntity(url, entity, String.class);
        } catch (HttpStatusCodeException e) {
            // Bắt lỗi mã trạng thái HTTP trả về từ Python (ví dụ: 400 Bad Request, 500 Server Error) và chuyển tiếp cho Client
            return ResponseEntity.status(e.getStatusCode())
                    .headers(e.getResponseHeaders())
                    .body(e.getResponseBodyAsString());
        } catch (Exception e) {
            // Bắt các ngoại lệ mất kết nối hoặc không gọi được service AI, trả về lỗi HTTP 500 Internal Server Error
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("{\"error\": \"" + e.getMessage() + "\"}");
        }
    }

    // Chuyển tiếp yêu cầu dự đoán xác suất chiến thắng của trận đấu kịch bản Machine Learning
    @GetMapping("/predict/{raceId}")
        public ResponseEntity<String> predict(@PathVariable("raceId") Integer raceId) {
        String url = aiBaseUrl + "/predict/" + raceId;
        try {
            // Gửi yêu cầu GET đến endpoint /predict/{raceId} của Python AI
            return restTemplate.getForEntity(url, String.class);
        } catch (HttpStatusCodeException e) {
            return ResponseEntity.status(e.getStatusCode())
                    .headers(e.getResponseHeaders())
                    .body(e.getResponseBodyAsString());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("{\"error\": \"" + e.getMessage() + "\"}");
        }
    }

    // Kiểm tra tính sẵn sàng (Healthcheck) của dịch vụ Python AI Flask
    @GetMapping("/health")
        public ResponseEntity<String> health() {
        String url = aiBaseUrl + "/health";
        try {
            return restTemplate.getForEntity(url, String.class);
        } catch (HttpStatusCodeException e) {
            return ResponseEntity.status(e.getStatusCode())
                    .headers(e.getResponseHeaders())
                    .body(e.getResponseBodyAsString());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("{\"error\": \"" + e.getMessage() + "\"}");
        }
    }

    // Uỷ thác (proxy) toàn bộ cuộc gọi GET không khớp cấu hình đường dẫn cụ thể nào khác
    @GetMapping("/**")
    public ResponseEntity<String> getProxy(HttpServletRequest request) {
        String url = buildUrl(request);
        try {
            return restTemplate.getForEntity(url, String.class);
        } catch (HttpStatusCodeException e) {
            return ResponseEntity.status(e.getStatusCode())
                    .headers(e.getResponseHeaders())
                    .body(e.getResponseBodyAsString());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("{\"error\": \"" + e.getMessage() + "\"}");
        }
    }

    // Uỷ thác (proxy) toàn bộ cuộc gọi POST không khớp cấu hình đường dẫn cụ thể nào khác
    @PostMapping("/**")
    public ResponseEntity<String> postProxy(@RequestBody(required = false) String body, HttpServletRequest request) {
        String url = buildUrl(request);
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<String> entity = new HttpEntity<>(body, headers);

        try {
            return restTemplate.postForEntity(url, entity, String.class);
        } catch (HttpStatusCodeException e) {
            return ResponseEntity.status(e.getStatusCode())
                    .headers(e.getResponseHeaders())
                    .body(e.getResponseBodyAsString());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("{\"error\": \"" + e.getMessage() + "\"}");
        }
    }
}
