package com.gachita.room;
import jakarta.persistence.LockModeType;
import com.gachita.participation.ParticipationStatus;
import java.util.*;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
public interface RoomRepository extends JpaRepository<TaxiRoom, Long> {
    @Lock(LockModeType.PESSIMISTIC_WRITE) @Query("select r from TaxiRoom r where r.roomId = :roomId")
    Optional<TaxiRoom> findLockedById(@Param("roomId") Long roomId);
    // departure_at is stored in UTC. Convert its hour to Asia/Seoul before filtering.
    // Every predicate is applied in SQL BEFORE Pageable limits the result to 100 rows.
    @Query("""
            select r from TaxiRoom r join fetch r.host
            where r.status = :status and r.departureAt > CURRENT_TIMESTAMP
              and locate(lower(:origin), lower(r.originName)) > 0
              and locate(lower(:destination), lower(r.destinationName)) > 0
              and mod(hour(r.departureAt) + 9, 24) >= :startHour
              and mod(hour(r.departureAt) + 9, 24) < :endHour
            order by r.departureAt, r.roomId
            """)
    List<TaxiRoom> search(@Param("status") RoomStatus status, @Param("origin") String origin,
                         @Param("destination") String destination, @Param("startHour") int startHour,
                         @Param("endHour") int endHour, Pageable pageable);
    @Query("select r from TaxiRoom r join fetch r.host where r.status <> :excludedStatus and (r.host.userId = :userId or exists (select p.participationId from Participation p where p.room = r and p.user.userId = :userId and p.status in :statuses)) order by r.departureAt desc, r.roomId desc")
    List<TaxiRoom> findMyRooms(@Param("userId") Long userId, @Param("excludedStatus") RoomStatus excludedStatus, @Param("statuses") Collection<ParticipationStatus> statuses, Pageable pageable);
}
