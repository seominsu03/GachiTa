// Stage 1 display models. These are demo data, not a server API contract.
export type ChatMessage = {
  messageId: number;
  roomId: number;
  userId: number;
  nickname: string;
  text: string;
  createdAt: string;
};

export type DemoChatRoom = {
  roomId: number;
  origin: { name: string; latitude: number; longitude: number };
  destination: { name: string; latitude: number; longitude: number };
  departureAt: string;
  capacity: number;
  participantCount: number;
  hostUserId: number;
};
