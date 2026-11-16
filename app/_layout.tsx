import { Stack, type ErrorBoundaryProps } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Pressable, Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { initAds } from '../src/ads/ads';
import { configureGoogleSignIn } from '../src/firebase/auth';
import { startFcmRuntime } from '../src/lib/fcmBootstrap';
import { useAppStore } from '../src/store/appStore';
import { useAppTheme } from '../src/theme';

export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F4F0EA', padding: 24, gap: 16 }}>
      <Text style={{ color: '#1B1612', fontWeight: '800', fontSize: 20, textAlign: 'center' }}>DailyMe hit a problem</Text>
      <Text style={{ color: '#6B6259', textAlign: 'center' }}>{error?.message || 'Something went wrong.'}</Text>
      <Pressable
        onPress={() => void retry()}
        style={{ backgroundColor: '#E85D4C', paddingHorizontal: 28, paddingVertical: 14, borderRadius: 999 }}
      >
        <Text style={{ color: '#FFFFFF', fontWeight: '700' }}>Try again</Text>
      </Pressable>
    </View>
  );
}

export default function RootLayout() {
  const hydrate = useAppStore((s) => s.hydrate);
  const uid = useAppStore((s) => s.user?.firebaseUid);
  const notifEnabled = useAppStore((s) => s.notif?.enabled);
  const ready = useAppStore((s) => s.ready);
  const theme = useAppTheme();

  useEffect(() => {
    try {
      configureGoogleSignIn();
    } catch {
      // Google Sign-In is optional; never let it stop the app from opening.
    }
    void hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (ready) void initAds();
  }, [ready]);

  useEffect(() => {
    if (!ready) return;
    void startFcmRuntime(uid, Boolean(notifEnabled));
  }, [ready, uid, notifEnabled]);

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: theme.bg }}>
      <StatusBar style={theme.scheme === 'dark' ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.bg }, animation: 'fade' }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="check-in" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
        <Stack.Screen name="coach" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
        <Stack.Screen name="meal" options={{ presentation: 'modal' }} />
        <Stack.Screen name="sleep-log" options={{ presentation: 'modal' }} />
        <Stack.Screen name="day-report" />
        <Stack.Screen name="weekly" />
        <Stack.Screen name="habit-new" options={{ presentation: 'modal' }} />
        <Stack.Screen name="settings" />
        <Stack.Screen name="notifications" />
        <Stack.Screen name="privacy" />
        <Stack.Screen name="privacy-policy" />
        <Stack.Screen name="terms" />
        <Stack.Screen name="support" />
        <Stack.Screen name="delete-account" />
        <Stack.Screen name="about" />
        <Stack.Screen name="score" />
        <Stack.Screen name="auth" />
        <Stack.Screen name="now" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
        <Stack.Screen name="focus" options={{ presentation: 'modal' }} />
        <Stack.Screen name="note" options={{ presentation: 'modal' }} />
        <Stack.Screen name="weather" options={{ presentation: 'modal' }} />
        <Stack.Screen name="compare" />
        <Stack.Screen name="quick" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
      </Stack>
    </GestureHandlerRootView>
  );
}
