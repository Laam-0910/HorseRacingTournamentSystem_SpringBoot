package com.horseracing.backend.repository;

import com.horseracing.backend.entity.RaceInvitation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface RaceInvitationRepository extends JpaRepository<RaceInvitation, Integer> {

    List<RaceInvitation> findByJockeyId(Integer jockeyId);
    List<RaceInvitation> findByOwnerId(Integer ownerId);
    List<RaceInvitation> findByRaceId(Integer raceId);
    List<RaceInvitation> findByJockeyIdAndRaceIdAndHorseId(Integer jockeyId, Integer raceId, Integer horseId);
    List<RaceInvitation> findByJockeyIdAndRaceIdAndStatus(Integer jockeyId, Integer raceId, String status);
    List<RaceInvitation> findByStatus(String status);
}
