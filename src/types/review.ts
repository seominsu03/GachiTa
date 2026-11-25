export type RideReview = {
  reviewId: number; roomId: number;
  reviewerUserId: number; reviewerNickname: string;
  revieweeUserId: number; revieweeNickname: string;
  rating: number; comment: string; createdAt: string;
};

export type ReviewOverview = { received: RideReview[]; written: RideReview[]; receivedCount: number; averageRating: number | null };
