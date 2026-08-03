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

    /**
     * Send notification to Jockey when Horse Owner sends a new race invitation.
     */
    public void notifyJockeyOnNewInvitation(RaceInvitation invite) {
        try {
            if (invite.getJockeyId() == null) return;
            Optional<Horse> horseOpt = horseRepository.findById(invite.getHorseId());
            Optional<User> jockeyOpt = userRepository.findById(invite.getJockeyId());

            if (horseOpt.isEmpty() || jockeyOpt.isEmpty()) return;

            Horse horse = horseOpt.get();
            Optional<User> ownerOpt = userRepository.findById(horse.getOwnerId());
            String ownerName = ownerOpt.map(u -> u.getFullName() != null && !u.getFullName().isBlank() ? u.getFullName() : u.getUsername()).orElse("Horse Owner");
            String raceMeetingDetails = getRaceMeetingDetails(invite.getRaceId());
            String hireFeeStr = invite.getHireFee() != null ? String.format("%,.0f VND", invite.getHireFee()) : "Standard Fee";

            String message = String.format(
                "Horse Owner %s has invited you to ride Horse '%s' in %s (Hire Fee: %s).",
                ownerName, horse.getName(), raceMeetingDetails, hireFeeStr
            );

            saveNotification(invite.getJockeyId(), "New Race Invitation", message);
        } catch (Exception e) {
            System.err.println("Failed to dispatch new invitation notification to jockey: " + e.getMessage());
        }
    }

    /**
     * Send notification to Owner and Jockey when Official Race Results are confirmed by Steward.
     */
    public void notifyPartiesOnOfficialResults(Integer raceId, Integer ownerId, Integer jockeyId, String horseName, int finishPosition, java.math.BigDecimal ownerPrize, java.math.BigDecimal jockeyTotalEarned) {
        try {
            String raceMeetingDetails = getRaceMeetingDetails(raceId);

            if (ownerId != null) {
                String prizeStr = ownerPrize != null && ownerPrize.compareTo(java.math.BigDecimal.ZERO) > 0
                        ? String.format(" Earned Prize: %,.0f VND.", ownerPrize)
                        : "";
                String message = String.format(
                    "Official Results for Horse '%s' in %s: Finished Position #%d.%s",
                    horseName, raceMeetingDetails, finishPosition, prizeStr
                );
                saveNotification(ownerId, "Official Race Results", message);
            }

            if (jockeyId != null) {
                String earnedStr = jockeyTotalEarned != null && jockeyTotalEarned.compareTo(java.math.BigDecimal.ZERO) > 0
                        ? String.format(" Total Earned (Prize + Hire Fee): %,.0f VND.", jockeyTotalEarned)
                        : "";
                String message = String.format(
                    "Official Results for %s with Horse '%s': Finished Position #%d.%s",
                    raceMeetingDetails, horseName, finishPosition, earnedStr
                );
                saveNotification(jockeyId, "Official Race Results", message);
            }
        } catch (Exception e) {
            System.err.println("Failed to dispatch official results notification: " + e.getMessage());
        }
    }

    /**
     * Send notification to User when Admin approves (PROCESSED) or rejects a Cash-Out Withdrawal Request.
     */
    public void notifyUserOnWithdrawalStatus(Integer userId, java.math.BigDecimal amount, boolean processed, String note) {
        try {
            if (userId == null) return;
            String amountStr = String.format("%,.0f VND", amount);
            String title = processed ? "Withdrawal Processed" : "Withdrawal Rejected";
            String message = processed
                ? String.format("Your cash-out withdrawal request of %s has been APPROVED & processed by Admin. Money transferred to your bank account.", amountStr)
                : String.format("Your cash-out withdrawal request of %s was REJECTED by Admin. Reason: %s", amountStr, note != null && !note.isBlank() ? note : "Admin decision.");

            saveNotification(userId, title, message);
        } catch (Exception e) {
            System.err.println("Failed to dispatch withdrawal status notification: " + e.getMessage());
        }
    }

    /**
     * Send notification to Spectator when purchasing a HD Livestream Ticket / Season Pass.
     */
    public void notifySpectatorOnTicketPurchase(Integer userId, String packageType, java.math.BigDecimal pricePaid) {
        try {
            if (userId == null) return;
            String priceStr = pricePaid != null ? String.format("%,.0f VND", pricePaid) : "";
            String message = String.format(
                "Payment successful! You have unlocked HD Livestream %s Pass (%s). Enjoy watching live races!",
                packageType.toUpperCase(), priceStr
            );
            saveNotification(userId, "Livestream Pass Activated", message);
        } catch (Exception e) {
            System.err.println("Failed to dispatch ticket purchase notification: " + e.getMessage());
        }
    }

    /**
     * Send notification to Owner and Jockey when a Race is CANCELLED by Admin.
     */
    public void notifyPartiesOnRaceCancelled(Integer raceId, Integer ownerId, Integer jockeyId, String horseName) {
        try {
            String raceMeetingDetails = getRaceMeetingDetails(raceId);

            if (ownerId != null) {
                String message = String.format(
                    "Race %s for Horse '%s' has been CANCELLED by Admin. Any escrowed hire fees have been refunded to your wallet.",
                    raceMeetingDetails, horseName
                );
                saveNotification(ownerId, "Race Cancelled", message);
            }

            if (jockeyId != null) {
                String message = String.format(
                    "Race %s for Horse '%s' has been CANCELLED by Admin.",
                    raceMeetingDetails, horseName
                );
                saveNotification(jockeyId, "Race Cancelled", message);
            }
        } catch (Exception e) {
            System.err.println("Failed to dispatch race cancelled notification: " + e.getMessage());
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
