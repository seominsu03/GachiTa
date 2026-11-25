package com.gachita.friend;

import java.time.Instant;

public record FriendshipResponse(Long friendshipId, FriendCandidate user, FriendshipStatus status, boolean incoming,
                                 Instant createdAt, Instant acceptedAt) {
    public static FriendshipResponse from(Friendship friendship, Long viewerId) {
        return new FriendshipResponse(friendship.getFriendshipId(), FriendCandidate.from(friendship.other(viewerId)),
                friendship.getStatus(), !friendship.getRequester().getUserId().equals(viewerId),
                friendship.getCreatedAt(), friendship.getAcceptedAt());
    }
}
