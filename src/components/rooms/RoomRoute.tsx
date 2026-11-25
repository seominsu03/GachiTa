import { useCallback, useRef, useState } from 'react';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Text } from 'react-native';
import { Button, Notice, Screen, ui } from '@/components/ui/DesignSystem';
import { CreateRoomScreen, ParticipantsScreen, RoomDetailScreen, RoomListScreen, type Navigate } from './RoomScreens';
import { SettlementScreen, type SettlementStage } from '@/components/settlement/SettlementScreens';
import { useAuth } from '@/contexts/AuthContext';
import { useRemote } from '@/hooks/use-remote';
import * as rooms from '@/features/rooms/api';
import { toDeparturePeriod } from '@/features/rooms/search';
import * as participation from '@/features/participation/api';
import * as settlement from '@/features/settlement/api';
import { ApiError } from '@/services/apiClient';
import type { RoomCreateRequest } from '@/types/room';
import { useRoomCreateDraft } from '@/features/maps/RoomCreateDraftContext';

export const navigateRoom: Navigate = (screen, roomId, search) => {
  if (screen === 'home') router.push('/(tabs)');
  else if (screen === 'rooms') router.push({ pathname: '/(tabs)/rooms', params: search });
  else if (screen === 'chats') router.push('/(tabs)/chats');
  else if (screen === 'chat') router.push({ pathname: '/rooms/[roomId]/chat', params: { roomId: String(roomId) } });
  else if (screen === 'mypage') router.push('/(tabs)/mypage');
  else if (screen === 'create') router.push('/rooms/create');
  else if (screen === 'detail') router.push({ pathname: '/rooms/[roomId]', params: { roomId: String(roomId) } });
  else if (screen === 'participants') router.push({ pathname: '/rooms/[roomId]/participants', params: { roomId: String(roomId) } });
  else if (screen === 'settlement') router.push({ pathname: '/rooms/[roomId]/settlement', params: { roomId: String(roomId) } });
  else if (screen === 'amount' || screen === 'confirm') router.push({ pathname: '/rooms/[roomId]/settlement/amount', params: { roomId: String(roomId), step: screen } });
  else if (screen === 'status') router.push({ pathname: '/rooms/[roomId]/settlement/status', params: { roomId: String(roomId) } });
  else if (screen === 'complete') router.push({ pathname: '/rooms/[roomId]/settlement/complete', params: { roomId: String(roomId) } });
};

export function RoomsRoute({ home = false }: { home?: boolean }) {
  const params = useLocalSearchParams<{ origin?: string; destination?: string; period?: string }>();
  const destination = params.destination ?? ''; const origin = params.origin ?? ''; const period = params.period ?? '전체';
  const { user } = useAuth(); const userId = user?.userId;
  const load = useCallback(() => userId ? rooms.getRooms({ origin, destination, period: toDeparturePeriod(period) }) : Promise.resolve([]), [origin, destination, period, userId]); const remote = useRemote(load);
  return <RoomListScreen key={`${params.origin ?? ''}-${destination}-${params.period ?? ''}`} home={home} onSearch={filter => router.setParams(filter)} rooms={remote.data ?? []} navigate={navigateRoom} initialSearch={params} error={remote.error} loading={remote.loading} refresh={() => void remote.refresh()} />;
}

function useMutation() {
  const lock = useRef(false); const [busy, setBusy] = useState(false); const [error, setError] = useState<string | null>(null);
  async function run(action: () => Promise<void>) {
    if (lock.current) return; lock.current = true; setBusy(true); setError(null);
    try { await action(); } catch (failure) { setError(failure instanceof Error ? failure.message : '요청에 실패했어요.'); throw failure; }
    finally { lock.current = false; setBusy(false); }
  }
  return { busy, error, run };
}

export function CreateRoomRoute() {
  const mutation = useMutation();
  const { resetDraft } = useRoomCreateDraft();
  return <CreateRoomScreen busy={mutation.busy} error={mutation.error}
    onOpenMap={focus => router.push({ pathname: '/map/picker', params: { focus } })}
    onCreate={(input: RoomCreateRequest) => void mutation.run(async () => { const created = await rooms.createRoom(input); resetDraft(); router.replace({ pathname: '/rooms/[roomId]/participants', params: { roomId: String(created.roomId) } }); }).catch(() => {})} />;
}

