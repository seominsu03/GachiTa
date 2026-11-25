import { useCallback, useState } from 'react';
import { router } from 'expo-router';
import { Text, View } from 'react-native';
import { Button, Card, Field, Notice, Screen, ui } from '@/components/ui/DesignSystem';
import { BottomNavigation } from '@/components/rooms/RoomScreens';
import { navigateRoom } from '@/components/rooms/RoomRoute';
import { useAuth } from '@/contexts/AuthContext';
import { useRemote } from '@/hooks/use-remote';
import { acceptFriend, getFriends, removeFriend, requestFriend, searchFriends } from '@/features/friends/api';
import type { FriendCandidate, Friendship } from '@/types/friend';

function UserLine({ user }: { user: FriendCandidate }) {
  return <View style={{ flex: 1 }}><Text style={ui.bold}>{user.nickname}</Text><Text style={ui.muted}>@{user.username}</Text></View>;
}

export default function FriendsScreen() {
  const { user } = useAuth();
  const load = useCallback(() => user ? getFriends() : Promise.reject(new Error('로그인이 필요해요.')), [user]);
  const remote = useRemote(load);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<FriendCandidate[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const all = [...(remote.data?.friends ?? []), ...(remote.data?.incoming ?? []), ...(remote.data?.outgoing ?? [])];
  async function search() {
    const value = query.trim();
    if (value.length < 2) { setError('아이디를 2자 이상 입력해 주세요.'); return; }
    setSearching(true); setError(null);
    try { setResults(await searchFriends(value)); }
    catch (failure) { setError(failure instanceof Error ? failure.message : '검색하지 못했어요.'); }
    finally { setSearching(false); }
  }
  async function change(id: number, action: () => Promise<unknown>) {
    setBusyId(id); setError(null);
    try { await action(); await remote.refresh(); }
    catch (failure) { setError(failure instanceof Error ? failure.message : '친구 요청을 처리하지 못했어요.'); }
    finally { setBusyId(null); }
  }
  function open(userId: number) { router.push({ pathname: '/friends/[userId]', params: { userId: String(userId) } }); }
  function row(item: Friendship, action: 'accept' | 'cancel' | 'remove') {
    return <Card key={item.friendshipId}><View style={ui.between}><UserLine user={item.user} />
      <Button secondary small onPress={() => open(item.user.userId)}>프로필</Button></View>
      {action === 'accept' ? <View style={ui.row}><View style={{ flex: 1 }}><Button small busy={busyId === item.friendshipId} onPress={() => void change(item.friendshipId, () => acceptFriend(item.friendshipId))}>수락</Button></View>
        <View style={{ flex: 1 }}><Button secondary small busy={busyId === item.friendshipId} onPress={() => void change(item.friendshipId, () => removeFriend(item.friendshipId))}>거절</Button></View></View>
        : <Button secondary small busy={busyId === item.friendshipId} onPress={() => void change(item.friendshipId, () => removeFriend(item.friendshipId))}>{action === 'cancel' ? '요청 취소' : '친구 삭제'}</Button>}
    </Card>;
  }
  return <Screen title="친구 목록" onBack={() => router.replace('/(tabs)/mypage')}
    tabs={<BottomNavigation active="mypage" navigate={navigateRoom} />}>
    <Text style={ui.heading}>친구 찾기</Text>
    <Field label="아이디 검색" icon="search" value={query} onChangeText={setQuery} autoCapitalize="none" autoCorrect={false} maxLength={20} placeholder="친구 아이디를 입력하세요" onSubmitEditing={() => void search()} />
    <Button secondary busy={searching} onPress={() => void search()}>검색</Button>
    {error && <Notice error>{error}</Notice>}
    {results && <><Text style={ui.heading}>검색 결과</Text>
      {results.length ? results.map(candidate => {
        const relation = all.find(item => item.user.userId === candidate.userId);
        return <Card key={candidate.userId}><View style={ui.between}><UserLine user={candidate} />
          <Button secondary small onPress={() => open(candidate.userId)}>프로필</Button></View>
          {relation ? <Notice>{relation.status === 'ACCEPTED' ? '이미 친구예요.' : relation.incoming ? '받은 요청이 있어요.' : '요청을 보냈어요.'}</Notice>
            : <Button small busy={busyId === candidate.userId} onPress={() => void change(candidate.userId, () => requestFriend(candidate.userId))}>친구 요청</Button>}
        </Card>;
      }) : <Notice>검색된 사용자가 없어요.</Notice>}
    </>}
    <View style={ui.between}><Text style={ui.heading}>내 친구</Text><Button secondary small busy={remote.loading} onPress={() => void remote.refresh()}>새로고침</Button></View>
    {remote.loading && <Notice>친구 목록을 불러오고 있어요.</Notice>}
    {remote.error && <Notice error>{remote.error}</Notice>}
    {remote.data && <><Text style={ui.bold}>받은 요청 {remote.data.incoming.length}개</Text>
      {remote.data.incoming.length ? remote.data.incoming.map(item => row(item, 'accept')) : <Notice>받은 요청이 없어요.</Notice>}
      <Text style={ui.bold}>친구 {remote.data.friends.length}명</Text>
      {remote.data.friends.length ? remote.data.friends.map(item => row(item, 'remove')) : <Notice>아직 친구가 없어요.</Notice>}
      <Text style={ui.bold}>보낸 요청 {remote.data.outgoing.length}개</Text>
      {remote.data.outgoing.length ? remote.data.outgoing.map(item => row(item, 'cancel')) : <Notice>보낸 요청이 없어요.</Notice>}
    </>}
  </Screen>;
}
