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
    @Query("select r from TaxiRoom r join fetch r.host where r.status = :status and r.departureAt > CURRENT_TIMESTAMP and lower(r.destinationName) like lower(concat('%', :destination, '%')) order by r.departureAt")
    List<TaxiRoom> search(@Param("status") RoomStatus status, @Param("destination") String destination, Pageable pageable);
    @Query("select r from TaxiRoom r join fetch r.host where r.host.userId = :userId or exists (select p.participationId from Participation p where p.room = r and p.user.userId = :userId and p.status in :statuses) order by r.departureAt desc, r.roomId desc")
    List<TaxiRoom> findMyRooms(@Param("userId") Long userId, @Param("statuses") Collection<ParticipationStatus> statuses, Pageable pageable);
}
