package com.horseracing.backend.config;

import com.horseracing.backend.entity.ChatMessage;
import com.horseracing.backend.repository.ChatMessageRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.io.IOException;
import java.sql.Timestamp;
import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

/**
 * Bộ xử lý ChatWebSocketHandler - Lớp xử lý sự kiện kết nối WebSocket nhắn tin trực tiếp.
 * - Kế thừa từ TextWebSocketHandler để phục vụ truyền nhận dữ liệu dạng Text (JSON).
 * - Lưu trữ danh sách các session hoạt động theo từng mã trận đấu (raceId) sử dụng bản đồ luồng an toàn ConcurrentHashMap.
 * - Tự động truy vấn lịch sử cuộc trò chuyện từ cơ sở dữ liệu và gửi lại cho khách hàng ngay khi kết nối thành công.
 * - Lưu tin nhắn mới nhận được vào cơ sở dữ liệu và gửi Broadcast (phát sóng) đến toàn bộ các session cùng tham gia xem cuộc đua đó.
 */
@Component
@RequiredArgsConstructor
public class ChatWebSocketHandler extends TextWebSocketHandler {

    private final ChatMessageRepository chatMessageRepository; // Kho lưu trữ tin nhắn chat
    private final ObjectMapper objectMapper = new ObjectMapper(); // Tiện ích chuyển đổi đối tượng sang chuỗi JSON và ngược lại

    // Bản đồ phân loại các session theo raceId để phát sóng (broadcast) nội bộ từng cuộc đua
    private final Map<String, List<WebSocketSession>> raceSessions = new ConcurrentHashMap<>();

    // Kích hoạt ngay sau khi một kết nối WebSocket được thiết lập thành công
    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        String raceId = getRaceId(session); // Trích xuất raceId từ URI của session
        if (raceId != null) {
            // Thêm session hiện tại vào nhóm chat của cuộc đua tương ứng
            raceSessions.computeIfAbsent(raceId, k -> new CopyOnWriteArrayList<>()).add(session);
            System.out.println("WebSocket Connected: Session " + session.getId() + " joined Race " + raceId);

            // 1. Tải lịch sử tin nhắn trò chuyện và gửi riêng cho session vừa mới tham gia
            try {
                Integer rId = Integer.parseInt(raceId);
                List<ChatMessage> history = chatMessageRepository.findByRaceIdOrderBySentAtAsc(rId);
                for (ChatMessage msg : history) {
                    Map<String, String> payload = new HashMap<>();
                    payload.put("user", msg.getUsername());
                    payload.put("text", msg.getMessageText());
                    payload.put("time", msg.getSentAt() != null ? new java.text.SimpleDateFormat("HH:mm").format(msg.getSentAt()) : "");
                    // Gửi tin nhắn lịch sử dạng JSON
                    session.sendMessage(new TextMessage(objectMapper.writeValueAsString(payload)));
                }
            } catch (Exception e) {
                System.err.println("Error loading chat history for race " + raceId + ": " + e.getMessage());
            }
        } else {
            // Đóng kết nối nếu dữ liệu URI gửi lên không hợp lệ
            session.close(CloseStatus.BAD_DATA);
        }
    }

    // Kích hoạt khi có tin nhắn văn bản (JSON) được gửi lên từ client
    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        String raceId = getRaceId(session);
        if (raceId != null) {
            // 1. Phân tích nội dung tin nhắn và lưu trữ vào cơ sở dữ liệu
            try {
                Map<String, String> payload = objectMapper.readValue(message.getPayload(), Map.class);
                if (payload != null && payload.containsKey("user") && payload.containsKey("text")) {
                    ChatMessage chatMessage = new ChatMessage();
                    chatMessage.setRaceId(Integer.parseInt(raceId));
                    chatMessage.setUsername(payload.get("user"));
                    chatMessage.setMessageText(payload.get("text"));
                    chatMessage.setSentAt(new Timestamp(System.currentTimeMillis())); // Thiết lập thời gian hiện tại
                    chatMessageRepository.save(chatMessage);
                }
            } catch (Exception e) {
                System.err.println("Error saving chat message for race " + raceId + ": " + e.getMessage());
            }

            // 2. Phát sóng (Broadcast) tin nhắn này tới tất cả những người đang kết nối cùng phòng đua (raceId)
            List<WebSocketSession> sessions = raceSessions.get(raceId);
            if (sessions != null) {
                for (WebSocketSession s : sessions) {
                    if (s.isOpen()) {
                        try {
                            s.sendMessage(message);
                        } catch (IOException e) {
                            System.err.println("Error sending message to session " + s.getId() + ": " + e.getMessage());
                        }
                    }
                }
            }
        }
    }

    // Kích hoạt khi phiên kết nối của client bị đóng
    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
        String raceId = getRaceId(session);
        if (raceId != null) {
            List<WebSocketSession> sessions = raceSessions.get(raceId);
            if (sessions != null) {
                sessions.remove(session); // Loại bỏ session khỏi danh sách hoạt động
                if (sessions.isEmpty()) {
                    raceSessions.remove(raceId); // Dọn dẹp map nếu không còn ai tham gia chat cuộc đua này
                }
            }
            System.out.println("WebSocket Closed: Session " + session.getId() + " left Race " + raceId);
        }
    }

    // Xử lý lỗi truyền tải dữ liệu của WebSocket
    @Override
    public void handleTransportError(WebSocketSession session, Throwable exception) throws Exception {
        System.err.println("Transport error for session " + session.getId() + ": " + exception.getMessage());
        session.close(CloseStatus.SERVER_ERROR); // Đóng kết nối do lỗi hệ thống
    }

    // Tiện ích hỗ trợ trích xuất raceId từ đường dẫn URI (Ví dụ: /ws/chat/12 -> 12)
    private String getRaceId(WebSocketSession session) {
        if (session.getUri() == null) {
            return null;
        }
        String path = session.getUri().getPath();
        if (path == null || path.isEmpty()) {
            return null;
        }
        try {
            String[] segments = path.split("/");
            if (segments.length > 0) {
                return segments[segments.length - 1]; // Trả về phần tử cuối cùng đại diện cho raceId
            }
        } catch (Exception e) {
            System.err.println("Error extracting raceId from URI path " + path + ": " + e.getMessage());
        }
        return null;
    }
}
