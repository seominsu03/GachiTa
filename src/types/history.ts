import type { Room } from './room';
import type { Settlement } from './settlement';

export type RideHistory = { room: Room; archived: boolean; completedAt: string | null; settlement: Settlement | null };
