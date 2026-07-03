package com.horseracing.backend.repository;

import com.horseracing.backend.entity.RaceReferee;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface RaceRefereeRepository extends JpaRepository<RaceReferee, Integer> {

    List<RaceReferee> findByRaceId(Integer raceId);
    List<RaceReferee> findByRefereeId(Integer refereeId);
    void deleteByRaceIdAndRefereeId(Integer raceId, Integer refereeId);

}
