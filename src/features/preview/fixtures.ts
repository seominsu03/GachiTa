import type { Member, Participation, Room } from '@/types/room';
import type { Settlement } from '@/types/settlement';

// Explicitly opt-in design fixtures. Never returned by a production API or written to the DB.
export const host: Member = { userId: 1, nickname: '수원러', rating: 4.9, reviewCount: 24, avatarKey: 'host' };
export const passengers: Participation[] = [
  { userId: 2, nickname: '하루', rating: 4.8, reviewCount: 12, avatarKey: 'haru', participationId: 2, roomId: 1, status: 'APPROVED' },
  { userId: 3, nickname: '민트', rating: 4.9, reviewCount: 18, avatarKey: 'mint', participationId: 3, roomId: 1, status: 'PENDING' },
  { userId: 4, nickname: '준호', rating: 4.7, reviewCount: 9, avatarKey: 'junho', participationId: 4, roomId: 1, status: 'PENDING' },
  { userId: 5, nickname: '소희', rating: 4.8, reviewCount: 15, avatarKey: 'sohee', participationId: 5, roomId: 1, status: 'PENDING' },
];
export const sampleRoom: Room = {
  roomId: 1, hostUserId: 1, host, origin: { name: '수원역', latitude: 37.2657, longitude: 127.0007 },
  destination: { name: '강남역', latitude: 37.4979, longitude: 127.0276 },
  departureAt: '2026-10-07T09:30:00Z', capacity: 4, participantCount: 2, status: 'RECRUITING',
};
export const sampleMembers = [host, passengers[0], passengers[1], passengers[3]];
export function sampleBill(complete = false): Settlement {
  return { roomId: 1, totalFare: 24000, farePerPerson: 6000, remainderFare: 0, participantCount: 4, receipts: sampleMembers.map((member, index) => ({ ...member, received: complete || index < 2 })) };
}
export const roomList: Room[] = [sampleRoom,
  { ...sampleRoom, roomId: 2, destination: { name: '사당역', latitude: 37.4765, longitude: 126.9816 }, departureAt: '2026-10-07T09:45:00Z', participantCount: 3 },
  { ...sampleRoom, roomId: 3, origin: { name: '아주대학교 정문', latitude: 37.2791, longitude: 127.0438 }, destination: sampleRoom.origin, departureAt: '2026-10-07T10:00:00Z', capacity: 3, participantCount: 1 },
];
export const homeRooms: Room[] = [
  { ...sampleRoom, origin: { name: '서울대학교 정문', latitude: 37.4663, longitude: 126.9481 }, destination: { name: '서울대입구역 3번 출구', latitude: 37.4812, longitude: 126.9527 }, departureAt: '2026-10-07T09:10:00Z', capacity: 3 },
  { ...sampleRoom, roomId: 2, origin: { name: '서울대학교 중앙도서관', latitude: 37.4591, longitude: 126.952 }, destination: { name: '신림역 2번 출구', latitude: 37.4842, longitude: 126.9296 } },
];
