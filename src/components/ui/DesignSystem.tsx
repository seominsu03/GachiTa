import type { PropsWithChildren, ReactNode } from 'react';
import { ActivityIndicator, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View, type StyleProp, type TextInputProps, type ViewStyle } from 'react-native';
import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { design as c } from '@/constants/design';

const names = {
  car: ['car', 'directions_car'], home: ['house', 'home'], chat: ['bubble', 'chat_bubble_outline'],
  user: ['person', 'person'], people: ['person.2', 'group'], plus: ['plus', 'add'], minus: ['minus', 'remove'],
  back: ['chevron.left', 'chevron_left'], next: ['chevron.right', 'chevron_right'], down: ['chevron.down', 'expand_more'],
  search: ['magnifyingglass', 'search'], origin: ['circle.inset.filled', 'adjust'], pin: ['mappin.circle', 'location_on'],
  clock: ['clock', 'schedule'], calendar: ['calendar', 'calendar_month'], check: ['checkmark', 'check'],
  info: ['info.circle', 'info'], eye: ['eye.slash', 'visibility_off'], visible: ['eye', 'visibility'],
  arrow: ['arrow.right', 'arrow_forward'], up: ['arrow.up', 'arrow_upward'], tune: ['slider.horizontal.3', 'tune'],
  star: ['star', 'star'], locate: ['location.viewfinder', 'my_location'], call: ['phone', 'call'],
} as const;

export function Icon({ name, size = 22, color = c.blue }: { name: keyof typeof names; size?: number; color?: string }) {
  const [ios, material] = names[name];
  return <SymbolView name={{ ios, android: material, web: material } as SymbolViewProps['name']} tintColor={color} size={size} />;
}

export function Brand() {
  return <View style={ui.row}><View style={ui.brandIcon}><Icon name="car" color={c.white} size={23} /></View><Text style={ui.brandText}>같이타</Text></View>;
}

export function Button({ children, onPress, secondary = false, small = false, disabled = false, busy = false }: PropsWithChildren<{ onPress: () => void; secondary?: boolean; small?: boolean; disabled?: boolean; busy?: boolean }>) {
  return <Pressable accessibilityRole="button" accessibilityState={{ disabled: disabled || busy, busy }} onPress={onPress} disabled={disabled || busy} hitSlop={small ? 4 : undefined}
    style={({ pressed }) => [ui.button, secondary && ui.secondary, small && ui.smallButton, (disabled || busy) && ui.disabled, pressed && { opacity: 0.8 }]}>
    {busy ? <ActivityIndicator color={secondary ? c.blue : c.white} /> : <Text style={[ui.buttonText, secondary && { color: c.ink }, small && { fontSize: 13 }]}>{children}</Text>}
  </Pressable>;
}

export function Field({ label, icon, prefix, suffix, ...props }: TextInputProps & { label?: string; icon?: keyof typeof names; prefix?: ReactNode; suffix?: ReactNode }) {
  return <View style={{ gap: 9 }}>
    {label && <Text style={ui.label}>{label}</Text>}
    <View style={ui.field}>
      {icon && <Icon name={icon} size={20} />}
      {prefix}
      <TextInput accessibilityLabel={label ?? props.placeholder} placeholderTextColor={c.faint} {...props} style={[ui.input, props.style]} />
      {suffix}
    </View>
  </View>;
}

export function Card({ children, tinted = false, style }: PropsWithChildren<{ tinted?: boolean; style?: StyleProp<ViewStyle> }>) {
  return <View style={[ui.card, tinted && ui.tinted, style]}>{children}</View>;
}

export function Screen({ title, right, children, footer, tabs, onBack, contentGap = 16 }: PropsWithChildren<{ title?: string; right?: ReactNode; footer?: ReactNode; tabs?: ReactNode; onBack?: () => void; contentGap?: number }>) {
  return <SafeAreaView style={ui.safe}>
    <View style={ui.phone}>
      {title && <View style={ui.header}>
        <Pressable accessibilityRole="button" accessibilityLabel="뒤로" onPress={onBack ?? (() => router.canGoBack() ? router.back() : router.replace('/'))} style={ui.back}><Icon name="back" color={c.ink} /></Pressable>
        <Text accessibilityRole="header" style={ui.headerTitle}>{title}</Text>
        <View style={ui.headerRight}>{right}</View>
      </View>}
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={[ui.scroll, { gap: contentGap }]} showsVerticalScrollIndicator={false}>{children}</ScrollView>
      {footer && <View style={ui.footer}>{footer}</View>}
      {tabs}
    </View>
  </SafeAreaView>;
}

export function Notice({ children, error = false }: PropsWithChildren<{ error?: boolean }>) {
  return <Text accessibilityRole={error ? 'alert' : undefined} style={[ui.note, error && { color: c.danger }]}>{children}</Text>;
}

export const ui = StyleSheet.create({
  safe: { flex: 1, backgroundColor: c.white },
  phone: { flex: 1, width: '100%', maxWidth: 480, alignSelf: 'center', backgroundColor: c.white, paddingTop: Platform.OS === 'web' ? 44 : 0 },
  scroll: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 12, paddingBottom: 20, gap: 16 },
  header: { height: 52, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 21, fontWeight: '700', color: c.ink },
  headerRight: { position: 'absolute', right: 24 },
  back: { position: 'absolute', left: 24, minHeight: 44, minWidth: 32, justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  column: { gap: 8 },
  brandIcon: { width: 32, height: 32, borderRadius: 11, backgroundColor: c.blue, justifyContent: 'center', alignItems: 'center' },
  brandText: { fontSize: 24, fontWeight: '700', color: c.blue },
  title: { fontSize: 27, fontWeight: '700', color: c.ink },
  heading: { fontSize: 18, fontWeight: '700', color: c.ink },
  body: { fontSize: 14, color: c.ink, lineHeight: 22 },
  label: { fontSize: 13, color: c.ink, fontWeight: '600' },
  muted: { fontSize: 12, color: c.muted, lineHeight: 19 },
  blue: { color: c.blue },
  bold: { fontWeight: '700', color: c.ink },
  card: { borderWidth: 1, borderColor: c.line, borderRadius: 12, backgroundColor: c.surface, padding: 14, gap: 10 },
  tinted: { backgroundColor: c.tint, borderColor: c.tint },
  field: { minHeight: 48, backgroundColor: c.surface, borderWidth: 1, borderColor: c.line, borderRadius: 12, paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', gap: 10 },
  input: { flex: 1, minWidth: 0, minHeight: 46, fontSize: 14, color: c.ink, paddingVertical: 10 },
  button: { minHeight: 54, borderRadius: 14, paddingHorizontal: 16, backgroundColor: c.blue, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
  secondary: { backgroundColor: c.white, borderWidth: 1, borderColor: c.line },
  smallButton: { minHeight: 26, borderRadius: 9, paddingHorizontal: 16 },
  buttonText: { color: c.white, fontSize: 17, fontWeight: '700' },
  disabled: { opacity: 0.5 },
  footer: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: Platform.OS === 'web' ? 35 : 12, gap: 8 },
  note: { color: c.muted, fontSize: 12, lineHeight: 19 },
  divider: { height: 1, backgroundColor: c.line, marginVertical: 4 },
  badge: { backgroundColor: c.tint, color: c.blue, fontSize: 11, fontWeight: '600', paddingHorizontal: 7, paddingVertical: 4, borderRadius: 6, overflow: 'hidden' },
});
