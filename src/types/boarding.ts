export type BoardingCheckStatus = 'PENDING' | 'COMPLETED' | 'EXPIRED';
export type BoardingResponseStatus = 'PENDING' | 'ACCEPTED' | 'TIMED_OUT' | 'CANCELLED';

export type BoardingCheck = {
  boardingCheckId: number;
  roomId: number;
  requestedAt: string;
  expiresAt: string;
  serverNow: string;
  status: BoardingCheckStatus;
  responses: { userId: number; status: BoardingResponseStatus; respondedAt: string | null }[];
};
