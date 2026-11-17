import { useCallback, useState } from 'react';
import { Text, View } from 'react-native';
import { Button, Card, Notice, Screen, ui } from '@/components/ui/DesignSystem';
import { BottomNavigation } from '@/components/rooms/RoomScreens';
import { navigateRoom } from '@/components/rooms/RoomRoute';
import { useAuth } from '@/contexts/AuthContext';
import { useRemote } from '@/hooks/use-remote';
import { getMyRooms } from '@/features/rooms/api';
import { departureLabel, roomStatusLabels } from '@/features/rooms/presentation';

export default function MyPageScreen() {
  const { user, logout } = useAuth();
  const [busy, setBusy] = useState(false); const [error, setError] = useState<string | null>(null);
  const userId = user?.userId;
  const load = useCallback(() => userId ? getMyRooms() : Promise.resolve([]), [userId]);
  const remote = useRemote(load);
  async function signOut() {
    setBusy(true); setError(null);
    try { await logout(); }
    catch (failure) { setError(failure instanceof Error ? failure.message : '로그아웃하지 못했어요.'); }
    finally { setBusy(false); }
  }
  return <Screen title="내 정보" tabs={<BottomNavigation active="mypage" navigate={navigateRoom} />}>
    <Card><Text style={ui.heading}>{user?.nickname}님</Text><Text style={ui.body}>아이디: {user?.username}</Text>{user?.name && <Text style={ui.body}>이름: {user.name}</Text>}{user?.phoneNumber && <Text style={ui.body}>전화번호: {user.phoneNumber}</Text>}</Card>
    <View style={ui.between}><Text style={ui.heading}>내 동승방</Text><Button secondary small busy={remote.loading} onPress={() => void remote.refresh()}>새로고침</Button></View>
    <Notice>내가 만들었거나 신청한 방을 확인해요. 정산이 끝난 방도 다시 열 수 있어요. 최근 출발일순 최대 100개를 표시해요.</Notice>
    {remote.error && <Notice error>{remote.error}</Notice>}
    {remote.loading && <Notice>동승방을 불러오고 있어요.</Notice>}
    {!remote.loading && !remote.error && !remote.data?.length && <Notice>아직 참여 중인 동승방이 없어요.</Notice>}
    {remote.data?.map(room => <Card key={room.roomId}>
      <View style={[ui.between, { alignItems: 'flex-start', gap: 8 }]}><Text style={[ui.bold, { flex: 1, minWidth: 0, flexShrink: 1 }]}>{room.origin.name} → {room.destination.name}</Text><Text style={[ui.badge, { flexShrink: 0 }]}>{roomStatusLabels[room.status]}</Text></View>
      <Text style={ui.muted}>{departureLabel(room.departureAt)} · {room.hostUserId === userId ? '내가 만든 방' : '신청한 방'}</Text>
      <Button secondary small onPress={() => navigateRoom('detail', room.roomId)}>방 상세 보기</Button>
    </Card>)}
    {error && <Notice error>{error}</Notice>}
    <Button secondary busy={busy} onPress={() => void signOut()}>로그아웃</Button>
  </Screen>;
}
