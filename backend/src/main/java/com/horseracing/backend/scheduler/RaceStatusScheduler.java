package com.horseracing.backend.scheduler;

import com.horseracing.backend.entity.Race;
import com.horseracing.backend.entity.RaceEntry;
import com.horseracing.backend.entity.RaceInvitation;
import com.horseracing.backend.repository.RaceRepository;
import com.horseracing.backend.repository.RaceEntryRepository;
import com.horseracing.backend.repository.RaceInvitationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Timestamp;
import java.util.List;
import java.util.Optional;

@Component
@RequiredArgsConstructor
@Slf4j
public class RaceStatusScheduler {

    private final RaceRepository raceRepository;
    private final RaceEntryRepository raceEntryRepository;
    private final RaceInvitationRepository raceInvitationRepository;

    @Scheduled(fixedDelay = 30000) // Runs every 30 seconds
    @Transactional
    public void updateRaceStatuses() {
        log.info("Running scheduled task to update race statuses...");
        List<Race> races = raceRepository.findAll();
        Timestamp current = new Timestamp(System.currentTimeMillis());

        for (Race race : races) {
            String status = race.getStatus();
            if ("SCHEDULED".equals(status) || "DECLARATION_OPEN".equals(status) || "DECLARATION_CLOSED".equals(status)) {
                Timestamp regStart = race.getRegistrationStartTime();
                Timestamp regEnd = race.getRegistrationEndTime();

                String targetStatus = status;
                if (regEnd != null && current.compareTo(regEnd) >= 0) {
                    long entryCount = raceEntryRepository.findByRaceId(race.getId()).stream()
                            .filter(e -> !"REJECTED".equalsIgnoreCase(e.getStatus()))
                            .count();
                    int min = race.getMinEntries() != null ? race.getMinEntries() : 3;
                    if (entryCount < min) {
                        targetStatus = "CANCELLED";
                    } else {
                        targetStatus = "DECLARATION_CLOSED";
                    }
                } else if (regStart != null && current.compareTo(regStart) >= 0) {
                    targetStatus = "DECLARATION_OPEN";
                } else {
                    targetStatus = "SCHEDULED";
                }

                if (!targetStatus.equals(status)) {
                    log.info("Race ID {} status changing from {} to {}", race.getId(), status, targetStatus);
                    race.setStatus(targetStatus);
                    raceRepository.save(race);

                    if ("CANCELLED".equals(targetStatus)) {
                        List<RaceEntry> entries = raceEntryRepository.findByRaceId(race.getId());
                        for (RaceEntry entry : entries) {
                            entry.setStatus("REJECTED");
                            entry.setGateNumber(0);
                            entry.setCarriedWeight(null);
                            entry.setHandicapWeight(null);
                            raceEntryRepository.save(entry);
                        }
                    }
                }
            }
        }

        // Expire pending invitations whose race registration end time has passed
        List<RaceInvitation> pendingInvitations = raceInvitationRepository.findByStatus("PENDING");
        for (RaceInvitation invitation : pendingInvitations) {
            Optional<Race> raceOpt = raceRepository.findById(invitation.getRaceId());
            if (raceOpt.isPresent()) {
                Race race = raceOpt.get();
                if (race.getRegistrationEndTime() != null && current.compareTo(race.getRegistrationEndTime()) >= 0) {
                    log.info("Expiring pending invitation ID {} for race ID {} since registration end time has passed", invitation.getId(), race.getId());
                    invitation.setStatus("EXPIRED");
                    raceInvitationRepository.save(invitation);
                }
            }
        }
    }
}
