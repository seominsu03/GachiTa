package com.gachita.room;
import com.gachita.common.*;
import java.time.Instant;
public record RoomResponse(Long roomId, Long hostUserId, MemberResponse host, LocationInfo origin, LocationInfo destination,
        Instant departureAt, int capacity, int participantCount, RoomStatus status) {
    public static RoomResponse from(TaxiRoom room) {
        return new RoomResponse(room.getRoomId(), room.getHost().getUserId(), MemberResponse.from(room.getHost()), room.getOrigin(), room.getDestination(), room.getDepartureAt(), room.getCapacity(), room.getParticipantCount(), room.getStatus());
    }
}
