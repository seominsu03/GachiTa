import { useCallback, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Button, Card, Notice, Screen, ui } from '@/components/ui/DesignSystem';
import { BottomNavigation } from '@/components/rooms/RoomScreens';
import { navigateRoom } from '@/components/rooms/RoomRoute';
import { useAuth } from '@/contexts/AuthContext';
import { useRemote } from '@/hooks/use-remote';
import { getMyRooms } from '@/features/rooms/api';
import { departureLabel, roomStatusLabels } from '@/features/rooms/presentation';
import type { Room } from '@/types/room';

const groupOrder = ['모집 중', '모집 완료', '탑승 확인 중', '택시 호출 중', '배차 완료', '운행 중', '정산 중', '정산 완료'] as const;

function roomGroupLabel(room: Room) {
  return room.status === 'RECRUITING' && room.participantCount >= room.capacity
    ? '모집 완료'
    : roomStatusLabels[room.status];
}

export default function MyPageScreen() {
  const { user, logout } = useAuth();
  const [busy, setBusy] = useState(false); const [error, setError] = useState<string | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<string[]>([]);
  const userId = user?.userId;
  const load = useCallback(() => userId ? getMyRooms() : Promise.resolve([]), [userId]);
  const remote = useRemote(load);
  const groups = groupOrder.map(label => ({ label, rooms: (remote.data ?? []).filter(room => roomGroupLabel(room) === label) }))
    .filter(group => group.rooms.length > 0);
  function toggleGroup(label: string) {
    setExpandedGroups(current => current.includes(label) ? current.filter(item => item !== label) : [...current, label]);
  }
  async function signOut() {
    setBusy(true); setError(null);
    try { await logout(); }
    catch (failure) { setError(failure instanceof Error ? failure.message : '로그아웃하지 못했어요.'); }
    finally { setBusy(false); }
  }
  return <Screen title="내 정보" tabs={<BottomNavigation active="mypage" navigate={navigateRoom} />}>
    <Card><Text style={ui.heading}>{user?.nickname}님</Text><Text style={ui.body}>아이디: {user?.username}</Text>{user?.name && <Text style={ui.body}>이름: {user.name}</Text>}{user?.phoneNumber && <Text style={ui.body}>전화번호: {user.phoneNumber}</Text>}</Card>
    {error && <Notice error>{error}</Notice>}
    <Button secondary busy={busy} onPress={() => void signOut()}>로그아웃</Button>
    <View style={ui.between}><Text style={ui.heading}>내 동승방</Text><Button secondary small busy={remote.loading} onPress={() => void remote.refresh()}>새로고침</Button></View>
    <Notice>상태를 누르면 내가 만들었거나 신청한 방을 볼 수 있어요. 각 목록은 출발 날짜가 늦은 순이며, 정산이 끝난 방도 다시 열 수 있어요. 최대 100개를 표시해요.</Notice>
    {remote.error && <Notice error>{remote.error}</Notice>}
    {remote.loading && <Notice>동승방을 불러오고 있어요.</Notice>}
    {!remote.loading && !remote.error && !remote.data?.length && <Notice>아직 참여 중인 동승방이 없어요.</Notice>}
    {groups.map(group => {
      const expanded = expandedGroups.includes(group.label);
      return <View key={group.label} style={{ gap: 8 }}>
        <Pressable accessibilityRole="button" accessibilityLabel={`${group.label} ${group.rooms.length}개`} accessibilityState={{ expanded }} onPress={() => toggleGroup(group.label)}>
          <Card><View style={ui.between}><Text style={ui.bold}>{group.label} · {group.rooms.length}개</Text><Text style={ui.blue}>{expanded ? '접기 ∧' : '보기 ∨'}</Text></View></Card>
        </Pressable>
        {expanded && group.rooms.map(room => <Card key={room.roomId}>
          <View style={[ui.between, { alignItems: 'flex-start', gap: 8 }]}><Text style={[ui.bold, { flex: 1, minWidth: 0, flexShrink: 1 }]}>{room.origin.name} → {room.destination.name}</Text><Text style={[ui.badge, { flexShrink: 0 }]}>{roomGroupLabel(room)}</Text></View>
          <Text style={ui.muted}>{departureLabel(room.departureAt)} · {room.hostUserId === userId ? '내가 만든 방' : '신청한 방'}</Text>
          <Button secondary small onPress={() => navigateRoom('detail', room.roomId)}>방 상세 보기</Button>
        </Card>)}
      </View>;
    })}
  </Screen>;
}
