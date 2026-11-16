import { apiRequest } from '@/services/apiClient';
import type { Participation } from '@/types/room';

const path = (roomId: number) => `/api/v1/rooms/${roomId}/participations`;
export function getParticipations(roomId: number) { return apiRequest<Participation[]>(path(roomId)); }
export function requestParticipation(roomId: number) { return apiRequest<Participation>(path(roomId), { method: 'POST' }); }
export function approveParticipation(roomId: number, participationId: number) { return apiRequest<Participation>(`${path(roomId)}/${participationId}/approve`, { method: 'POST' }); }
export function rejectParticipation(roomId: number, participationId: number) { return apiRequest<Participation>(`${path(roomId)}/${participationId}/reject`, { method: 'POST' }); }
export function cancelParticipation(roomId: number, participationId: number) { return apiRequest<Participation>(`${path(roomId)}/${participationId}/cancel`, { method: 'POST' }); }
