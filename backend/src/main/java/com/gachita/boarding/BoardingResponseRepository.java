package com.gachita.boarding;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BoardingResponseRepository extends JpaRepository<BoardingResponse, Long> {
    List<BoardingResponse> findByBoardingCheckBoardingCheckIdOrderByBoardingResponseId(Long boardingCheckId);
    Optional<BoardingResponse> findByBoardingCheckBoardingCheckIdAndUserUserId(Long boardingCheckId, Long userId);
}
