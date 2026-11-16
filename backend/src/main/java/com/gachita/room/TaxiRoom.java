package com.gachita.room;
import com.gachita.common.LocationInfo;
import com.gachita.user.User;
import jakarta.persistence.*;
import java.time.Instant;

@Entity @Table(name = "taxi_rooms")
public class TaxiRoom {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) @Column(name = "room_id") private Long roomId;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "host_user_id") private User host;
    @Column(name = "origin_name", nullable = false, length = 100) private String originName;
    @Column(name = "origin_latitude", nullable = false) private double originLatitude;
    @Column(name = "origin_longitude", nullable = false) private double originLongitude;
    @Column(name = "destination_name", nullable = false, length = 100) private String destinationName;
    @Column(name = "destination_latitude", nullable = false) private double destinationLatitude;
    @Column(name = "destination_longitude", nullable = false) private double destinationLongitude;
    @Column(name = "departure_at", nullable = false) private Instant departureAt;
    @Column(nullable = false) private int capacity;
    @Column(name = "participant_count", nullable = false) private int participantCount = 1;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 30) private RoomStatus status = RoomStatus.RECRUITING;
    protected TaxiRoom() {}
    public TaxiRoom(User host, RoomCreateRequest input) {
        this.host = host; originName = input.origin().name(); originLatitude = input.origin().latitude(); originLongitude = input.origin().longitude();
        destinationName = input.destination().name(); destinationLatitude = input.destination().latitude(); destinationLongitude = input.destination().longitude();
        departureAt = input.departureAt(); capacity = input.capacity();
    }
    public Long getRoomId() { return roomId; } public User getHost() { return host; }
    public LocationInfo getOrigin() { return new LocationInfo(originName, originLatitude, originLongitude); }
    public LocationInfo getDestination() { return new LocationInfo(destinationName, destinationLatitude, destinationLongitude); }
    public Instant getDepartureAt() { return departureAt; } public int getCapacity() { return capacity; }
    public int getParticipantCount() { return participantCount; } public RoomStatus getStatus() { return status; }
    public void setParticipantCount(int count) { participantCount = count; }
    public void setStatus(RoomStatus status) { this.status = status; }
}
