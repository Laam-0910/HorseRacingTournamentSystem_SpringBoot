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

    // Chủ sở hữu gửi yêu cầu xin giải nghệ cho chiến mã
    @Transactional
    public HorseRetirementRequestDTO requestRetirement(Integer horseId, Integer ownerId, String reason) {
        // Tìm thông tin chiến mã trong CSDL
        Horse horse = horseRepository.findById(horseId)
                .orElseThrow(() -> new IllegalArgumentException("Horse not found"));

        // Kiểm tra quyền sở hữu của người dùng gửi yêu cầu
        if (!horse.getOwnerId().equals(ownerId)) {
            throw new SecurityException("You do not own this horse");
        }

        // Kiểm tra nếu con ngựa đã giải nghệ trước đó
        if ("RETIRED".equalsIgnoreCase(horse.getStatus())) {
            throw new IllegalArgumentException("Horse is already retired");
        }

        // Kiểm tra xem đã có yêu cầu xin giải nghệ đang chờ duyệt (PENDING) cho con ngựa này chưa
        List<HorseRetirementRequest> pending = requestRepository.findByHorseIdAndStatus(horseId, "PENDING");
        if (!pending.isEmpty()) {
            throw new IllegalArgumentException("A retirement request for this horse is already pending approval");
        }

        // Khởi tạo đối tượng yêu cầu giải nghệ mới
        HorseRetirementRequest req = HorseRetirementRequest.builder()
                .horseId(horseId)
                .ownerId(ownerId)
                .reason(reason)
                .status("PENDING")
                .createdAt(new Timestamp(System.currentTimeMillis()))
                .build();

        // Lưu đơn giải nghệ vào CSDL và chuyển đổi sang DTO trả về
        HorseRetirementRequest saved = requestRepository.save(req);
        return mapToDTO(saved);
    }

    // Admin phê duyệt yêu cầu giải nghệ chiến mã
    @Transactional
    public void approveRequest(Integer requestId, String adminRemarks) {
        // Tìm đơn giải nghệ theo mã ID
        HorseRetirementRequest req = requestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Retirement request not found"));

        // Kiểm tra đơn phải ở trạng thái PENDING
        if (!"PENDING".equals(req.getStatus())) {
            throw new IllegalArgumentException("Request is already processed");
        }

        req.setStatus("APPROVED"); // Cập nhật trạng thái đơn thành APPROVED
        req.setAdminRemarks(adminRemarks); // Thêm ghi chú của Admin
        req.setProcessedAt(new Timestamp(System.currentTimeMillis())); // Lưu mốc thời gian xử lý
        requestRepository.save(req); // Lưu đơn vào DB

        // Cập nhật trạng thái của chiến mã thành RETIRED
        Horse horse = horseRepository.findById(req.getHorseId())
                .orElseThrow(() -> new IllegalArgumentException("Horse not found"));
        horse.setStatus("RETIRED"); // Chuyển trạng thái con ngựa sang RETIRED
        horseRepository.save(horse); // Lưu chiến mã vào DB
    }

    // Admin từ chối yêu cầu giải nghệ chiến mã
    @Transactional
    public void rejectRequest(Integer requestId, String adminRemarks) {
        // Tìm đơn giải nghệ theo mã ID
        HorseRetirementRequest req = requestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Retirement request not found"));

        // Kiểm tra đơn phải ở trạng thái PENDING
        if (!"PENDING".equals(req.getStatus())) {
            throw new IllegalArgumentException("Request is already processed");
        }

        req.setStatus("REJECTED"); // Cập nhật trạng thái đơn thành REJECTED
        req.setAdminRemarks(adminRemarks); // Thêm ghi chú lý do từ chối của Admin
        req.setProcessedAt(new Timestamp(System.currentTimeMillis())); // Lưu mốc thời gian xử lý
        requestRepository.save(req); // Lưu đơn vào DB
    }

    // Admin cưỡng chế buộc giải nghệ đối với chiến mã (Compulsory Retirement)
    @Transactional
    public HorseRetirementRequestDTO compulsoryRetire(Integer horseId, String reason) {
        // Tìm chiến mã trong CSDL
        Horse horse = horseRepository.findById(horseId)
                .orElseThrow(() -> new IllegalArgumentException("Horse not found"));

        // Kiểm tra nếu chiến mã đã giải nghệ từ trước
        if ("RETIRED".equalsIgnoreCase(horse.getStatus())) {
            throw new IllegalArgumentException("Horse is already retired");
        }

        // Đổi trạng thái trực tiếp của chiến mã sang RETIRED
        horse.setStatus("RETIRED");
        horseRepository.save(horse);

        // Tạo bản ghi nhật ký yêu cầu giải nghệ cưỡng chế đã phê duyệt để lưu vết
        HorseRetirementRequest req = HorseRetirementRequest.builder()
                .horseId(horseId)
                .ownerId(horse.getOwnerId())
                .reason("[COMPULSORY] " + reason)
                .status("APPROVED")
                .adminRemarks("Enforced by Admin (Compulsory Retirement)")
                .createdAt(new Timestamp(System.currentTimeMillis()))
                .processedAt(new Timestamp(System.currentTimeMillis()))
                .build();

        // Lưu bản ghi vào CSDL và trả về DTO
        HorseRetirementRequest saved = requestRepository.save(req);
        return mapToDTO(saved);
    }

    // Lấy toàn bộ danh sách các yêu cầu giải nghệ
    public List<HorseRetirementRequestDTO> getAllRequests() {
        List<HorseRetirementRequest> list = requestRepository.findAll();
        return mapListToDTO(list);
    }

    // Lấy danh sách các yêu cầu giải nghệ theo Chủ sở hữu
    public List<HorseRetirementRequestDTO> getRequestsByOwner(Integer ownerId) {
        List<HorseRetirementRequest> list = requestRepository.findByOwnerId(ownerId);
        return mapListToDTO(list);
    }

    // Tiện ích ánh xạ danh sách thực thể sang DTO kèm thông tin Tên Ngựa và Tên Chủ sở hữu
    private List<HorseRetirementRequestDTO> mapListToDTO(List<HorseRetirementRequest> list) {
        // Tạo Map tên ngựa để tra cứu nhanh
        Map<Integer, String> horseNames = horseRepository.findAll().stream()
                .collect(Collectors.toMap(Horse::getId, Horse::getName, (a, b) -> a));

        // Tạo Map tên chủ sở hữu để tra cứu nhanh
        Map<Integer, String> ownerNames = userRepository.findAll().stream()
                .collect(Collectors.toMap(User::getId, User::getUsername, (a, b) -> a));

        // Ánh xạ từng bản ghi sang DTO
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

    // Tiện ích ánh xạ đơn lẻ thực thể sang DTO
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
