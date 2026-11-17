import { createContext, useCallback, useContext, useState, type PropsWithChildren } from 'react';

import type { LocationInfo } from '@/types/contracts';

export type RoomDraftPoint = LocationInfo & {
  source: 'map' | 'search';
  roadAddress: string | null;
  addressKind?: 'road' | 'parcel' | 'nearby' | null;
  buildingCandidate: string | null;
  placeId: string | null;
};

type RoomCreateDraft = {
  origin: RoomDraftPoint | null;
  destination: RoomDraftPoint | null;
  capacity: number;
  day: string;
  time: string;
};
type RoomEdit = { roomId: number; origin: RoomDraftPoint; destination: RoomDraftPoint };

function initialDraft(): RoomCreateDraft {
  return {
    origin: null,
    destination: null,
    capacity: 3,
    day: new Date(Date.now() + 86400000 + 9 * 3600000).toISOString().slice(0, 10),
    time: '18:30',
  };
}

type DraftContextValue = {
  draft: RoomCreateDraft;
  roomEdit: RoomEdit | null;
  startRoomEdit: (edit: RoomEdit) => void;
  clearRoomEdit: () => void;
  updateDraft: (patch: Partial<RoomCreateDraft>) => void;
  resetDraft: () => void;
};

const RoomCreateDraftContext = createContext<DraftContextValue | null>(null);

export function RoomCreateDraftProvider({ children }: PropsWithChildren) {
  const [draft, setDraft] = useState<RoomCreateDraft>(initialDraft);
  const [roomEdit, setRoomEdit] = useState<RoomEdit | null>(null);
  const updateDraft = useCallback((patch: Partial<RoomCreateDraft>) => {
    setDraft(current => ({ ...current, ...patch }));
  }, []);
  const resetDraft = useCallback(() => setDraft(initialDraft()), []);
  return <RoomCreateDraftContext.Provider value={{ draft, updateDraft, resetDraft, roomEdit,
    startRoomEdit: setRoomEdit, clearRoomEdit: () => setRoomEdit(null) }}>
    {children}
  </RoomCreateDraftContext.Provider>;
}

export function useRoomCreateDraft() {
  const value = useContext(RoomCreateDraftContext);
  if (!value) throw new Error('방 만들기 입력 상태를 찾을 수 없습니다.');
  return value;
}
