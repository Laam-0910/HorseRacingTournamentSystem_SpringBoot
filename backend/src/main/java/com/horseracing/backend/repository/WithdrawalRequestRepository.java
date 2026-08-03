package com.horseracing.backend.repository;

import com.horseracing.backend.entity.WithdrawalRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface WithdrawalRequestRepository extends JpaRepository<WithdrawalRequest, Integer> {

    /** Lấy tất cả request theo trạng thái, mới nhất trước */
    List<WithdrawalRequest> findByStatusOrderByCreatedAtDesc(String status);

    /** Lấy tất cả request của một user cụ thể, mới nhất trước */
    List<WithdrawalRequest> findByUserIdOrderByCreatedAtDesc(Integer userId);

    /** Lấy tất cả request (mọi trạng thái), mới nhất trước */
    List<WithdrawalRequest> findAllByOrderByCreatedAtDesc();
}
