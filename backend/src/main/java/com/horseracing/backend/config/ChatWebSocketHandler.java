package com.horseracing.backend.config;

import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

@Component
public class ChatWebSocketHandler extends TextWebSocketHandler {

    // Map of raceId to session lists
    private final Map<String, List<WebSocketSession>> raceSessions = new ConcurrentHashMap<>();

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        String raceId = getRaceId(session);
        if (raceId != null) {
            raceSessions.computeIfAbsent(raceId, k -> new CopyOnWriteArrayList<>()).add(session);
            System.out.println("WebSocket Connected: Session " + session.getId() + " joined Race " + raceId);
        } else {
            session.close(CloseStatus.BAD_DATA);
        }
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        String raceId = getRaceId(session);
        if (raceId != null) {
            List<WebSocketSession> sessions = raceSessions.get(raceId);
            if (sessions != null) {
                // Broadcast to all sessions in the same race (including sender)
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

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
        String raceId = getRaceId(session);
        if (raceId != null) {
            List<WebSocketSession> sessions = raceSessions.get(raceId);
            if (sessions != null) {
                sessions.remove(session);
                if (sessions.isEmpty()) {
                    raceSessions.remove(raceId);
                }
            }
            System.out.println("WebSocket Closed: Session " + session.getId() + " left Race " + raceId);
        }
    }

    @Override
    public void handleTransportError(WebSocketSession session, Throwable exception) throws Exception {
        System.err.println("Transport error for session " + session.getId() + ": " + exception.getMessage());
        session.close(CloseStatus.SERVER_ERROR);
    }

    private String getRaceId(WebSocketSession session) {
        if (session.getUri() == null) {
            return null;
        }
        String path = session.getUri().getPath();
        // Path format: /ws/chat/{raceId}
        if (path == null || path.isEmpty()) {
            return null;
        }
        try {
            String[] segments = path.split("/");
            if (segments.length > 0) {
                return segments[segments.length - 1]; // Return the last segment which is raceId
            }
        } catch (Exception e) {
            System.err.println("Error extracting raceId from URI path " + path + ": " + e.getMessage());
        }
        return null;
    }
}
