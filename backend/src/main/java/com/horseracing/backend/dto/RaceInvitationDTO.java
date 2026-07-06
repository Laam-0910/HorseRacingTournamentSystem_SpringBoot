package com.horseracing.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RaceInvitationDTO {
    private Integer id;
    private Integer raceId;
    private Integer horseId;
    private String horseName;       // Tên chiến mã bổ trợ
    private Integer ownerId;
    private String ownerName;       // Tên chủ ngựa bổ trợ
    private Integer jockeyId;
    private String jockeyName;      // Tên nài ngựa bổ trợ
    private String status;          // PENDING, ACCEPTED, REJECTED, EXPIRED
    private String meetingName;     // Tên ngày hội đua bổ trợ
    private String startTime;       // Thời gian bắt đầu trận đấu bổ trợ
    private String classLevel;      // Hạng đấu bổ trợ
    private String venue;           // Địa điểm thi đấu bổ trợ
    private Integer entryId;        // ID của đăng ký đua tương ứng
    private String entryStatus;     // Trạng thái của đăng ký đua tương ứng
}
