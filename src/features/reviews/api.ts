import { apiRequest } from '@/services/apiClient';
import type { ReviewOverview, RideReview } from '@/types/review';

export function getMyReviews() { return apiRequest<ReviewOverview>('/api/v1/reviews/mine'); }
export function getRoomReviews(roomId: number) { return apiRequest<RideReview[]>(`/api/v1/rooms/${roomId}/reviews`); }
export function createRideReview(roomId: number, revieweeUserId: number, rating: number, comment: string) {
  return apiRequest<RideReview>(`/api/v1/rooms/${roomId}/reviews`, { method: 'POST', body: { revieweeUserId, rating, comment } });
}
