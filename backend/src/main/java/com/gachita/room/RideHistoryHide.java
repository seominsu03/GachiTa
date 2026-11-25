package com.gachita.room;

import com.gachita.user.User;
import jakarta.persistence.*;
import java.time.Instant;

@Entity @Table(name = "ride_history_hides", uniqueConstraints = @UniqueConstraint(name = "uk_ride_history_hide_room_user", columnNames = {"room_id", "user_id"}))
public class RideHistoryHide {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) @Column(name = "hide_id") private Long hideId;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "room_id") private TaxiRoom room;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "user_id") private User user;
    @Column(name = "hidden_at", nullable = false) private Instant hiddenAt;

    protected RideHistoryHide() {}
    public RideHistoryHide(TaxiRoom room, User user) { this.room = room; this.user = user; hiddenAt = Instant.now(); }
    public Long getHideId() { return hideId; }
}
