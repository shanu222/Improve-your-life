import { router } from 'expo-router';
import { Pressable, ScrollView, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Body, Card, Screen, Title } from '../src/components/ui';
import { SCORE_EXPLAINER } from '../src/domain/scoring';
import { useAppTheme } from '../src/theme';

export default function ScoreScreen() {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  return (
    <Screen theme={theme}>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 12, padding: 20, gap: 14, paddingBottom: 40 }}>
        <Pressable onPress={() => router.back()}><Text style={{ color: theme.accent, fontWeight: '700' }}>Back</Text></Pressable>
        <Title theme={theme}>{SCORE_EXPLAINER.title}</Title>
        <Body theme={theme}>{SCORE_EXPLAINER.body}</Body>
        {SCORE_EXPLAINER.weights.map((w) => (
          <Card key={w.label} theme={theme} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ color: theme.ink, fontWeight: '700' }}>{w.label}</Text>
            <Text style={{ color: theme.muted }}>{w.value}%</Text>
          </Card>
        ))}
        <Body theme={theme}>{SCORE_EXPLAINER.note}</Body>
      </ScrollView>
    </Screen>
  );
}
