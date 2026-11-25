package com.gachita.review;

import com.gachita.room.TaxiRoom;
import com.gachita.user.User;
import jakarta.persistence.*;
import java.time.Instant;

@Entity @Table(name = "ride_reviews", uniqueConstraints = @UniqueConstraint(name = "uk_ride_review_once", columnNames = {"room_id", "reviewer_user_id", "reviewee_user_id"}))
public class RideReview {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) @Column(name = "review_id") private Long reviewId;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "room_id") private TaxiRoom room;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "reviewer_user_id") private User reviewer;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "reviewee_user_id") private User reviewee;
    @Column(nullable = false) private int rating;
    @Column(length = 500) private String comment;
    @Column(name = "created_at", nullable = false) private Instant createdAt;
    protected RideReview() {}
    public RideReview(TaxiRoom room, User reviewer, User reviewee, int rating, String comment) {
        this.room = room; this.reviewer = reviewer; this.reviewee = reviewee; this.rating = rating; this.comment = comment; createdAt = Instant.now();
    }
    public Long getReviewId() { return reviewId; }
    public TaxiRoom getRoom() { return room; }
    public User getReviewer() { return reviewer; }
    public User getReviewee() { return reviewee; }
    public int getRating() { return rating; }
    public String getComment() { return comment; }
    public Instant getCreatedAt() { return createdAt; }
}
