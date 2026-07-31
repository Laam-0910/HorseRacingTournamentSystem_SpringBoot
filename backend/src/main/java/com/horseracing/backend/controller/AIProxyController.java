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

/**
 * Controller AIProxyController - Lớp Proxy chuyển tiếp cuộc gọi đến dịch vụ Python AI (Reverse Proxy).
 * - Chuyển tiếp câu hỏi trò chuyện chatbot AI đến API Google Gemini (thông qua Python gateway).
 * - Chuyển tiếp yêu cầu dự đoán xác suất chiến thắng của các chiến mã cho một trận đấu cụ thể.
 * - Hỗ trợ cơ chế catch-all (getProxy, postProxy) để ủy quyền toàn bộ các API Python AI khác.
 */
@RestController
@RequestMapping({"/api/ai", "/ai"})
@CrossOrigin(origins = "*") // Hỗ trợ CORS đa nguồn
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
    @Operation(
        summary = "POST: Hỏi đáp với AI Gemini Chatbot",
        description = "📝 **CẤU TRÚC CODE & LUỒNG XỬ LÝ POST API:**\n\n" +
                      "📌 **CÁC CLASS MÃ NGUỒN XỬ LÝ:**\n" +
                      "* **Controllers**: `AIProxyController.chat()` (Spring Boot Proxy)\n" +
                      "* **Services**: `app.py:chatbot()` -> `ai_service.py` -> `rag_engine.py` (Python Flask)\n" +
                      "* **Repositories**: `RAG SQL Server Queries`\n" +
                      "* **Entities**: `Google Gemini API`\n" +
                      "* **DTOs**: `AiChatRequestDTO` (`message`, `sessionId`, `lang`), `String` (JSON Response)\n" +
                      "* **DTO Request**: `AiChatRequestDTO` (`message`, `sessionId`, `lang`)\n" +
                      "* **DTO Response**: `String` (JSON: `{\"response\": \"...\", \"sessionId\": \"...\"}`)\n" +
                      "* **Frontend**: `Chatbot.tsx` (landing), `Landing.tsx`, `aiService.ts`\n\n" +
                      "🔄 **LUỒNG XỬ LÝ NGHIỆP VỤ DETAILED:**\n" +
                      "1. Spring Boot tiếp nhận câu hỏi người dùng và forward sang Python Flask (Port 5000).\n" +
                      "2. Python `rag_engine.py` truy vấn dữ liệu thời gian thực từ SQL Server.\n" +
                      "3. Gửi dữ liệu + câu hỏi lên Google Gemini API để tạo câu trả lời.\n" +
                      "4. Lưu lịch sử hội thoại vào `session_memory.py` và trả về câu trả lời."
    )
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
    @Operation(
        summary = "GET: AI Dự đoán kết quả cho trận đua",
        description = "📝 **CẤU TRÚC CODE & LUỒNG XỬ LÝ GET API:**\n\n" +
                      "📌 **CÁC CLASS MÃ NGUỒN XỬ LÝ:**\n" +
                      "* **Controllers**: `AIProxyController.predict()` (Spring Boot Proxy)\n" +
                      "* **Services**: `app.py` -> `predictor.py:predict_race()` (Python Machine Learning)\n" +
                      "* **Repositories**: `HorseRepository`, `RaceEntryRepository`\n" +
                      "* **Entities**: `Horse.java`, `RaceEntry.java`\n" +
                      "* **DTOs**: `String` (JSON: `[{horseName, winProbability%, predictedPosition}]`)\n" +
                      "* **DTO Response**: `String` (JSON: `[{\"horseName\": \"...\", \"winProbability\": 85.5, \"predictedPosition\": 1}]`)\n" +
                      "* **Frontend**: `Chatbot.tsx` (landing), `Landing.tsx`, `aiService.ts`\n\n" +
                      "🔄 **LUỒNG TRA CỨU NGHIỆP VỤ:**\n" +
                      "1. Spring Boot forward `raceId` sang Python Flask.\n" +
                      "2. `predictor.py` tải dữ liệu tất cả chiến mã tham gia trận đua (Rating, Cân nặng, Lịch sử).\n" +
                      "3. Thuật toán ML tính toán tỷ lệ % chiến thắng cho từng chiến mã.\n" +
                      "4. Trả về danh sách xếp hạng dự đoán theo xác suất thắng."
    )
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
    @Operation(
        summary = "GET: Kiểm tra sức khỏe dịch vụ Python AI",
        description = "📝 **CẤU TRÚC CODE & LUỒNG XỬ LÝ GET API:**\n\n" +
                      "📌 **CÁC CLASS MÃ NGUỒN XỬ LÝ:**\n" +
                      "* **Controllers**: `AIProxyController.health()` (Spring Boot Proxy)\n" +
                      "* **Services**: `app.py:health()` (Flask endpoint `/health`)\n" +
                      "* **Repositories**: `Python AI Gateway`\n" +
                      "* **Entities**: `Flask Microservice`\n" +
                      "* **DTOs**: `String` (JSON: `{\"status\": \"ok\", \"service\": \"Python AI\"}`)\n" +
                      "* **DTO Response**: `String` (JSON: `{\"status\": \"ok\", \"service\": \"Python AI\"}`)\n" +
                      "* **Frontend**: `Chatbot.tsx` (landing), `aiService.ts`\n\n" +
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
