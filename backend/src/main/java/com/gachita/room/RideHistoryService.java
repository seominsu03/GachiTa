package com.gachita.room;

import com.gachita.common.ApiException;
import com.gachita.participation.ParticipationRepository;
import com.gachita.participation.ParticipationStatus;
import com.gachita.settlement.SettlementRepository;
import com.gachita.settlement.SettlementResponse;
import com.gachita.user.UserRepository;
import java.util.List;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service @Transactional
public class RideHistoryService {
    private static final List<ParticipationStatus> RIDER_STATUSES = List.of(ParticipationStatus.APPROVED, ParticipationStatus.BOARDING_CONFIRMED);
    private static final List<ParticipationStatus> LIST_STATUSES = List.of(ParticipationStatus.PENDING, ParticipationStatus.APPROVED, ParticipationStatus.BOARDING_CONFIRMED);
    private final RoomRepository rooms; private final ParticipationRepository members; private final UserRepository users;
    private final RideHistoryHideRepository hides; private final RoomCompletionRepository completions; private final SettlementRepository settlements;
    public RideHistoryService(RoomRepository rooms, ParticipationRepository members, UserRepository users, RideHistoryHideRepository hides,
                              RoomCompletionRepository completions, SettlementRepository settlements) {
        this.rooms = rooms; this.members = members; this.users = users; this.hides = hides; this.completions = completions; this.settlements = settlements;
    }
    private boolean isRider(TaxiRoom room, Long userId) {
        if (room.getHost().getUserId().equals(userId)) return true;
        return members.findByRoomRoomIdAndUserUserId(room.getRoomId(), userId)
                .map(member -> RIDER_STATUSES.contains(member.getStatus())).orElse(false);
    }
    private RoomResponse response(TaxiRoom room) {
        var original = RoomResponse.from(room);
        if (room.getStatus() != RoomStatus.CANCELLED) return original;
        return new RoomResponse(original.roomId(), original.hostUserId(), original.host(), original.origin(), original.destination(),
                original.departureAt(), original.capacity(), original.participantCount(), RoomStatus.COMPLETED);
    }
    @Transactional(readOnly = true) public List<RideHistoryResponse> list(Long userId) {
        return rooms.findMyRideHistory(userId, LIST_STATUSES, RIDER_STATUSES, PageRequest.of(0, 100)).stream()
                .map(room -> new RideHistoryResponse(response(room), room.getStatus() == RoomStatus.CANCELLED,
                        completions.findById(room.getRoomId()).map(RoomCompletion::getCompletedAt).orElse(null), null)).toList();
    }
    @Transactional(readOnly = true) public RideHistoryResponse get(Long roomId, Long userId) {
        var room = rooms.findById(roomId).orElseThrow(() -> notFound());
        var completion = completions.findById(roomId);
        if ((room.getStatus() != RoomStatus.COMPLETED && !(room.getStatus() == RoomStatus.CANCELLED && completion.isPresent()))
                || !isRider(room, userId) || hides.existsByRoomRoomIdAndUserUserId(roomId, userId)) throw notFound();
        return new RideHistoryResponse(response(room), room.getStatus() == RoomStatus.CANCELLED,
                completion.map(RoomCompletion::getCompletedAt).orElse(null),
                settlements.findByRoomRoomId(roomId).map(SettlementResponse::from).orElse(null));
    }
    public void hide(Long roomId, Long userId) {
        var room = rooms.findById(roomId).orElseThrow(() -> notFound());
        if ((room.getStatus() != RoomStatus.COMPLETED && !(room.getStatus() == RoomStatus.CANCELLED && completions.existsById(roomId)))
                || !isRider(room, userId)) throw notFound();
        if (!hides.existsByRoomRoomIdAndUserUserId(roomId, userId))
            hides.save(new RideHistoryHide(room, users.getReferenceById(userId)));
    }
    private ApiException notFound() { return new ApiException(HttpStatus.NOT_FOUND, "HISTORY_NOT_FOUND", "동승 이력이 없습니다."); }
}
