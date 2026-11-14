import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { ChatPage } from '@/components/chat/ChatPage';
import { DemoRoomCard } from '@/components/chat/DemoRoomCard';
import { useChatDemo } from '@/features/chat/ChatDemoContext';
import { getRoomMessages } from '@/features/chat/messages';
import { DEMO_ROOMS } from '@/features/chat/mockMessages';
import { CHAT_COLORS as colors } from '@/features/chat/theme';

export default function ChatsScreen() {
  const { messages } = useChatDemo();
  return (
    <ChatPage title="참여 채팅방" subtitle="함께 타기 전, 가볍게 인사해요" onBack={() => router.canGoBack() ? router.back() : router.replace('/')}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.notice}><Text style={styles.noticeTitle}>채팅 화면을 미리 만나 보세요</Text><Text style={styles.description}>예시 방과 메시지입니다. 실제 동승자에게 전송되지 않으며, 앱을 다시 실행하면 초기화됩니다.</Text></View>
        <Text style={styles.section}>시연용 채팅방 {DEMO_ROOMS.length}</Text>
        {DEMO_ROOMS.map((room) => {
          const roomMessages = getRoomMessages(messages, room.roomId);
          return <DemoRoomCard key={room.roomId} room={room} lastMessage={roomMessages.at(-1)} onPress={() => router.push({ pathname: '/rooms/[roomId]/chat', params: { roomId: room.roomId } })} />;
        })}
        <Text style={styles.footer}>실제 참여 채팅방 목록은 인증·참여 API 연결 후 제공됩니다.</Text>
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
  footer: { fontSize: 12, lineHeight: 20, color: colors.secondary, marginTop: 10 },
});
