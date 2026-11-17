import { apiRequest } from '@/services/apiClient';
import type { BoardingCheck } from '@/types/boarding';

const path = (roomId: number) => `/api/v1/rooms/${roomId}/boarding-checks`;

export function requestBoardingCheck(roomId: number) {
  return apiRequest<BoardingCheck>(path(roomId), { method: 'POST' });
}
export function getCurrentBoardingCheck(roomId: number) {
  return apiRequest<BoardingCheck>(`${path(roomId)}/current`);
}
export function acceptBoardingCheck(roomId: number, boardingCheckId: number) {
  return apiRequest<BoardingCheck>(`${path(roomId)}/${boardingCheckId}/accept`, { method: 'POST' });
}
