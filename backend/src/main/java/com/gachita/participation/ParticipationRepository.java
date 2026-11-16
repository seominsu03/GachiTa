package com.gachita.participation;
import java.util.*;
import org.springframework.data.jpa.repository.JpaRepository;
public interface ParticipationRepository extends JpaRepository<Participation, Long> {
    List<Participation> findByRoomRoomIdOrderByParticipationId(Long roomId);
    Optional<Participation> findByRoomRoomIdAndUserUserId(Long roomId, Long userId);
}
