import { useCallback, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { Text } from 'react-native';
import { Button, Card, Notice, Screen, ui } from '@/components/ui/DesignSystem';
import { BottomNavigation } from '@/components/rooms/RoomScreens';
import { navigateRoom } from '@/components/rooms/RoomRoute';
import { useAuth } from '@/contexts/AuthContext';
import { useRemote } from '@/hooks/use-remote';
import { acceptFriend, getFriendProfile, getFriends, removeFriend, requestFriend } from '@/features/friends/api';

export default function FriendProfileScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const id = Number(userId);
  const { user } = useAuth();
  const load = useCallback(() => Number.isSafeInteger(id) && id > 0 && user
    ? Promise.all([getFriendProfile(id), getFriends()]) : Promise.reject(new Error('올바른 사용자 정보가 아니에요.')), [id, user]);
  const remote = useRemote(load);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const profile = remote.data?.[0];
  const overview = remote.data?.[1];
  const relation = [...(overview?.friends ?? []), ...(overview?.incoming ?? []), ...(overview?.outgoing ?? [])]
    .find(item => item.user.userId === id);
  async function change(action: () => Promise<unknown>) {
    setBusy(true); setError(null);
    try { await action(); await remote.refresh(); }
    catch (failure) { setError(failure instanceof Error ? failure.message : '친구 관계를 변경하지 못했어요.'); }
    finally { setBusy(false); }
  }
  return <Screen title="친구 프로필" onBack={() => router.replace('/friends')}
    tabs={<BottomNavigation active="mypage" navigate={navigateRoom} />}>
    {remote.loading && <Notice>사용자 정보를 불러오고 있어요.</Notice>}
    {remote.error && <Notice error>{remote.error}</Notice>}
    {profile && <><Card><Text style={ui.heading}>{profile.nickname}</Text><Text style={ui.body}>@{profile.username}</Text></Card>
      {profile.userId === user?.userId ? <Notice>내 프로필이에요.</Notice> : relation?.status === 'ACCEPTED' ?
        <Button secondary busy={busy} onPress={() => void change(() => removeFriend(relation.friendshipId))}>친구 삭제</Button> :
        relation?.incoming ? <><Button busy={busy} onPress={() => void change(() => acceptFriend(relation.friendshipId))}>친구 요청 수락</Button>
          <Button secondary busy={busy} onPress={() => void change(() => removeFriend(relation.friendshipId))}>요청 거절</Button></> :
          relation ? <Button secondary busy={busy} onPress={() => void change(() => removeFriend(relation.friendshipId))}>보낸 요청 취소</Button> :
          <Button busy={busy} onPress={() => void change(() => requestFriend(id))}>친구 요청</Button>}
      {profile.userId !== user?.userId && <Button secondary onPress={() => router.push({ pathname: '/reports/create', params: { userId: String(profile.userId) } })}>이 사용자 신고하기</Button>}
    </>}
    {error && <Notice error>{error}</Notice>}
  </Screen>;
}
