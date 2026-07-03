package com.horseracing.backend.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/public")
public class PublicChatController {

    @PostMapping("/chat")
    public ResponseEntity<?> chat(@RequestBody Map<String, String> request) {
        String message = request.get("message");
        String lang = request.get("lang");
        if (message == null) {
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
}
