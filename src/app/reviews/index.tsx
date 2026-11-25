import { useCallback } from 'react';
import { router } from 'expo-router';
import { Text, View } from 'react-native';
import { Button, Card, Notice, Screen, ui } from '@/components/ui/DesignSystem';
import { BottomNavigation } from '@/components/rooms/RoomScreens';
import { navigateRoom } from '@/components/rooms/RoomRoute';
import { useAuth } from '@/contexts/AuthContext';
import { useRemote } from '@/hooks/use-remote';
import { getMyReviews } from '@/features/reviews/api';
import type { RideReview } from '@/types/review';

function ReviewCard({ review, received }: { review: RideReview; received: boolean }) {
  return <Card><View style={ui.between}><Text style={ui.bold}>{received ? `${review.reviewerNickname}님에게 받은 후기` : `${review.revieweeNickname}님에게 쓴 후기`}</Text>
    <Text style={ui.blue}>{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</Text></View>
    {review.comment ? <Text style={ui.body}>{review.comment}</Text> : <Notice>평점만 남긴 후기예요.</Notice>}
    <Text style={ui.muted}>{new Date(review.createdAt).toLocaleDateString('ko-KR')}</Text></Card>;
}

export default function ReviewsScreen() {
  const { user } = useAuth();
  const load = useCallback(() => user ? getMyReviews() : Promise.reject(new Error('로그인이 필요해요.')), [user]);
  const remote = useRemote(load);
  const data = remote.data;
  return <Screen title="후기 및 평가" onBack={() => router.replace('/(tabs)/mypage')}
    tabs={<BottomNavigation active="mypage" navigate={navigateRoom} />}>
    <View style={ui.between}><Text style={ui.heading}>내 후기</Text><Button secondary small busy={remote.loading} onPress={() => void remote.refresh()}>새로고침</Button></View>
    {remote.loading && <Notice>후기를 불러오고 있어요.</Notice>}
    {remote.error && <Notice error>{remote.error}</Notice>}
    {data && <><Card tinted><Text style={ui.heading}>받은 평점</Text><Text style={ui.title}>{data.averageRating === null ? '아직 없음' : `${data.averageRating.toFixed(1)} / 5.0`}</Text>
      <Notice>받은 후기 {data.receivedCount}개</Notice></Card>
      <Text style={ui.heading}>받은 후기</Text>
      {data.received.length ? data.received.map(review => <ReviewCard key={review.reviewId} review={review} received />) : <Notice>아직 받은 후기가 없어요.</Notice>}
      <Text style={ui.heading}>작성한 후기</Text>
      {data.written.length ? data.written.map(review => <ReviewCard key={review.reviewId} review={review} received={false} />) : <Notice>아직 작성한 후기가 없어요. 정산 완료된 동승 이력에서 작성할 수 있어요.</Notice>}
    </>}
  </Screen>;
}
