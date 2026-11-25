package com.gachita.room;

import jakarta.persistence.*;
import java.time.Instant;
import java.time.temporal.ChronoUnit;

@Entity @Table(name = "room_completions")
public class RoomCompletion {
    @Id @Column(name = "room_id") private Long roomId;
    @Column(name = "completed_at", nullable = false) private Instant completedAt;

    protected RoomCompletion() {}
    public RoomCompletion(TaxiRoom room, Instant completedAt) {
        this.roomId = room.getRoomId();
        this.completedAt = completedAt.truncatedTo(ChronoUnit.MICROS);
    }
    public Long getRoomId() { return roomId; }
    public Instant getCompletedAt() { return completedAt; }
}
