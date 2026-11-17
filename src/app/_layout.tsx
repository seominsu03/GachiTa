import { DarkTheme, DefaultTheme, router, Stack, ThemeProvider, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { ActivityIndicator, useColorScheme, View } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { ChatDemoProvider } from '@/features/chat/ChatDemoContext';

void SplashScreen.preventAutoHideAsync().catch(() => {});

export const unstable_settings = { anchor: 'index' };

function AuthNavigator() {
  const { user, isRestoring } = useAuth();
  const segments = useSegments();
  const isAuthRoute = segments[0] === '(auth)';
  const isPreviewRoute = segments[0] === 'preview';
  // Also guard future feature screens without modifying another owner's route files.
  useEffect(() => {
    if (!isRestoring && !user && !isAuthRoute && !isPreviewRoute) router.replace('/(auth)/login');
  }, [isRestoring, user, isAuthRoute, isPreviewRoute]);
  if (isRestoring && !isPreviewRoute) {
    return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator accessibilityLabel="로그인 확인 중" /></View>;
  }
  return (
    <View style={{ flex: 1, opacity: !user && !isAuthRoute && !isPreviewRoute ? 0 : 1 }}>
    <ChatDemoProvider key={user?.userId ?? 'signed-out'}>
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={!user}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
      <Stack.Protected guard={Boolean(user)}>
        <Stack.Screen name="index" />
        <Stack.Screen name="explore" />
        <Stack.Screen name="(tabs)" />
      </Stack.Protected>
      <Stack.Screen name="preview" />
    </Stack>
    </ChatDemoProvider>
    </View>
  );
}

export default function TabLayout() {
  const colorScheme = useColorScheme();
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AuthProvider>
        <AnimatedSplashOverlay />
        <AuthNavigator />
      </AuthProvider>
    </ThemeProvider>
  );
}
