import type { BoardingDemoState } from '@/types/boarding';
import type { ChatMessage } from '@/types/chat';

const BOARDING_WINDOW_MS = 60_000;

export type BoardingDemoTimelineItem =
  | { kind: 'message'; message: ChatMessage }
  | { kind: 'boarding'; roomId: number };

export function getBoardingDemoTimeline(
  messages: ChatMessage[], initialMessageCount: number, roomId: number,
): BoardingDemoTimelineItem[] {
  return [
    ...messages.slice(0, initialMessageCount).map((message) => ({ kind: 'message' as const, message })),
    { kind: 'boarding' as const, roomId },
    ...messages.slice(initialMessageCount).map((message) => ({ kind: 'message' as const, message })),
  ];
}

export function createBoardingDemoRequest(now: number): BoardingDemoState {
  return { status: 'pending', requestedAt: now, expiresAt: now + BOARDING_WINDOW_MS };
}

export function expireBoardingDemoRequest(state: BoardingDemoState, now: number): BoardingDemoState {
  if (state.status !== 'pending' || now < state.expiresAt) return state;
  return { ...state, status: 'expired' };
}

export function respondToBoardingDemoRequest(
  state: BoardingDemoState,
  response: 'accepted' | 'declined',
  now: number,
): BoardingDemoState {
  if (state.status !== 'pending') return state;
  if (now >= state.expiresAt) return { ...state, status: 'expired' };
  return { ...state, status: response, respondedAt: now };
}
