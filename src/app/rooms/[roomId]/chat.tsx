import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { ChatPage } from '@/components/chat/ChatPage';
import { MessageBubble } from '@/components/chat/MessageBubble';
import { MessageComposer } from '@/components/chat/MessageComposer';
import { BoardingRequestCard } from '@/components/boarding/BoardingRequestCard';
import { createBoardingDemoRequest, expireBoardingDemoRequest, getBoardingDemoTimeline, respondToBoardingDemoRequest } from '@/features/boarding/demo';
import { useChatDemo } from '@/features/chat/ChatDemoContext';
import { getRoomMessages } from '@/features/chat/messages';
import { useAuth } from '@/contexts/AuthContext';
import { getRoomById } from '@/features/rooms/api';
import { getParticipations } from '@/features/participation/api';
import { ApiError } from '@/services/apiClient';
import { CHAT_COLORS as colors, chatTime } from '@/features/chat/theme';
import type { BoardingDemoTimelineItem } from '@/features/boarding/demo';
import type { BoardingDemoState } from '@/types/boarding';
import type { Room } from '@/types/room';

export default function RoomChatScreen() {
  const { roomId } = useLocalSearchParams<{ roomId?: string | string[] }>();
  const { user } = useAuth();
  const parsedRoomId = typeof roomId === 'string' ? Number(roomId) : NaN;
  const [result, setResult] = useState<{ roomId: number; room: Room | null; error: string | null } | null>(null);
  const { messages, sendMessage } = useChatDemo();
  const listRef = useRef<FlatList<BoardingDemoTimelineItem>>(null);
  const listDimensionsRef = useRef({ contentHeight: 0, viewportHeight: 0 });
  const [boardingState, setBoardingState] = useState<BoardingDemoState>({ status: 'idle' });
  const goBack = () => router.canGoBack() ? router.back() : router.replace('/(tabs)/chats');

  useEffect(() => {
    let active = true;
    if (!Number.isSafeInteger(parsedRoomId) || parsedRoomId <= 0 || !user) {
      return () => { active = false; };
    }
    void Promise.all([getRoomById(parsedRoomId), getParticipations(parsedRoomId)]).then(([found, participants]) => {
      if (!active) return;
      const allowed = found.hostUserId === user.userId || participants.some(person => person.userId === user.userId &&
        (person.status === 'APPROVED' || person.status === 'BOARDING_CONFIRMED'));
      if (!allowed) throw new Error('승인된 참여자만 채팅방을 열 수 있습니다.');
      setResult({ roomId: parsedRoomId, room: found, error: null });
      setBoardingState(found.hostUserId === user.userId ? { status: 'idle' } : createBoardingDemoRequest(Date.now()));
    }).catch(cause => {
      if (active) setResult({ roomId: parsedRoomId, room: null, error: cause instanceof ApiError && cause.status === 404 ? '삭제되었거나 없는 채팅방입니다.' : cause instanceof Error ? cause.message : '채팅방을 불러오지 못했습니다.' });
    });
    return () => { active = false; };
  }, [parsedRoomId, user]);

  const invalidRoomId = !Number.isSafeInteger(parsedRoomId) || parsedRoomId <= 0;
  const currentResult = result?.roomId === parsedRoomId ? result : null;
  const loading = !invalidRoomId && !currentResult;
  const loadError = invalidRoomId ? '올바른 채팅방 주소가 아닙니다.' : currentResult?.error;
  const room = currentResult?.room;

  function scrollToLatestMessage() {
    const { contentHeight, viewportHeight } = listDimensionsRef.current;
    const offset = Math.max(0, contentHeight - viewportHeight);
    listRef.current?.scrollToOffset({ offset, animated: true });
  }

  if (!room || !user) {
    return <ChatPage title="택시방 채팅" onBack={goBack}><View style={styles.empty}><Text style={styles.emptyTitle}>{loading ? '채팅방 불러오는 중' : '채팅방을 열 수 없어요'}</Text><Text style={styles.description}>{loadError}</Text><Pressable accessibilityRole="button" onPress={() => router.replace('/(tabs)/chats')} style={styles.returnButton}><Text style={styles.returnText}>채팅 목록으로</Text></Pressable></View></ChatPage>;
  }

  const roomMessages = getRoomMessages(messages, room.roomId);
  const initialMessageCount = 0;
  const timeline = getBoardingDemoTimeline(roomMessages, initialMessageCount, room.roomId);
  return (
    <ChatPage title="택시방 채팅" subtitle="예시 대화 · 서버 전송 없음" onBack={goBack}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.summary}>
          <View style={styles.summaryTop}><Text style={styles.route}>{room.origin.name} → {room.destination.name}</Text><Text style={styles.count}>{room.participantCount}명 / {room.capacity}명</Text></View>
          <View style={styles.summaryTop}><Text style={styles.description}>출발 {chatTime(room.departureAt)}</Text><Text style={styles.description}>나 · {room.hostUserId === user.userId ? '방장' : '참여자'}</Text></View>
        </View>
        <Text style={styles.demoNotice}>메시지와 탑승 확인은 이 앱에서만 시연됩니다. 실제 요청은 다른 기기로 전송되지 않아요.</Text>
        <FlatList
          ref={listRef} style={styles.flex} data={timeline} keyExtractor={(item) => item.kind === 'boarding' ? `boarding-${item.roomId}` : `message-${item.message.messageId}`}
          renderItem={({ item }) => item.kind === 'message' ? <MessageBubble message={item.message} currentUserId={user.userId} /> : (
            <BoardingRequestCard
              isHost={room.hostUserId === user.userId}
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
          ListHeaderComponent={roomMessages.length === 0 ? <View style={styles.empty}><Text style={styles.emptyTitle}>첫 인사를 나눠 보세요</Text><Text style={styles.description}>아직 이 기기에 표시된 메시지가 없습니다.</Text></View> : undefined}
        />
        <MessageComposer key={room.roomId} onSend={(text) => sendMessage(room.roomId, user.userId, text)} />
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
