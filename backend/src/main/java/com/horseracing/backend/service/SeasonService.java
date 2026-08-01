package com.horseracing.backend.service;

import com.horseracing.backend.dto.SeasonClassRuleDTO;
import com.horseracing.backend.dto.SeasonDTO;
import com.horseracing.backend.entity.Season;
import com.horseracing.backend.entity.SeasonClassRule;
import com.horseracing.backend.mapper.SeasonClassRuleMapper;
import com.horseracing.backend.mapper.SeasonMapper;
import com.horseracing.backend.repository.SeasonClassRuleRepository;
import com.horseracing.backend.repository.SeasonRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

import com.horseracing.backend.utils.DateTimeParser;

/**
 * Lớp dịch vụ SeasonService - Quản lý nghiệp vụ mùa giải đua và quy định phân hạng điểm (Class Rules).
 * - Tra cứu danh sách mùa giải.
 * - Khởi tạo mùa giải mới: Hỗ trợ tự động sinh quy định phân hạng mặc định (Class 1 -> Class 5) hoặc thiết lập hạng thủ công.
 * - Bật/Tắt hoạt động mùa giải (Đổi trạng thái giữa ACTIVE và CLOSED).
 * - Xem và lưu quy tắc phân hạng rating cho từng mùa giải.
 * - Gia hạn thời gian mùa giải (Cập nhật ngày bắt đầu và kết thúc).
 */
@Service
@RequiredArgsConstructor
public class SeasonService {

    private final SeasonRepository seasonRepository; // Kho lưu trữ mùa giải
    private final SeasonClassRuleRepository seasonClassRuleRepository; // Kho lưu trữ quy định hạng
    private final SeasonMapper seasonMapper; // Bộ ánh xạ mùa giải
    private final SeasonClassRuleMapper seasonClassRuleMapper; // Bộ ánh xạ quy định hạng

    // Lấy danh sách toàn bộ mùa giải
    public List<SeasonDTO> getAllSeasons() {
        return seasonRepository.findAll().stream()
                .map(seasonMapper::toDTO)
                .collect(Collectors.toList());
    }

    // Khởi tạo mùa giải mới và thiết lập các hạng đua
    @Transactional
    public SeasonDTO createSeason(Map<String, Object> body) {
        String name = (String) body.get("name");
        String startStr = (String) body.get("startDate");
        String endStr = (String) body.get("endDate");

        // Phân tích định dạng ngày từ chuỗi sang java.sql.Date
        java.sql.Date startDate = DateTimeParser.parseDate(startStr);
        java.sql.Date endDate = DateTimeParser.parseDate(endStr);
        String classRuleMethod = (String) body.get("classRuleMethod");

        Season season = new Season();
        season.setName(name);
        season.setStartDate(startDate);
        season.setEndDate(endDate);
        season.setStatus("ACTIVE"); // Thiết lập trạng thái hoạt động mặc định
        Season savedSeason = seasonRepository.save(season);

        // Trường hợp tự động tạo quy định phân hạng (AUTOMATIC)
        if ("AUTOMATIC".equals(classRuleMethod)) {
            // Thiết lập mặc định tự động cho Class 1 - Class 5
            SeasonClassRule class1 = new SeasonClassRule(null, savedSeason.getId(), "Class 1", "Elite Championship", 95, null, new BigDecimal("300000"), new BigDecimal("1000000"));
            SeasonClassRule class2 = new SeasonClassRule(null, savedSeason.getId(), "Class 2", "Premium Group", 80, 94, new BigDecimal("200000"), new BigDecimal("299999"));
            SeasonClassRule class3 = new SeasonClassRule(null, savedSeason.getId(), "Class 3", "Advanced Tier", 60, 79, new BigDecimal("100000"), new BigDecimal("199999"));
            SeasonClassRule class4 = new SeasonClassRule(null, savedSeason.getId(), "Class 4", "Intermediate Level", 40, 59, new BigDecimal("50000"), new BigDecimal("99999"));
            SeasonClassRule class5 = new SeasonClassRule(null, savedSeason.getId(), "Class 5", "Entry Division", 0, 39, new BigDecimal("20000"), new BigDecimal("49999"));

            seasonClassRuleRepository.saveAll(List.of(class1, class2, class3, class4, class5));
        } 
        // Trường hợp tạo quy định phân hạng thủ công (MANUAL)
        else if (body.get("manualClasses") != null) {
            List<Map<String, Object>> manualRules = (List<Map<String, Object>>) body.get("manualClasses");
            for (Map<String, Object> ruleMap : manualRules) {
                String classLevelName = (String) ruleMap.get("classLevelName");
                Integer minRating = (Integer) ruleMap.get("minRating");
                Integer maxRating = (Integer) ruleMap.get("maxRating");
                BigDecimal minPrize = new BigDecimal(String.valueOf(ruleMap.get("minPrize")));
                BigDecimal maxPrize = new BigDecimal(String.valueOf(ruleMap.get("maxPrize")));

                SeasonClassRule rule = new SeasonClassRule();
                rule.setSeasonId(savedSeason.getId());
                rule.setClassLevel(classLevelName);
                rule.setClassName(classLevelName + " Custom Tier");
                rule.setMinRating(minRating);
                rule.setMaxRating(maxRating);
                rule.setMinPrize(minPrize);
                rule.setMaxPrize(maxPrize);

                seasonClassRuleRepository.save(rule);
            }
        }

        return seasonMapper.toDTO(savedSeason);
    }

