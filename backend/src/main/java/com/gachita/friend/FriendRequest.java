package com.gachita.friend;

import jakarta.validation.constraints.NotNull;

public record FriendRequest(@NotNull Long userId) {}
