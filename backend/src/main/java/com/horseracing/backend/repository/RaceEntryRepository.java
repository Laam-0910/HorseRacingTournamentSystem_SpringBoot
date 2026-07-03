package com.horseracing.backend.repository;

import com.horseracing.backend.entity.RaceEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface RaceEntryRepository extends JpaRepository<RaceEntry, Integer> {

    List<RaceEntry> findByRaceId(Integer raceId);
    List<RaceEntry> findByJockeyId(Integer jockeyId);
    List<RaceEntry> findByHorseId(Integer horseId);
    List<RaceEntry> findByStatus(String status);
    java.util.Optional<RaceEntry> findByHorseIdAndRaceId(Integer horseId, Integer raceId);

}
