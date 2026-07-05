package com.horseracing.backend.repository;

import com.horseracing.backend.entity.HorseRetirementRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface HorseRetirementRequestRepository extends JpaRepository<HorseRetirementRequest, Integer> {
    List<HorseRetirementRequest> findByOwnerId(Integer ownerId);
    List<HorseRetirementRequest> findByStatus(String status);
    List<HorseRetirementRequest> findByHorseIdAndStatus(Integer horseId, String status);
}
