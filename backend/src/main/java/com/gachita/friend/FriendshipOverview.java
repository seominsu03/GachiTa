package com.gachita.friend;

import java.util.List;

public record FriendshipOverview(List<FriendshipResponse> friends, List<FriendshipResponse> incoming,
                                 List<FriendshipResponse> outgoing) {}
