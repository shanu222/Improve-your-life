import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TimeStepper } from '../src/components/TimeStepper';
import { Body, Button, Screen, Title } from '../src/components/ui';
import { formatHoursMinutes, sleepBand, sleepDurationMinutes, sleepEncouragement } from '../src/domain/sleep';
import { useAppStore } from '../src/store/appStore';
import { useAppTheme } from '../src/theme';

export default function SleepLog() {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const profile = useAppStore((s) => s.profile);
  const logSleep = useAppStore((s) => s.logSleep);
  const [sleepTime, setSleep] = useState(profile?.sleepTime ?? '23:00');
  const [wakeTime, setWake] = useState(profile?.wakeTime ?? '07:00');
  const minutes = sleepDurationMinutes(sleepTime, wakeTime);
  const band = sleepBand(minutes, profile?.sleepGoalMinutes);

  return (
    <Screen theme={theme}>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 12, padding: 20, gap: 18, paddingBottom: 40 }}>
        <Pressable onPress={() => router.back()}><Text style={{ color: theme.accent, fontWeight: '700' }}>Close</Text></Pressable>
        <Title theme={theme}>{"Last night's sleep"}</Title>
        <TimeStepper theme={theme} label="Slept at" value={sleepTime} onChange={setSleep} />
        <TimeStepper theme={theme} label="Woke at" value={wakeTime} onChange={setWake} />
        <Title theme={theme} style={{ fontSize: 34 }}>{formatHoursMinutes(minutes)}</Title>
        <Body theme={theme}>{band.label}</Body>
        <Body theme={theme}>{sleepEncouragement(minutes, profile?.sleepGoalMinutes)}</Body>
        <Body theme={theme} style={{ fontSize: 12 }}>These are general lifestyle categories, not medical diagnoses.</Body>
        <Button
          theme={theme}
          label="Save sleep"
          onPress={async () => {
            await logSleep(sleepTime, wakeTime);
            router.back();
          }}
        />
      </ScrollView>
    </Screen>
  );
}
