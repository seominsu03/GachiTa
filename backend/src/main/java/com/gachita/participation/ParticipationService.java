package com.gachita.participation;
import com.gachita.common.ApiException;
import com.gachita.boarding.BoardingService;
import com.gachita.room.*;
import com.gachita.user.UserRepository;
import java.time.Instant;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service @Transactional
public class ParticipationService {
    private final RoomRepository rooms; private final UserRepository users; private final ParticipationRepository members; private final BoardingService boarding;
    public ParticipationService(RoomRepository rooms, UserRepository users, ParticipationRepository members, BoardingService boarding) { this.rooms = rooms; this.users = users; this.members = members; this.boarding = boarding; }
    private ApiException error(HttpStatus status, String code, String message) { return new ApiException(status, code, message); }
    private TaxiRoom lock(Long roomId) { return rooms.findLockedById(roomId).orElseThrow(() -> error(HttpStatus.NOT_FOUND, "ROOM_NOT_FOUND", "택시방이 없습니다.")); }
    private void recruiting(TaxiRoom room) {
        if (room.getStatus() != RoomStatus.RECRUITING || !room.getDepartureAt().isAfter(Instant.now())) throw error(HttpStatus.CONFLICT, "ROOM_NOT_RECRUITING", "현재 모집 중인 방이 아닙니다.");
    }
    public ParticipationResponse requestParticipation(Long roomId, Long userId) {
        var room = lock(roomId); recruiting(room);
        if (room.getHost().getUserId().equals(userId)) throw error(HttpStatus.CONFLICT, "HOST_ALREADY_JOINED", "방장은 이미 참여 중입니다.");
        if (room.getParticipantCount() >= room.getCapacity()) throw error(HttpStatus.CONFLICT, "ROOM_FULL", "모집 인원이 가득 찼습니다.");
        var member = members.findByRoomRoomIdAndUserUserId(roomId, userId).orElse(null);
        if (member != null && member.getStatus() != ParticipationStatus.CANCELLED && member.getStatus() != ParticipationStatus.REJECTED) throw error(HttpStatus.CONFLICT, "PARTICIPATION_EXISTS", "이미 신청했거나 이 방에 다시 참여할 수 없습니다.");
        if (member == null) member = new Participation(room, users.findById(userId).orElseThrow(() -> error(HttpStatus.UNAUTHORIZED, "UNAUTHENTICATED", "다시 로그인해 주세요.")));
        member.setStatus(ParticipationStatus.PENDING); return ParticipationResponse.from(members.save(member));
    }
    @Transactional(readOnly = true) public List<ParticipationResponse> getParticipations(Long roomId, Long userId) {
        var room = rooms.findById(roomId).filter(value -> value.getStatus() != RoomStatus.CANCELLED).orElseThrow(() -> error(HttpStatus.NOT_FOUND, "ROOM_NOT_FOUND", "택시방이 없습니다."));
        return members.findByRoomRoomIdOrderByParticipationId(roomId).stream()
                .filter(member -> room.getHost().getUserId().equals(userId) || member.getUser().getUserId().equals(userId) || member.getStatus() == ParticipationStatus.APPROVED || member.getStatus() == ParticipationStatus.BOARDING_CONFIRMED)
                .map(ParticipationResponse::from).toList();
    }
    public ParticipationResponse change(Long roomId, Long participationId, Long userId, ParticipationStatus target) {
        var room = lock(roomId);
        var member = members.findById(participationId).filter(value -> value.getRoom().getRoomId().equals(roomId)).orElseThrow(() -> error(HttpStatus.NOT_FOUND, "PARTICIPATION_NOT_FOUND", "신청 내역이 없습니다."));
        if (target == ParticipationStatus.CANCELLED) {
            if (!member.getUser().getUserId().equals(userId)) throw error(HttpStatus.FORBIDDEN, "FORBIDDEN", "본인의 신청만 취소할 수 있습니다.");
            if ((room.getStatus() != RoomStatus.RECRUITING && room.getStatus() != RoomStatus.BOARDING_CHECK) || (member.getStatus() != ParticipationStatus.PENDING && member.getStatus() != ParticipationStatus.APPROVED)) throw error(HttpStatus.CONFLICT, "CANCEL_NOT_ALLOWED", "탑승 수락 전의 신청만 취소할 수 있습니다.");
            if (member.getStatus() == ParticipationStatus.APPROVED) {
                room.setParticipantCount(room.getParticipantCount() - 1);
                boarding.markCancelled(roomId, userId);
            }
        } else {
            if (!room.getHost().getUserId().equals(userId)) throw error(HttpStatus.FORBIDDEN, "FORBIDDEN", "방장만 처리할 수 있습니다.");
            recruiting(room);
            if (member.getStatus() != ParticipationStatus.PENDING) throw error(HttpStatus.CONFLICT, "ALREADY_PROCESSED", "이미 처리된 신청입니다.");
            if (target == ParticipationStatus.APPROVED) {
                if (room.getParticipantCount() >= room.getCapacity()) throw error(HttpStatus.CONFLICT, "ROOM_FULL", "모집 인원이 가득 찼습니다.");
                room.setParticipantCount(room.getParticipantCount() + 1);
            }
        }
        member.setStatus(target); return ParticipationResponse.from(member);
    }
}
