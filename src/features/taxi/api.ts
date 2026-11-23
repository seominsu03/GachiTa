import { apiRequest } from '@/services/apiClient';
import type { RoomStatus } from '@/types/contracts';

export type TaxiStatus = { roomId: number; status: RoomStatus; participantCount: number };

const path = (roomId: number) => `/api/v1/rooms/${roomId}/taxi`;

export function getTaxiStatus(roomId: number) {
  return apiRequest<TaxiStatus>(path(roomId));
}

export function advanceTaxi(roomId: number, expectedStatus: RoomStatus) {
  return apiRequest<TaxiStatus>(`${path(roomId)}/advance`, { method: 'POST', body: { expectedStatus } });
}
