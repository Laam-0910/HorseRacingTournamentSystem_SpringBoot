package com.horseracing.backend.repository;

import com.horseracing.backend.entity.Horse;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface HorseRepository extends JpaRepository<Horse, Integer> {

    List<Horse> findByStatus(String status);
    List<Horse> findByOwnerId(Integer ownerId);

}
