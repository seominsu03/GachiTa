package com.gachita.boarding;

import com.gachita.room.TaxiRoom;
import jakarta.persistence.*;
import java.time.Instant;

@Entity @Table(name = "boarding_checks")
public class BoardingCheck {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "boarding_check_id") private Long boardingCheckId;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "room_id") private TaxiRoom room;
    @Column(name = "requested_at", nullable = false) private Instant requestedAt;
    @Column(name = "expires_at", nullable = false) private Instant expiresAt;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 30)
    private BoardingCheckStatus status = BoardingCheckStatus.PENDING;

    protected BoardingCheck() {}
    public BoardingCheck(TaxiRoom room, Instant requestedAt, Instant expiresAt) {
        this.room = room; this.requestedAt = requestedAt; this.expiresAt = expiresAt;
    }
    public Long getBoardingCheckId() { return boardingCheckId; }
    public TaxiRoom getRoom() { return room; }
    public Instant getRequestedAt() { return requestedAt; }
    public Instant getExpiresAt() { return expiresAt; }
    public BoardingCheckStatus getStatus() { return status; }
    public void setStatus(BoardingCheckStatus status) { this.status = status; }
}
