import { useState } from 'react';
import { router } from 'expo-router';
import { Text, View } from 'react-native';
import { Button, Card, Icon, Notice, Screen, ui } from '@/components/ui/DesignSystem';
import { BottomNavigation } from '@/components/rooms/RoomScreens';
import { navigateRoom } from '@/components/rooms/RoomRoute';
import { useAuth } from '@/contexts/AuthContext';

export default function MyPageScreen() {
  const { user, logout } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function signOut() {
    setBusy(true); setError(null);
    try { await logout(); }
    catch (failure) { setError(failure instanceof Error ? failure.message : '로그아웃하지 못했어요.'); }
    finally { setBusy(false); }
  }
  const menu = [
    { label: '동승 이력', icon: 'car' as const, detail: '내가 만든 방과 참여한 방', onPress: () => router.push('/history') },
    { label: '후기 및 평가', icon: 'star' as const, detail: '받은 후기와 작성한 후기', onPress: () => router.push('/reviews') },
    { label: '친구 목록', icon: 'people' as const, detail: '친구 찾기와 요청 관리', onPress: () => router.push('/friends') },
    { label: '신고하기', icon: 'info' as const, detail: '사용자 신고와 접수 내역', onPress: () => router.push('/reports') },
  ];
  return <Screen title="내 정보" tabs={<BottomNavigation active="mypage" navigate={navigateRoom} />}>
    <Card style={{ padding: 20, gap: 12 }}>
      <Text style={ui.heading}>{user?.nickname}님</Text>
      <Text style={ui.body}>아이디: {user?.username}</Text>
      {user?.name && <Text style={ui.body}>이름: {user.name}</Text>}
      {user?.phoneNumber && <Text style={ui.body}>전화번호: {user.phoneNumber}</Text>}
    </Card>
    <Text style={ui.heading}>내 메뉴</Text>
    {menu.map(item => <Card key={item.label} style={{ padding: 16 }}>
      <View style={ui.row}><Icon name={item.icon} /><View style={{ flex: 1 }}><Text style={ui.bold}>{item.label}</Text><Text style={ui.muted}>{item.detail}</Text></View></View>
      <Button secondary small disabled={!item.onPress} onPress={item.onPress ?? (() => {})}>{item.label} 열기</Button>
    </Card>)}
    {error && <Notice error>{error}</Notice>}
    <Button secondary busy={busy} onPress={() => void signOut()}>로그아웃</Button>
  </Screen>;
}
