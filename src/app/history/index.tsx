import { useCallback, useState } from 'react';
import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { Button, Card, Notice, Screen, ui } from '@/components/ui/DesignSystem';
import { BottomNavigation } from '@/components/rooms/RoomScreens';
import { navigateRoom } from '@/components/rooms/RoomRoute';
import { useAuth } from '@/contexts/AuthContext';
import { useRemote } from '@/hooks/use-remote';
import { getRideHistory } from '@/features/history/api';
import { departureLabel, roomStatusLabels } from '@/features/rooms/presentation';
import type { RideHistory } from '@/types/history';

const groupOrder = ['모집 중', '모집 완료', '탑승 확인 중', '택시 호출 중', '배차 완료', '운행 중', '정산 중', '정산 완료'] as const;
function groupLabel(ride: RideHistory) {
  const room = ride.room;
  return room.status === 'RECRUITING' && room.participantCount >= room.capacity ? '모집 완료' : roomStatusLabels[room.status];
}

export default function RideHistoryListScreen() {
  const { user } = useAuth();
  const [expandedGroups, setExpandedGroups] = useState<string[]>([]);
  const userId = user?.userId;
  const load = useCallback(() => userId ? getRideHistory() : Promise.resolve([]), [userId]);
  const remote = useRemote(load);
  const groups = groupOrder.map(label => ({ label, rides: (remote.data ?? []).filter(ride => groupLabel(ride) === label) }))
    .filter(group => group.rides.length > 0);
  const open = (ride: RideHistory) => ride.room.status === 'COMPLETED'
    ? router.push({ pathname: '/history/[rideId]', params: { rideId: String(ride.room.roomId) } })
    : navigateRoom('detail', ride.room.roomId);
  return <Screen title="동승 이력" onBack={() => router.replace('/(tabs)/mypage')}
    tabs={<BottomNavigation active="mypage" navigate={navigateRoom} />}>
    <View style={ui.between}><Text style={ui.heading}>내 동승방</Text><Button secondary small busy={remote.loading} onPress={() => void remote.refresh()}>새로고침</Button></View>
    <Notice>상태를 누르면 내가 만들었거나 신청한 방을 볼 수 있어요. 각 목록은 출발 날짜가 늦은 순이며, 정산 완료 기록은 7일이 지나도 남아요. 최근 100개를 표시해요.</Notice>
    {remote.error && <Notice error>{remote.error}</Notice>}
    {remote.loading && <Notice>동승 이력을 불러오고 있어요.</Notice>}
    {!remote.loading && !remote.error && !remote.data?.length && <Notice>아직 동승 이력이 없어요.</Notice>}
    {groups.map(group => {
      const expanded = expandedGroups.includes(group.label);
      return <View key={group.label} style={{ gap: 8 }}>
        <Pressable accessibilityRole="button" accessibilityLabel={`${group.label} ${group.rides.length}개`} accessibilityState={{ expanded }}
          onPress={() => setExpandedGroups(current => current.includes(group.label) ? current.filter(value => value !== group.label) : [...current, group.label])}>
          <Card><View style={ui.between}><Text style={ui.bold}>{group.label} · {group.rides.length}개</Text><Text style={ui.blue}>{expanded ? '접기 ∧' : '보기 ∨'}</Text></View></Card>
        </Pressable>
        {expanded && group.rides.map(ride => <Card key={ride.room.roomId}>
          <View style={[ui.between, { alignItems: 'flex-start', gap: 8 }]}><Text style={[ui.bold, { flex: 1, minWidth: 0, flexShrink: 1 }]}>{ride.room.origin.name} → {ride.room.destination.name}</Text><Text style={[ui.badge, { flexShrink: 0 }]}>{groupLabel(ride)}</Text></View>
          <Text style={ui.muted}>{departureLabel(ride.room.departureAt)} · {ride.room.hostUserId === userId ? '내가 만든 방' : '신청한 방'}</Text>
          <Button secondary small onPress={() => open(ride)}>{ride.room.status === 'COMPLETED' ? '정산 기록 보기' : '방 상세 보기'}</Button>
        </Card>)}
      </View>;
    })}
  </Screen>;
}
