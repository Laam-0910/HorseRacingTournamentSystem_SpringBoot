package com.horseracing.backend.repository;

import com.horseracing.backend.entity.LivestreamSubscription;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LivestreamSubscriptionRepository extends JpaRepository<LivestreamSubscription, Integer> {
    List<LivestreamSubscription> findByUserId(Integer userId);
    List<LivestreamSubscription> findByUserIdAndSeasonId(Integer userId, Integer seasonId);
    List<LivestreamSubscription> findByUserIdAndRaceMeetingId(Integer userId, Integer raceMeetingId);
}
