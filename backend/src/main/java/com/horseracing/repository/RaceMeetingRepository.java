package com.horseracing.backend.repository;

import com.horseracing.backend.entity.RaceMeeting;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface RaceMeetingRepository extends JpaRepository<RaceMeeting, Integer> {

    List<RaceMeeting> findBySeasonId(Integer seasonId);

}
