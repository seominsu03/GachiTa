import { createContext, useCallback, useContext, useState, type PropsWithChildren } from 'react';

import { createDemoMessage } from '@/features/chat/messages';
import { DEMO_ROOMS, MOCK_MESSAGES } from '@/features/chat/mockMessages';
import type { ChatMessage } from '@/types/chat';

type ChatDemoValue = {
  messages: ChatMessage[];
  sendMessage: (roomId: number, text: string) => void;
};

const ChatDemoContext = createContext<ChatDemoValue | null>(null);

export function ChatDemoProvider({ children }: PropsWithChildren) {
  const [messages, setMessages] = useState<ChatMessage[]>(MOCK_MESSAGES);
  const sendMessage = useCallback((roomId: number, text: string) => {
    if (!DEMO_ROOMS.some((room) => room.roomId === roomId)) return;
    setMessages((current) => {
      const message = createDemoMessage(current, roomId, text, new Date().toISOString());
      return message ? [...current, message] : current;
    });
  }, []);

  return <ChatDemoContext.Provider value={{ messages, sendMessage }}>{children}</ChatDemoContext.Provider>;
}

export function useChatDemo() {
  const value = useContext(ChatDemoContext);
  if (!value) throw new Error('useChatDemo requires ChatDemoProvider');
  return value;
}
