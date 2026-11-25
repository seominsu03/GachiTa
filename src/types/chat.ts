// Stored server message returned to every approved rider in the room.
export type ChatMessage = {
  messageId: number;
  roomId: number;
  userId: number;
  nickname: string;
  text: string;
  createdAt: string;
};
