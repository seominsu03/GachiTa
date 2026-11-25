package com.gachita.friend;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FriendshipRepository extends JpaRepository<Friendship, Long> {
    Optional<Friendship> findByLowerUserUserIdAndHigherUserUserId(Long lowerId, Long higherId);
    List<Friendship> findByLowerUserUserIdOrHigherUserUserIdOrderByCreatedAtDesc(Long lowerId, Long higherId);
}
