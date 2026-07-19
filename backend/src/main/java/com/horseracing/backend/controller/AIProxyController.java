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
    name = "15. AI Gemini & Predictions (Python)",
    description = "🤖 **BƯỚC 15: AI TRỢ LÝ GIẢI ĐÚA & DỰ ĐOÁN KẾT QUẢ (PYTHON AI ARCHITECTURE)**\n\n" +
                  "📌 **CÁC CLASS MÃ NGUỒN LIÊN QUAN:**\n" +
                  "* **Java Proxy**: `AIProxyController.java` (Spring Boot RestTemplate Proxy)\n" +
                  "* **Python Gateway**: `backend/python_ai/app.py` (Flask App Port 5000)\n" +
                  "* **AI Chatbot & RAG**: `ai_service.py`, `rag_engine.py`, `session_memory.py`\n" +
                  "* **ML Predictor**: `predictor.py` (Machine Learning Winning Probability)\n\n" +
                  "🔄 **LUỒNG XỬ LÝ NGHIỆP VỤ CHÍNH (BUSINESS FLOW):**\n" +
                  "1. Reverse Proxy từ Spring Boot sang Python Microservice.\n" +
                  "2. RAG Engine truy vấn dữ liệu SQL Server thời gian thực -> Google Gemini API trả lời câu hỏi tự nhiên.\n" +
                  "3. Predictor tính toán tỷ lệ % chiến thắng dựa trên Rating, Cân nặng, Cự ly và Lịch sử thi đấu."
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
    @Operation(summary = "POST: Hỏi đáp với AI Gemini Chatbot", description = "📝 **CẤU TRÚC CODE & LUỒNG XỬ LÝ POST API:**\n\n📌 **Code Architecture**: `AIProxyController.chat()` (Spring Proxy) -> Python `app.py:chatbot()` -> `ai_service.py` -> `rag_engine.py` (Google Gemini API)")
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
    @Operation(summary = "GET: AI Dự đoán kết quả cho trận đua", description = "🔍 **Chạy thử Try It Out**: Bấm 'Try it out' -> Điền raceId -> 'Execute'.\n\n📌 **Code Architecture**: `AIProxyController.predict()` (Spring Proxy) -> Python `app.py` -> `predictor.py:predict_race()` (ML Algorithm)")
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
    @Operation(summary = "GET: Kiểm tra sức khỏe dịch vụ Python AI", description = "🔍 **Chạy thử Try It Out**: Bấm 'Try it out' -> 'Execute'.\n\n📌 **Code Architecture**: `AIProxyController.health()` (Spring Proxy) -> Python `app.py:health()`")
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
