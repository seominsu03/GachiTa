import { DarkTheme, DefaultTheme, Link, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StyleSheet, Text, useColorScheme, View } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { ChatDemoProvider } from '@/features/chat/ChatDemoContext';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <ChatDemoProvider>
        <AnimatedSplashOverlay />
        <Stack>
          <Stack.Screen name="index" options={{ title: '같이타 · 개발 미리보기', headerRight: () => <View style={styles.links}><Link href="/explore" style={styles.link}>예제</Link><Link href="/(tabs)/chats" style={styles.link}><Text>채팅 시연</Text></Link></View> }} />
          <Stack.Screen name="explore" options={{ title: 'Expo 예제' }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="rooms/[roomId]/chat" options={{ headerShown: false }} />
        </Stack>
      </ChatDemoProvider>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  links: { flexDirection: 'row', gap: 16 },
  link: { color: '#2864F5', fontSize: 14, fontWeight: '600', paddingVertical: 10 },
});
