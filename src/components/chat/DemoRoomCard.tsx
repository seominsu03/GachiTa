import { Pressable, StyleSheet, Text, View } from 'react-native';

import { CHAT_COLORS as colors, chatTime } from '@/features/chat/theme';
import type { ChatMessage, DemoChatRoom } from '@/types/chat';

type Props = { room: DemoChatRoom; lastMessage?: ChatMessage; onPress: () => void };

export function DemoRoomCard({ room, lastMessage, onPress }: Props) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`${room.origin.name}에서 ${room.destination.name} 채팅방 열기`} onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <View style={styles.top}><Text style={styles.route}>{room.origin.name} → {room.destination.name}</Text><Text style={styles.chevron}>›</Text></View>
      <Text style={styles.detail}>예시 출발 {chatTime(room.departureAt)} · {room.participantCount}명 / {room.capacity}명</Text>
      <Text numberOfLines={1} style={styles.preview}>{lastMessage ? `${lastMessage.nickname}: ${lastMessage.text}` : '아직 메시지가 없어요. 첫 인사를 나눠 보세요.'}</Text>
      <View style={styles.bottom}><Text style={styles.tag}>시연용 채팅방</Text>{lastMessage && <Text style={styles.time}>{chatTime(lastMessage.createdAt)}</Text>}</View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { padding: 18, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 16, gap: 10 },
  pressed: { opacity: 0.7 }, top: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  route: { flex: 1, fontSize: 17, lineHeight: 26, fontWeight: '700', color: colors.text },
  chevron: { color: colors.secondary, fontSize: 28 }, detail: { fontSize: 13, lineHeight: 20, color: colors.secondary },
  preview: { color: colors.text, fontSize: 14, lineHeight: 22 },
  bottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  tag: { color: colors.primary, fontSize: 11, fontWeight: '600' }, time: { color: colors.secondary, fontSize: 11 },
});
