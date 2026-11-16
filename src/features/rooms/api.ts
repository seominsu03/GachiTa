import { apiRequest } from '@/services/apiClient';
import type { Room, RoomCreateRequest, RoomSearchParams } from '@/types/room';
import { roomSearchQuery } from '@/features/rooms/search';

// Retain getRooms('destination') compatibility for existing callers.
export function getRooms(input: string | RoomSearchParams = '') {
  return apiRequest<Room[]>(`/api/v1/rooms${roomSearchQuery(input)}`);
}
export function searchRoomsByDestination(destination: string) { return getRooms(destination); }
export function getMyRooms() { return apiRequest<Room[]>('/api/v1/rooms/mine'); }
export function getRoomById(roomId: number) { return apiRequest<Room>(`/api/v1/rooms/${roomId}`); }
export function createRoom(input: RoomCreateRequest) { return apiRequest<Room>('/api/v1/rooms', { method: 'POST', body: input }); }

export function updateRoomCapacity(roomId: number, capacity: number) { return apiRequest<Room>(`/api/v1/rooms/${roomId}/capacity`, { method: 'PATCH', body: { capacity } }); }
export function deleteRoom(roomId: number) { return apiRequest<null>(`/api/v1/rooms/${roomId}`, { method: 'DELETE' }); }
