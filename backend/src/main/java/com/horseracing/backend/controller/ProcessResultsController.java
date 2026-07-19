package com.horseracing.backend.controller;

import com.horseracing.backend.dto.ConfirmResultsRequestDTO;
import com.horseracing.backend.service.ProcessResultsService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/results")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
@Tag(name = "Process Results Service", description = "Xác nhận và nhập kết quả trận đua")
public class ProcessResultsController {

    private final ProcessResultsService processResultsService;

    @PostMapping("/confirm")
    @Operation(summary = "Trọng tài nhập kết quả trận đua và báo cáo giám sát", description = "📌 **Code Handler**: `ProcessResultsController.confirmResults()` -> `ProcessResultsService.confirmResults()` | **DTO Request**: `ConfirmResultsRequestDTO`")
    public ResponseEntity<?> confirmResults(@RequestBody ConfirmResultsRequestDTO request) {
        try {
            processResultsService.confirmResults(request.getRaceId(), request.getStewardReport(), request.getResults());
            return ResponseEntity.ok(Map.of("success", true, "message", "Results processed successfully"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }
}
