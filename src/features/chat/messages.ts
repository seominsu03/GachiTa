import type { ChatMessage } from '@/types/chat';

export const MAX_MESSAGE_LENGTH = 500;
export const DEMO_USER_ID = 1;

export function getRoomMessages(messages: ChatMessage[], roomId: number): ChatMessage[] {
  return messages.filter((message) => message.roomId === roomId);
}

export function createDemoMessage(
  messages: ChatMessage[], roomId: number, input: string, createdAt: string,
): ChatMessage | null {
  const text = input.trim();
  if (!text || input.length > MAX_MESSAGE_LENGTH) return null;
  return {
    messageId: messages.reduce((max, message) => Math.max(max, message.messageId), 0) + 1,
    roomId, userId: DEMO_USER_ID, nickname: '나', text, createdAt,
  };
}
