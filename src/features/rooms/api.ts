import { apiRequest } from '@/services/apiClient';
import type { Room, RoomCreateRequest } from '@/types/room';

export function getRooms(destination = '') {
  return apiRequest<Room[]>(`/api/v1/rooms${destination ? `?destination=${encodeURIComponent(destination)}` : ''}`);
}
export function searchRoomsByDestination(destination: string) { return getRooms(destination); }
export function getMyRooms() { return apiRequest<Room[]>('/api/v1/rooms/mine'); }
export function getRoomById(roomId: number) { return apiRequest<Room>(`/api/v1/rooms/${roomId}`); }
export function createRoom(input: RoomCreateRequest) { return apiRequest<Room>('/api/v1/rooms', { method: 'POST', body: input }); }
