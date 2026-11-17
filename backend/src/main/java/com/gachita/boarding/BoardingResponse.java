package com.gachita.boarding;

import com.gachita.user.User;
import jakarta.persistence.*;
import java.time.Instant;

@Entity @Table(name = "boarding_responses", uniqueConstraints = @UniqueConstraint(
        name = "uk_boarding_response_check_user", columnNames = {"boarding_check_id", "user_id"}))
public class BoardingResponse {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "boarding_response_id") private Long boardingResponseId;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "boarding_check_id") private BoardingCheck boardingCheck;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id") private User user;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 30)
    private BoardingResponseStatus status = BoardingResponseStatus.PENDING;
    @Column(name = "responded_at") private Instant respondedAt;

    protected BoardingResponse() {}
    public BoardingResponse(BoardingCheck boardingCheck, User user) {
        this.boardingCheck = boardingCheck; this.user = user;
    }
    public Long getBoardingResponseId() { return boardingResponseId; }
    public BoardingCheck getBoardingCheck() { return boardingCheck; }
    public User getUser() { return user; }
    public BoardingResponseStatus getStatus() { return status; }
    public Instant getRespondedAt() { return respondedAt; }
    public void record(BoardingResponseStatus status, Instant respondedAt) {
        this.status = status; this.respondedAt = respondedAt;
    }
}
