import { router } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Body, Button, Card, Screen, Title } from '../src/components/ui';
import { useAppStore } from '../src/store/appStore';
import { useAppTheme } from '../src/theme';

export default function CoachScreen() {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const today = useAppStore((s) => s.today);
  const coach = today?.coach;

  return (
    <Screen theme={theme}>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 12, padding: 20, gap: 16, paddingBottom: 40 }}>
        <Pressable onPress={() => router.back()} accessibilityRole="button">
          <Text style={{ color: theme.accent, fontWeight: '700' }}>Close</Text>
        </Pressable>
        <Title theme={theme}>Improve my day</Title>
        <Body theme={theme}>{coach?.greeting ?? 'Log a little first, then I’ll have something useful.'}</Body>
        {(coach?.priorities.length ?? 0) > 0 ? (
          <View style={{ gap: 10 }}>
            <Text style={{ color: theme.ink, fontWeight: '800', fontSize: 18 }}>Your {Math.min(3, coach?.priorities.length ?? 0)} priorities</Text>
            {coach?.priorities.map((p) => (
              <Card key={p.text} theme={theme} style={{ gap: 4 }}>
                <Text style={{ color: theme.ink, fontWeight: '800', fontSize: 17 }}>
                  {p.emoji} {p.text}
                </Text>
                <Body theme={theme}>{p.reason}</Body>
              </Card>
            ))}
          </View>
        ) : null}
        {coach?.easiest ? (
          <Card theme={theme} style={{ backgroundColor: theme.accentSoft }}>
            <Text style={{ color: theme.ink, fontWeight: '800' }}>{coach.easiest}</Text>
          </Card>
        ) : null}
        <Button theme={theme} label="Got it" onPress={() => router.back()} />
      </ScrollView>
    </Screen>
  );
}
