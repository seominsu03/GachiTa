import { StyleSheet, Text, View } from 'react-native';

import { DEMO_USER_ID } from '@/features/chat/messages';
import { CHAT_COLORS as colors, chatTime } from '@/features/chat/theme';
import type { ChatMessage } from '@/types/chat';

export function MessageBubble({ message }: { message: ChatMessage }) {
  const mine = message.userId === DEMO_USER_ID;
  return (
    <View style={[styles.row, mine && styles.myRow]}>
      {!mine && <View style={styles.avatar}><Text style={styles.initial}>{message.nickname.slice(0, 1)}</Text></View>}
      <View style={[styles.content, mine && styles.myContent]}>
        <View style={styles.caption}><Text style={styles.name}>{mine ? '나' : message.nickname}</Text><Text style={styles.time}>{chatTime(message.createdAt)}</Text></View>
        <View style={[styles.bubble, mine && styles.myBubble]}><Text selectable style={[styles.text, mine && styles.myText]}>{message.text}</Text></View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 9, paddingVertical: 8 },
  myRow: { justifyContent: 'flex-end' },
  myContent: { alignItems: 'flex-end' },
  avatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  initial: { fontSize: 13, color: colors.primary, fontWeight: '700' }, content: { maxWidth: '82%', minWidth: 0, gap: 6 },
  caption: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, alignItems: 'center' },
  name: { fontSize: 12, lineHeight: 18, color: colors.text, fontWeight: '600' }, time: { fontSize: 10, color: colors.secondary },
  bubble: { maxWidth: '100%', borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, borderRadius: 14, borderTopLeftRadius: 4, paddingHorizontal: 13, paddingVertical: 10 },
  myBubble: { backgroundColor: colors.primary, borderColor: colors.primary, borderTopLeftRadius: 14, borderTopRightRadius: 4 },
  text: { color: colors.text, fontSize: 15, lineHeight: 23, flexShrink: 1 }, myText: { color: colors.white },
});
