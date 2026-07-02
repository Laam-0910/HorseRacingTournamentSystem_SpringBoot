package com.horseracing.backend.service;

import com.horseracing.backend.entity.*;
import com.horseracing.backend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class ProcessResultsService {

    private final RaceRepository raceRepository;
    private final RaceEntryRepository raceEntryRepository;
    private final HorseRepository horseRepository;
    private final UserRepository userRepository;

    @Transactional
    public void confirmResults(Integer raceId, String stewardReport, List<Map<String, Object>> entriesResults) {
        Race race = raceRepository.findById(raceId)
                .orElseThrow(() -> new IllegalArgumentException("Race not found"));

        BigDecimal purse = race.getPurse() != null ? race.getPurse() : BigDecimal.ZERO;

        for (Map<String, Object> res : entriesResults) {
            Integer entryId = (Integer) res.get("entryId");
            Integer finalPosition = (Integer) res.get("finalPosition");
            String finishTime = (String) res.get("finishTime");
            Object weightVal = res.get("weighInWeight");
            BigDecimal weighInWeight = BigDecimal.ZERO;
            if (weightVal != null) {
                String ws = weightVal.toString().trim();
                if (!ws.isEmpty() && !"null".equalsIgnoreCase(ws) && !"undefined".equalsIgnoreCase(ws)) {
                    weighInWeight = new BigDecimal(ws);
                }
            }

            Optional<RaceEntry> entryOpt = raceEntryRepository.findById(entryId);
            if (entryOpt.isPresent()) {
                RaceEntry entry = entryOpt.get();
                
                // Kiểm tra chênh lệch cân nặng sau trận đấu (Weighing-in underweight check)
                // Nếu cân nặng thực tế sau trận (weigh-in) nhẹ hơn mức đăng ký (carriedWeight) quá 0.5kg
                BigDecimal diff = entry.getCarriedWeight().subtract(weighInWeight);
                if (diff.compareTo(new BigDecimal("0.5")) > 0) {
                    entry.setStatus("DISQUALIFIED");
                    entry.setFinalPosition(null);
                    entry.setPrizeMoney(BigDecimal.ZERO);
                    entry.setRatingAdjustment(-2);
                } else {
                    entry.setStatus("FINISHED");
                    entry.setFinalPosition(finalPosition);
                    entry.setFinishTime(finishTime);

                    // Phân chia tiền thưởng: Hạng 1 (60%), Hạng 2 (25%), Hạng 3 (15%)
                    BigDecimal prize = BigDecimal.ZERO;
                    int ratingAdj = 0;
                    if (finalPosition == 1) {
                        prize = purse.multiply(new BigDecimal("0.60"));
                        ratingAdj = 6;
                    } else if (finalPosition == 2) {
                        prize = purse.multiply(new BigDecimal("0.25"));
                        ratingAdj = 3;
                    } else if (finalPosition == 3) {
                        prize = purse.multiply(new BigDecimal("0.15"));
                        ratingAdj = 1;
                    } else {
                        ratingAdj = 0;
                    }

                    entry.setPrizeMoney(prize);
                    entry.setRatingAdjustment(ratingAdj);

                    // Cập nhật chỉ số Jockey
                    Optional<User> jockeyOpt = userRepository.findById(entry.getJockeyId());
                    if (jockeyOpt.isPresent()) {
                        User jockey = jockeyOpt.get();
                        jockey.setTotalRacesParticipated((jockey.getTotalRacesParticipated() != null ? jockey.getTotalRacesParticipated() : 0) + 1);
                        if (finalPosition != null && finalPosition <= 3) {
                            jockey.setTotalTop3Finishes((jockey.getTotalTop3Finishes() != null ? jockey.getTotalTop3Finishes() : 0) + 1);
                        }
                        userRepository.save(jockey);
                    }
                }

                // Cập nhật chỉ số Horse
                Optional<Horse> horseOpt = horseRepository.findById(entry.getHorseId());
                if (horseOpt.isPresent()) {
                    Horse horse = horseOpt.get();
                    horse.setTotalRaces(horse.getTotalRaces() + 1);
                    if (finalPosition != null && finalPosition == 1 && !"DISQUALIFIED".equals(entry.getStatus())) {
                        horse.setTotalWins(horse.getTotalWins() + 1);
                    }
                    // Tính toán rating mới (không để âm)
                    int newRating = horse.getCurrentRating() + entry.getRatingAdjustment();
                    horse.setCurrentRating(Math.max(0, newRating));
                    horseRepository.save(horse);
                }

                raceEntryRepository.save(entry);
            }
        }

        race.setStewardReport(stewardReport);
        race.setStatus("OFFICIAL");
        race.setYoutubeLiveUrl(null); // Automatically remove livestream URL when race finishes
        raceRepository.save(race);
    }
}
