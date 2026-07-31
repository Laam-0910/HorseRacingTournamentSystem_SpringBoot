package com.horseracing.backend.config;

import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.io.IOException;
import java.net.URI;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Lớp LivestreamWebSocketHandler - Xử lý truyền nhận dữ liệu tín hiệu Livestream (WebRTC Offer/Answer/ICE hoặc Frame Streaming).
 * Mỗi trận đua (raceId) có một danh sách các kết nối WebSocket riêng.
 */
@Component
public class LivestreamWebSocketHandler extends TextWebSocketHandler {

    // Lưu danh sách các session đang mở theo từng raceId
    private final Map<String, List<WebSocketSession>> raceLivestreamSessions = new ConcurrentHashMap<>();

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        String raceId = getRaceId(session);
        if (raceId != null) {
            raceLivestreamSessions.computeIfAbsent(raceId, k -> new CopyOnWriteArrayList<>()).add(session);
            System.out.println("Livestream WebSocket Connected: Session " + session.getId() + " joined Race #" + raceId);
        }
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        String raceId = getRaceId(session);
        if (raceId != null) {
            List<WebSocketSession> sessions = raceLivestreamSessions.get(raceId);
            if (sessions != null) {
                // Broadcast tin nhắn tới tất cả các session khác trong cùng raceId
                for (WebSocketSession s : sessions) {
                    if (s.isOpen() && !s.getId().equals(session.getId())) {
                        try {
                            s.sendMessage(message);
                        } catch (IOException e) {
                            System.err.println("Error relaying livestream message: " + e.getMessage());
                        }
                    }
                }
            }
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
        String raceId = getRaceId(session);
        if (raceId != null) {
            List<WebSocketSession> sessions = raceLivestreamSessions.get(raceId);
            if (sessions != null) {
                sessions.remove(session);
                if (sessions.isEmpty()) {
                    raceLivestreamSessions.remove(raceId);
                }
            }
            System.out.println("Livestream WebSocket Closed: Session " + session.getId() + " left Race #" + raceId);
        }
    }

    @Override
    public void handleTransportError(WebSocketSession session, Throwable exception) throws Exception {
        System.err.println("Livestream WebSocket Transport Error: " + exception.getMessage());
    }

    private String getRaceId(WebSocketSession session) {
        URI uri = session.getUri();
        if (uri != null) {
            String path = uri.getPath();
            String[] segments = path.split("/");
            if (segments.length > 0) {
                return segments[segments.length - 1];
            }
        }
        return null;
    }
}
