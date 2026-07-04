package com.horseracing.backend.config;

import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import com.horseracing.backend.entity.ChatMessage;
import com.horseracing.backend.repository.ChatMessageRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import java.io.IOException;
import java.sql.Timestamp;
import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

@Component
public class ChatWebSocketHandler extends TextWebSocketHandler {

    @Autowired
    private ChatMessageRepository chatMessageRepository;

    private final ObjectMapper objectMapper = new ObjectMapper();

    // Map of raceId to session lists
    private final Map<String, List<WebSocketSession>> raceSessions = new ConcurrentHashMap<>();

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        String raceId = getRaceId(session);
        if (raceId != null) {
            raceSessions.computeIfAbsent(raceId, k -> new CopyOnWriteArrayList<>()).add(session);
            System.out.println("WebSocket Connected: Session " + session.getId() + " joined Race " + raceId);

            // Load and send chat history
            try {
                Integer rId = Integer.parseInt(raceId);
                List<ChatMessage> history = chatMessageRepository.findByRaceIdOrderBySentAtAsc(rId);
                for (ChatMessage msg : history) {
                    Map<String, String> payload = new HashMap<>();
                    payload.put("user", msg.getUsername());
                    payload.put("text", msg.getMessageText());
                    payload.put("time", msg.getSentAt() != null ? new java.text.SimpleDateFormat("HH:mm").format(msg.getSentAt()) : "");
                    session.sendMessage(new TextMessage(objectMapper.writeValueAsString(payload)));
                }
            } catch (Exception e) {
                System.err.println("Error loading chat history for race " + raceId + ": " + e.getMessage());
            }
        } else {
            session.close(CloseStatus.BAD_DATA);
        }
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        String raceId = getRaceId(session);
        if (raceId != null) {
            // Save to DB first
            try {
                Map<String, String> payload = objectMapper.readValue(message.getPayload(), Map.class);
                if (payload != null && payload.containsKey("user") && payload.containsKey("text")) {
                    ChatMessage chatMessage = new ChatMessage();
                    chatMessage.setRaceId(Integer.parseInt(raceId));
                    chatMessage.setUsername(payload.get("user"));
                    chatMessage.setMessageText(payload.get("text"));
                    chatMessage.setSentAt(new Timestamp(System.currentTimeMillis()));
                    chatMessageRepository.save(chatMessage);
                }
            } catch (Exception e) {
                System.err.println("Error saving chat message for race " + raceId + ": " + e.getMessage());
            }

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
