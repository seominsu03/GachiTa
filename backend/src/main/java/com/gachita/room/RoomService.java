package com.gachita.room;
import com.gachita.common.ApiException;
import com.gachita.user.UserRepository;
import com.gachita.participation.ParticipationStatus;
import java.util.List;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service @Transactional
public class RoomService {
    private final RoomRepository rooms; private final UserRepository users;
    public RoomService(RoomRepository rooms, UserRepository users) { this.rooms = rooms; this.users = users; }
    public RoomResponse createRoom(Long userId, RoomCreateRequest input) {
        var user = users.findById(userId).orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "UNAUTHENTICATED", "다시 로그인해 주세요."));
        if (input.origin().name().equals(input.destination().name()) || (input.origin().latitude() == input.destination().latitude() && input.origin().longitude() == input.destination().longitude()))
            throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_INPUT", "출발지와 목적지를 다르게 선택해 주세요.");
        return RoomResponse.from(rooms.save(new TaxiRoom(user, input)));
    }
    @Transactional(readOnly = true) public List<RoomResponse> getRooms(String destination) {
        return rooms.search(RoomStatus.RECRUITING, destination.trim(), PageRequest.of(0, 100)).stream().map(RoomResponse::from).toList();
    }
    @Transactional(readOnly = true) public List<RoomResponse> getMyRooms(Long userId) {
        return rooms.findMyRooms(userId, List.of(ParticipationStatus.PENDING, ParticipationStatus.APPROVED, ParticipationStatus.BOARDING_CONFIRMED), PageRequest.of(0, 100))
                .stream().map(RoomResponse::from).toList();
    }
    @Transactional(readOnly = true) public RoomResponse getRoomById(Long roomId) {
        return RoomResponse.from(rooms.findById(roomId).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "ROOM_NOT_FOUND", "택시방이 없습니다.")));
    }
}
