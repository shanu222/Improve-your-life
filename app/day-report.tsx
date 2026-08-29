import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Body, Button, Card, Screen, Title, TonePill } from '../src/components/ui';
import type { DailyReport } from '../src/domain/types';
import { useAppStore } from '../src/store/appStore';
import { useAppTheme } from '../src/theme';

export default function DayReportScreen() {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const service = useAppStore((s) => s.service);
  const user = useAppStore((s) => s.user);
  const [report, setReport] = useState<DailyReport | null>(null);

  useEffect(() => {
    if (!service || !user) return;
    void service.generateDailyReport(user.id).then(setReport);
  }, [service, user]);

  return (
    <Screen theme={theme}>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 12, padding: 20, gap: 14, paddingBottom: 40 }}>
        <Pressable onPress={() => router.back()}><Text style={{ color: theme.accent, fontWeight: '700' }}>Back</Text></Pressable>
        <Title theme={theme}>Your day</Title>
        {report ? (
          <>
            <Card theme={theme} style={{ alignItems: 'center' }}>
              <Text style={{ color: theme.faint, fontWeight: '700' }}>Daily Balance Score</Text>
              <Text style={{ color: theme.ink, fontSize: 52, fontWeight: '800' }}>{report.score}</Text>
              <Text style={{ color: theme.muted }}>/100</Text>
            </Card>
            <Line theme={theme} title="Sleep" item={report.sleep} />
            <Line theme={theme} title="Water" item={report.water} />
            <Line theme={theme} title="Nutrition" item={report.nutrition} />
            <Line theme={theme} title="Movement" item={report.movement} />
            <Line theme={theme} title="Mood" item={report.mood} />
            <Line theme={theme} title="Personal care" item={report.personalCare} />
            {report.smoking ? <Line theme={theme} title="Smoking" item={report.smoking} /> : null}
            <Card theme={theme} style={{ gap: 8 }}>
              <Text style={{ color: theme.ink, fontWeight: '800' }}>You did great at</Text>
              <Body theme={theme}>{report.wins}</Body>
              <Text style={{ color: theme.ink, fontWeight: '800' }}>You can improve</Text>
              <Body theme={theme}>{report.improve}</Body>
              <Text style={{ color: theme.ink, fontWeight: '800' }}>Tomorrow</Text>
              <Body theme={theme}>{report.tomorrow}</Body>
            </Card>
            <Title theme={theme} style={{ fontSize: 22, textAlign: 'center' }}>{report.closer}</Title>
          </>
        ) : (
          <Body theme={theme}>Putting your day together…</Body>
        )}
        <Button theme={theme} label="Done" onPress={() => router.back()} />
      </ScrollView>
    </Screen>
  );
}

function Line({
  theme,
  title,
  item,
}: {
  theme: ReturnType<typeof useAppTheme>;
  title: string;
  item: { label: string; tone: 'good' | 'almost' | 'attention' | 'neutral' };
}) {
  return (
    <Card theme={theme} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
      <View>
        <Text style={{ color: theme.ink, fontWeight: '800' }}>{title}</Text>
        <Text style={{ color: theme.muted }}>{item.label}</Text>
      </View>
      <TonePill theme={theme} tone={item.tone} label="" />
    </Card>
  );
}
