package com.horseracing.backend.repository;

import com.horseracing.backend.entity.Violation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface ViolationRepository extends JpaRepository<Violation, Integer> {

    List<Violation> findByRaceId(Integer raceId);
    List<Violation> findByJockeyId(Integer jockeyId);
    List<Violation> findByHorseId(Integer horseId);

}
