package com.horseracing.backend.controller;

import com.horseracing.backend.dto.PublicChatRequestDTO;
import com.horseracing.backend.entity.ChatMessage;
import com.horseracing.backend.repository.ChatMessageRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

/**
 * Controller PublicChatController - Lớp kiểm soát các endpoint liên quan đến nhắn tin công khai và trợ lý AI trả lời nhanh.
 * - Cung cấp lịch sử phòng chat (chat history) của từng trận đấu qua REST API phục vụ tải trang.
 * - Mô phỏng một trợ lý AI hỏi đáp nhanh dựa trên quy luật từ khóa đơn giản (Keyword Matching) phục vụ kiểm thử chatbot.
 */
@RestController // Khai báo đây là Spring Controller phản hồi dữ liệu JSON
@RequestMapping("/api/public") // Cấu hình đường dẫn chung cho toàn bộ các route trong controller này
@CrossOrigin(origins = "*") // Cho phép gọi API từ mọi domain frontend (CORS)
@Tag(
    name = "16. Public Chat & Livestream WebSocket",
    description = "💬 **CHAT TRONG CỘNG ĐỒNG & LIVESTREAM WEBSOCKET (CHAT ARCHITECTURE)**\n\n" +
                  "📌 **CÁC CLASS MÃ NGUỒN LIÊN QUAN:**\n" +
                  "* **REST Controllers**: `PublicChatController.java` (HTTP REST - lịch sử chat)\n" +
                  "* **WebSocket Handler**: `ChatWebSocketHandler.java` (Full-Duplex `/ws/chat/{raceId}`)\n" +
                  "* **WebSocket Config**: `WebSocketConfig.java`\n" +
                  "* **Repositories**: `ChatMessageRepository.java`\n" +
                  "* **Entities**: `ChatMessage.java`\n" +
                  "* **DTOs**: `PublicChatRequestDTO.java`\n" +
                  "* **Frontend**: `Chatbot.tsx` (landing - AI chatbot), `Livestream.tsx` (landing - WebSocket phòng đua), `ViewLive.tsx` (dashboards - xem video + chat)\n\n" +
                  "🔄 **LUỒNG XỬ LÝ NGHIỆP VỤ CHÍNH (BUSINESS FLOW):**\n" +
                  "1. **REST Chat (HTTP)**: Khán giả gửi tin nhắn, câu hỏi và lấy lịch sử chat qua REST API.\n" +
                  "2. **Livestream WebSocket**: Khán giả kết nối Full-Duplex `/ws/chat/{raceId}` - tin nhắn được phát tức thì tới tất cả người dùng trong phòng.\n" +
                  "3. Tin nhắn được lưu lịch sử kèm mốc thời gian `sent_at` vào bảng `ChatMessage`."
)
public class PublicChatController {

    @Autowired // Tự động tiêm (inject) ChatMessageRepository từ Spring Context
    private ChatMessageRepository chatMessageRepository; // Kho lưu trữ tin nhắn chat

