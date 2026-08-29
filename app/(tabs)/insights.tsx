import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Body, Button, Card, EmptyState, Screen, Title } from '../../src/components/ui';
import type { Insight, WeeklyReport } from '../../src/domain/types';
import { formatHoursMinutes } from '../../src/domain/sleep';
import { GLASS_ML } from '../../src/domain/types';
import { useAppStore } from '../../src/store/appStore';
import { useAppTheme } from '../../src/theme';

export default function InsightsScreen() {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const service = useAppStore((s) => s.service);
  const user = useAppStore((s) => s.user);
  const today = useAppStore((s) => s.today);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [weekly, setWeekly] = useState<WeeklyReport | null>(null);

  useEffect(() => {
    if (!service || !user) return;
    void service.insights(user.id).then(setInsights);
    void service.generateWeeklyReport(user.id).then(setWeekly);
  }, [service, user, today?.entries.length]);

  return (
    <Screen theme={theme}>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 16, padding: 18, gap: 14, paddingBottom: 40 }}>
        <Title theme={theme}>Insights</Title>
        <Body theme={theme}>{"Patterns only appear when you've logged enough days. These are correlations, not causes."}</Body>

        {insights.length === 0 ? (
          <EmptyState
            theme={theme}
            emoji="✨"
            title="Still gathering your story"
            body="Keep checking in for a week and DailyMe will surface gentle patterns."
          />
        ) : (
          insights.map((insight) => (
            <Card key={insight.id} theme={theme}>
              <Text style={{ color: theme.ink, fontWeight: '700', fontSize: 16 }}>{insight.text}</Text>
              <Body theme={theme}>{insight.sampleSize} days of logs</Body>
            </Card>
          ))
        )}

        <Text style={{ color: theme.ink, fontWeight: '800', fontSize: 18 }}>Your week</Text>
        {weekly ? (
          <Card theme={theme} style={{ gap: 10 }}>
            <Row emoji="🌙" label="Sleep" value={weekly.avgSleepMinutes ? `${formatHoursMinutes(weekly.avgSleepMinutes)} average` : 'Not enough logs'} />
            <Row emoji="💧" label="Water" value={`${(weekly.avgWaterMl / GLASS_ML).toFixed(1)} glasses/day`} />
            <Row emoji="🏃" label="Movement" value={`${weekly.exerciseDays} days · ${Math.round(weekly.exerciseMinutes)} min`} />
            <Row emoji="😊" label="Mood" value={weekly.avgMood ? `${weekly.avgMood.toFixed(1)}/10` : '—'} />
            {weekly.smokingAvg !== undefined ? (
              <Row emoji="🚬" label="Smoking" value={`${weekly.smokingAvg.toFixed(1)}/day`} />
            ) : null}
            <Row emoji="✨" label="Personal care" value={`${Math.round(weekly.personalCareConsistency * 7)} days`} />
            {weekly.avgScreenMinutes ? (
              <Row emoji="📱" label="Screen time" value={`${formatHoursMinutes(weekly.avgScreenMinutes)} average`} />
            ) : null}
            <View style={{ height: 1, backgroundColor: theme.line, marginVertical: 4 }} />
            <Text style={{ color: theme.ink, fontWeight: '800' }}>Biggest win</Text>
            <Body theme={theme}>{weekly.biggestWin}</Body>
            <Text style={{ color: theme.ink, fontWeight: '800' }}>Next focus</Text>
            <Body theme={theme}>{weekly.nextFocus}</Body>
          </Card>
        ) : null}
        <Button theme={theme} variant="soft" label="Open weekly report" onPress={() => router.push('/weekly')} />
      </ScrollView>
    </Screen>
  );
}

function Row({ emoji, label, value }: { emoji: string; label: string; value: string }) {
  const theme = useAppTheme();
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
      <Text style={{ color: theme.ink, fontWeight: '700' }}>{emoji} {label}</Text>
      <Text style={{ color: theme.muted, flex: 1, textAlign: 'right' }}>{value}</Text>
    </View>
  );
}
