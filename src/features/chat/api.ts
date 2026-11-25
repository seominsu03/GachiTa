import { apiRequest } from '@/services/apiClient';
import type { ChatMessage } from '@/types/chat';

export function getChatMessages(roomId: number, after = 0) {
  return apiRequest<ChatMessage[]>(`/api/v1/rooms/${roomId}/messages?after=${after}`);
}
export function sendChatMessage(roomId: number, text: string) {
  return apiRequest<ChatMessage>(`/api/v1/rooms/${roomId}/messages`, { method: 'POST', body: { text } });
}