    // Gửi tin nhắn hỏi đáp trợ lý AI nhanh dạng REST API (Không dùng WebSocket)
    @PostMapping("/chat") // Xử lý request POST tới đường dẫn /api/public/chat
    @Operation(
        summary = "POST: Gửi tin nhắn hỏi đáp trợ lý AI công khai",
        description = "📝 **CẤU TRÚC CODE & LUỒNG XỬ LÝ POST API:**\n\n" +
                      "📌 **CÁC CLASS MÃ NGUỒN XỬ LÝ:**\n" +
                      "* **Controllers**: `PublicChatController.chat()`\n" +
                      "* **Services**: `PublicChatService`\n" +
                      "* **Repositories**: `ChatMessageRepository.save()`\n" +
                      "* **Entities**: `ChatMessage.java`\n" +
                      "* **DTOs**: `PublicChatRequestDTO` (`message`, `lang`), `Map<String, Object>` (`{\"success\": true}`)\n" +
                      "* **DTO Request**: `PublicChatRequestDTO` (`message`, `lang`)\n" +
                      "* **DTO Response**: `Map<String, Object>` (`{\"success\": true, \"reply\": \"...\"}`)\n" +
                      "* **Frontend**: `Chatbot.tsx` (landing - AI chatbot), `publicDataService.ts`\n\n" +
                      "🔄 **LUỒNG XỬ LÝ NGHIỆP VỤ DETAILED:**\n" +
                      "1. Tiếp nhận tin nhắn người dùng và ngôn ngữ phản hồi (`vi` hoặc `en`).\n" +
                      "2. Phân tích từ khóa trong câu hỏi (rating, dự đoán, nài ngựa, mùa giải...).\n" +
                      "3. Tạo câu trả lời phù hợp bằng ngôn ngữ yêu cầu.\n" +
                      "4. Trả về câu trả lời dạng text cho người dùng."
    )
    public ResponseEntity<?> chat(@RequestBody PublicChatRequestDTO request) {
        // Lấy nội dung tin nhắn gửi từ người dùng
        String message = request.getMessage();
        // Lấy thông tin ngôn ngữ gửi lên (ví dụ: "en" hoặc "vi")
        String lang = request.getLang();
        // Kiểm tra nếu nội dung tin nhắn rỗng hoặc toàn khoảng trắng
        if (message == null || message.trim().isEmpty()) {
            // Trả về mã lỗi HTTP 400 Bad Request cùng thông báo lỗi
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", "Message is required"));
        }

        // Khởi tạo chuỗi câu trả lời của AI
        String reply = "";
        // Kiểm tra ngôn ngữ phản hồi xem có phải là Tiếng Anh hay không
        if ("en".equalsIgnoreCase(lang)) {
            // Lọc từ khóa Tiếng Anh liên quan đến điểm rating
            if (message.contains("rating") || message.contains("highest")) {
                // Tạo câu trả lời về ngựa có rating cao nhất bằng tiếng Anh
                reply = "According to records, 'Golden Flash' has the highest rating of 91, followed by 'Thunder King' at 88.";
            } else if (message.contains("predict")) { // Lọc từ khóa liên quan đến dự đoán trận đua
                // Tạo câu trả lời dự đoán bằng tiếng Anh
                reply = "Based on current rating and handicap weights, 'Golden Flash' (rating 91) has a 42% probability of winning the upcoming Class 2 Turf race.";
            } else if (message.contains("jockey")) { // Lọc từ khóa liên quan đến nài ngựa
                // Tạo câu trả lời thông tin nài ngựa bằng tiếng Anh
                reply = "Jockey Carlos leads with 80 career races and 35 top-3 finishes (43.7% success rate).";
            } else if (message.contains("season")) { // Lọc từ khóa liên quan đến mùa giải
                // Tạo câu trả lời về mùa giải hiện tại bằng tiếng Anh
                reply = "The current season is '2026-2027 Grand Prix Season', running from Sept 2026 to June 2027.";
            } else { // Phản hồi mặc định nếu không khớp từ khóa Tiếng Anh nào
                // Tạo câu trả lời chào mừng mặc định bằng tiếng Anh
                reply = "I am the AI Horse Racing Assistant. Ask me about horses, ratings, jockeys, or predictions!";
            }
        } else {
            // Lọc từ khóa Tiếng Việt (mặc định) liên quan đến rating
            if (message.contains("rating") || message.contains("cao nhất")) {
                // Tạo câu trả lời về rating bằng tiếng Việt
                reply = "Theo dữ liệu, ngựa 'Golden Flash' có rating cao nhất là 91, theo sau là 'Thunder King' với 88 điểm.";
            } else if (message.contains("dự đoán") || message.contains("race")) { // Lọc từ khóa dự đoán trận đua
                // Tạo câu trả lời dự đoán bằng tiếng Việt
                reply = "Dựa trên điểm phong độ và tạ gánh chì, ngựa 'Golden Flash' (rating 91) được dự báo có tỷ lệ thắng cao nhất (42%) ở trận Class 2 sắp tới.";
            } else if (message.contains("nài") || message.contains("xuất sắc")) { // Lọc từ khóa nài ngựa
                // Tạo câu trả lời về thông tin nài ngựa bằng tiếng Việt
                reply = "Nài Carlos đang có phong độ tốt nhất với 80 lượt thi đấu và 35 lần đạt top 3 (tỷ lệ thành công 43.7%).";
            } else if (message.contains("mùa giải")) { // Lọc từ khóa mùa giải
                // Tạo câu trả lời thông tin mùa giải bằng tiếng Việt
                reply = "Mùa giải hiện tại là '2026-2027 Grand Prix Season', diễn ra từ tháng 9/2026 đến tháng 6/2027.";
            } else { // Phản hồi mặc định nếu không khớp từ khóa Tiếng Việt nào
                // Tạo câu trả lời chào mừng mặc định bằng tiếng Việt
                reply = "Chào bạn! Tôi là trợ lý AI. Hỏi tôi về ngựa, nài, xếp hạng rating hoặc dự đoán trận đấu nhé.";
            }
        }

        // Trả về câu phản hồi AI thành công HTTP 200 OK
        return ResponseEntity.ok(Map.of("success", true, "reply", reply));
    }

