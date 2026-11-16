package com.gachita.common;
import com.gachita.user.User;
public record MemberResponse(Long userId, String nickname) {
    public static MemberResponse from(User user) { return new MemberResponse(user.getUserId(), user.getNickname()); }
}
