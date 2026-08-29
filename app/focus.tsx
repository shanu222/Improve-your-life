import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Body, Button, Chip, Screen, Title } from '../src/components/ui';
import { FOCUS_RESULTS, type FocusResult } from '../src/domain/nowActivity';
import { useAppStore } from '../src/store/appStore';
import { useAppTheme } from '../src/theme';

export default function FocusScreen() {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ minutes?: string }>();
  const logFocus = useAppStore((s) => s.logFocus);
  const [title, setTitle] = useState('');
  const [goal, setGoal] = useState('');
  const [duration, setDuration] = useState(Number(params.minutes) || 25);
  const [running, setRunning] = useState(false);
  const [left, setLeft] = useState(duration * 60);
  const [result, setResult] = useState<FocusResult | null>(null);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setLeft((n) => Math.max(0, n - 1)), 1000);
    return () => clearInterval(id);
  }, [running]);

  const minutes = Math.floor(left / 60);
  const seconds = String(left % 60).padStart(2, '0');

  return (
    <Screen theme={theme}>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 12, padding: 20, gap: 14, paddingBottom: 40 }}>
        <Pressable onPress={() => router.back()}><Text style={{ color: theme.accent, fontWeight: '700' }}>Close</Text></Pressable>
        <Title theme={theme}>{"I'm working on..."}</Title>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="Finish presentation"
          placeholderTextColor={theme.faint}
          accessibilityLabel="Current task"
          style={{ backgroundColor: theme.surface, borderRadius: 16, padding: 14, color: theme.ink, minHeight: 52 }}
        />
        <Body theme={theme}>What do you want to accomplish?</Body>
        <TextInput
          value={goal}
          onChangeText={setGoal}
          placeholder="Goal for this session"
          placeholderTextColor={theme.faint}
          accessibilityLabel="Goal"
          style={{ backgroundColor: theme.surface, borderRadius: 16, padding: 14, color: theme.ink, minHeight: 52 }}
        />
        <Text style={{ color: theme.ink, fontWeight: '800' }}>Suggested: try {duration} minutes of focused work.</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {[10, 25, 45, 60].map((n) => (
            <Chip key={n} theme={theme} label={`${n} min`} selected={duration === n && !running} onPress={() => { setDuration(n); setLeft(n * 60); }} />
          ))}
        </View>

        {!running && left > 0 && !result ? (
          <Button
            theme={theme}
            label="Start focus session"
            disabled={!title.trim()}
            onPress={async () => {
              await logFocus({ title: title.trim(), duration, action: 'start' });
              setLeft(duration * 60);
              setRunning(true);
            }}
          />
        ) : null}

        {running || left === 0 ? (
          <Text style={{ color: theme.ink, fontSize: 48, fontWeight: '800', textAlign: 'center' }}>
            {minutes}:{seconds}
          </Text>
        ) : null}

        {(running || left === 0) && !result ? (
          <>
            <Title theme={theme}>How did it go?</Title>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {FOCUS_RESULTS.map((item) => (
                <Chip key={item.id} theme={theme} label={item.label} selected={result === item.id} onPress={() => setResult(item.id)} />
              ))}
            </View>
            {result ? (
              <Button
                theme={theme}
                label="Save result"
                onPress={async () => {
                  await logFocus({ title: title.trim() || 'Focus', duration, status: result, action: 'complete' });
                  router.back();
                }}
              />
            ) : (
              <Button
                theme={theme}
                variant="soft"
                label="End session"
                onPress={() => setRunning(false)}
              />
            )}
          </>
        ) : null}

        {result && !running ? (
          <Button
            theme={theme}
            label="Save result"
            onPress={async () => {
              await logFocus({ title: title.trim() || goal || 'Focus', duration, status: result, action: 'complete' });
              router.back();
            }}
          />
        ) : null}
      </ScrollView>
    </Screen>
  );
}