    // Lấy lịch sử chat đã lưu trong cơ sở dữ liệu cho phòng chat của cuộc đua (raceId)
    @GetMapping("/chat/history") // Xử lý request GET tới đường dẫn /api/public/chat/history
    @Operation(
        summary = "GET: Lấy lịch sử chat của phòng đua",
        description = "📝 **CẤU TRÚC CODE & LUỒNG XỬ LÝ GET API:**\n\n" +
                      "📌 **CÁC CLASS MÃ NGUỒN XỬ LÝ:**\n" +
                      "* **Controllers**: `PublicChatController.getChatHistory()`\n" +
                      "* **Services**: `PublicChatService`\n" +
                      "* **Repositories**: `ChatMessageRepository.findByRaceIdOrderBySentAtAsc()`\n" +
                      "* **Entities**: `ChatMessage.java`\n" +
                      "* **DTOs**: `List<Map<String, String>>` (`user`, `text`, `time`)\n" +
                      "* **DTO Response**: `List<Map<String, String>>` (`user`, `text`, `time`)\n" +
                      "* **Frontend**: `Livestream.tsx` (landing - WebSocket phòng đua), `ViewLive.tsx` (dashboards - xem video + chat), `chatService.ts`\n\n" +
                      "🔄 **LUỒNG TRA CỨU NGHIỆP VỤ:**\n" +
                      "1. Truy vấn danh sách tin nhắn trong phòng chat theo `raceId`.\n" +
                      "2. Sắp xếp tin nhắn theo thứ tự thời gian từ cũ đến mới.\n" +
                      "3. Định dạng thời gian tin nhắn (`HH:mm`) và trả về danh sách."
    )
    public ResponseEntity<List<Map<String, String>>> getChatHistory(@RequestParam Integer raceId) {
        // Lấy danh sách tin nhắn cũ xếp tăng dần theo mốc thời gian gửi từ cơ sở dữ liệu
        List<ChatMessage> list = chatMessageRepository.findByRaceIdOrderBySentAtAsc(raceId);
        // Khởi tạo danh sách các Map để định dạng dữ liệu tin nhắn trả về cho frontend
        List<Map<String, String>> history = new ArrayList<>();
        // Định dạng thời gian hiển thị dạng Giờ:Phút (HH:mm)
        java.text.SimpleDateFormat sdf = new java.text.SimpleDateFormat("HH:mm");

        // Duyệt qua từng bản ghi tin nhắn chat thu thập từ CSDL
        for (ChatMessage msg : list) {
            // Tạo Map lưu thông tin của từng tin nhắn
            Map<String, String> m = new HashMap<>();
            // Đưa tên người dùng vào Map
            m.put("user", msg.getUsername());
            // Đưa nội dung tin nhắn vào Map
            m.put("text", msg.getMessageText());
            // Định dạng thời gian gửi và đưa vào Map (nếu thời gian không null)
            m.put("time", msg.getSentAt() != null ? sdf.format(msg.getSentAt()) : "");
            // Thêm Map tin nhắn vừa định dạng vào danh sách lịch sử
            history.add(m);
        }
        // Trả về danh sách lịch sử nhắn tin cùng mã HTTP 200 OK
        return ResponseEntity.ok(history);
    }
}
