package com.horseracing.backend.repository;

import com.horseracing.backend.entity.HorseRaceMeetingRegistration;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface HorseRaceMeetingRegistrationRepository extends JpaRepository<HorseRaceMeetingRegistration, Integer> {

    List<HorseRaceMeetingRegistration> findByRaceMeetingId(Integer raceMeetingId);
    List<HorseRaceMeetingRegistration> findByHorseId(Integer horseId);
    java.util.Optional<HorseRaceMeetingRegistration> findByRaceMeetingIdAndHorseId(Integer raceMeetingId, Integer horseId);

}
