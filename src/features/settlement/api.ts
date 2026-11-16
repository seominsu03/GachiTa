import { apiRequest } from '@/services/apiClient';
import type { Settlement } from '@/types/settlement';

const path = (roomId: number) => `/api/v1/rooms/${roomId}/settlement`;
export function getSettlement(roomId: number) { return apiRequest<Settlement>(path(roomId)); }
export function createSettlement(roomId: number, totalFare: number) { return apiRequest<Settlement>(path(roomId), { method: 'POST', body: { totalFare } }); }
export function confirmReceipt(roomId: number, userId: number) { return apiRequest<Settlement>(`${path(roomId)}/receipts/${userId}`, { method: 'PATCH', body: { received: true } }); }
