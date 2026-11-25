import { useCallback, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { Text, TextInput, View } from 'react-native';
import { Button, Card, Notice, Screen, ui } from '@/components/ui/DesignSystem';
import { BottomNavigation } from '@/components/rooms/RoomScreens';
import { navigateRoom } from '@/components/rooms/RoomRoute';
import { useAuth } from '@/contexts/AuthContext';
import { useRemote } from '@/hooks/use-remote';
import { getRideHistoryById } from '@/features/history/api';
import { createRideReview } from '@/features/reviews/api';

export default function CreateReviewScreen() {
  const { roomId, revieweeUserId } = useLocalSearchParams<{ roomId: string; revieweeUserId: string }>();
  const id = Number(roomId);
  const targetId = Number(revieweeUserId);
  const { user } = useAuth();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(() => Number.isSafeInteger(id) && id > 0 && user ? getRideHistoryById(id)
    : Promise.reject(new Error('올바른 동승 기록이 아니에요.')), [id, user]);
  const remote = useRemote(load);
  const target = remote.data?.settlement?.receipts.find(receipt => receipt.userId === targetId && receipt.userId !== user?.userId);
  async function submit() {
    if (!target || busy) return;
    setBusy(true); setError(null);
    try {
      await createRideReview(id, targetId, rating, comment);
      router.replace({ pathname: '/history/[rideId]', params: { rideId: String(id) } });
    } catch (failure) { setError(failure instanceof Error ? failure.message : '후기를 저장하지 못했어요.'); }
    finally { setBusy(false); }
  }
  return <Screen title="후기 작성" onBack={() => router.replace({ pathname: '/history/[rideId]', params: { rideId: String(id) } })}
    tabs={<BottomNavigation active="mypage" navigate={navigateRoom} />}>
    {remote.loading && <Notice>동승 기록을 불러오고 있어요.</Notice>}
    {remote.error && <Notice error>{remote.error}</Notice>}
    {remote.data && !target && <Notice error>이 방에서 후기 대상을 확인할 수 없어요.</Notice>}
    {target && <><Card><Text style={ui.heading}>{target.nickname}님에게 후기 남기기</Text>
      <Notice>실제로 함께 탄 사람에게만 작성할 수 있어요. 한 방에서 같은 사람에게는 한 번만 남길 수 있습니다.</Notice></Card>
      <Text style={ui.heading}>평점</Text><View style={ui.row}>{[1, 2, 3, 4, 5].map(value => <View key={value} style={{ flex: 1 }}>
        <Button secondary={rating !== value} small onPress={() => setRating(value)}>{value}점</Button></View>)}</View>
      <Text style={ui.heading}>후기 (선택)</Text>
      <TextInput accessibilityLabel="후기 내용" multiline maxLength={500} value={comment} onChangeText={setComment}
        placeholder="함께 탄 경험을 적어 주세요" style={[ui.field, { minHeight: 120, textAlignVertical: 'top', padding: 14 }]} />
      <Notice>{comment.length}/500자</Notice>
      {error && <Notice error>{error}</Notice>}
      <Button busy={busy} onPress={() => void submit()}>후기 저장</Button>
    </>}
  </Screen>;
}
