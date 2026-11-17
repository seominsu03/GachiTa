import { useState } from 'react';
import { Modal, Text, View } from 'react-native';
import { Button, Card, Notice, ui } from '@/components/ui/DesignSystem';
import type { Room } from '@/types/room';

export function HostRoomControls({ room, busy, onUpdate, onDelete, onEditLocations, canEditLocations }: {
  room: Room; busy?: boolean; onUpdate: (capacity: number) => Promise<void>; onDelete: () => Promise<void>;
  onEditLocations?: () => void; canEditLocations?: boolean;
}) {
  const [mode, setMode] = useState<'capacity' | 'delete' | null>(null);
  const [capacity, setCapacity] = useState(room.capacity);
  const [error, setError] = useState<string | null>(null);
  async function save() {
    try { setError(null); if (mode === 'capacity') await onUpdate(capacity); else await onDelete(); setMode(null); }
    catch (failure) { setError(failure instanceof Error ? failure.message : '변경하지 못했어요.'); }
  }
  function open(next: 'capacity' | 'delete') { setCapacity(room.capacity); setError(null); setMode(next); }
  return <Card>
    <Text style={ui.heading}>방 관리</Text>
    <Notice>총 정원은 방장 포함 2~4명입니다. 정원을 모두 채우지 않아도 실제 확정 인원으로 요금을 나눠요.</Notice>
    <Button secondary disabled={busy || room.status !== 'RECRUITING'} onPress={() => open('capacity')}>모집 인원 수정</Button>
    {onEditLocations && <Button secondary disabled={busy || !canEditLocations} onPress={onEditLocations}>장소 변경</Button>}
    {onEditLocations && !canEditLocations && <Notice>참여자나 대기 신청자가 없는 모집 중인 방에서만 장소를 변경할 수 있어요.</Notice>}
    <Button secondary disabled={busy || room.status !== 'RECRUITING'} onPress={() => open('delete')}>택시방 삭제</Button>
    {room.status !== 'RECRUITING' && <Notice>탑승 확인이 시작된 이후에는 정원 변경과 방 삭제가 제한됩니다.</Notice>}
    <Modal visible={mode !== null} transparent animationType="fade" onRequestClose={() => { if (!busy) setMode(null); }}>
      <View style={{ flex: 1, justifyContent: 'center', padding: 24, backgroundColor: '#00000055' }}><Card style={{ backgroundColor: '#fff', gap: 16 }}>
        <Text style={ui.heading}>{mode === 'capacity' ? '모집 인원 수정' : '택시방을 삭제할까요?'}</Text>
        {mode === 'capacity' ? <>
          <Notice>현재 확정 인원은 방장 포함 {room.participantCount}명입니다. 대기 중인 신청은 정원에 포함하지 않습니다.</Notice>
          <View style={ui.row}>{[2, 3, 4].map(count => <View key={count} style={{ flex: 1 }}><Button secondary={capacity !== count} disabled={busy || count < room.participantCount} onPress={() => setCapacity(count)}>{count}명</Button></View>)}</View>
        </> : <Notice>방 목록과 내 동승방에서 사라지고, 참여 신청도 취소됩니다. 삭제 후 되돌릴 수 없습니다.</Notice>}
        {error && <Notice error>{error}</Notice>}
        <Button busy={busy} onPress={() => void save()}>{mode === 'capacity' ? '인원 변경 저장' : '삭제 확인'}</Button>
        <Button secondary disabled={busy} onPress={() => setMode(null)}>취소</Button>
      </Card></View>
    </Modal>
  </Card>;
}
