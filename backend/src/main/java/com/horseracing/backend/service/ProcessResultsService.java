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

        // Validate that the race is in a valid state to have results confirmed (has started running/finished)
        java.util.List<String> ineligibleStatuses = java.util.Arrays.asList(
                "SCHEDULED", "DECLARATION_OPEN", "DECLARATION_CLOSED", "RACE_ASSIGNED", "OFFICIAL", "CANCELLED"
        );
        if (ineligibleStatuses.contains(race.getStatus())) {
            throw new IllegalArgumentException("Cannot confirm results. The race is in status '" + race.getStatus() + "' and cannot be processed.");
        }

        BigDecimal purse = race.getPurse() != null ? race.getPurse() : BigDecimal.ZERO;

        for (Map<String, Object> res : entriesResults) {
            Object entryIdObj = res.get("entryId");
            Integer entryId = entryIdObj != null ? Integer.parseInt(entryIdObj.toString()) : null;

            Integer finalPosition = null;
            Object fpObj = res.get("finalPosition");
            if (fpObj != null) {
                String fps = fpObj.toString().trim();
                if (!fps.isEmpty() && !"null".equalsIgnoreCase(fps) && !"undefined".equalsIgnoreCase(fps)) {
                    try {
                        finalPosition = Integer.parseInt(fps);
                    } catch (NumberFormatException e) {
                        // ignore
                    }
                }
            }

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
                
                // Nếu ngựa đã bị loại trong trận (DISQUALIFIED do vi phạm), giữ nguyên trạng thái
                if ("DISQUALIFIED".equals(entry.getStatus())) {
                    entry.setFinalPosition(null);
                    entry.setFinishTime("DQ");
                    entry.setPrizeMoney(BigDecimal.ZERO);
                    
                    // Chỉ tăng số trận tham gia của ngựa, không trừ thêm điểm rating (rating đã được trừ khi ghi nhận vi phạm)
                    Optional<Horse> horseOpt = horseRepository.findById(entry.getHorseId());
                    if (horseOpt.isPresent()) {
                        Horse horse = horseOpt.get();
                        horse.setTotalRaces(horse.getTotalRaces() + 1);
                        horseRepository.save(horse);
                    }
                    raceEntryRepository.save(entry);
                    continue;
                }
                
                // Nếu trọng tài loại trực tiếp (manual DQ) ở bước xác nhận kết quả
                if ("DQ".equals(finishTime)) {
                    entry.setStatus("DISQUALIFIED");
                    entry.setFinalPosition(null);
                    entry.setFinishTime("DQ");
                    entry.setPrizeMoney(BigDecimal.ZERO);
                    entry.setRatingAdjustment(-2);

                    Optional<Horse> horseOpt = horseRepository.findById(entry.getHorseId());
                    if (horseOpt.isPresent()) {
                        Horse horse = horseOpt.get();
                        horse.setTotalRaces(horse.getTotalRaces() + 1);
                        int newRating = horse.getCurrentRating() + entry.getRatingAdjustment();
                        horse.setCurrentRating(Math.max(0, newRating));
                        horseRepository.save(horse);
                    }
                    raceEntryRepository.save(entry);
                    continue;
                }

                // Kiểm tra chênh lệch cân nặng sau trận đấu (Weighing-in underweight check)
                // Nếu cân nặng thực tế sau trận (weigh-in) nhẹ hơn mức đăng ký (carriedWeight) quá 0.5kg
                BigDecimal carriedWeight = entry.getCarriedWeight() != null ? entry.getCarriedWeight() : BigDecimal.ZERO;
                BigDecimal diff = carriedWeight.subtract(weighInWeight);
                if (diff.compareTo(new BigDecimal("0.5")) > 0) {
                    entry.setStatus("DISQUALIFIED");
                    entry.setFinalPosition(null);
                    entry.setFinishTime("DQ");
                    entry.setPrizeMoney(BigDecimal.ZERO);
                    entry.setRatingAdjustment(-2);
                } else {
                    entry.setStatus("FINISHED");
                    entry.setFinalPosition(finalPosition);
                    entry.setFinishTime(finishTime);

                    // Phân chia tiền thưởng: Hạng 1 (60%), Hạng 2 (25%), Hạng 3 (15%)
                    BigDecimal prize = BigDecimal.ZERO;
                    int ratingAdj = 0;
                    if (finalPosition != null && finalPosition == 1) {
                        prize = purse.multiply(new BigDecimal("0.60"));
                        ratingAdj = 6;
                    } else if (finalPosition != null && finalPosition == 2) {
                        prize = purse.multiply(new BigDecimal("0.25"));
                        ratingAdj = 3;
                    } else if (finalPosition != null && finalPosition == 3) {
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
