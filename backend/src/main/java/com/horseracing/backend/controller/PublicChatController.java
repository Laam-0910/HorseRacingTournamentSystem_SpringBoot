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

@RestController
@RequestMapping("/api/public")
@CrossOrigin(origins = "*")
@Tag(
    name = "14. Public Data & Statistics",
    description = "📊 **PHÒNG CHAT CÔNG KHAI (PUBLIC CHAT ARCHITECTURE)**\n\n" +
                  "📌 **CÁC CLASS MÃ NGUỒN LIÊN QUAN:**\n" +
                  "* **Controllers**: `PublicChatController.java`\n" +
                  "* **Repositories**: `ChatMessageRepository.java`\n" +
                  "* **Entities**: `ChatMessage.java`"
)
public class PublicChatController {

    @Autowired
    private ChatMessageRepository chatMessageRepository;

    @PostMapping("/chat")
    @Operation(summary = "POST: Gửi tin nhắn hỏi đáp trợ lý AI công khai", description = "📝 **CẤU TRÚC CODE & LUỒNG XỬ LÝ POST API:**\n\n📌 **Code Architecture**: `PublicChatController.chat()` | **DTO Request**: `PublicChatRequestDTO`")
    public ResponseEntity<?> chat(@RequestBody PublicChatRequestDTO request) {
        String message = request.getMessage();
        String lang = request.getLang();
        if (message == null || message.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", "Message is required"));
        }

        String reply = "";
        if ("en".equalsIgnoreCase(lang)) {
            if (message.contains("rating") || message.contains("highest")) {
                reply = "According to records, 'Golden Flash' has the highest rating of 91, followed by 'Thunder King' at 88.";
            } else if (message.contains("predict")) {
                reply = "Based on current rating and handicap weights, 'Golden Flash' (rating 91) has a 42% probability of winning the upcoming Class 2 Turf race.";
            } else if (message.contains("jockey")) {
                reply = "Jockey Carlos leads with 80 career races and 35 top-3 finishes (43.7% success rate).";
            } else if (message.contains("season")) {
                reply = "The current season is '2026-2027 Grand Prix Season', running from Sept 2026 to June 2027.";
            } else {
                reply = "I am the AI Horse Racing Assistant. Ask me about horses, ratings, jockeys, or predictions!";
            }
        } else {
            // Default to Vietnamese (vi)
            if (message.contains("rating") || message.contains("cao nhất")) {
                reply = "Theo dữ liệu, ngựa 'Golden Flash' có rating cao nhất là 91, theo sau là 'Thunder King' với 88 điểm.";
            } else if (message.contains("dự đoán") || message.contains("race")) {
                reply = "Dựa trên điểm phong độ và tạ gánh chì, ngựa 'Golden Flash' (rating 91) được dự báo có tỷ lệ thắng cao nhất (42%) ở trận Class 2 sắp tới.";
            } else if (message.contains("nài") || message.contains("xuất sắc")) {
                reply = "Nài Carlos đang có phong độ tốt nhất với 80 lượt thi đấu và 35 lần đạt top 3 (tỷ lệ thành công 43.7%).";
            } else if (message.contains("mùa giải")) {
                reply = "Mùa giải hiện tại là '2026-2027 Grand Prix Season', diễn ra từ tháng 9/2026 đến tháng 6/2027.";
            } else {
                reply = "Chào bạn! Tôi là trợ lý AI. Hỏi tôi về ngựa, nài, xếp hạng rating hoặc dự đoán trận đấu nhé.";
            }
        }

        return ResponseEntity.ok(Map.of("success", true, "reply", reply));
    }

    @GetMapping("/chat/history")
    @Operation(summary = "GET: Lấy lịch sử chat của phòng đua", description = "🔍 **Chạy thử Try It Out**: Bấm 'Try it out' -> Điền raceId -> 'Execute'.\n\n📌 **Code Architecture**: `PublicChatController.getChatHistory()` -> `ChatMessageRepository.findByRaceIdOrderBySentAtAsc()`")
    public ResponseEntity<List<Map<String, String>>> getChatHistory(@RequestParam Integer raceId) {
        List<ChatMessage> list = chatMessageRepository.findByRaceIdOrderBySentAtAsc(raceId);
        List<Map<String, String>> history = new ArrayList<>();
        java.text.SimpleDateFormat sdf = new java.text.SimpleDateFormat("HH:mm");

        for (ChatMessage msg : list) {
            Map<String, String> m = new HashMap<>();
            m.put("user", msg.getUsername());
            m.put("text", msg.getMessageText());
            m.put("time", msg.getSentAt() != null ? sdf.format(msg.getSentAt()) : "");
            history.add(m);
        }
        return ResponseEntity.ok(history);
    }
}
