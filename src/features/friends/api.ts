import { apiRequest } from '@/services/apiClient';
import type { FriendCandidate, Friendship, FriendshipOverview } from '@/types/friend';

export function getFriends() { return apiRequest<FriendshipOverview>('/api/v1/friends'); }
export function searchFriends(query: string) { return apiRequest<FriendCandidate[]>(`/api/v1/friends/search?query=${encodeURIComponent(query)}`); }
export function getFriendProfile(userId: number) { return apiRequest<FriendCandidate>(`/api/v1/friends/users/${userId}`); }
export function requestFriend(userId: number) { return apiRequest<Friendship>('/api/v1/friends/requests', { method: 'POST', body: { userId } }); }
export function acceptFriend(friendshipId: number) { return apiRequest<Friendship>(`/api/v1/friends/requests/${friendshipId}/accept`, { method: 'POST' }); }
export function removeFriend(friendshipId: number) { return apiRequest<null>(`/api/v1/friends/${friendshipId}`, { method: 'DELETE' }); }
