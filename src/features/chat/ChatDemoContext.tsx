import { createContext, useCallback, useContext, useState, type PropsWithChildren } from 'react';

import { createDemoMessage } from '@/features/chat/messages';
import type { ChatMessage } from '@/types/chat';

type ChatDemoValue = {
  messages: ChatMessage[];
  sendMessage: (roomId: number, userId: number, text: string) => void;
};

const ChatDemoContext = createContext<ChatDemoValue | null>(null);

export function ChatDemoProvider({ children }: PropsWithChildren) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const sendMessage = useCallback((roomId: number, userId: number, text: string) => {
    setMessages((current) => {
      const message = createDemoMessage(current, roomId, userId, text, new Date().toISOString());
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
