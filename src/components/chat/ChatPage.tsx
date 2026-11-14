import { StatusBar } from 'expo-status-bar';
import type { PropsWithChildren } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CHAT_COLORS as colors } from '@/features/chat/theme';

type Props = PropsWithChildren<{ title: string; subtitle?: string; onBack: () => void }>;

export function ChatPage({ children, title, subtitle, onBack }: Props) {
  return (
    <SafeAreaView style={styles.page}>
      <StatusBar style="dark" />
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable accessibilityRole="button" accessibilityLabel="뒤로 가기" onPress={onBack} style={styles.back}>
            <Text accessible={false} style={styles.backText}>‹</Text>
          </Pressable>
          <View style={styles.heading}><Text accessibilityRole="header" style={styles.title}>{title}</Text>{subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}</View>
          <View style={styles.badge}><Text style={styles.badgeText}>시연용</Text></View>
        </View>
        {children}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1, width: '100%', maxWidth: 600, alignSelf: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  back: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  backText: { fontSize: 36, lineHeight: 40, color: colors.text },
  heading: { flex: 1 }, title: { fontSize: 19, lineHeight: 28, fontWeight: '700', color: colors.text },
  subtitle: { marginTop: 2, fontSize: 12, lineHeight: 18, color: colors.secondary },
  badge: { borderRadius: 8, backgroundColor: colors.primarySoft, paddingHorizontal: 9, paddingVertical: 6 },
  badgeText: { fontSize: 12, color: colors.primary, fontWeight: '700' },
});
