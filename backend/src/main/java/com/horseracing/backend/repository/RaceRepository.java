package com.horseracing.backend.repository;

import com.horseracing.backend.entity.Race;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface RaceRepository extends JpaRepository<Race, Integer> {

    List<Race> findByRaceMeetingId(Integer raceMeetingId);
    List<Race> findByStatus(String status);

}
