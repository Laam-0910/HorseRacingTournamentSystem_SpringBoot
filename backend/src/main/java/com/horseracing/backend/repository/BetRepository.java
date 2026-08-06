package com.horseracing.backend.repository;

import com.horseracing.backend.entity.Bet;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface BetRepository extends JpaRepository<Bet, Integer> {

    List<Bet> findByRaceId(Integer raceId);
    List<Bet> findByUserId(Integer userId);
    List<Bet> findByUserIdOrderByCreatedAtDesc(Integer userId);
    List<Bet> findByRaceIdAndUserId(Integer raceId, Integer userId);
    List<Bet> findByRaceIdAndStatus(Integer raceId, String status);
}
