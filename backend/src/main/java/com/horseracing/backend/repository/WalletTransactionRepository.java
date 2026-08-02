package com.horseracing.backend.repository;

import com.horseracing.backend.entity.WalletTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface WalletTransactionRepository extends JpaRepository<WalletTransaction, Integer> {
    List<WalletTransaction> findByUserId(Integer userId);
    List<WalletTransaction> findByUserIdOrderByCreatedAtDesc(Integer userId);
    List<WalletTransaction> findByRaceMeetingIdOrderByIdDesc(Integer raceMeetingId);
}
