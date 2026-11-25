import { apiRequest } from '@/services/apiClient';
import type { RideHistory } from '@/types/history';

export function getRideHistory() { return apiRequest<RideHistory[]>('/api/v1/history'); }
export function getRideHistoryById(roomId: number) { return apiRequest<RideHistory>(`/api/v1/history/${roomId}`); }
export function hideRideHistory(roomId: number) { return apiRequest<null>(`/api/v1/history/${roomId}`, { method: 'DELETE' }); }
