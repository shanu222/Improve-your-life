import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Body, Button, Card, EmptyState, Screen, Title } from '../src/components/ui';
import { toUserMessage } from '../src/domain/errors';
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!service || !user) {
      setLoading(false);
      setError('DailyMe is still starting. Try again in a moment.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const report = await service.generateWeeklyReport(user.id);
      setWeekly(report);
    } catch (err) {
      setWeekly(null);
      setError(toUserMessage(err));
    } finally {
      setLoading(false);
    }
  }, [service, user]);

  useEffect(() => {
    void load();
  }, [load]);

  const emptyWeek = weekly && !weekly.avgSleepMinutes && weekly.avgWaterMl === 0 && weekly.exerciseDays === 0 && !weekly.avgMood;

  return (
    <Screen theme={theme}>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 12, padding: 20, gap: 14, paddingBottom: insets.bottom + 32 }}>
        <Pressable onPress={() => router.back()} style={{ minHeight: 44, justifyContent: 'center' }}>
          <Text style={{ color: theme.accent, fontWeight: '700' }}>Back</Text>
        </Pressable>
        <Title theme={theme}>Your week</Title>
        {loading ? (
          <Card theme={theme} style={{ alignItems: 'center', gap: 10 }}>
            <ActivityIndicator color={theme.accent} />
            <Body theme={theme}>Building this week from your logs…</Body>
          </Card>
        ) : null}
        {error ? (
          <EmptyState
            theme={theme}
            emoji="⚠️"
            title="Could not load this week"
            body={error}
            action="Try again"
            onAction={() => void load()}
          />
        ) : null}
        {!loading && !error && weekly && emptyWeek ? (
          <EmptyState
            theme={theme}
            emoji="📅"
            title="Not enough logs this week"
            body="Check in for a few days and DailyMe will summarize sleep, water, meals and mood here. Nothing is invented."
          />
        ) : null}
        {!loading && !error && weekly && !emptyWeek ? (
          <>
            <Card theme={theme} style={{ gap: 10 }}>
              <Text style={{ color: theme.ink, fontSize: 18 }}>🌙 Sleep · {weekly.avgSleepMinutes ? formatHoursMinutes(weekly.avgSleepMinutes) + ' average' : 'Not logged'}</Text>
              <Text style={{ color: theme.ink, fontSize: 18 }}>💧 Water · {(weekly.avgWaterMl / GLASS_ML).toFixed(1)} glasses/day</Text>
              <Text style={{ color: theme.ink, fontSize: 18 }}>🏃 Movement · {weekly.exerciseDays} days</Text>
              <Text style={{ color: theme.ink, fontSize: 18 }}>😊 Mood · {weekly.avgMood ? weekly.avgMood.toFixed(1) + '/10' : 'Not logged'}</Text>
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
        ) : null}
        <View style={{ marginTop: 8 }}>
          <Button theme={theme} label="Done" onPress={() => router.back()} />
        </View>
      </ScrollView>
    </Screen>
  );
}
