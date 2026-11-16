package com.gachita.participation;
import com.gachita.room.TaxiRoom;
import com.gachita.user.User;
import jakarta.persistence.*;
@Entity @Table(name = "participations", uniqueConstraints = @UniqueConstraint(name = "uk_participation_room_user", columnNames = {"room_id", "user_id"}))
public class Participation {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) @Column(name = "participation_id") private Long participationId;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "room_id") private TaxiRoom room;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "user_id") private User user;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 30) private ParticipationStatus status = ParticipationStatus.PENDING;
    protected Participation() {}
    public Participation(TaxiRoom room, User user) { this.room = room; this.user = user; }
    public Long getParticipationId() { return participationId; } public TaxiRoom getRoom() { return room; }
    public User getUser() { return user; } public ParticipationStatus getStatus() { return status; }
    public void setStatus(ParticipationStatus status) { this.status = status; }
}
