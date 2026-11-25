package com.gachita.friend;

import com.gachita.user.User;
import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "friendships", uniqueConstraints = @UniqueConstraint(name = "uk_friendship_pair", columnNames = {"lower_user_id", "higher_user_id"}))
public class Friendship {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) @Column(name = "friendship_id") private Long friendshipId;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "lower_user_id") private User lowerUser;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "higher_user_id") private User higherUser;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "requester_user_id") private User requester;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 12) private FriendshipStatus status;
    @Column(name = "created_at", nullable = false) private Instant createdAt;
    @Column(name = "accepted_at") private Instant acceptedAt;

    protected Friendship() {}
    public Friendship(User lowerUser, User higherUser, User requester) {
        this.lowerUser = lowerUser; this.higherUser = higherUser; this.requester = requester;
        this.status = FriendshipStatus.PENDING; this.createdAt = Instant.now();
    }
    public Long getFriendshipId() { return friendshipId; }
    public User getLowerUser() { return lowerUser; }
    public User getHigherUser() { return higherUser; }
    public User getRequester() { return requester; }
    public FriendshipStatus getStatus() { return status; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getAcceptedAt() { return acceptedAt; }
    public User other(Long userId) { return lowerUser.getUserId().equals(userId) ? higherUser : lowerUser; }
    public void accept() { status = FriendshipStatus.ACCEPTED; acceptedAt = Instant.now(); }
}
