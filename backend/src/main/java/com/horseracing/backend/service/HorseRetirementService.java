package com.horseracing.backend.service;

import com.horseracing.backend.dto.HorseRetirementRequestDTO;
import com.horseracing.backend.entity.Horse;
import com.horseracing.backend.entity.HorseRetirementRequest;
import com.horseracing.backend.entity.User;
import com.horseracing.backend.repository.HorseRepository;
import com.horseracing.backend.repository.HorseRetirementRequestRepository;
import com.horseracing.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Timestamp;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class HorseRetirementService {

    private final HorseRetirementRequestRepository requestRepository;
    private final HorseRepository horseRepository;
    private final UserRepository userRepository;

    @Transactional
    public HorseRetirementRequestDTO requestRetirement(Integer horseId, Integer ownerId, String reason) {
        Horse horse = horseRepository.findById(horseId)
                .orElseThrow(() -> new IllegalArgumentException("Horse not found"));

        if (!horse.getOwnerId().equals(ownerId)) {
            throw new SecurityException("You do not own this horse");
        }

        if ("RETIRED".equalsIgnoreCase(horse.getStatus())) {
            throw new IllegalArgumentException("Horse is already retired");
        }

        // Check if there's already a pending request
        List<HorseRetirementRequest> pending = requestRepository.findByHorseIdAndStatus(horseId, "PENDING");
        if (!pending.isEmpty()) {
            throw new IllegalArgumentException("A retirement request for this horse is already pending approval");
        }

        HorseRetirementRequest req = HorseRetirementRequest.builder()
                .horseId(horseId)
                .ownerId(ownerId)
                .reason(reason)
                .status("PENDING")
                .createdAt(new Timestamp(System.currentTimeMillis()))
                .build();

        HorseRetirementRequest saved = requestRepository.save(req);
        return mapToDTO(saved);
    }

    @Transactional
    public void approveRequest(Integer requestId, String adminRemarks) {
        HorseRetirementRequest req = requestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Retirement request not found"));

        if (!"PENDING".equals(req.getStatus())) {
            throw new IllegalArgumentException("Request is already processed");
        }

        req.setStatus("APPROVED");
        req.setAdminRemarks(adminRemarks);
        req.setProcessedAt(new Timestamp(System.currentTimeMillis()));
        requestRepository.save(req);

        // Update horse status to RETIRED
        Horse horse = horseRepository.findById(req.getHorseId())
                .orElseThrow(() -> new IllegalArgumentException("Horse not found"));
        horse.setStatus("RETIRED");
        horseRepository.save(horse);
    }

    @Transactional
    public void rejectRequest(Integer requestId, String adminRemarks) {
        HorseRetirementRequest req = requestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Retirement request not found"));

        if (!"PENDING".equals(req.getStatus())) {
            throw new IllegalArgumentException("Request is already processed");
        }

        req.setStatus("REJECTED");
        req.setAdminRemarks(adminRemarks);
        req.setProcessedAt(new Timestamp(System.currentTimeMillis()));
        requestRepository.save(req);
    }

    @Transactional
    public HorseRetirementRequestDTO compulsoryRetire(Integer horseId, String reason) {
        Horse horse = horseRepository.findById(horseId)
                .orElseThrow(() -> new IllegalArgumentException("Horse not found"));

        if ("RETIRED".equalsIgnoreCase(horse.getStatus())) {
            throw new IllegalArgumentException("Horse is already retired");
        }

        // Set status to RETIRED directly
        horse.setStatus("RETIRED");
        horseRepository.save(horse);

        // Create an approved retirement request record for logging/audit purposes
        HorseRetirementRequest req = HorseRetirementRequest.builder()
                .horseId(horseId)
                .ownerId(horse.getOwnerId())
                .reason("[COMPULSORY] " + reason)
                .status("APPROVED")
                .adminRemarks("Enforced by Admin (Compulsory Retirement)")
                .createdAt(new Timestamp(System.currentTimeMillis()))
                .processedAt(new Timestamp(System.currentTimeMillis()))
                .build();

        HorseRetirementRequest saved = requestRepository.save(req);
        return mapToDTO(saved);
    }

    public List<HorseRetirementRequestDTO> getAllRequests() {
        List<HorseRetirementRequest> list = requestRepository.findAll();
        return mapListToDTO(list);
    }

    public List<HorseRetirementRequestDTO> getRequestsByOwner(Integer ownerId) {
        List<HorseRetirementRequest> list = requestRepository.findByOwnerId(ownerId);
        return mapListToDTO(list);
    }

    private List<HorseRetirementRequestDTO> mapListToDTO(List<HorseRetirementRequest> list) {
        Map<Integer, String> horseNames = horseRepository.findAll().stream()
                .collect(Collectors.toMap(Horse::getId, Horse::getName, (a, b) -> a));

        Map<Integer, String> ownerNames = userRepository.findAll().stream()
                .collect(Collectors.toMap(User::getId, User::getUsername, (a, b) -> a));

        return list.stream().map(req -> HorseRetirementRequestDTO.builder()
                .id(req.getId())
                .horseId(req.getHorseId())
                .horseName(horseNames.getOrDefault(req.getHorseId(), "Unknown Horse"))
                .ownerId(req.getOwnerId())
                .ownerName(ownerNames.getOrDefault(req.getOwnerId(), "Unknown Owner"))
                .reason(req.getReason())
                .status(req.getStatus())
                .adminRemarks(req.getAdminRemarks())
                .createdAt(req.getCreatedAt())
                .processedAt(req.getProcessedAt())
                .build()
        ).collect(Collectors.toList());
    }

    private HorseRetirementRequestDTO mapToDTO(HorseRetirementRequest req) {
        String horseName = horseRepository.findById(req.getHorseId()).map(Horse::getName).orElse("Unknown Horse");
        String ownerName = userRepository.findById(req.getOwnerId()).map(User::getUsername).orElse("Unknown Owner");
        return HorseRetirementRequestDTO.builder()
                .id(req.getId())
                .horseId(req.getHorseId())
                .horseName(horseName)
                .ownerId(req.getOwnerId())
                .ownerName(ownerName)
                .reason(req.getReason())
                .status(req.getStatus())
                .adminRemarks(req.getAdminRemarks())
                .createdAt(req.getCreatedAt())
                .processedAt(req.getProcessedAt())
                .build();
    }
}
