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
    description = "🤖 **BƯỚC 15: AI TRỢ LÝ GIẢI ĐUA & DỰ ĐOÁN KẾT QUẢ (PYTHON AI ARCHITECTURE)**\n\n" +
                  "📌 **CÁC CLASS MÃ NGUỒN LIÊN QUAN:**\n" +
                  "* **Java Proxy**: `AIProxyController.java` (Spring Boot RestTemplate Proxy)\n" +
                  "* **Python Gateway**: `backend/python_ai/app.py` (Flask App Port 5000)\n" +
                  "* **AI Chatbot & RAG**: `ai_service.py`, `rag_engine.py`, `session_memory.py`\n" +
                  "* **ML Predictor**: `predictor.py` (Machine Learning Winning Probability)\n" +
                  "* **Frontend**: `Chatbot.tsx` (landing - AI hỏi đáp & dự đoán), `Landing.tsx` (embedded chatbot widget)\n\n" +
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
    @Operation(
        summary = "POST: Hỏi đáp với AI Gemini Chatbot",
        description = "📝 **CẤU TRÚC CODE & LUỒNG XỬ LÝ POST API:**\n\n" +
                      "📌 **CÁC CLASS MÃ NGUỒN XỬ LÝ:**\n" +
                      "* **Java Controller**: `AIProxyController.chat()` (Spring Boot Proxy)\n" +
                      "* **Python Service**: `app.py:chatbot()` -> `ai_service.py` -> `rag_engine.py`\n" +
                      "* **External API**: Google Gemini API\n" +
                      "* **DTO Request**: `AiChatRequestDTO` (`message`, `sessionId`, `lang`)\n" +
                      "* **DTO Response**: `String` (JSON từ Python microservice)\n\n" +
                      "🔄 **LUỒNG XỬ LÝ NGHIỆP VỤ DETAILED:**\n" +
                      "1. Spring Boot tiếp nhận câu hỏi người dùng và forward sang Python Flask (Port 5000).\n" +
                      "2. Python `rag_engine.py` truy vấn dữ liệu thời gian thực từ SQL Server.\n" +
                      "3. Gửi dữ liệu + câu hỏi lên Google Gemini API để tạo câu trả lời.\n" +
                      "4. Lưu lịch sử hội thoại vào `session_memory.py` và trả về câu trả lời."
    )
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
    @Operation(
        summary = "GET: AI Dự đoán kết quả cho trận đua",
        description = "🔍 **CHẠY THỬ TRY IT OUT**: Bấm 'Try it out' -> Điền raceId -> 'Execute'.\n\n" +
                      "📌 **CÁC CLASS MÃ NGUỒN XỬ LÝ:**\n" +
                      "* **Java Controller**: `AIProxyController.predict()` (Spring Boot Proxy)\n" +
                      "* **Python Service**: `app.py` -> `predictor.py:predict_race()`\n" +
                      "* **DTO Response**: `String` (JSON: `[{horseName, winProbability%, predictedPosition}]`)\n\n" +
                      "🔄 **LUỒNG TRA CỨU NGHIỆP VỤ:**\n" +
                      "1. Spring Boot forward `raceId` sang Python Flask.\n" +
                      "2. `predictor.py` tải dữ liệu tất cả chiến mã tham gia trận đua (Rating, Cân nặng, Lịch sử).\n" +
                      "3. Thuật toán ML tính toán tỷ lệ % chiến thắng cho từng chiến mã.\n" +
                      "4. Trả về danh sách xếp hạng dự đoán theo xác suất thắng."
    )
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
    @Operation(
        summary = "GET: Kiểm tra sức khỏe dịch vụ Python AI",
        description = "🔍 **CHẠY THỬ TRY IT OUT**: Bấm 'Try it out' -> 'Execute' để kiểm tra Python AI đang chạy.\n\n" +
                      "📌 **CÁC CLASS MÃ NGUỒN XỬ LÝ:**\n" +
                      "* **Java Controller**: `AIProxyController.health()` (Spring Boot Proxy)\n" +
                      "* **Python Service**: `app.py:health()` (Flask endpoint `/health`)\n" +
                      "* **DTO Response**: `String` (JSON: `{\"status\": \"ok\", \"service\": \"Python AI\"}`)\n\n" +
                      "🔄 **LUỒNG TRA CỨU NGHIỆP VỤ:**\n" +
                      "1. Spring Boot gửi GET request tới Python Flask `/health`.\n" +
                      "2. Python trả về trạng thái hoạt động của AI microservice."
    )
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
