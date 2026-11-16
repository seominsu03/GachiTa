import type { Member } from './room';

export type SettlementReceipt = Member & { received: boolean };
export type Settlement = {
  roomId: number; totalFare: number; farePerPerson: number; remainderFare: number;
  participantCount: number; receipts: SettlementReceipt[];
};
