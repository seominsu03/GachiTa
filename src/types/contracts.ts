export type RoomStatus = 'RECRUITING' | 'BOARDING_CHECK' | 'TAXI_CALLING' | 'TAXI_ASSIGNED' | 'IN_RIDE' | 'SETTLING' | 'COMPLETED' | 'CANCELLED';
export type ParticipationStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'BOARDING_CONFIRMED' | 'TIMED_OUT';
export type LocationInfo = { name: string; latitude: number; longitude: number };
