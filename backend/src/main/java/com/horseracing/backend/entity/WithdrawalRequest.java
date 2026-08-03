package com.horseracing.backend.entity;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import jakarta.persistence.*;
import java.io.Serializable;
import java.math.BigDecimal;
import java.sql.Timestamp;

/**
 * Entity WithdrawalRequest - Lưu trữ các yêu cầu rút tiền của người dùng.
 * Thay thế cơ chế trừ ví ngay lập tức bằng flow:
 * User tạo request (PENDING) → Admin duyệt + chuyển khoản thật → Hệ thống xác nhận trừ ví (PROCESSED)
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "WithdrawalRequest")
public class WithdrawalRequest implements Serializable {

    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Integer id;

    /** ID người dùng yêu cầu rút tiền */
    @Column(name = "user_id", nullable = false)
    private Integer userId;

    /** Số tiền muốn rút (VNĐ) */
    @Column(name = "amount", nullable = false, precision = 18, scale = 2)
    private BigDecimal amount;

    /** Tên ngân hàng nhận tiền */
    @Column(name = "bank_name")
    private String bankName;

    /** Số tài khoản ngân hàng nhận tiền */
    @Column(name = "account_number")
    private String accountNumber;

    /** Tên chủ tài khoản ngân hàng */
    @Column(name = "account_holder")
    private String accountHolder;

    /** Ghi chú bổ sung của người dùng */
    @Column(name = "notes")
    private String notes;

    /**
     * Trạng thái xử lý:
     * PENDING   — Đang chờ Admin duyệt và chuyển khoản
     * PROCESSED — Admin đã chuyển khoản thật và đã trừ ví người dùng
     * REJECTED  — Admin từ chối (tiền không bị trừ)
     */
    @Column(name = "status", nullable = false)
    private String status; // PENDING | PROCESSED | REJECTED

    /** Ghi chú từ Admin khi xử lý (lý do duyệt hoặc từ chối) */
    @Column(name = "processed_note")
    private String processedNote;

    /** ID của Admin đã xử lý request */
    @Column(name = "processed_by")
    private Integer processedBy;

    /** Thời điểm tạo request */
    @Column(name = "created_at")
    private Timestamp createdAt;

    /** Thời điểm Admin xử lý request */
    @Column(name = "processed_at")
    private Timestamp processedAt;
}
