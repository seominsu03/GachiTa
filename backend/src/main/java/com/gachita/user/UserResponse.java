package com.gachita.user;

public record UserResponse(Long userId, String username, String nickname, String name, String phoneNumber) {
    public static UserResponse from(User user) {
        return new UserResponse(user.getUserId(), user.getUsername(), user.getNickname(), user.getName(), user.getPhoneNumber());
    }
}
