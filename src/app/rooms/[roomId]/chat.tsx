import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { ChatPage } from '@/components/chat/ChatPage';
import { MessageBubble } from '@/components/chat/MessageBubble';
import { MessageComposer } from '@/components/chat/MessageComposer';
import { BoardingRequestCard } from '@/components/boarding/BoardingRequestCard';
import { acceptBoardingCheck, getCurrentBoardingCheck, requestBoardingCheck } from '@/features/boarding/api';
import { getChatMessages, sendChatMessage } from '@/features/chat/api';
import { useAuth } from '@/contexts/AuthContext';
import { getRoomById } from '@/features/rooms/api';
import { cancelParticipation, getParticipations } from '@/features/participation/api';
import { ApiError } from '@/services/apiClient';
import { CHAT_COLORS as colors, chatTime } from '@/features/chat/theme';
import { getTaxiStatus } from '@/features/taxi/api';
import type { BoardingCheck } from '@/types/boarding';
import type { ChatMessage } from '@/types/chat';
import type { Room } from '@/types/room';

type ChatItem = { kind: 'message'; message: ChatMessage } | { kind: 'boarding'; roomId: number };

export default function RoomChatScreen() {
  const { roomId } = useLocalSearchParams<{ roomId?: string | string[] }>();
  const { user } = useAuth();
  const parsedRoomId = typeof roomId === 'string' ? Number(roomId) : NaN;
  const [result, setResult] = useState<{ roomId: number; room: Room | null; participationId: number | null; error: string | null } | null>(null);
  const [messageSnapshot, setMessageSnapshot] = useState<{ roomId: number; messages: ChatMessage[] } | null>(null);
  const [messageError, setMessageError] = useState<string | null>(null);
  const messageCursor = useRef<{ roomId: number; latestId: number; initialized: boolean } | null>(null);
  const listRef = useRef<FlatList<ChatItem>>(null);
  const listDimensionsRef = useRef({ contentHeight: 0, viewportHeight: 0 });
  const [check, setCheck] = useState<BoardingCheck | null>(null);
  const [serverClockOffsetMs, setServerClockOffsetMs] = useState(0);
  const [boardingError, setBoardingError] = useState<string | null>(null);
  const [actionBusy, setActionBusy] = useState(false);
  const [taxiAvailable, setTaxiAvailable] = useState(false);
  const actionLock = useRef(false);
  const goBack = () => router.canGoBack() ? router.back() : router.replace('/(tabs)/chats');
  const goToRoom = () => router.push({ pathname: '/rooms/[roomId]', params: { roomId: String(parsedRoomId) } });

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
      const mine = participants.find(person => person.userId === user.userId);
      setResult({ roomId: parsedRoomId, room: found, participationId: mine?.participationId ?? null, error: null });
    }).catch(cause => {
      if (active) setResult({ roomId: parsedRoomId, room: null, participationId: null, error: cause instanceof ApiError && cause.status === 404 ? '삭제되었거나 없는 채팅방입니다.' : cause instanceof Error ? cause.message : '채팅방을 불러오지 못했습니다.' });
    });
    return () => { active = false; };
  }, [parsedRoomId, user]);

  const invalidRoomId = !Number.isSafeInteger(parsedRoomId) || parsedRoomId <= 0;
  const currentResult = result?.roomId === parsedRoomId ? result : null;
  const loading = !invalidRoomId && !currentResult;
  const loadError = invalidRoomId ? '올바른 채팅방 주소가 아닙니다.' : currentResult?.error;
  const room = currentResult?.room;
  const activeRoomId = room?.roomId;
  const currentUserId = user?.userId;

  useFocusEffect(useCallback(() => {
    if (!activeRoomId || !currentUserId) return;
    const pollingRoomId = activeRoomId;
    let active = true;
    let polling = false;
    if (messageCursor.current?.roomId !== activeRoomId)
      messageCursor.current = { roomId: activeRoomId, latestId: 0, initialized: false };
    async function pollMessages() {
      if (polling) return;
      polling = true;
      try {
        const cursor = messageCursor.current;
        const batch = await getChatMessages(pollingRoomId, cursor?.latestId ?? 0);
        const latestCursor = messageCursor.current;
        if (!active || !latestCursor || latestCursor.roomId !== pollingRoomId) return;
        latestCursor.initialized = true;
        latestCursor.latestId = Math.max(latestCursor.latestId, ...batch.map(item => item.messageId));
        setMessageSnapshot(current => {
          const previous = current && current.roomId === pollingRoomId ? current.messages : [];
          const byId = new Map(previous.map(item => [item.messageId, item]));
          batch.forEach(item => byId.set(item.messageId, item));
          return { roomId: pollingRoomId, messages: [...byId.values()].sort((a, b) => a.messageId - b.messageId) };
        });
        setMessageError(null);
      } catch (cause) {
        if (active) setMessageError(cause instanceof Error ? cause.message : '메시지를 불러오지 못했습니다.');
      } finally { polling = false; }
    }
    void pollMessages();
    const timer = setInterval(() => void pollMessages(), 2000);
    return () => { active = false; clearInterval(timer); };
  }, [activeRoomId, currentUserId]));

  async function sendMessage(text: string) {
    setMessageError(null);
    try {
      const saved = await sendChatMessage(parsedRoomId, text);
      setMessageSnapshot(current => {
        const previous = current?.roomId === parsedRoomId ? current.messages : [];
        return previous.some(item => item.messageId === saved.messageId) ? current :
          { roomId: parsedRoomId, messages: [...previous, saved].sort((a, b) => a.messageId - b.messageId) };
      });
    } catch (cause) {
      setMessageError(cause instanceof Error ? cause.message : '메시지를 보내지 못했습니다.');
      throw cause;
    }
  }

  const applyCheck = useCallback((next: BoardingCheck) => {
    setCheck(next);
    setServerClockOffsetMs(Date.parse(next.serverNow) - Date.now());
    setBoardingError(null);
  }, []);

  async function refreshBoarding() {
    if (!Number.isSafeInteger(parsedRoomId) || parsedRoomId <= 0) return;
    try {
      const next = await getCurrentBoardingCheck(parsedRoomId);
      applyCheck(next);
      const updatedRoom = await getRoomById(parsedRoomId);
      setResult(current => current?.roomId === parsedRoomId ? { ...current, room: updatedRoom } : current);
    } catch (cause) {
      if (cause instanceof ApiError && cause.status === 404) { setCheck(null); return; }
      if (cause instanceof ApiError && cause.status === 403) {
        setResult(current => current?.roomId === parsedRoomId ? { ...current, room: null, error: '탑승 확인 시간이 지나 이 방에서 퇴장했습니다.' } : current);
        return;
      }
      setBoardingError(cause instanceof Error ? cause.message : '탑승 확인을 조회하지 못했습니다.');
    }
  }

  useEffect(() => {
    if (!activeRoomId || !currentUserId) return;
    let active = true;
    let polling = false;
    async function poll() {
      if (polling) return;
      polling = true;
      try {
        const next = await getCurrentBoardingCheck(parsedRoomId);
        if (!active) return;
        applyCheck(next);
        const updatedRoom = await getRoomById(parsedRoomId);
        if (active) setResult(current => current?.roomId === parsedRoomId ? { ...current, room: updatedRoom } : current);
      } catch (cause) {
        if (!active) return;
        if (cause instanceof ApiError && cause.status === 404) setCheck(null);
        else if (cause instanceof ApiError && cause.status === 403)
          setResult(current => current?.roomId === parsedRoomId ? { ...current, room: null, error: '탑승 확인 시간이 지나 이 방에서 퇴장했습니다.' } : current);
        else setBoardingError(cause instanceof Error ? cause.message : '탑승 확인을 조회하지 못했습니다.');
      } finally { polling = false; }
    }
    void poll();
    const timer = setInterval(() => void poll(), 2000);
    return () => { active = false; clearInterval(timer); };
  }, [parsedRoomId, activeRoomId, currentUserId, applyCheck]);

  useEffect(() => {
    if (!activeRoomId || !currentUserId) return;
    let active = true;
    async function refreshTaxiAvailability() {
      try {
        const taxi = await getTaxiStatus(parsedRoomId);
        if (active) setTaxiAvailable(taxi.status === 'BOARDING_CHECK' || taxi.status === 'TAXI_CALLING' ||
          taxi.status === 'TAXI_ASSIGNED' || taxi.status === 'IN_RIDE' || taxi.status === 'SETTLING' || taxi.status === 'COMPLETED');
      } catch { if (active) setTaxiAvailable(false); }
    }
    void refreshTaxiAvailability();
    const timer = setInterval(() => void refreshTaxiAvailability(), 3000);
    return () => { active = false; clearInterval(timer); };
  }, [activeRoomId, currentUserId, parsedRoomId]);

  async function runAction(action: () => Promise<void>) {
    if (actionLock.current) return;
    actionLock.current = true;
    setActionBusy(true);
    setBoardingError(null);
    try { await action(); }
    catch (cause) { setBoardingError(cause instanceof Error ? cause.message : '탑승 확인 요청에 실패했습니다.'); }
    finally { actionLock.current = false; setActionBusy(false); }
  }

  function scrollToLatestMessage() {
    const { contentHeight, viewportHeight } = listDimensionsRef.current;
    const offset = Math.max(0, contentHeight - viewportHeight);
    listRef.current?.scrollToOffset({ offset, animated: true });
  }

  if (!room || !user) {
    return <ChatPage title="택시방 채팅" onBack={goBack}><View style={[styles.empty, styles.unavailable]}><Text style={styles.emptyTitle}>{loading ? '채팅방 불러오는 중' : '채팅방을 열 수 없어요'}</Text><Text style={styles.description}>{loadError}</Text>{!invalidRoomId && <Pressable accessibilityRole="button" onPress={goToRoom} style={styles.returnButton}><Text style={styles.returnText}>택시방 상세로</Text></Pressable>}<Pressable accessibilityRole="button" onPress={() => router.replace('/(tabs)/chats')} style={styles.returnButton}><Text style={styles.returnText}>채팅 목록으로</Text></Pressable></View></ChatPage>;
  }

  const messagesLoaded = messageSnapshot?.roomId === room.roomId;
  const roomMessages = messagesLoaded ? messageSnapshot.messages : [];
  const timeline: ChatItem[] = [{ kind: 'boarding', roomId: room.roomId }, ...roomMessages.map(message => ({ kind: 'message' as const, message }))];
  return (
    <ChatPage title="택시방 채팅" subtitle="동승자 대화" onBack={goBack}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.summary}>
          <View style={styles.summaryTop}><Text style={styles.route}>{room.origin.name} → {room.destination.name}</Text><Text style={styles.count}>{room.participantCount}명 / {room.capacity}명</Text></View>
          <View style={styles.summaryTop}><Text style={styles.description}>출발 {chatTime(room.departureAt)}</Text><Text style={styles.description}>나 · {room.hostUserId === user.userId ? '방장' : '참여자'}</Text></View>
          <Pressable accessibilityRole="button" onPress={goToRoom} style={styles.roomLink}><Text style={styles.roomLinkText}>택시방 상세로 돌아가기 ›</Text></Pressable>
        </View>
        <Text style={styles.demoNotice}>메시지는 서버에 저장되며 동승자에게 표시됩니다. 새 메시지는 약 2초마다 확인해요.</Text>
        {messageError && <Text accessibilityRole="alert" style={styles.errorNotice}>{messageError}</Text>}
        {taxiAvailable && <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: '/rooms/[roomId]/taxi', params: { roomId: String(room.roomId) } })} style={styles.taxiButton}><Text style={styles.taxiButtonText}>가상 택시 이용 화면으로 이동 ›</Text></Pressable>}
        <FlatList
          ref={listRef} style={styles.flex} data={timeline} keyExtractor={(item) => item.kind === 'boarding' ? `boarding-${item.roomId}` : `message-${item.message.messageId}`}
          renderItem={({ item }) => item.kind === 'message' ? <MessageBubble message={item.message} currentUserId={user.userId} /> : (
            <BoardingRequestCard
              isHost={room.hostUserId === user.userId}
              userId={user.userId}
              check={check}
              serverClockOffsetMs={serverClockOffsetMs}
              busy={actionBusy}
              error={boardingError}
              onRequest={() => void runAction(async () => applyCheck(await requestBoardingCheck(room.roomId)))}
              onAccept={() => void runAction(async () => { if (check) applyCheck(await acceptBoardingCheck(room.roomId, check.boardingCheckId)); })}
              onDecline={() => void runAction(async () => { if (currentResult?.participationId) { await cancelParticipation(room.roomId, currentResult.participationId); router.replace('/(tabs)/chats'); } })}
              onRefresh={() => void refreshBoarding()}
              canRequest={room.status === 'RECRUITING' && room.participantCount > 1}
              underCapacity={room.participantCount < room.capacity}
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
          ListHeaderComponent={roomMessages.length === 0 ? <View style={styles.empty}><Text style={styles.emptyTitle}>첫 인사를 나눠 보세요</Text><Text style={styles.description}>{messagesLoaded ? '아직 메시지가 없습니다.' : '메시지를 불러오는 중입니다.'}</Text></View> : undefined}
        />
        <MessageComposer key={room.roomId} onSend={sendMessage} />
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
  errorNotice: { paddingHorizontal: 20, marginBottom: 10, fontSize: 12, lineHeight: 18, color: '#C53030' },
  roomLink: { alignSelf: 'flex-end', minHeight: 44, justifyContent: 'center' },
  roomLinkText: { color: colors.primary, fontSize: 13, fontWeight: '700' },
  taxiButton: { marginHorizontal: 20, marginBottom: 8, minHeight: 44, borderRadius: 10, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  taxiButtonText: { color: colors.primary, fontWeight: '700', fontSize: 14 },
  messages: { paddingHorizontal: 20, paddingBottom: 18 }, emptyMessages: { flexGrow: 1, justifyContent: 'center' },
  empty: { padding: 24, alignItems: 'center', gap: 10 }, emptyTitle: { color: colors.text, fontSize: 17, lineHeight: 26, fontWeight: '700' },
  unavailable: { flex: 1, justifyContent: 'center' },
  returnButton: { marginTop: 10, minHeight: 44, paddingHorizontal: 20, justifyContent: 'center', borderRadius: 12, backgroundColor: colors.primary }, returnText: { color: colors.white, fontWeight: '600', fontSize: 14 },
});
