import { useState } from 'react';
import { Link } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useAuth } from '@/contexts/AuthContext';

export function AccountBar({ destination }: { destination: 'home' | 'explore' }) {
  const { user, logout } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function signOut() {
    if (busy) return;
    setBusy(true);
    setError(null);
    try { await logout(); } catch (failure) {
      setError(failure instanceof Error ? failure.message : '로그아웃하지 못했습니다.');
    } finally { setBusy(false); }
  }

  return <View style={styles.container}>
    <Text style={styles.text}>{user?.nickname}님</Text>
    <Link href={destination === 'home' ? '/' : '/explore'} style={styles.link}>{destination === 'home' ? '홈' : 'Explore'}</Link>
    <Pressable accessibilityRole="button" disabled={busy} onPress={() => void signOut()}><Text style={styles.link}>{busy ? '처리 중…' : '로그아웃'}</Text></Pressable>
    {error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
  </View>;
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, paddingVertical: 16, alignItems: 'center' },
  text: { color: '#1469bf', fontWeight: '700' },
  link: { color: '#1469bf', paddingVertical: 8 },
  error: { color: '#b42318', width: '100%' },
});
