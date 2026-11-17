package com.gachita.boarding;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BoardingCheckRepository extends JpaRepository<BoardingCheck, Long> {
    Optional<BoardingCheck> findFirstByRoomRoomIdOrderByBoardingCheckIdDesc(Long roomId);
    List<BoardingCheck> findByStatusAndExpiresAtLessThanEqual(BoardingCheckStatus status, Instant now);
}
