package com.gachita.friend;

import com.gachita.user.User;

public record FriendCandidate(Long userId, String username, String nickname) {
    public static FriendCandidate from(User user) { return new FriendCandidate(user.getUserId(), user.getUsername(), user.getNickname()); }
}
