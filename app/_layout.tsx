import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useAppStore } from '../src/store/appStore';
import { useAppTheme } from '../src/theme';

export default function RootLayout() {
  const hydrate = useAppStore((s) => s.hydrate);
  const theme = useAppTheme();

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

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
        <Stack.Screen name="about" />
        <Stack.Screen name="score" />
      </Stack>
    </GestureHandlerRootView>
  );
}
