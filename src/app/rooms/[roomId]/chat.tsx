import { router, useLocalSearchParams } from 'expo-router';
import { useRef } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { ChatPage } from '@/components/chat/ChatPage';
import { MessageBubble } from '@/components/chat/MessageBubble';
import { MessageComposer } from '@/components/chat/MessageComposer';
import { useChatDemo } from '@/features/chat/ChatDemoContext';
import { getRoomMessages } from '@/features/chat/messages';
import { getDemoRoom } from '@/features/chat/mockMessages';
import { CHAT_COLORS as colors, chatTime } from '@/features/chat/theme';
import type { ChatMessage } from '@/types/chat';

export default function RoomChatScreen() {
  const { roomId } = useLocalSearchParams<{ roomId?: string | string[] }>();
  const room = getDemoRoom(typeof roomId === 'string' ? roomId : undefined);
  const { messages, sendMessage } = useChatDemo();
  const listRef = useRef<FlatList<ChatMessage>>(null);
  const listDimensionsRef = useRef({ contentHeight: 0, viewportHeight: 0 });
  const goBack = () => router.canGoBack() ? router.back() : router.replace('/(tabs)/chats');

  function scrollToLatestMessage() {
    const { contentHeight, viewportHeight } = listDimensionsRef.current;
    const offset = Math.max(0, contentHeight - viewportHeight);
    listRef.current?.scrollToOffset({ offset, animated: true });
  }

  if (!room) {
    return <ChatPage title="택시방 채팅" onBack={goBack}><View style={styles.empty}><Text style={styles.emptyTitle}>채팅방을 찾을 수 없어요</Text><Text style={styles.description}>이 단계에서는 목록의 시연용 방만 열 수 있습니다.</Text><Pressable accessibilityRole="button" onPress={() => router.replace('/(tabs)/chats')} style={styles.returnButton}><Text style={styles.returnText}>채팅 목록으로</Text></Pressable></View></ChatPage>;
  }

  const roomMessages = getRoomMessages(messages, room.roomId);
  return (
    <ChatPage title="택시방 채팅" subtitle="예시 대화 · 서버 전송 없음" onBack={goBack}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.summary}>
          <View style={styles.summaryTop}><Text style={styles.route}>{room.origin.name} → {room.destination.name}</Text><Text style={styles.count}>{room.participantCount}명 / {room.capacity}명</Text></View>
          <View style={styles.summaryTop}><Text style={styles.description}>예시 출발 {chatTime(room.departureAt)}</Text><Text style={styles.description}>나 · {room.hostUserId === 1 ? '방장' : '참여자'}</Text></View>
        </View>
        <Text style={styles.demoNotice}>메시지는 이 앱 실행 중에만 유지됩니다. 탑승 확인은 다음 단계에서 연결합니다.</Text>
        <FlatList
          ref={listRef} style={styles.flex} data={roomMessages} keyExtractor={(message) => String(message.messageId)}
          renderItem={({ item }) => <MessageBubble message={item} />}
          contentContainerStyle={[styles.messages, roomMessages.length === 0 && styles.emptyMessages]}
          keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag"
          onContentSizeChange={(_, height) => {
            listDimensionsRef.current.contentHeight = height;
            scrollToLatestMessage();
          }}
          onLayout={(event) => {
            listDimensionsRef.current.viewportHeight = event.nativeEvent.layout.height;
            scrollToLatestMessage();
          }}
          ListEmptyComponent={<View style={styles.empty}><Text style={styles.emptyTitle}>첫 인사를 나눠 보세요</Text><Text style={styles.description}>아직 메시지가 없는 시연용 방입니다.</Text></View>}
        />
        <MessageComposer key={room.roomId} onSend={(text) => sendMessage(room.roomId, text)} />
      </KeyboardAvoidingView>
    </ChatPage>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  summary: { margin: 20, marginBottom: 10, padding: 15, borderRadius: 14, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, gap: 9 },
  summaryTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  route: { color: colors.text, fontSize: 16, lineHeight: 24, fontWeight: '700' }, count: { color: colors.primary, fontSize: 13, fontWeight: '700' },
  description: { color: colors.secondary, fontSize: 12, lineHeight: 20 },
  demoNotice: { paddingHorizontal: 20, marginBottom: 10, fontSize: 11, lineHeight: 18, color: colors.secondary },
  messages: { paddingHorizontal: 20, paddingBottom: 18 }, emptyMessages: { flexGrow: 1, justifyContent: 'center' },
  empty: { padding: 24, alignItems: 'center', gap: 10 }, emptyTitle: { color: colors.text, fontSize: 17, lineHeight: 26, fontWeight: '700' },
  returnButton: { marginTop: 10, minHeight: 44, paddingHorizontal: 20, justifyContent: 'center', borderRadius: 12, backgroundColor: colors.primary }, returnText: { color: colors.white, fontWeight: '600', fontSize: 14 },
});
