package com.horseracing.backend.service;

import com.horseracing.backend.entity.*;
import com.horseracing.backend.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.sql.Timestamp;
import java.util.List;
import java.util.Optional;

@Service
public class NotificationService {

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private HorseRepository horseRepository;

    @Autowired
    private RaceRepository raceRepository;

    @Autowired
    private RaceMeetingRepository raceMeetingRepository;

    /**
     * Build descriptive Race & Race Meeting string (e.g. Race #1 of Race Meeting Summer Grand Prix 2026)
     */
    private String getRaceMeetingDetails(Integer raceId) {
        if (raceId == null) return "Unknown Race";
        Optional<Race> raceOpt = raceRepository.findById(raceId);
        if (raceOpt.isPresent()) {
            Race race = raceOpt.get();
            if (race.getRaceMeetingId() != null) {
                Optional<RaceMeeting> meetingOpt = raceMeetingRepository.findById(race.getRaceMeetingId());
                if (meetingOpt.isPresent()) {
                    return String.format("Race #%d of Race Meeting %s",
                            race.getId(), meetingOpt.get().getName());
                }
            }
            return "Race #" + race.getId();
        }
        return "Race #" + raceId;
    }

    /**
     * Persist notification into DB table [notifications]
     */
    private void saveNotification(Integer userId, String title, String message) {
        if (userId == null) return;
        try {
            Notification noti = Notification.builder()
                    .userId(userId)
                    .title(title)
                    .message(message)
                    .isRead(false)
                    .createdAt(new Timestamp(System.currentTimeMillis()))
                    .build();
            notificationRepository.save(noti);
            System.out.println("🔔 [Notification Persisted DB] User ID " + userId + ": " + message);
        } catch (Exception e) {
            System.err.println("Failed to save notification: " + e.getMessage());
        }
    }

    /**
     * Send notification to Horse Owner when a Jockey accepts or rejects a race invitation.
     */
    public void notifyOwnerOnInvitationResponse(RaceInvitation invite, boolean accepted) {
        try {
            Optional<Horse> horseOpt = horseRepository.findById(invite.getHorseId());
            Optional<User> jockeyOpt = userRepository.findById(invite.getJockeyId());

            if (horseOpt.isEmpty() || jockeyOpt.isEmpty()) return;

            Horse horse = horseOpt.get();
            User jockey = jockeyOpt.get();
            Optional<User> ownerOpt = userRepository.findById(horse.getOwnerId());
            if (ownerOpt.isEmpty()) return;

            User owner = ownerOpt.get();
            String raceMeetingDetails = getRaceMeetingDetails(invite.getRaceId());
            String statusText = accepted ? "ACCEPTED" : "DECLINED";

            String message = String.format(
                "Jockey %s HAS %s your invitation for Horse %s in %s.",
                jockey.getUsername(), statusText, horse.getName(), raceMeetingDetails
            );

            saveNotification(owner.getId(), "Race Invitation Update", message);
        } catch (Exception e) {
            System.err.println("Failed to dispatch invitation notification: " + e.getMessage());
        }
    }

    /**
     * Send notification to user when Admin approves or rejects their registration request.
     */
    public void notifyUserOnAdminDecision(String targetType, Integer userId, Integer targetId, boolean approved) {
        try {
            if (userId == null) return;
            Optional<User> userOpt = userRepository.findById(userId);
            if (userOpt.isEmpty()) return;

            String decision = approved ? "APPROVED" : "REJECTED";
            String message = String.format(
                "Your %s request has been %s by the Steward.",
                targetType, decision
            );

            saveNotification(userId, "Steward Decision", message);
        } catch (Exception e) {
            System.err.println("Failed to dispatch admin decision notification: " + e.getMessage());
        }
    }

    /**
     * Send notification to both Owner and Jockey when a Race Entry is approved or rejected by Admin.
     */
    public void notifyPartiesOnRaceEntryDecision(RaceEntry entry, boolean approved) {
        try {
            Optional<Horse> horseOpt = horseRepository.findById(entry.getHorseId());
            Optional<User> jockeyOpt = entry.getJockeyId() != null ? userRepository.findById(entry.getJockeyId()) : Optional.empty();

            String decision = approved ? "APPROVED" : "REJECTED";
            String raceMeetingDetails = getRaceMeetingDetails(entry.getRaceId());

            if (horseOpt.isPresent()) {
                Horse horse = horseOpt.get();
                Optional<User> ownerOpt = userRepository.findById(horse.getOwnerId());
                if (ownerOpt.isPresent()) {
                    String message = String.format(
                        "Race Entry for Horse %s in %s has been %s by the Steward.",
                        horse.getName(), raceMeetingDetails, decision
                    );
                    saveNotification(ownerOpt.get().getId(), "Race Entry Decision", message);
                }
            }

            if (jockeyOpt.isPresent()) {
                User jockey = jockeyOpt.get();
                String message = String.format(
                    "Race Entry in %s has been %s by the Steward.",
                    raceMeetingDetails, decision
                );
                saveNotification(jockey.getId(), "Race Entry Decision", message);
            }
        } catch (Exception e) {
            System.err.println("Failed to dispatch race entry decision notification: " + e.getMessage());
        }
    }

    public List<Notification> getUserNotifications(Integer userId) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    public long getUnreadCount(Integer userId) {
        return notificationRepository.countByUserIdAndIsReadFalse(userId);
    }

    public void markAsRead(Integer notificationId) {
        Optional<Notification> notiOpt = notificationRepository.findById(notificationId);
        if (notiOpt.isPresent()) {
            Notification noti = notiOpt.get();
            noti.setIsRead(true);
            noti.setReadAt(new Timestamp(System.currentTimeMillis()));
            notificationRepository.save(noti);
        }
    }

    public void markAllAsRead(Integer userId) {
        List<Notification> userNotis = notificationRepository.findByUserIdOrderByCreatedAtDesc(userId);
        Timestamp now = new Timestamp(System.currentTimeMillis());
        for (Notification n : userNotis) {
            if (!Boolean.TRUE.equals(n.getIsRead())) {
                n.setIsRead(true);
                n.setReadAt(now);
                notificationRepository.save(n);
            }
        }
    }
}
