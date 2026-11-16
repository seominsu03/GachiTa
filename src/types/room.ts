import type { LocationInfo, ParticipationStatus, RoomStatus } from './contracts';

export type Member = { userId: number; nickname: string; rating?: number; reviewCount?: number; avatarKey?: 'host' | 'haru' | 'mint' | 'junho' | 'sohee' };
export type Room = {
  roomId: number; hostUserId: number; host: Member;
  origin: LocationInfo; destination: LocationInfo; departureAt: string;
  capacity: number; participantCount: number; status: RoomStatus;
};
export type RoomCreateRequest = { origin: LocationInfo; destination: LocationInfo; departureAt: string; capacity: number };
export type Participation = Member & { participationId: number; roomId: number; status: ParticipationStatus };

export type DeparturePeriod = 'ALL' | 'MORNING' | 'AFTERNOON' | 'EVENING';
export type RoomSearchParams = { origin?: string; destination?: string; period?: DeparturePeriod };
