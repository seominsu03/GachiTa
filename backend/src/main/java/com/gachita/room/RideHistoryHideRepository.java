package com.gachita.room;

import org.springframework.data.jpa.repository.JpaRepository;

public interface RideHistoryHideRepository extends JpaRepository<RideHistoryHide, Long> {
    boolean existsByRoomRoomIdAndUserUserId(Long roomId, Long userId);
}
