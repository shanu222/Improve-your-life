import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Body, Card, Screen, Title } from '../src/components/ui';
import { addDays, getLocalDate } from '../src/domain/timezone';
import { average, compareMetric, percentChange, totalsFromEntries } from '../src/domain/comparison';
import { formatHoursMinutes } from '../src/domain/sleep';
import { GLASS_ML } from '../src/domain/types';
import { useAppStore } from '../src/store/appStore';
import { useAppTheme } from '../src/theme';

export default function CompareScreen() {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const service = useAppStore((s) => s.service);
  const user = useAppStore((s) => s.user);
  const profile = useAppStore((s) => s.profile);
  const [lines, setLines] = useState<string[]>([]);
  const [stats, setStats] = useState<{ today: number; yesterday: number; week: number; month: number; label: string }[]>([]);

  useEffect(() => {
    if (!service || !user || !profile) return;
    const today = getLocalDate(new Date(), profile.timezone);
    const yesterday = addDays(today, -1);
    void (async () => {
      const monthEntries = await service.range(user.id, addDays(today, -29), today);
      const todayE = monthEntries.filter((e) => e.localDate === today);
      const yestE = monthEntries.filter((e) => e.localDate === yesterday);
      const t = totalsFromEntries(today, todayE);
      const y = totalsFromEntries(yesterday, yestE);
      const weekDates = Array.from({ length: 7 }, (_, i) => addDays(today, -i));
      const monthDates = Array.from({ length: 30 }, (_, i) => addDays(today, -i));
      const weekAvg = (pick: (d: string) => number) => average(weekDates.map(pick));
      const monthAvg = (pick: (d: string) => number) => average(monthDates.map(pick));
      const waterFor = (date: string) => totalsFromEntries(date, monthEntries.filter((e) => e.localDate === date)).waterMl;
      const sleepFor = (date: string) => totalsFromEntries(date, monthEntries.filter((e) => e.localDate === date)).sleepMinutes;
      setLines([
        compareMetric('Water', '💧', t.waterMl, y.waterMl, 'ml'),
        compareMetric('Sleep', '😴', t.sleepMinutes, y.sleepMinutes, 'min'),
        compareMetric('Smoking', '🚬', t.smoking, y.smoking, 'count'),
      ]);
      const waterPct = percentChange(weekAvg(waterFor), monthAvg(waterFor));
      setStats([
        { label: 'Water (ml)', today: t.waterMl, yesterday: y.waterMl, week: Math.round(weekAvg(waterFor)), month: Math.round(monthAvg(waterFor)) },
        { label: 'Sleep', today: t.sleepMinutes, yesterday: y.sleepMinutes, week: Math.round(weekAvg(sleepFor)), month: Math.round(monthAvg(sleepFor)) },
      ]);
      if (waterPct !== null) {
        setLines((curr) => [...curr, `Your water intake changed about ${waterPct}% versus the longer average. This is an estimate from your logs.`]);
      }
    })();
  }, [service, user, profile]);

  return (
    <Screen theme={theme}>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 12, padding: 20, gap: 14, paddingBottom: 40 }}>
        <Pressable onPress={() => router.back()}><Text style={{ color: theme.accent, fontWeight: '700' }}>Back</Text></Pressable>
        <Title theme={theme}>Today vs your recent days</Title>
        <Body theme={theme}>Comparisons use what you logged — not medical measurements.</Body>
        {lines.map((line) => (
          <Card key={line} theme={theme}><Body theme={theme}>{line}</Body></Card>
        ))}
        {stats.map((row) => (
          <Card key={row.label} theme={theme} style={{ gap: 6 }}>
            <Text style={{ color: theme.ink, fontWeight: '800' }}>{row.label}</Text>
            <Text style={{ color: theme.muted }}>Today: {row.label === 'Sleep' ? formatHoursMinutes(row.today) : row.today}</Text>
            <Text style={{ color: theme.muted }}>Yesterday: {row.label === 'Sleep' ? formatHoursMinutes(row.yesterday) : row.yesterday}</Text>
            <Text style={{ color: theme.muted }}>7-day average: {row.label === 'Sleep' ? formatHoursMinutes(row.week) : row.week}</Text>
            <Text style={{ color: theme.muted }}>30-day trend: {row.label === 'Sleep' ? formatHoursMinutes(row.month) : row.month}</Text>
            {row.label.startsWith('Water') ? (
              <View style={{ height: 10, borderRadius: 8, backgroundColor: theme.line, overflow: 'hidden' }}>
                <View style={{ width: `${Math.min(100, (row.today / Math.max(1, (profile?.waterGoalMl ?? 2000))) * 100)}%`, height: 10, backgroundColor: theme.water }} />
              </View>
            ) : null}
          </Card>
        ))}
        <Body theme={theme} style={{ fontSize: 13 }}>{`${GLASS_ML} ml is one glass in DailyMe.`}</Body>
      </ScrollView>
    </Screen>
  );
}
