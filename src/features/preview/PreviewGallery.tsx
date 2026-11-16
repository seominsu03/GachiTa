import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { AuthForm } from '@/components/auth/AuthForm';
import { CreateRoomScreen, ParticipantsScreen, RoomDetailScreen, RoomListScreen } from '@/components/rooms/RoomScreens';
import { SettlementScreen, type SettlementStage } from '@/components/settlement/SettlementScreens';
import { Screen, ui } from '@/components/ui/DesignSystem';
import { design as c } from '@/constants/design';
import { calculateSettlement } from '@/features/settlement/calculations';
import { homeRooms, host, passengers, roomList, sampleBill, sampleMembers, sampleRoom } from './fixtures';

export const previewScreens = [
  ['login', '로그인'], ['signup', '회원가입'], ['home', '메인'], ['rooms', '택시방 목록'], ['create', '택시방 생성'],
  ['detail', '상세 · 신청 전'], ['requested', '상세 · 신청 후'], ['participants', '동승자 관리'], ['accepted', '수락 후'], ['rejected', '거절 후'], ['full', '모집 완료'],
  ['settlement', '요금 및 정산'], ['amount', '실제 요금 입력'], ['confirm', '정산 금액 확인'], ['status', '정산 현황'], ['complete', '정산 완료'],
] as const;

function presetMembers(key: string) {
  return passengers.map(member => ({ ...member, status: member.userId === 3 && ['accepted', 'rejected', 'full'].includes(key) ? 'APPROVED' as const
    : member.userId === 4 && ['rejected', 'full'].includes(key) ? 'REJECTED' as const
      : member.userId === 5 && key === 'full' ? 'APPROVED' as const : member.status }));
}

export function PreviewGallery() {
  const { screen: parameter } = useLocalSearchParams<{ screen?: string }>();
  const initial = previewScreens.some(([key]) => key === parameter) ? parameter! : 'home';
  const [screen, setScreen] = useState(initial);
  const [members, setMembers] = useState(() => presetMembers(initial));
  const [room, setRoom] = useState(sampleRoom);
  const [bill, setBill] = useState(() => sampleBill(initial === 'complete'));

  function select(key: string) {
    setScreen(key); setMembers(presetMembers(key)); setRoom(sampleRoom); setBill(sampleBill(key === 'complete'));
  }
  const count = members.filter(member => member.status === 'APPROVED').length + 1;
  const currentRoom = { ...room, participantCount: count };
  const navigate = (key: string) => setScreen(key);
  const requested = screen === 'requested';
  let content;
  if (screen === 'login' || screen === 'signup') content = <AuthForm key={screen} mode={screen} preview onNavigate={navigate} />;
  else if (screen === 'home' || screen === 'rooms') content = <RoomListScreen key={screen} home={screen === 'home'} rooms={screen === 'home' ? homeRooms : roomList} navigate={navigate} />;
  else if (screen === 'create') content = <CreateRoomScreen preview onCreate={input => { setRoom({ ...room, ...input, host, hostUserId: 1 }); setMembers([]); setScreen('participants'); }} />;
  else if (screen === 'detail' || requested) content = <RoomDetailScreen room={currentRoom} participations={requested ? [...members, { userId: 99, nickname: '나', participationId: 99, roomId: 1, status: 'PENDING' }] : members} userId={99} navigate={navigate} onRequest={() => setScreen('requested')} onCancel={() => setScreen('detail')} />;
  else if (['participants', 'accepted', 'rejected', 'full'].includes(screen)) content = <ParticipantsScreen room={currentRoom} participations={members} navigate={navigate} onApprove={id => setMembers(values => values.map(member => member.participationId === id && count < currentRoom.capacity ? { ...member, status: 'APPROVED' } : member))} onReject={id => setMembers(values => values.map(member => member.participationId === id ? { ...member, status: 'REJECTED' } : member))} />;
  else if (['settlement', 'amount', 'confirm', 'status', 'complete'].includes(screen)) content = <SettlementScreen key={screen} stage={screen as SettlementStage} room={{ ...room, participantCount: 4 }} members={sampleMembers} settlement={bill} userId={1} preview navigate={navigate}
    onCreate={fare => { setBill({ ...bill, ...calculateSettlement(fare, 4) }); setScreen('confirm'); }} onReceipt={userId => setBill(value => ({ ...value, receipts: value.receipts.map(receipt => receipt.userId === userId ? { ...receipt, received: true } : receipt) }))} />;
  else content = <Screen title="내 정보"><Text style={ui.heading}>수원러님</Text><Text style={ui.body}>예시 데이터로 보는 화면입니다. 실제 가입·로그인과 데이터 저장은 로그인 화면에서 이용해 주세요.</Text><Pressable onPress={() => select('home')}><Text style={ui.blue}>홈으로 돌아가기</Text></Pressable></Screen>;
  return <View style={{ flex: 1, backgroundColor: c.white }}>
    <View style={{ borderBottomWidth: 1, borderColor: c.line, paddingVertical: 6, paddingHorizontal: 12, backgroundColor: c.tint }}><Text style={{ fontSize: 11, color: c.blue, marginBottom: 4 }}>디자인 미리보기 · 예시 데이터 · 실제 계정/서버와 분리</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>{previewScreens.map(([key, label]) => <Pressable key={key} accessibilityRole="button" accessibilityState={{ selected: key === screen }} onPress={() => select(key)} style={{ paddingHorizontal: 9, paddingVertical: 6, borderRadius: 7, backgroundColor: key === screen ? c.blue : c.white }}><Text style={{ fontSize: 11, color: key === screen ? c.white : c.ink }}>{label}</Text></Pressable>)}</ScrollView></View>
    {content}
  </View>;
}
