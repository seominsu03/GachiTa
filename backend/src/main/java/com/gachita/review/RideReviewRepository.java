package com.gachita.review;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface RideReviewRepository extends JpaRepository<RideReview, Long> {
    boolean existsByRoomRoomIdAndReviewerUserIdAndRevieweeUserId(Long roomId, Long reviewerId, Long revieweeId);
    List<RideReview> findByRoomRoomIdOrderByCreatedAtDescReviewIdDesc(Long roomId);
    List<RideReview> findTop100ByRevieweeUserIdOrderByCreatedAtDescReviewIdDesc(Long userId);
    List<RideReview> findTop100ByReviewerUserIdOrderByCreatedAtDescReviewIdDesc(Long userId);
    long countByRevieweeUserId(Long userId);
    @Query("select avg(r.rating) from RideReview r where r.reviewee.userId = :userId")
    Double averageRatingFor(@Param("userId") Long userId);
}