    // Đảo ngược trạng thái hoạt động của mùa giải (ACTIVE <-> CLOSED)
    @Transactional
    public String toggleSeasonStatus(Integer id) {
        Season season = seasonRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Season not found"));
        season.setStatus("ACTIVE".equals(season.getStatus()) ? "CLOSED" : "ACTIVE");
        seasonRepository.save(season);
        return season.getStatus();
    }

    // Lấy các quy định phân hạng điểm Rating của mùa giải
    public List<SeasonClassRuleDTO> getSeasonRules(Integer seasonId) {
        return seasonClassRuleRepository.findBySeasonId(seasonId).stream()
                .map(seasonClassRuleMapper::toDTO)
                .collect(Collectors.toList());
    }

    // Ghi nhận lưu các quy định phân hạng điểm Rating của mùa giải
    @Transactional
    public void saveSeasonRules(Integer seasonId, List<SeasonClassRuleDTO> rules) {
        validateSeasonClassRulesHierarchy(rules);
        for (SeasonClassRuleDTO dto : rules) {
            SeasonClassRule rule = seasonClassRuleMapper.toEntity(dto);
            rule.setSeasonId(seasonId);
            seasonClassRuleRepository.save(rule);
        }
    }

    /**
     * Validates that season class rules adhere to business rules:
     * 1) For each class: 0 < minPrize < maxPrize
     * 2) Class 1 minPrize > Class 2 maxPrize
     * 3) Class 2 minPrize > Class 3 maxPrize
     * 4) Class 3 minPrize > Class 4 maxPrize
     * 5) Class 4 minPrize > Class 5 maxPrize
     * 6) Sum of minPrizes for all classes <= $10,000,000 (Race Meeting min budget limit)
     */
    private void validateSeasonClassRulesHierarchy(List<SeasonClassRuleDTO> rules) {
        if (rules == null || rules.isEmpty()) return;

        Map<Integer, SeasonClassRuleDTO> classMap = new HashMap<>();
        BigDecimal totalMinPrizeSum = BigDecimal.ZERO;

        for (SeasonClassRuleDTO rule : rules) {
            if (rule.getClassLevel() == null) continue;
            String level = rule.getClassLevel().trim().toLowerCase();
            int classNum = -1;
            if (level.startsWith("class")) {
                try {
                    classNum = Integer.parseInt(level.replace("class", "").trim());
                } catch (NumberFormatException ignored) {}
            }
            if (classNum < 1 || classNum > 5) continue;

            BigDecimal minPrize = rule.getMinPrize();
            BigDecimal maxPrize = rule.getMaxPrize();

            if (minPrize == null || minPrize.compareTo(BigDecimal.ZERO) <= 0) {
                throw new IllegalArgumentException(String.format("Minimum prize money for %s must be greater than $0.00.", rule.getClassLevel()));
            }
            if (maxPrize == null || maxPrize.compareTo(minPrize) <= 0) {
                throw new IllegalArgumentException(String.format("Maximum prize money ($%,.2f) must be strictly greater than minimum prize money ($%,.2f) for %s.",
                        maxPrize != null ? maxPrize : BigDecimal.ZERO, minPrize, rule.getClassLevel()));
            }

            classMap.put(classNum, rule);
            totalMinPrizeSum = totalMinPrizeSum.add(minPrize);
        }

        // Check non-overlapping hierarchy: Class 1 Min > Class 2 Max > Class 2 Min > Class 3 Max ...
        for (int i = 1; i < 5; i++) {
            SeasonClassRuleDTO higher = classMap.get(i);
            SeasonClassRuleDTO lower = classMap.get(i + 1);
            if (higher != null && lower != null && higher.getMinPrize() != null && lower.getMaxPrize() != null) {
                if (higher.getMinPrize().compareTo(lower.getMaxPrize()) <= 0) {
                    throw new IllegalArgumentException(String.format(
                            "Class %d minimum prize ($%,.2f) must be strictly greater than Class %d maximum prize ($%,.2f). Higher classes must offer higher prizes.",
                            i, higher.getMinPrize(), i + 1, lower.getMaxPrize()));
                }
            }
        }

        // Check against Race Meeting min budget limit ($10,000,000)
        BigDecimal maxAllowedSum = new BigDecimal("10000000.00");
        if (totalMinPrizeSum.compareTo(maxAllowedSum) > 0) {
            throw new IllegalArgumentException(String.format(
                    "Total minimum prizes for all classes ($%,.2f) exceeds the minimum Race Meeting budget limit ($%,.2f).",
                    totalMinPrizeSum, maxAllowedSum));
        }
    }

    // Gia hạn thời gian bắt đầu và kết thúc của mùa giải đua
    @Transactional
    public SeasonDTO extendSeason(Integer id, String newStartDateStr, String newEndDateStr) {
        Season season = seasonRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Season not found"));
        
        // Cập nhật ngày bắt đầu mới nếu được truyền vào hợp lệ
        if (newStartDateStr != null && !newStartDateStr.trim().isEmpty()) {
            java.sql.Date newStartDate = DateTimeParser.parseDate(newStartDateStr);
            season.setStartDate(newStartDate);
        }

        // Cập nhật ngày kết thúc mới nếu được truyền vào hợp lệ
        if (newEndDateStr != null && !newEndDateStr.trim().isEmpty()) {
            java.sql.Date newEndDate = DateTimeParser.parseDate(newEndDateStr);
            season.setEndDate(newEndDate);
        }

        Season saved = seasonRepository.save(season);
        return seasonMapper.toDTO(saved);
    }
}
