import { useState } from 'react';
import { Modal, Text, TextInput, View } from 'react-native';
import { Button, Card, Icon, Notice, Screen, ui } from '@/components/ui/DesignSystem';
import { Avatar, MemberStrip, RoomSummary, money } from '@/components/rooms/RoomPresentation';
import { design as c } from '@/constants/design';
import type { Member, Room } from '@/types/room';
import type { Settlement } from '@/types/settlement';
import type { Navigate } from '@/components/rooms/RoomScreens';
import { calculateSettlement } from '@/features/settlement/calculations';

export type SettlementStage = 'settlement' | 'amount' | 'confirm' | 'status' | 'complete';

export function SettlementScreen({ onRefresh, stage, room, members, settlement, userId, navigate, onCreate, onReceipt, busy, error, preview = false }: {
  stage: SettlementStage; room: Room; members: Member[]; settlement: Settlement | null; userId: number; navigate: Navigate;
  onRefresh?: () => void; onCreate: (fare: number) => void; onReceipt: (userId: number) => void; busy?: boolean; error?: string | null; preview?: boolean;
}) {
  const [fare, setFare] = useState(preview ? '24000' : ''); const [inputError, setInputError] = useState<string | null>(null); const [showChat, setShowChat] = useState(false);
  const host = room.hostUserId === userId;
  const canInput = host && (preview || (room.status === 'SETTLING' && !settlement));
  const total = settlement?.totalFare ?? 0; const each = settlement?.farePerPerson ?? 0;
  const done = settlement?.receipts.filter(receipt => receipt.received).length ?? 0;
  const count = settlement?.participantCount ?? members.length;
  const title = { settlement: '요금 및 정산', amount: '실제 택시요금 입력', confirm: '정산 금액 확인', status: '정산 현황', complete: '정산 완료' }[stage];
  function create() {
    try { const amount = Number(fare.replace(/,/g, '')); calculateSettlement(amount, members.length); setInputError(null); onCreate(amount); }
    catch (failure) { setInputError(failure instanceof Error ? failure.message : '요금을 확인해 주세요.'); }
  }
  const footer = stage === 'settlement' ? <Button disabled={!settlement && !canInput} onPress={() => navigate(settlement ? 'confirm' : 'amount', room.roomId)}>{settlement ? '정산 금액 확인' : !host ? '방장의 요금 입력을 기다리고 있어요' : canInput ? '실제 요금 입력하기' : '운행 완료 후 요금을 입력할 수 있어요'}</Button>
    : stage === 'amount' ? <Button disabled={!canInput} busy={busy} onPress={create}>정산 금액 계산</Button>
      : stage === 'confirm' ? <Button onPress={() => navigate('status', room.roomId)}>정산 현황 확인</Button>
        : stage === 'complete' ? <><Button onPress={() => setShowChat(true)}>채팅방으로 돌아가기</Button><Button secondary onPress={() => navigate('home')}>홈으로 돌아가기</Button></>
          : done === count && count > 0 ? <Button onPress={() => navigate('complete', room.roomId)}>전체 정산 완료 확인</Button> : undefined;
  return <Screen title={title} right={onRefresh && <Button secondary small onPress={onRefresh}>새로고침</Button>} footer={footer}>
    {stage === 'complete' && <View style={{ alignItems: 'center', gap: 14, paddingVertical: 14 }}><View style={{ backgroundColor: c.tint, padding: 10, borderRadius: 30 }}><Icon name="check" /></View><Text style={ui.heading}>모든 참여자의 정산이 완료되었어요!</Text></View>}
    <RoomSummary room={room} compact />
    {stage === 'amount' && !canInput && <Notice>운행 완료 후 방장이 요금을 입력할 수 있어요. 이미 등록한 요금은 다시 입력하지 않아요.</Notice>}
    {(inputError || error) && <Notice error>{inputError ?? error}</Notice>}
    {stage === 'settlement' && <><Text style={[ui.heading, { marginTop: 4 }]}>함께 타고, 요금은 나눠요</Text><Card tinted style={{ padding: 20, gap: 15 }}><View style={ui.between}><Text style={ui.muted}>예상 택시요금</Text><Text style={ui.bold}>{preview ? '28,000원' : '운행 후 확인'}</Text></View><View style={ui.divider} /><Text style={ui.muted}>1인 예상 부담금</Text><Text style={{ fontSize: 34, color: c.blue, fontWeight: '700' }}>{preview ? '7,000원' : '—'}</Text><Text style={ui.muted}>{preview ? '28,000원 ÷ 4명 · 방장 포함' : '최종 요금과 실제 탑승 인원으로 계산해요.'}</Text></Card><MemberStrip members={members} hostUserId={room.hostUserId} currentUserId={userId} /><Notice>예상 요금은 실제 요금과 다를 수 있어요.{'\n'}탑승이 끝나면 방장이 실제 요금을 입력해 주세요.</Notice></>}
    {stage === 'amount' && <><View style={{ gap: 8, marginTop: 10 }}><Text style={[ui.heading, { fontSize: 24 }]}>실제로 낸 요금을 알려주세요</Text><Text style={[ui.muted, { fontSize: 14, lineHeight: 22 }]}>결제한 총 택시요금을 입력하면{'\n'}{members.length}명이 똑같이 나눌 금액을 확인할 수 있어요.</Text></View><Text style={ui.bold}>총 택시요금</Text>
      <View style={{ borderWidth: 2, borderColor: c.blue, borderRadius: 13, minHeight: 88, flexDirection: 'row', alignItems: 'center', padding: 16, gap: 8 }}><Text style={{ color: c.muted, fontSize: 21 }}>₩</Text><TextInput accessibilityLabel="총 택시요금" keyboardType="number-pad" maxLength={10} value={fare ? money(Number(fare.replace(/,/g, ''))) : ''} onChangeText={value => setFare(value.replace(/[^0-9]/g, ''))} editable={canInput && !busy} placeholder="0" style={{ flex: 1, minWidth: 0, color: c.ink, fontSize: 34, fontWeight: '700', textAlign: 'right' }} /><Text style={ui.body}>원</Text></View>
      <Text style={[ui.muted, { marginTop: -8 }]}>영수증 또는 택시 미터기의 최종 요금을 입력해 주세요.</Text><Card style={{ borderWidth: 0, paddingVertical: 18 }}><View style={ui.between}><Text style={ui.muted}>정산 참여 인원</Text><Text style={ui.bold}>{members.length}명 (방장 포함)</Text></View></Card><MemberStrip members={members} hostUserId={room.hostUserId} currentUserId={userId} /><Card tinted><View style={ui.row}><Icon name="info" size={18} /><Text style={[ui.muted, ui.blue]}>방장만 요금을 입력할 수 있어요.{'\n'}현재 방장: {room.host.nickname}{host ? ' (나)' : ''}</Text></View></Card></>}
    {stage === 'confirm' && <><Card tinted style={{ alignItems: 'center', paddingVertical: 30, gap: 20 }}><Text style={ui.bold}>1인당 부담금</Text><Text style={{ color: c.blue, fontSize: 42, fontWeight: '700' }}>{money(each)}원</Text><Text style={ui.muted}>{money(total)}원 ÷ {count}명</Text><Text style={[ui.muted, ui.blue]}>방장도 동일한 금액을 부담해요.</Text></Card><Card style={{ backgroundColor: c.white, gap: 18 }}><View style={ui.between}><Text style={ui.muted}>총 택시요금</Text><Text style={ui.bold}>{money(total)}원</Text></View><View style={ui.between}><Text style={ui.muted}>총 참여 인원</Text><Text style={ui.bold}>{count}명</Text></View></Card><MemberStrip members={members} hostUserId={room.hostUserId} currentUserId={userId} /><Notice>참여자별 정산 현황에서 수령 여부를 확인해 주세요.</Notice></>}
    {(stage === 'status' || stage === 'complete') && <><Card tinted><View style={ui.between}><Text style={ui.muted}>총 택시요금</Text><Text style={ui.bold}>{money(total)}원</Text></View>{stage === 'complete' && <View style={ui.between}><Text style={ui.muted}>총 참여 인원</Text><Text style={ui.bold}>{count}명</Text></View>}<View style={ui.between}><Text style={ui.muted}>1인당 부담금</Text><Text style={[ui.bold, ui.blue]}>{money(each)}원</Text></View></Card>
      {stage === 'status' && <View style={{ gap: 8 }}><View style={ui.between}><Text style={ui.heading}>참여자별 정산</Text><Text style={[ui.label, ui.blue]}>{done} / {count}명 완료</Text></View><View style={[ui.row, { gap: 4 }]}>{(settlement?.receipts ?? []).map((receipt, index) => <View key={receipt.userId} style={{ height: 6, flex: 1, borderRadius: 4, backgroundColor: index < done ? c.blue : c.line }} />)}</View></View>}
      {settlement?.receipts.map(receipt => <Card key={receipt.userId} tinted={receipt.userId === room.hostUserId} style={{ backgroundColor: receipt.userId === room.hostUserId ? c.tint : c.white, paddingVertical: stage === 'complete' ? 10 : 17 }}><View style={ui.row}><Avatar member={receipt} size={stage === 'complete' ? 32 : 40} /><View style={{ flex: 1, gap: 4 }}><Text style={ui.bold}>{receipt.nickname} {receipt.userId === room.hostUserId && <Text style={[ui.muted, ui.blue]}>방장{host ? ' · 나' : ''}</Text>}</Text><Text style={ui.muted}>{money(each)}원</Text></View>{receipt.received ? <Text style={ui.badge}>✓ 정산 완료</Text> : <View style={{ gap: 5 }}><Text style={[ui.muted, { textAlign: 'center', fontSize: 11 }]}>정산 대기</Text>{host ? <Button small busy={busy} onPress={() => onReceipt(receipt.userId)}>받았음</Button> : <Text style={ui.muted}>방장 수령 확인 대기</Text>}</View>}</View></Card>)}
      {stage === 'status' && <Card style={{ borderWidth: 0 }}><Text style={ui.label}>{done === count ? '모든 참여자의 정산이 완료되었어요.' : `아직 ${count - done}명의 정산을 기다리고 있어요.`}</Text><Text style={[ui.muted, { fontSize: 11 }]}>{host ? '송금을 받은 뒤 ‘받았음’을 눌러 확인해 주세요.' : '앱 밖에서 방장에게 직접 송금해 주세요.'}</Text></Card>}
    </>}
    {!!settlement?.remainderFare && <Notice>원 미만 버림으로 남은 차액 {settlement.remainderFare}원이 있어요. 차액 지원은 향후 정책이며 자동 송금되지 않아요.</Notice>}
    <Modal visible={showChat} transparent animationType="fade" onRequestClose={() => setShowChat(false)}><View style={{ flex: 1, justifyContent: 'center', padding: 24, backgroundColor: '#00000055' }}><Card><Text style={ui.heading}>채팅 화면 연결</Text><Text style={ui.body}>B 담당 채팅 화면은 이번 작업에서 변경하지 않았어요.</Text><Button onPress={() => { setShowChat(false); navigate('home'); }}>홈으로 돌아가기</Button></Card></View></Modal>
  </Screen>;
}
