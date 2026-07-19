package com.horseracing.backend.controller;

import com.horseracing.backend.dto.SeasonClassRuleDTO;
import com.horseracing.backend.dto.SeasonDTO;
import com.horseracing.backend.service.SeasonService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/seasons")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
@Tag(name = "Season Service", description = "Quản lý Mùa giải đua và Quy định phân hạng (Class Rules)")
public class SeasonController {

    private final SeasonService seasonService;

    @GetMapping
    @Operation(summary = "Lấy danh sách tất cả các Mùa giải", description = "📌 **Code Handler**: `SeasonController.getAllSeasons()` -> `SeasonService.getAllSeasons()`")
    public ResponseEntity<List<SeasonDTO>> getAllSeasons() {
        return ResponseEntity.ok(seasonService.getAllSeasons());
    }

    @GetMapping("/{seasonId}/rules")
    @Operation(summary = "Lấy danh sách quy định phân hạng của Mùa giải", description = "📌 **Code Handler**: `SeasonController.getSeasonRules()` -> `SeasonService.getSeasonRules()`")
    public ResponseEntity<List<SeasonClassRuleDTO>> getSeasonRules(@PathVariable Integer seasonId) {
        return ResponseEntity.ok(seasonService.getSeasonRules(seasonId));
    }
}
