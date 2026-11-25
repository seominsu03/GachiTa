import { useCallback } from 'react';
import { router } from 'expo-router';
import { Text, View } from 'react-native';
import { Button, Card, Notice, Screen, ui } from '@/components/ui/DesignSystem';
import { BottomNavigation } from '@/components/rooms/RoomScreens';
import { navigateRoom } from '@/components/rooms/RoomRoute';
import { useAuth } from '@/contexts/AuthContext';
import { useRemote } from '@/hooks/use-remote';
import { getMyReports } from '@/features/reports/api';
import { reportReasonLabel } from '@/types/report';

export default function ReportsScreen() {
  const { user } = useAuth();
  const load = useCallback(() => user ? getMyReports() : Promise.reject(new Error('로그인이 필요해요.')), [user]);
  const remote = useRemote(load);
  return <Screen title="신고하기" onBack={() => router.replace('/(tabs)/mypage')}
    tabs={<BottomNavigation active="mypage" navigate={navigateRoom} />}>
    <Notice>안전한 동승을 위해 문제가 있었던 사용자를 신고할 수 있어요. 제출한 내용은 다른 사용자에게 공개되지 않습니다.</Notice>
    <Button onPress={() => router.push('/reports/create')}>사용자 신고하기</Button>
    <View style={ui.between}><Text style={ui.heading}>내 신고 접수 내역</Text>
      <Button secondary small busy={remote.loading} onPress={() => void remote.refresh()}>새로고침</Button></View>
    {remote.loading && <Notice>접수 내역을 불러오고 있어요.</Notice>}
    {remote.error && <Notice error>{remote.error}</Notice>}
    {remote.data && (remote.data.length ? remote.data.map(report => <Card key={report.reportId}>
      <Text style={ui.bold}>{report.reportedNickname} (@{report.reportedUsername})</Text>
      <Text style={ui.body}>{reportReasonLabel(report.reason)}</Text>
      <Text style={ui.muted}>{report.description}</Text>
      <Text style={ui.muted}>접수: {new Date(report.createdAt).toLocaleDateString('ko-KR')} · #{report.reportId}</Text>
    </Card>) : <Notice>아직 접수한 신고가 없어요.</Notice>)}
  </Screen>;
}
