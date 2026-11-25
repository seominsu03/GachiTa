package com.gachita.friend;

import com.gachita.common.ApiException;
import com.gachita.user.User;
import com.gachita.user.UserRepository;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service @Transactional
public class FriendshipService {
    private final FriendshipRepository friendships;
    private final UserRepository users;
    public FriendshipService(FriendshipRepository friendships, UserRepository users) {
        this.friendships = friendships; this.users = users;
    }
    private ApiException error(HttpStatus status, String code, String message) { return new ApiException(status, code, message); }
    @Transactional(readOnly = true) public List<FriendCandidate> search(Long viewerId, String query) {
        String normalized = query == null ? "" : query.strip();
        if (normalized.length() < 2 || normalized.length() > 20)
            throw error(HttpStatus.BAD_REQUEST, "INVALID_QUERY", "아이디를 2~20자로 입력해 주세요.");
        return users.findTop20ByUsernameContainingIgnoreCaseAndUserIdNotOrderByUsernameAsc(normalized, viewerId)
                .stream().map(FriendCandidate::from).toList();
    }
    @Transactional(readOnly = true) public FriendCandidate profile(Long userId) {
        return users.findById(userId).map(FriendCandidate::from)
                .orElseThrow(() -> error(HttpStatus.NOT_FOUND, "USER_NOT_FOUND", "사용자를 찾을 수 없어요."));
    }
    @Transactional(readOnly = true) public FriendshipOverview mine(Long userId) {
        var all = friendships.findByLowerUserUserIdOrHigherUserUserIdOrderByCreatedAtDesc(userId, userId).stream()
                .map(friendship -> FriendshipResponse.from(friendship, userId)).toList();
        return new FriendshipOverview(all.stream().filter(item -> item.status() == FriendshipStatus.ACCEPTED).toList(),
                all.stream().filter(item -> item.status() == FriendshipStatus.PENDING && item.incoming()).toList(),
                all.stream().filter(item -> item.status() == FriendshipStatus.PENDING && !item.incoming()).toList());
    }
    public FriendshipResponse request(Long viewerId, Long targetId) {
        if (viewerId.equals(targetId)) throw error(HttpStatus.BAD_REQUEST, "SELF_FRIEND", "본인에게 친구 요청을 보낼 수 없어요.");
        User target = users.findById(targetId).orElseThrow(() -> error(HttpStatus.NOT_FOUND, "USER_NOT_FOUND", "사용자를 찾을 수 없어요."));
        Long lower = Math.min(viewerId, targetId), higher = Math.max(viewerId, targetId);
        // Serialize opposite-direction requests for the same pair before checking the unique key.
        users.findLockedByUserId(lower).orElseThrow(() -> error(HttpStatus.UNAUTHORIZED, "UNAUTHENTICATED", "다시 로그인해 주세요."));
        User viewer = users.getReferenceById(viewerId);
        if (friendships.findByLowerUserUserIdAndHigherUserUserId(lower, higher).isPresent())
            throw error(HttpStatus.CONFLICT, "FRIENDSHIP_EXISTS", "이미 친구이거나 처리 중인 요청이 있어요.");
        return FriendshipResponse.from(friendships.saveAndFlush(new Friendship(viewerId < targetId ? viewer : target,
                viewerId < targetId ? target : viewer, viewer)), viewerId);
    }
    public FriendshipResponse accept(Long viewerId, Long friendshipId) {
        var friendship = requireParticipant(viewerId, friendshipId);
        if (friendship.getStatus() != FriendshipStatus.PENDING || friendship.getRequester().getUserId().equals(viewerId))
            throw error(HttpStatus.CONFLICT, "FRIEND_REQUEST_NOT_RECEIVED", "받은 친구 요청만 수락할 수 있어요.");
        friendship.accept();
        return FriendshipResponse.from(friendship, viewerId);
    }
    public void remove(Long viewerId, Long friendshipId) { friendships.delete(requireParticipant(viewerId, friendshipId)); }
    private Friendship requireParticipant(Long viewerId, Long friendshipId) {
        var friendship = friendships.findById(friendshipId)
                .orElseThrow(() -> error(HttpStatus.NOT_FOUND, "FRIENDSHIP_NOT_FOUND", "친구 관계를 찾을 수 없어요."));
        if (!friendship.getLowerUser().getUserId().equals(viewerId) && !friendship.getHigherUser().getUserId().equals(viewerId))
            throw error(HttpStatus.FORBIDDEN, "FRIEND_FORBIDDEN", "이 친구 관계를 변경할 수 없어요.");
        return friendship;
    }
}
