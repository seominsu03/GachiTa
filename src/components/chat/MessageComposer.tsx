import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { MAX_MESSAGE_LENGTH } from '@/features/chat/messages';
import { CHAT_COLORS as colors } from '@/features/chat/theme';

export function MessageComposer({ onSend }: { onSend: (text: string) => void }) {
  const [text, setText] = useState('');
  const canSend = text.trim().length > 0 && text.length <= MAX_MESSAGE_LENGTH;
  function submit() {
    if (!canSend) return;
    onSend(text);
    setText('');
  }
  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <TextInput accessibilityLabel="메시지 입력" placeholder="메시지를 입력해 주세요" placeholderTextColor={colors.secondary} value={text} onChangeText={setText} multiline maxLength={MAX_MESSAGE_LENGTH} submitBehavior="newline" style={styles.input} />
        <Pressable accessibilityRole="button" accessibilityLabel="메시지 전송" accessibilityState={{ disabled: !canSend }} disabled={!canSend} onPress={submit} style={({ pressed }) => [styles.send, !canSend && styles.disabled, pressed && styles.pressed]}>
          <Text accessible={false} style={styles.arrow}>↑</Text>
        </Pressable>
      </View>
      <Text style={styles.hint}>이 기기에서만 표시 · {text.length}/{MAX_MESSAGE_LENGTH}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { borderTopWidth: 1, borderTopColor: colors.border, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8, backgroundColor: colors.background },
  row: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  input: { flex: 1, minWidth: 0, minHeight: 48, maxHeight: 130, borderWidth: 1, borderColor: colors.border, borderRadius: 14, backgroundColor: colors.surface, paddingHorizontal: 14, paddingVertical: 12, color: colors.text, fontSize: 15, lineHeight: 23, textAlignVertical: 'top' },
  send: { width: 48, height: 48, borderRadius: 14, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  disabled: { backgroundColor: colors.disabled }, pressed: { opacity: 0.75 },
  arrow: { color: colors.white, fontSize: 27, lineHeight: 32 }, hint: { fontSize: 10, lineHeight: 16, textAlign: 'right', color: colors.secondary, marginTop: 5 },
});
