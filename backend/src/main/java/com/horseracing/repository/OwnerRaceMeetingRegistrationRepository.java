package com.horseracing.backend.repository;

import com.horseracing.backend.entity.OwnerRaceMeetingRegistration;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface OwnerRaceMeetingRegistrationRepository extends JpaRepository<OwnerRaceMeetingRegistration, Integer> {

    List<OwnerRaceMeetingRegistration> findByRaceMeetingId(Integer raceMeetingId);
    List<OwnerRaceMeetingRegistration> findByOwnerId(Integer ownerId);
    java.util.Optional<OwnerRaceMeetingRegistration> findByRaceMeetingIdAndOwnerId(Integer raceMeetingId, Integer ownerId);

}
