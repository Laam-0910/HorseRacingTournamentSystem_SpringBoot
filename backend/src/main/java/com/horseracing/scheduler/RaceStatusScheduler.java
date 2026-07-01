package com.horseracing.backend.scheduler;

import com.horseracing.backend.entity.Race;
import com.horseracing.backend.repository.RaceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Timestamp;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class RaceStatusScheduler {

    private final RaceRepository raceRepository;

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
                Timestamp start = race.getStartTime();

                String targetStatus = status;
                if (start != null && current.compareTo(start) >= 0) {
                    targetStatus = "RUNNING";
                } else if (regEnd != null && current.compareTo(regEnd) >= 0) {
                    targetStatus = "DECLARATION_CLOSED";
                } else if (regStart != null && current.compareTo(regStart) >= 0) {
                    targetStatus = "DECLARATION_OPEN";
                } else {
                    targetStatus = "SCHEDULED";
                }

                if (!targetStatus.equals(status)) {
                    log.info("Race ID {} status changing from {} to {}", race.getId(), status, targetStatus);
                    race.setStatus(targetStatus);
                    raceRepository.save(race);
                }
            }
        }
    }
}
