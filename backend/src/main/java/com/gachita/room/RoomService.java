package com.gachita.room;
import com.gachita.common.ApiException;
import com.gachita.participation.ParticipationRepository;
import java.time.Instant;
import com.gachita.user.UserRepository;
import com.gachita.participation.ParticipationStatus;
import java.util.List;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service @Transactional
public class RoomService {
    private final RoomRepository rooms; private final UserRepository users; private final ParticipationRepository members;
    public RoomService(RoomRepository rooms, UserRepository users, ParticipationRepository members) { this.rooms = rooms; this.users = users; this.members = members; }
    public RoomResponse createRoom(Long userId, RoomCreateRequest input) {
        var user = users.findById(userId).orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "UNAUTHENTICATED", "다시 로그인해 주세요."));
        if (input.origin().latitude() == input.destination().latitude() && input.origin().longitude() == input.destination().longitude())
            throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_INPUT", "출발지와 목적지를 다르게 선택해 주세요.");
        return RoomResponse.from(rooms.save(new TaxiRoom(user, input)));
    }
    @Transactional(readOnly = true) public List<RoomResponse> getRooms(String destination) {
        return getRooms("", destination, "ALL");
    }
    @Transactional(readOnly = true) public List<RoomResponse> getRooms(String origin, String destination, String period) {
        var departurePeriod = DeparturePeriod.parse(period);
        return rooms.search(RoomStatus.RECRUITING, Instant.now(), origin.strip(), destination.strip(),
                departurePeriod.startHour(), departurePeriod.endHour(), PageRequest.of(0, 100))
                .stream().map(RoomResponse::from).toList();
    }
    @Transactional(readOnly = true) public List<RoomResponse> getMyRooms(Long userId) {
        return rooms.findMyRooms(userId, RoomStatus.CANCELLED, List.of(ParticipationStatus.PENDING, ParticipationStatus.APPROVED, ParticipationStatus.BOARDING_CONFIRMED), PageRequest.of(0, 100))
                .stream().map(RoomResponse::from).toList();
    }
    @Transactional(readOnly = true) public RoomResponse getRoomById(Long roomId) {
        return RoomResponse.from(rooms.findById(roomId).filter(room -> room.getStatus() != RoomStatus.CANCELLED).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "ROOM_NOT_FOUND", "택시방이 없습니다.")));
    }
    private TaxiRoom lockHostRoom(Long roomId, Long userId) {
        var room = rooms.findLockedById(roomId).filter(value -> value.getStatus() != RoomStatus.CANCELLED)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "ROOM_NOT_FOUND", "택시방이 없습니다."));
        if (!room.getHost().getUserId().equals(userId)) throw new ApiException(HttpStatus.FORBIDDEN, "FORBIDDEN", "방장만 변경할 수 있습니다.");
        if (room.getStatus() != RoomStatus.RECRUITING) throw new ApiException(HttpStatus.CONFLICT, "ROOM_NOT_RECRUITING", "모집 중인 방만 변경하거나 삭제할 수 있습니다.");
        return room;
    }
    public RoomResponse updateRoomCapacity(Long roomId, Long userId, int capacity) {
        var room = lockHostRoom(roomId, userId);
        if (!room.getDepartureAt().isAfter(Instant.now())) throw new ApiException(HttpStatus.CONFLICT, "ROOM_NOT_RECRUITING", "출발 시간이 지난 방의 정원은 변경할 수 없습니다.");
        if (capacity < 2 || capacity > 4) throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_INPUT", "방장 포함 2~4명을 선택해 주세요.");
        if (capacity < room.getParticipantCount()) throw new ApiException(HttpStatus.CONFLICT, "CAPACITY_BELOW_PARTICIPANTS", "확정된 참여 인원보다 적게 설정할 수 없습니다.");
        room.setCapacity(capacity);
        return RoomResponse.from(room);
    }
    public RoomResponse updateLocations(Long roomId, Long userId, RoomLocationsRequest input) {
        var room = lockHostRoom(roomId, userId);
        if (!room.getDepartureAt().isAfter(Instant.now()))
            throw new ApiException(HttpStatus.CONFLICT, "ROOM_NOT_RECRUITING", "출발 시간이 지난 방은 장소를 변경할 수 없습니다.");
        if (room.getParticipantCount() != 1 || members.findByRoomRoomIdOrderByParticipationId(roomId).stream()
                .anyMatch(member -> member.getStatus() == ParticipationStatus.PENDING || member.getStatus() == ParticipationStatus.APPROVED || member.getStatus() == ParticipationStatus.BOARDING_CONFIRMED))
            throw new ApiException(HttpStatus.CONFLICT, "ROOM_HAS_APPLICANTS", "참여자나 대기 신청자가 있으면 장소를 변경할 수 없습니다.");
        if (input.origin().latitude() == input.destination().latitude() && input.origin().longitude() == input.destination().longitude())
            throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_INPUT", "출발지와 목적지를 다르게 선택해 주세요.");
        room.setOrigin(input.origin());
        room.setDestination(input.destination());
        return RoomResponse.from(room);
    }
    public void deleteRoom(Long roomId, Long userId) {
        var room = lockHostRoom(roomId, userId);
        // Logical deletion preserves foreign keys and future B-owned boarding/chat records.
        room.setStatus(RoomStatus.CANCELLED);
        for (var member : members.findByRoomRoomIdOrderByParticipationId(roomId)) {
            if (member.getStatus() == ParticipationStatus.PENDING || member.getStatus() == ParticipationStatus.APPROVED || member.getStatus() == ParticipationStatus.BOARDING_CONFIRMED)
                member.setStatus(ParticipationStatus.CANCELLED);
        }
        room.setParticipantCount(1);
    }
}
