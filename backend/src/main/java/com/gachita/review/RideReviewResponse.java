package com.gachita.review;

import java.time.Instant;

public record RideReviewResponse(Long reviewId, Long roomId, Long reviewerUserId, String reviewerNickname,
        Long revieweeUserId, String revieweeNickname, int rating, String comment, Instant createdAt) {
    public static RideReviewResponse from(RideReview review) {
        return new RideReviewResponse(review.getReviewId(), review.getRoom().getRoomId(), review.getReviewer().getUserId(),
                review.getReviewer().getNickname(), review.getReviewee().getUserId(), review.getReviewee().getNickname(),
                review.getRating(), review.getComment(), review.getCreatedAt());
    }
}
