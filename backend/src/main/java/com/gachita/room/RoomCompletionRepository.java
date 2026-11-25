package com.gachita.room;

import java.time.Instant;
import java.util.List;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface RoomCompletionRepository extends JpaRepository<RoomCompletion, Long> {
    @Query("select r from TaxiRoom r where r.status = com.gachita.room.RoomStatus.COMPLETED and not exists (select c from RoomCompletion c where c.roomId = r.roomId)")
    List<TaxiRoom> findCompletedWithoutTimestamp(Pageable pageable);

    @Query("select c.roomId from RoomCompletion c, TaxiRoom r where c.roomId = r.roomId and r.status = com.gachita.room.RoomStatus.COMPLETED and c.completedAt <= :cutoff")
    List<Long> findDueRoomIds(@Param("cutoff") Instant cutoff, Pageable pageable);
}
