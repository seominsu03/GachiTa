import { useCallback, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { Text, View } from 'react-native';
import { Button, Card, Notice, Screen, ui } from '@/components/ui/DesignSystem';
import { BottomNavigation } from '@/components/rooms/RoomScreens';
import { navigateRoom } from '@/components/rooms/RoomRoute';
import { useAuth } from '@/contexts/AuthContext';
import { useRemote } from '@/hooks/use-remote';
import { getRideHistoryById, hideRideHistory } from '@/features/history/api';
import { departureLabel } from '@/features/rooms/presentation';
import { getRoomReviews } from '@/features/reviews/api';

export default function RideHistoryDetailScreen() {
  const { rideId } = useLocalSearchParams<{ rideId: string }>();
  const id = Number(rideId);
  const { user } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(() => {
    if (!Number.isSafeInteger(id) || id < 1 || !user) return Promise.reject(new Error('동승 이력을 확인할 수 없어요.'));
    return getRideHistoryById(id).then(async history => ({ history, reviews: history.settlement ? await getRoomReviews(id) : [] }));
  }, [id, user]);
  const remote = useRemote(load);
  async function hide() {
    if (busy) return;
    setBusy(true); setError(null);
    try { await hideRideHistory(id); router.replace('/history'); }
    catch (failure) { setError(failure instanceof Error ? failure.message : '이력을 삭제하지 못했어요.'); }
    finally { setBusy(false); }
  }
  const data = remote.data?.history;
  const reviews = remote.data?.reviews ?? [];
  return <Screen title="동승 기록" onBack={() => router.replace('/history')}
    tabs={<BottomNavigation active="mypage" navigate={navigateRoom} />}>
    {remote.loading && <Notice>동승 기록을 불러오고 있어요.</Notice>}
    {remote.error && <Notice error>{remote.error}</Notice>}
    {data && <>
      <Card><Text style={ui.heading}>{data.room.origin.name} → {data.room.destination.name}</Text>
        <Text style={ui.muted}>출발 {departureLabel(data.room.departureAt)}</Text>
        <Text style={ui.body}>방장 {data.room.host.nickname} · 총 {data.room.participantCount}명</Text></Card>
      <Card tinted><Text style={ui.heading}>정산 내역</Text>
        {data.settlement ? <><View style={ui.between}><Text style={ui.body}>총 택시요금</Text><Text style={ui.bold}>{data.settlement.totalFare.toLocaleString()}원</Text></View>
          <View style={ui.between}><Text style={ui.body}>1인당 부담금</Text><Text style={ui.bold}>{data.settlement.farePerPerson.toLocaleString()}원</Text></View></>
          : <Notice>저장된 정산 내역이 없습니다.</Notice>}</Card>
      {data.settlement && <Card><Text style={ui.heading}>함께 탄 참여자</Text>
        {data.settlement.receipts.map(receipt => <View key={receipt.userId} style={{ gap: 6 }}>
          <View style={ui.between}><Text style={ui.body}>{receipt.nickname}{receipt.userId === user?.userId ? ' (나)' : ''}</Text>
            <Text style={ui.blue}>{receipt.received ? '정산 완료' : '정산 확인 전'}</Text></View>
          {receipt.userId !== user?.userId && <Button secondary small
            disabled={reviews.some(review => review.reviewerUserId === user?.userId && review.revieweeUserId === receipt.userId)}
            onPress={() => router.push({ pathname: '/reviews/create', params: { roomId: String(id), revieweeUserId: String(receipt.userId) } })}>
            {reviews.some(review => review.reviewerUserId === user?.userId && review.revieweeUserId === receipt.userId) ? '후기 작성 완료' : '후기 작성'}</Button>}
        </View>)}</Card>}
      {reviews.length > 0 && <Card><Text style={ui.heading}>이 방의 후기</Text>
        {reviews.map(review => <View key={review.reviewId} style={{ gap: 3 }}><Text style={ui.bold}>{review.reviewerNickname} → {review.revieweeNickname} · {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</Text>
          {review.comment ? <Text style={ui.body}>{review.comment}</Text> : null}</View>)}</Card>}
      <Notice>삭제하면 내 목록에서만 사라져요. 함께 탄 다른 사람의 기록은 유지됩니다.</Notice>
      {error && <Notice error>{error}</Notice>}
      <Button secondary busy={busy} onPress={() => void hide()}>내 동승 이력 삭제</Button>
    </>}
  </Screen>;
}
