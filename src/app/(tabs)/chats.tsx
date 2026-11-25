import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { ChatPage } from '@/components/chat/ChatPage';
import { DemoRoomCard } from '@/components/chat/DemoRoomCard';
import { useAuth } from '@/contexts/AuthContext';
import { getParticipations } from '@/features/participation/api';
import { getMyRooms } from '@/features/rooms/api';
import { CHAT_COLORS as colors } from '@/features/chat/theme';
import type { Room } from '@/types/room';

async function getAccessibleRooms(userId: number): Promise<Room[]> {
  const mine = await getMyRooms();
  const access = await Promise.all(mine.map(async room => {
    if (room.hostUserId === userId) return true;
    try {
      const participants = await getParticipations(room.roomId);
      return participants.some(person => person.userId === userId &&
        (person.status === 'APPROVED' || person.status === 'BOARDING_CONFIRMED'));
    } catch { return false; }
  }));
  return mine.filter((_, index) => access[index]);
}

export default function ChatsScreen() {
  const { user } = useAuth();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  function reload() {
    if (!user) return;
    setLoading(true);
    setError(null);
    void getAccessibleRooms(user.userId).then(setRooms).catch(cause => {
      setError(cause instanceof Error ? cause.message : '채팅방 목록을 불러오지 못했습니다.');
    }).finally(() => setLoading(false));
  }

  useEffect(() => {
    if (!user) return;
    let active = true;
    void getAccessibleRooms(user.userId).then(found => {
      if (active) setRooms(found);
    }).catch(cause => {
      if (active) setError(cause instanceof Error ? cause.message : '채팅방 목록을 불러오지 못했습니다.');
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [user]);

  return (
    <ChatPage title="참여 채팅방" subtitle="내가 참여 중인 방" onBack={() => router.canGoBack() ? router.back() : router.replace('/')}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.notice}><Text style={styles.noticeTitle}>동승자 채팅</Text><Text style={styles.description}>승인된 동승자끼리 메시지를 주고받을 수 있어요. 대화 내용은 서버에 저장됩니다.</Text></View>
        <Pressable accessibilityRole="button" onPress={reload} style={styles.refresh}><Text style={styles.refreshText}>목록 새로고침</Text></Pressable>
        {loading ? <ActivityIndicator accessibilityLabel="채팅방 목록 불러오는 중" /> : error ? <Text style={styles.description}>{error}</Text> : rooms.length === 0 ? <Text style={styles.description}>승인되어 참여 중인 채팅방이 없습니다.</Text> : <>
          <Text style={styles.section}>참여 채팅방 {rooms.length}</Text>
          {rooms.map(room => <DemoRoomCard key={room.roomId} room={room} onPress={() => router.push({ pathname: '/rooms/[roomId]/chat', params: { roomId: room.roomId } })} />)}
        </>}
      </ScrollView>
    </ChatPage>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, gap: 16, paddingBottom: 32 },
  notice: { borderRadius: 14, backgroundColor: colors.primarySoft, padding: 16, gap: 7 },
  noticeTitle: { fontSize: 15, fontWeight: '700', lineHeight: 23, color: colors.primary },
  description: { fontSize: 13, lineHeight: 21, color: colors.secondary },
  section: { marginTop: 12, fontSize: 15, lineHeight: 22, fontWeight: '700', color: colors.text },
  refresh: { alignSelf: 'flex-start', padding: 10 }, refreshText: { color: colors.primary, fontWeight: '700' },
});
