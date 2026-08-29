import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Body, Button, Card, Screen, Title } from '../src/components/ui';
import { weatherSuggestion } from '../src/domain/notesSafety';
import { apiGet } from '../src/lib/apiClient';
import { toUserMessage } from '../src/domain/errors';
import { useAppStore } from '../src/store/appStore';
import { useAppTheme } from '../src/theme';

export default function WeatherScreen() {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const logWeather = useAppStore((s) => s.logWeather);
  const [celsius, setCelsius] = useState('');
  const [condition, setCondition] = useState('');
  const [hot, setHot] = useState<boolean | null>(null);
  const [hint, setHint] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadAuto = async () => {
    setError(null);
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setError('Location is optional. You can type the temperature instead.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const data = await apiGet<{ celsius?: number; condition?: string }>(
            `/api/weather?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}`,
          );
          if (data.celsius !== undefined) setCelsius(String(Math.round(data.celsius)));
          if (data.condition) setCondition(data.condition);
        } catch (err) {
          setError(toUserMessage(err));
        }
      },
      () => setError('Location is optional. You can type the temperature instead.'),
      { timeout: 8000 },
    );
  };

  return (
    <Screen theme={theme}>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 12, padding: 20, gap: 14, paddingBottom: 40 }}>
        <Pressable onPress={() => router.back()}><Text style={{ color: theme.accent, fontWeight: '700' }}>Close</Text></Pressable>
        <Title theme={theme}>How is the weather right now?</Title>
        <Body theme={theme}>Location is optional. You can always enter this yourself.</Body>
        <Button theme={theme} variant="soft" label="Use approximate weather" onPress={() => void loadAuto()} />
        {error ? <Body theme={theme}>{error}</Body> : null}
        <TextInput
          value={celsius}
          onChangeText={setCelsius}
          keyboardType="numeric"
          placeholder="Temperature °C"
          placeholderTextColor={theme.faint}
          accessibilityLabel="Temperature"
          style={{ backgroundColor: theme.surface, borderRadius: 16, padding: 14, color: theme.ink, minHeight: 52 }}
        />
        <TextInput
          value={condition}
          onChangeText={setCondition}
          placeholder="Sunny, rainy, humid…"
          placeholderTextColor={theme.faint}
          accessibilityLabel="Condition"
          style={{ backgroundColor: theme.surface, borderRadius: 16, padding: 14, color: theme.ink, minHeight: 52 }}
        />
        <Text style={{ color: theme.ink, fontWeight: '800' }}>Feeling hot?</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Button theme={theme} variant={hot === true ? 'primary' : 'soft'} label="Yes" onPress={() => setHot(true)} />
          <Button theme={theme} variant={hot === false ? 'primary' : 'soft'} label="No" onPress={() => setHot(false)} />
        </View>
        <Button
          theme={theme}
          label="Save"
          onPress={async () => {
            const n = celsius ? Number(celsius) : undefined;
            await logWeather({ celsius: Number.isFinite(n) ? n : undefined, condition, feelingHot: hot ?? undefined });
            setHint(weatherSuggestion(Number.isFinite(n) ? n : undefined, hot ?? undefined));
          }}
        />
        {hint ? <Card theme={theme}><Body theme={theme}>{hint}</Body></Card> : null}
      </ScrollView>
    </Screen>
  );
}
