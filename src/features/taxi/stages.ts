// Local preview stages. Server room status is defined separately in the shared contract.
export type TaxiDemoStage = 'BEFORE_CALL' | 'TAXI_CALLING' | 'TAXI_ASSIGNED' | 'IN_RIDE' | 'SETTLING';

export const TAXI_DEMO_PROGRESS = [
  { stage: 'TAXI_CALLING', label: '택시 호출 중' },
  { stage: 'TAXI_ASSIGNED', label: '배차 완료' },
  { stage: 'IN_RIDE', label: '택시 이용 중' },
] as const;

export function advanceTaxiDemoStage(stage: TaxiDemoStage, isHost: boolean): TaxiDemoStage {
  if (!isHost) return stage;

  switch (stage) {
    case 'BEFORE_CALL': return 'TAXI_CALLING';
    case 'TAXI_CALLING': return 'TAXI_ASSIGNED';
    case 'TAXI_ASSIGNED': return 'IN_RIDE';
    case 'IN_RIDE': return 'SETTLING';
    case 'SETTLING': return 'SETTLING';
  }
}

export function cancelTaxiDemoCall(stage: TaxiDemoStage, isHost: boolean): TaxiDemoStage {
  return isHost && stage === 'TAXI_CALLING' ? 'BEFORE_CALL' : stage;
}

export function getTaxiDemoProgress(stage: TaxiDemoStage): number {
  switch (stage) {
    case 'BEFORE_CALL': return 0;
    case 'TAXI_CALLING': return 1;
    case 'TAXI_ASSIGNED': return 2;
    case 'IN_RIDE':
    case 'SETTLING': return 3;
  }
}

// Keep each demo room's stage while this JavaScript session remains active.
const roomStages = new Map<number, TaxiDemoStage>();

export function getTaxiDemoRoomStage(roomId: number, isHost: boolean): TaxiDemoStage {
  return roomStages.get(roomId) ?? (isHost ? 'BEFORE_CALL' : 'TAXI_ASSIGNED');
}

export function advanceTaxiDemoRoomStage(roomId: number, isHost: boolean): TaxiDemoStage {
  const next = advanceTaxiDemoStage(getTaxiDemoRoomStage(roomId, isHost), isHost);
  if (isHost) roomStages.set(roomId, next);
  return next;
}

export function cancelTaxiDemoRoomCall(roomId: number, isHost: boolean): TaxiDemoStage {
  const next = cancelTaxiDemoCall(getTaxiDemoRoomStage(roomId, isHost), isHost);
  if (isHost) roomStages.set(roomId, next);
  return next;
}
