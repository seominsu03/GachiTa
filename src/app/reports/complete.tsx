import { router, useLocalSearchParams } from 'expo-router';
import { Text } from 'react-native';
import { Button, Card, Notice, Screen, ui } from '@/components/ui/DesignSystem';
import { BottomNavigation } from '@/components/rooms/RoomScreens';
import { navigateRoom } from '@/components/rooms/RoomRoute';

export default function ReportCompleteScreen() {
  const { reportId } = useLocalSearchParams<{ reportId?: string }>();
  return <Screen title="신고 접수" onBack={() => router.replace('/reports')}
    tabs={<BottomNavigation active="mypage" navigate={navigateRoom} />}>
    <Card tinted><Text style={ui.heading}>신고가 접수되었습니다.</Text>
      {reportId && <Text style={ui.body}>접수 번호 #{reportId}</Text>}
      <Notice>제출한 내용은 내 신고 접수 내역에서 다시 확인할 수 있어요.</Notice></Card>
    <Button onPress={() => router.replace('/reports')}>접수 내역 보기</Button>
  </Screen>;
}
