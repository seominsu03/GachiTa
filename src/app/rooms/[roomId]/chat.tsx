import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { ChatPage } from '@/components/chat/ChatPage';
import { MessageBubble } from '@/components/chat/MessageBubble';
import { MessageComposer } from '@/components/chat/MessageComposer';
import { BoardingRequestCard } from '@/components/boarding/BoardingRequestCard';
import { createBoardingDemoRequest, expireBoardingDemoRequest, getBoardingDemoTimeline, respondToBoardingDemoRequest } from '@/features/boarding/demo';
import { useChatDemo } from '@/features/chat/ChatDemoContext';
import { DEMO_USER_ID, getRoomMessages } from '@/features/chat/messages';
import { getDemoRoom, MOCK_MESSAGES } from '@/features/chat/mockMessages';
import { CHAT_COLORS as colors, chatTime } from '@/features/chat/theme';
import type { BoardingDemoTimelineItem } from '@/features/boarding/demo';
import type { BoardingDemoState } from '@/types/boarding';

export default function RoomChatScreen() {
  const { roomId } = useLocalSearchParams<{ roomId?: string | string[] }>();
  const room = getDemoRoom(typeof roomId === 'string' ? roomId : undefined);
  const { messages, sendMessage } = useChatDemo();
  const listRef = useRef<FlatList<BoardingDemoTimelineItem>>(null);
  const listDimensionsRef = useRef({ contentHeight: 0, viewportHeight: 0 });
  const [boardingState, setBoardingState] = useState<BoardingDemoState>(() => (
    room && room.hostUserId !== DEMO_USER_ID ? createBoardingDemoRequest(Date.now()) : { status: 'idle' }
  ));
  const goBack = () => router.canGoBack() ? router.back() : router.replace('/(tabs)/chats');

  useEffect(() => {
    setBoardingState(room && room.hostUserId !== DEMO_USER_ID ? createBoardingDemoRequest(Date.now()) : { status: 'idle' });
  }, [room?.roomId]);

  function scrollToLatestMessage() {
    const { contentHeight, viewportHeight } = listDimensionsRef.current;
    const offset = Math.max(0, contentHeight - viewportHeight);
    listRef.current?.scrollToOffset({ offset, animated: true });
  }

  if (!room) {
    return <ChatPage title="택시방 채팅" onBack={goBack}><View style={styles.empty}><Text style={styles.emptyTitle}>채팅방을 찾을 수 없어요</Text><Text style={styles.description}>이 단계에서는 목록의 시연용 방만 열 수 있습니다.</Text><Pressable accessibilityRole="button" onPress={() => router.replace('/(tabs)/chats')} style={styles.returnButton}><Text style={styles.returnText}>채팅 목록으로</Text></Pressable></View></ChatPage>;
  }

  const roomMessages = getRoomMessages(messages, room.roomId);
  const initialMessageCount = getRoomMessages(MOCK_MESSAGES, room.roomId).length;
  const timeline = getBoardingDemoTimeline(roomMessages, initialMessageCount, room.roomId);
  return (
    <ChatPage title="택시방 채팅" subtitle="예시 대화 · 서버 전송 없음" onBack={goBack}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.summary}>
          <View style={styles.summaryTop}><Text style={styles.route}>{room.origin.name} → {room.destination.name}</Text><Text style={styles.count}>{room.participantCount}명 / {room.capacity}명</Text></View>
          <View style={styles.summaryTop}><Text style={styles.description}>예시 출발 {chatTime(room.departureAt)}</Text><Text style={styles.description}>나 · {room.hostUserId === DEMO_USER_ID ? '방장' : '참여자'}</Text></View>
          <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: '/rooms/[roomId]/taxi', params: { roomId: String(room.roomId) } })} style={styles.taxiPreviewButton}>
            <Text style={styles.taxiPreviewText}>가상 택시 시연 보기 →</Text>
          </Pressable>
        </View>
        <Text style={styles.demoNotice}>메시지와 탑승 확인은 이 앱에서만 시연됩니다. 실제 요청은 다른 기기로 전송되지 않아요.</Text>
        <FlatList
          ref={listRef} style={styles.flex} data={timeline} keyExtractor={(item) => item.kind === 'boarding' ? `boarding-${item.roomId}` : `message-${item.message.messageId}`}
          renderItem={({ item }) => item.kind === 'message' ? <MessageBubble message={item.message} /> : (
            <BoardingRequestCard
              isHost={room.hostUserId === DEMO_USER_ID}
              participantCount={room.participantCount}
              state={boardingState}
              onRequest={() => setBoardingState((current) => current.status === 'idle' ? createBoardingDemoRequest(Date.now()) : current)}
              onAccept={() => setBoardingState((current) => respondToBoardingDemoRequest(current, 'accepted', Date.now()))}
              onDecline={() => setBoardingState((current) => respondToBoardingDemoRequest(current, 'declined', Date.now()))}
              onExpire={() => setBoardingState((current) => expireBoardingDemoRequest(current, Date.now()))}
            />
          )}
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
          ListHeaderComponent={roomMessages.length === 0 ? <View style={styles.empty}><Text style={styles.emptyTitle}>첫 인사를 나눠 보세요</Text><Text style={styles.description}>아직 메시지가 없는 시연용 방입니다.</Text></View> : undefined}
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
  taxiPreviewButton: { minHeight: 44, borderRadius: 10, backgroundColor: colors.primarySoft, justifyContent: 'center', alignItems: 'center', marginTop: 3 },
  taxiPreviewText: { color: colors.primary, fontSize: 13, fontWeight: '700' },
  route: { color: colors.text, fontSize: 16, lineHeight: 24, fontWeight: '700' }, count: { color: colors.primary, fontSize: 13, fontWeight: '700' },
  description: { color: colors.secondary, fontSize: 12, lineHeight: 20 },
  demoNotice: { paddingHorizontal: 20, marginBottom: 10, fontSize: 11, lineHeight: 18, color: colors.secondary },
  messages: { paddingHorizontal: 20, paddingBottom: 18 }, emptyMessages: { flexGrow: 1, justifyContent: 'center' },
  empty: { padding: 24, alignItems: 'center', gap: 10 }, emptyTitle: { color: colors.text, fontSize: 17, lineHeight: 26, fontWeight: '700' },
  returnButton: { marginTop: 10, minHeight: 44, paddingHorizontal: 20, justifyContent: 'center', borderRadius: 12, backgroundColor: colors.primary }, returnText: { color: colors.white, fontWeight: '600', fontSize: 14 },
});
