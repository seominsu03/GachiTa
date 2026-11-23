package com.gachita.taxi;

import com.gachita.boarding.BoardingCheckRepository;
import com.gachita.boarding.BoardingCheckStatus;
import com.gachita.common.ApiException;
import com.gachita.participation.ParticipationRepository;
import com.gachita.participation.ParticipationStatus;
import com.gachita.room.RoomRepository;
import com.gachita.room.RoomStatus;
import com.gachita.room.TaxiRoom;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class TaxiService {
    private final RoomRepository rooms;
    private final ParticipationRepository members;
    private final BoardingCheckRepository checks;

    public TaxiService(RoomRepository rooms, ParticipationRepository members, BoardingCheckRepository checks) {
        this.rooms = rooms;
        this.members = members;
        this.checks = checks;
    }

    private ApiException error(HttpStatus status, String code, String message) {
        return new ApiException(status, code, message);
    }

    private TaxiRoom findRoom(Long roomId, boolean lock) {
        return (lock ? rooms.findLockedById(roomId) : rooms.findById(roomId))
                .filter(room -> room.getStatus() != RoomStatus.CANCELLED)
                .orElseThrow(() -> error(HttpStatus.NOT_FOUND, "ROOM_NOT_FOUND", "택시방이 없습니다."));
    }

    private void requireMember(TaxiRoom room, Long userId) {
        if (room.getHost().getUserId().equals(userId)) return;
        boolean allowed = members.findByRoomRoomIdAndUserUserId(room.getRoomId(), userId)
                .filter(member -> member.getStatus() == ParticipationStatus.BOARDING_CONFIRMED).isPresent();
        if (!allowed) throw error(HttpStatus.FORBIDDEN, "FORBIDDEN", "탑승을 확인한 동승자만 이용 상태를 볼 수 있습니다.");
    }

    @Transactional(readOnly = true)
    public TaxiStatusResponse getStatus(Long roomId, Long userId) {
        var room = findRoom(roomId, false);
        requireMember(room, userId);
        return TaxiStatusResponse.from(room);
    }

    public TaxiStatusResponse advance(Long roomId, Long userId, RoomStatus expectedStatus) {
        var room = findRoom(roomId, true);
        if (!room.getHost().getUserId().equals(userId))
            throw error(HttpStatus.FORBIDDEN, "FORBIDDEN", "방장만 가상 운행을 진행할 수 있습니다.");
        if (room.getStatus() != expectedStatus)
            throw error(HttpStatus.CONFLICT, "TAXI_STAGE_CHANGED", "가상 운행 단계가 이미 변경됐습니다. 새로고침 후 다시 시도해 주세요.");

        RoomStatus next;
        switch (room.getStatus()) {
            case BOARDING_CHECK -> {
                var check = checks.findFirstByRoomRoomIdOrderByBoardingCheckIdDesc(roomId)
                        .orElseThrow(() -> error(HttpStatus.CONFLICT, "BOARDING_NOT_READY", "탑승 확인을 먼저 완료해 주세요."));
                long confirmed = members.findByRoomRoomIdOrderByParticipationId(roomId).stream()
                        .filter(member -> member.getStatus() == ParticipationStatus.BOARDING_CONFIRMED).count();
                if (check.getStatus() != BoardingCheckStatus.COMPLETED || confirmed < 1 ||
                        confirmed + 1 != room.getParticipantCount())
                    throw error(HttpStatus.CONFLICT, "BOARDING_NOT_READY", "모든 동승자의 탑승 확인을 완료해 주세요.");
                next = RoomStatus.TAXI_CALLING;
            }
            case TAXI_CALLING -> next = RoomStatus.TAXI_ASSIGNED;
            case TAXI_ASSIGNED -> next = RoomStatus.IN_RIDE;
            case IN_RIDE -> next = RoomStatus.SETTLING;
            default -> throw error(HttpStatus.CONFLICT, "TAXI_STAGE_INVALID", "현재 상태에서는 가상 운행을 진행할 수 없습니다.");
        }
        room.setStatus(next);
        return TaxiStatusResponse.from(room);
    }
}
