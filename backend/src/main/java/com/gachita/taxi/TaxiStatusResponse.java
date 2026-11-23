package com.gachita.taxi;

import com.gachita.room.RoomStatus;
import com.gachita.room.TaxiRoom;

public record TaxiStatusResponse(Long roomId, RoomStatus status, int participantCount) {
    static TaxiStatusResponse from(TaxiRoom room) {
        return new TaxiStatusResponse(room.getRoomId(), room.getStatus(), room.getParticipantCount());
    }
}
