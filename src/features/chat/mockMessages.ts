import type { ChatMessage, DemoChatRoom } from '@/types/chat';

export const DEMO_ROOMS: DemoChatRoom[] = [
  {
    roomId: 101,
    origin: { name: '수원역', latitude: 37.266, longitude: 127.000 },
    destination: { name: '강남역', latitude: 37.498, longitude: 127.027 },
    departureAt: '2026-11-11T09:30:00Z', capacity: 4, participantCount: 3, hostUserId: 1,
  },
  {
    roomId: 102,
    origin: { name: '광교중앙역', latitude: 37.288, longitude: 127.051 },
    destination: { name: '수원역', latitude: 37.266, longitude: 127.000 },
    departureAt: '2026-11-11T10:00:00Z', capacity: 4, participantCount: 2, hostUserId: 2,
  },
];

export const MOCK_MESSAGES: ChatMessage[] = [
  { messageId: 1, roomId: 101, userId: 2, nickname: '하루', text: '안녕하세요!', createdAt: '2026-11-11T09:20:00Z' },
  { messageId: 2, roomId: 101, userId: 1, nickname: '나', text: '18시 30분에 수원역에서 만나요.', createdAt: '2026-11-11T09:21:00Z' },
  { messageId: 3, roomId: 101, userId: 3, nickname: '준호', text: '네, 확인했습니다.', createdAt: '2026-11-11T09:22:00Z' },
];

export function getDemoRoom(roomId: string | undefined): DemoChatRoom | undefined {
  return DEMO_ROOMS.find((room) => String(room.roomId) === roomId);
}
