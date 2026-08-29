import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Body, Button, Card, Screen, Title } from '../src/components/ui';
import { formatHoursMinutes } from '../src/domain/sleep';
import type { WeeklyReport } from '../src/domain/types';
import { GLASS_ML } from '../src/domain/types';
import { useAppStore } from '../src/store/appStore';
import { useAppTheme } from '../src/theme';

export default function WeeklyScreen() {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const service = useAppStore((s) => s.service);
  const user = useAppStore((s) => s.user);
  const [weekly, setWeekly] = useState<WeeklyReport | null>(null);

  useEffect(() => {
    if (!service || !user) return;
    void service.generateWeeklyReport(user.id).then(setWeekly);
  }, [service, user]);

  return (
    <Screen theme={theme}>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 12, padding: 20, gap: 14, paddingBottom: 40 }}>
        <Pressable onPress={() => router.back()}><Text style={{ color: theme.accent, fontWeight: '700' }}>Back</Text></Pressable>
        <Title theme={theme}>Your week</Title>
        {weekly ? (
          <>
            <Card theme={theme} style={{ gap: 10 }}>
              <Text style={{ color: theme.ink, fontSize: 18 }}>🌙 Sleep · {weekly.avgSleepMinutes ? formatHoursMinutes(weekly.avgSleepMinutes) + ' average' : '—'}</Text>
              <Text style={{ color: theme.ink, fontSize: 18 }}>💧 Water · {(weekly.avgWaterMl / GLASS_ML).toFixed(1)} glasses/day</Text>
              <Text style={{ color: theme.ink, fontSize: 18 }}>🏃 Movement · {weekly.exerciseDays} days</Text>
              <Text style={{ color: theme.ink, fontSize: 18 }}>😊 Mood · {weekly.avgMood ? weekly.avgMood.toFixed(1) + '/10' : '—'}</Text>
              {weekly.smokingAvg !== undefined ? (
                <Text style={{ color: theme.ink, fontSize: 18 }}>🚬 Smoking · {weekly.smokingAvg.toFixed(1)}/day</Text>
              ) : null}
            </Card>
            <Card theme={theme} style={{ gap: 8 }}>
              <Text style={{ color: theme.ink, fontWeight: '800' }}>Biggest win</Text>
              <Body theme={theme}>{weekly.biggestWin}</Body>
              <Text style={{ color: theme.ink, fontWeight: '800' }}>Next focus</Text>
              <Body theme={theme}>{weekly.nextFocus}</Body>
            </Card>
          </>
        ) : (
          <Body theme={theme}>Loading your week…</Body>
        )}
        <Button theme={theme} label="Done" onPress={() => router.back()} />
      </ScrollView>
    </Screen>
  );
}
