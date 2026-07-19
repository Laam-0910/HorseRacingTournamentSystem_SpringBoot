package com.horseracing.backend.controller;

import com.horseracing.backend.dto.AiChatRequestDTO;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestTemplate;

@RestController
@RequestMapping({"/api/ai", "/ai"})
@CrossOrigin(origins = "*")
@Tag(
    name = "AI Service (Python)",
    description = "🤖 **Cấu trúc Mô-đun Trí Tuệ Nhân Tạo AI Gemini & ML Predictor (AI Architecture)**\n\n" +
                  "📌 **CÁC CLASS MÃ NGUỒN LIÊN QUAN:**\n" +
                  "* **Java Proxy**: `AIProxyController.java` (Spring Boot RestTemplate Proxy)\n" +
                  "* **Python Microservice**: `backend/python_ai/app.py` (Flask App Gateway)\n" +
                  "* **AI Chatbot & RAG Engine**: `backend/python_ai/ai_service.py`, `rag_engine.py`, `session_memory.py`\n" +
                  "* **ML Predictor**: `backend/python_ai/predictor.py` (Mô hình dự đoán thắng trận)\n\n" +
                  "🔄 **LUỒNG XỬ LÝ NGHIỆP VỤ CHÍNH (BUSINESS FLOW):**\n" +
                  "1. Spring Boot `AIProxyController` nhận Request từ Frontend và chuyển tiếp (Reverse Proxy) tới Python Service tại cổng `http://localhost:5000`.\n" +
                  "2. **Hỏi đáp AI Chatbot**: Python RAG Engine truy vấn dữ liệu thời gian thực từ MSSQL Database -> Kết hợp ngữ cảnh -> Trả lời câu hỏi tự nhiên qua Google Gemini API.\n" +
                  "3. **Dự đoán kết quả**: Python Predictor lấy điểm Elo Rating, Cân nặng, Cự ly và Lịch sử thi đấu -> Tính toán xác suất chiến thắng (%) của từng chiến mã."
)
public class AIProxyController {

    @Value("${ai.service.url:http://localhost:5000}")
    private String aiBaseUrl;

    private final RestTemplate restTemplate = new RestTemplate();

    private String buildUrl(HttpServletRequest request) {
        String path = request.getRequestURI().replaceFirst("^/api/ai", "").replaceFirst("^/ai", "");
        String url = aiBaseUrl + (path.startsWith("/") ? path : "/" + path);
        if (request.getQueryString() != null) {
            url += "?" + request.getQueryString();
        }
        return url;
    }

    @PostMapping("/chat")
    @Operation(summary = "Hỏi đáp với AI Gemini Chatbot", description = "📌 **Code Architecture**: `AIProxyController.chat()` (Spring Proxy) -> Python `app.py:chatbot()` -> `ai_service.py` -> `rag_engine.py` (Google Gemini API)")
    public ResponseEntity<String> chat(@RequestBody AiChatRequestDTO body) {
        String url = aiBaseUrl + "/chat";
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<AiChatRequestDTO> entity = new HttpEntity<>(body, headers);

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

    @GetMapping("/predict/{raceId}")
    @Operation(summary = "AI Dự đoán kết quả cho trận đua", description = "📌 **Code Architecture**: `AIProxyController.predict()` (Spring Proxy) -> Python `app.py` -> `predictor.py:predict_race()` (ML Algorithm)")
    public ResponseEntity<String> predict(@PathVariable("raceId") Integer raceId) {
        String url = aiBaseUrl + "/predict/" + raceId;
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

    @GetMapping("/health")
    @Operation(summary = "Kiểm tra sức khỏe dịch vụ Python AI", description = "📌 **Code Architecture**: `AIProxyController.health()` (Spring Proxy) -> Python `app.py:health()`")
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
