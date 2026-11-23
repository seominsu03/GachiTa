import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { Text } from 'react-native';
import { BottomNavigation } from '@/components/rooms/RoomScreens';
import { navigateRoom } from '@/components/rooms/RoomRoute';
import { TaxiProgressCard } from '@/components/taxi/TaxiProgressCard';
import { Button, Card, Notice, Screen, ui } from '@/components/ui/DesignSystem';
import { useAuth } from '@/contexts/AuthContext';
import { getRoomById } from '@/features/rooms/api';
import { advanceTaxi, getTaxiStatus, type TaxiStatus } from '@/features/taxi/api';
import { taxiStageCopy } from '@/features/taxi/stages';
import type { Room } from '@/types/room';

export default function TaxiScreen() {
  const { roomId: value } = useLocalSearchParams<{ roomId?: string }>();
  const roomId = Number(value);
  const { user } = useAuth();
  const [snapshot, setSnapshot] = useState<{ room: Room; taxi: TaxiStatus } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const actionLock = useRef(false);

  const refresh = useCallback(async () => {
    if (!Number.isSafeInteger(roomId) || roomId <= 0 || !user) return;
    try {
      const [room, taxi] = await Promise.all([getRoomById(roomId), getTaxiStatus(roomId)]);
      setSnapshot({ room, taxi });
      setError(null);
    } catch (cause) { setError(cause instanceof Error ? cause.message : '가상 택시 상태를 불러오지 못했어요.'); }
  }, [roomId, user]);

  useFocusEffect(useCallback(() => {
    void refresh();
    const timer = setInterval(() => void refresh(), 3000);
    return () => clearInterval(timer);
  }, [refresh]));

  async function advance() {
    if (actionLock.current) return;
    const expectedStatus = snapshot?.taxi.status;
    if (!expectedStatus) return;
    actionLock.current = true;
    setBusy(true);
    try {
      const taxi = await advanceTaxi(roomId, expectedStatus);
      setSnapshot(current => current ? { ...current, taxi } : current);
      setError(null);
      if (taxi.status === 'SETTLING') navigateRoom('settlement', roomId);
    } catch (cause) { setError(cause instanceof Error ? cause.message : '가상 운행을 진행하지 못했어요.'); }
    finally { actionLock.current = false; setBusy(false); }
  }

  const room = snapshot?.room;
  const status = snapshot?.taxi.status;
  const isHost = room?.hostUserId === user?.userId;
  const action = status ? taxiStageCopy[status]?.action : undefined;
  return <Screen title="가상 택시 이용" onBack={() => router.canGoBack() ? router.back() : router.replace('/(tabs)/chats')}
    footer={<>
      {isHost && action && <Button busy={busy} onPress={() => void advance()}>{action}</Button>}
      {(status === 'SETTLING' || status === 'COMPLETED') && <Button onPress={() => navigateRoom('settlement', roomId)}>요금 및 정산으로 이동</Button>}
      <Button secondary onPress={() => void refresh()}>상태 새로고침</Button>
    </>}
    tabs={<BottomNavigation active="chats" navigate={navigateRoom} />}>
    {!room || !status ? <Notice>{error ?? '가상 택시 상태를 불러오는 중이에요.'}</Notice> : <>
      <Card><Text style={ui.heading}>{room.origin.name} → {room.destination.name}</Text><Text style={ui.muted}>탑승 인원 {snapshot.taxi.participantCount}명 · {isHost ? '방장' : '참여자'}</Text></Card>
      <TaxiProgressCard status={status} />
      {!isHost && <Notice>진행 단계는 방장이 변경합니다. 화면은 자동으로 갱신돼요.</Notice>}
      {error && <Notice error>{error}</Notice>}
      <Button secondary onPress={() => navigateRoom('chat', roomId)}>채팅방으로 돌아가기</Button>
    </>}
  </Screen>;
}