export function RoomRoute({ screen }: { screen: 'detail' | 'participants' | SettlementStage }) {
  const { roomId: roomIdParam, step } = useLocalSearchParams<{ roomId: string; step?: string }>(); const roomId = Number(roomIdParam);
  const { user } = useAuth(); const mutation = useMutation();
  const userId = user?.userId;
  const isSettlement = screen !== 'detail' && screen !== 'participants';
  const load = useCallback(async () => {
    if (!userId) throw new Error('로그인이 필요해요.');
    if (!Number.isSafeInteger(roomId) || roomId < 1) throw new Error('올바른 택시방 주소가 아니에요.');
    const [room, members, bill] = await Promise.all([rooms.getRoomById(roomId), participation.getParticipations(roomId), isSettlement ? settlement.getSettlement(roomId).catch(error => { if (error instanceof ApiError && error.status === 404) return null; throw error; }) : Promise.resolve(null)]);
    return { room, members, bill };
  }, [roomId, isSettlement, userId]);
  const remote = useRemote(load);
  const awaitingApproval = screen === 'detail' && remote.data?.members.some(member => member.userId === userId && member.status === 'PENDING');
  const refresh = remote.refresh;
  useFocusEffect(useCallback(() => {
    if (!awaitingApproval) return;
    const timer = setInterval(() => void refresh(), 3000);
    return () => clearInterval(timer);
  }, [awaitingApproval, refresh]));
  const { startRoomEdit } = useRoomCreateDraft();
  if (!remote.data) return <Screen title="택시방"><Text style={ui.body}>{remote.loading ? '불러오는 중…' : '택시방을 불러오지 못했어요.'}</Text>{remote.error && <Notice error>{remote.error}</Notice>}<Button secondary onPress={() => void remote.refresh()}>다시 불러오기</Button></Screen>;
  const { room, members, bill } = remote.data;
  const mutate = (action: () => Promise<unknown>, next?: string) => void mutation.run(async () => { await action(); await remote.refresh(); if (next) navigateRoom(next, roomId); }).catch(() => {});
  const updateCapacity = (capacity: number) => mutation.run(async () => { await rooms.updateRoomCapacity(roomId, capacity); await remote.refresh(); });
  const editLocations = () => {
    if (!remote.data) return;
    const toPoint = (location: typeof room.origin) => ({ ...location, source: 'map' as const,
      roadAddress: location.name, buildingCandidate: null, placeId: null });
    startRoomEdit({ roomId, origin: toPoint(room.origin), destination: toPoint(room.destination) });
    router.push({ pathname: '/map/picker', params: { mode: 'edit-locations' } });
  };
  const deleteCurrentRoom = () => mutation.run(async () => {
    await rooms.deleteRoom(roomId);
    router.replace('/history');
  });
  const error = mutation.error ?? remote.error;
  if (screen === 'detail') return <RoomDetailScreen onUpdateCapacity={updateCapacity} onDeleteRoom={deleteCurrentRoom} onEditLocations={editLocations} onRefresh={() => void remote.refresh()} room={room} participations={members} userId={user?.userId ?? 0} navigate={navigateRoom} busy={mutation.busy} error={error} onRequest={() => mutate(() => participation.requestParticipation(roomId))} onCancel={id => mutate(() => participation.cancelParticipation(roomId, id))} />;
  if (screen === 'participants') {
    if (user?.userId !== room.hostUserId) return <Screen title="동승자 관리"><Notice error>방장만 동승자를 관리할 수 있어요.</Notice></Screen>;
    return <ParticipantsScreen onUpdateCapacity={updateCapacity} onDeleteRoom={deleteCurrentRoom} onEditLocations={editLocations} onRefresh={() => void remote.refresh()} room={room} participations={members} navigate={navigateRoom} busy={mutation.busy} error={error} onApprove={id => mutate(() => participation.approveParticipation(roomId, id))} onReject={id => mutate(() => participation.rejectParticipation(roomId, id))} />;
  }
  const requestedStage = screen === 'amount' && (bill || step === 'confirm') ? 'confirm' : screen === 'amount' && userId !== room.hostUserId ? 'settlement' : screen;
  // Already-created bills are immutable; a stale amount URL opens the saved result.
  const stage = requestedStage === 'complete' && bill?.receipts.some(receipt => !receipt.received) ? 'status' : requestedStage;
  if (stage !== 'settlement' && stage !== 'amount' && !bill) return <Screen title="정산"><Notice>아직 방장이 최종 요금을 입력하지 않았어요.</Notice><Button onPress={() => navigateRoom('settlement', roomId)}>요금 및 정산으로 돌아가기</Button></Screen>;
  return <SettlementScreen onRefresh={() => void remote.refresh()} stage={stage} room={room} members={[room.host, ...members.filter(p => p.status === 'APPROVED' || p.status === 'BOARDING_CONFIRMED')]} settlement={bill} userId={user?.userId ?? 0} navigate={navigateRoom} busy={mutation.busy} error={error}
    onCreate={fare => mutate(() => settlement.createSettlement(roomId, fare), 'confirm')} onReceipt={id => mutate(() => settlement.confirmReceipt(roomId, id))} />;
}
