import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Body, Button, Card, Screen, Title } from '../src/components/ui';
import { tapFeedback } from '../src/lib/haptics';
import { useAppStore } from '../src/store/appStore';
import { useAppTheme } from '../src/theme';
import type { CaffeineKind, ExerciseKind } from '../src/domain/types';

export default function CheckIn() {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const { type, kind } = useLocalSearchParams<{ type?: string; kind?: string }>();
  const logExercise = useAppStore((s) => s.logExercise);
  const logCaffeine = useAppStore((s) => s.logCaffeine);
  const logScreen = useAppStore((s) => s.logScreen);
  const logBreak = useAppStore((s) => s.logBreak);
  const [minutes, setMinutes] = useState(20);
  const [caffeine, setCaffeine] = useState<CaffeineKind>('coffee');

  const close = () => router.back();

  return (
    <Screen theme={theme}>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 12, padding: 20, gap: 16, paddingBottom: 40 }}>
        <Pressable onPress={close} accessibilityRole="button"><Text style={{ color: theme.accent, fontWeight: '700' }}>Close</Text></Pressable>

        {type === 'exercise' || type === 'walk' ? (
          <>
            <Title theme={theme}>{kind === 'walk' || type === 'walk' ? 'Walk' : 'Exercise'}</Title>
            <Body theme={theme}>How long? Estimates only if we show calories.</Body>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {[10, 15, 20, 30, 45, 60].map((n) => (
                <Pressable
                  key={n}
                  onPress={() => setMinutes(n)}
                  style={{
                    paddingHorizontal: 16,
                    minHeight: 44,
                    borderRadius: 22,
                    backgroundColor: minutes === n ? theme.accent : theme.surface,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{ color: minutes === n ? theme.onAccent : theme.ink, fontWeight: '800' }}>{n} min</Text>
                </Pressable>
              ))}
            </View>
            <Button
              theme={theme}
              label="Log movement"
              onPress={async () => {
                await tapFeedback();
                const k: ExerciseKind = kind === 'walk' || type === 'walk' ? 'walk' : 'custom';
                await logExercise(k, minutes);
                close();
              }}
            />
          </>
        ) : null}

        {type === 'caffeine' ? (
          <>
            <Title theme={theme}>Caffeine</Title>
            <Body theme={theme}>Approximate — actual caffeine varies a lot.</Body>
            {(['coffee', 'tea', 'energy', 'other'] as const).map((k) => (
              <Pressable key={k} onPress={() => setCaffeine(k)}>
                <Card theme={theme} style={{ borderColor: caffeine === k ? theme.accent : theme.line }}>
                  <Text style={{ color: theme.ink, fontWeight: '800', textTransform: 'capitalize' }}>{k}</Text>
                </Card>
              </Pressable>
            ))}
            <Button
              theme={theme}
              label="Log serving"
              onPress={async () => {
                await logCaffeine(caffeine);
                close();
              }}
            />
          </>
        ) : null}

        {type === 'screen' ? (
          <>
            <Title theme={theme}>Screen time</Title>
            <Body theme={theme}>Manual entry. Device screen-time APIs can be connected later if available.</Body>
            <TextInput
              keyboardType="numeric"
              value={String(minutes)}
              onChangeText={(t) => setMinutes(Number(t) || 0)}
              accessibilityLabel="Minutes"
              style={{ backgroundColor: theme.surface, borderRadius: 16, padding: 14, color: theme.ink, minHeight: 48 }}
            />
            <Button
              theme={theme}
              label="Save"
              onPress={async () => {
                await logScreen(minutes);
                close();
              }}
            />
          </>
        ) : null}

        {type === 'break' || type === 'relax' ? (
          <>
            <Title theme={theme}>Take a break</Title>
            <Body theme={theme}>{"You've been focused. Five to ten minutes is plenty."}</Body>
            <Button theme={theme} label="Start break" onPress={async () => { await logBreak('start'); close(); }} />
            <Button theme={theme} variant="soft" label="Break complete" onPress={async () => { await logBreak('complete', 8); close(); }} />
          </>
        ) : null}

        {!['exercise', 'walk', 'caffeine', 'screen', 'break', 'relax'].includes(String(type)) ? (
          <Card theme={theme}>
            <Body theme={theme}>Use the Today check-ins for this one — most things are a single tap.</Body>
            <Button theme={theme} label="Back to today" onPress={close} />
          </Card>
        ) : null}
      </ScrollView>
    </Screen>
  );
}
