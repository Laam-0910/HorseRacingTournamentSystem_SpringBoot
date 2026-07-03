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
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

import com.horseracing.backend.utils.DateTimeParser;

@Service
@RequiredArgsConstructor
public class SeasonService {

    private final SeasonRepository seasonRepository;
    private final SeasonClassRuleRepository seasonClassRuleRepository;
    private final SeasonMapper seasonMapper;
    private final SeasonClassRuleMapper seasonClassRuleMapper;

    public List<SeasonDTO> getAllSeasons() {
        return seasonRepository.findAll().stream()
                .map(seasonMapper::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public SeasonDTO createSeason(Map<String, Object> body) {
        String name = (String) body.get("name");
        String startStr = (String) body.get("startDate");
        String endStr = (String) body.get("endDate");

        java.sql.Date startDate = DateTimeParser.parseDate(startStr);
        java.sql.Date endDate = DateTimeParser.parseDate(endStr);
        String classRuleMethod = (String) body.get("classRuleMethod");

        Season season = new Season();
        season.setName(name);
        season.setStartDate(startDate);
        season.setEndDate(endDate);
        season.setStatus("ACTIVE");
        Season savedSeason = seasonRepository.save(season);

        if ("AUTOMATIC".equals(classRuleMethod)) {
            // Thiết lập mặc định tự động cho Class 1 - Class 5
            SeasonClassRule class1 = new SeasonClassRule(null, savedSeason.getId(), "Class 1", "Elite Championship", 95, null, new BigDecimal("300000"), new BigDecimal("1000000"));
            SeasonClassRule class2 = new SeasonClassRule(null, savedSeason.getId(), "Class 2", "Premium Group", 80, 94, new BigDecimal("200000"), new BigDecimal("299999"));
            SeasonClassRule class3 = new SeasonClassRule(null, savedSeason.getId(), "Class 3", "Advanced Tier", 60, 79, new BigDecimal("100000"), new BigDecimal("199999"));
            SeasonClassRule class4 = new SeasonClassRule(null, savedSeason.getId(), "Class 4", "Intermediate Level", 40, 59, new BigDecimal("50000"), new BigDecimal("99999"));
            SeasonClassRule class5 = new SeasonClassRule(null, savedSeason.getId(), "Class 5", "Entry Division", 0, 39, new BigDecimal("20000"), new BigDecimal("49999"));

            seasonClassRuleRepository.saveAll(List.of(class1, class2, class3, class4, class5));
        } else if (body.get("manualClasses") != null) {
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

    @Transactional
    public String toggleSeasonStatus(Integer id) {
        Season season = seasonRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Season not found"));
        season.setStatus("ACTIVE".equals(season.getStatus()) ? "CLOSED" : "ACTIVE");
        seasonRepository.save(season);
        return season.getStatus();
    }

    public List<SeasonClassRuleDTO> getSeasonRules(Integer seasonId) {
        return seasonClassRuleRepository.findBySeasonId(seasonId).stream()
                .map(seasonClassRuleMapper::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public void saveSeasonRules(Integer seasonId, List<SeasonClassRuleDTO> rules) {
        for (SeasonClassRuleDTO dto : rules) {
            SeasonClassRule rule = seasonClassRuleMapper.toEntity(dto);
            rule.setSeasonId(seasonId);
            seasonClassRuleRepository.save(rule);
        }
    }

    @Transactional
    public SeasonDTO extendSeason(Integer id, String newStartDateStr, String newEndDateStr) {
        Season season = seasonRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Season not found"));
        
        if (newStartDateStr != null && !newStartDateStr.trim().isEmpty()) {
            java.sql.Date newStartDate = DateTimeParser.parseDate(newStartDateStr);
            season.setStartDate(newStartDate);
        }

        if (newEndDateStr != null && !newEndDateStr.trim().isEmpty()) {
            java.sql.Date newEndDate = DateTimeParser.parseDate(newEndDateStr);
            season.setEndDate(newEndDate);
        }

        Season saved = seasonRepository.save(season);
        return seasonMapper.toDTO(saved);
    }
}
