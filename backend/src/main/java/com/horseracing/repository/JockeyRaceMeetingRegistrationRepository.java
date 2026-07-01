package com.horseracing.backend.repository;

import com.horseracing.backend.entity.JockeyRaceMeetingRegistration;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface JockeyRaceMeetingRegistrationRepository extends JpaRepository<JockeyRaceMeetingRegistration, Integer> {

    List<JockeyRaceMeetingRegistration> findByRaceMeetingId(Integer raceMeetingId);
    List<JockeyRaceMeetingRegistration> findByJockeyId(Integer jockeyId);
    java.util.Optional<JockeyRaceMeetingRegistration> findByRaceMeetingIdAndJockeyId(Integer raceMeetingId, Integer jockeyId);

}
