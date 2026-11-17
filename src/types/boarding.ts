// Temporary UI state for the local boarding preview. Server DTOs are separate.
type BoardingDemoRequest = { requestedAt: number; expiresAt: number };

export type BoardingDemoState =
  | { status: 'idle' }
  | (BoardingDemoRequest & { status: 'pending' })
  | (BoardingDemoRequest & { status: 'accepted' | 'declined'; respondedAt: number })
  | (BoardingDemoRequest & { status: 'expired' });
