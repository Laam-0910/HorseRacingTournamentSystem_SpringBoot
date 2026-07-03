package com.horseracing.backend.mapper;

import com.horseracing.backend.dto.SeasonClassRuleDTO;
import com.horseracing.backend.entity.SeasonClassRule;
import org.springframework.stereotype.Component;

@Component
public class SeasonClassRuleMapper {

    public SeasonClassRuleDTO toDTO(SeasonClassRule rule) {
        if (rule == null) {
            return null;
        }
        return SeasonClassRuleDTO.builder()
                .id(rule.getId())
                .seasonId(rule.getSeasonId())
                .classLevel(rule.getClassLevel())
                .className(rule.getClassName())
                .minRating(rule.getMinRating())
                .maxRating(rule.getMaxRating())
                .minPrize(rule.getMinPrize())
                .maxPrize(rule.getMaxPrize())
                .build();
    }

    public SeasonClassRule toEntity(SeasonClassRuleDTO dto) {
        if (dto == null) {
            return null;
        }
        SeasonClassRule rule = new SeasonClassRule();
        rule.setId(dto.getId());
        rule.setSeasonId(dto.getSeasonId());
        rule.setClassLevel(dto.getClassLevel());
        rule.setClassName(dto.getClassName());
        rule.setMinRating(dto.getMinRating());
        rule.setMaxRating(dto.getMaxRating());
        rule.setMinPrize(dto.getMinPrize());
        rule.setMaxPrize(dto.getMaxPrize());
        return rule;
    }
}
