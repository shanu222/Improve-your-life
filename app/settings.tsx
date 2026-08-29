import { router } from 'expo-router';
import { Pressable, ScrollView, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Body, Button, Card, Screen, Title } from '../src/components/ui';
import { SCORE_EXPLAINER } from '../src/domain/scoring';
import { HEALTH_DISCLAIMER } from '../src/domain/types';
import { useAppStore } from '../src/store/appStore';
import { useAppTheme } from '../src/theme';

export default function SettingsScreen() {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const profile = useAppStore((s) => s.profile);
  const updateProfile = useAppStore((s) => s.updateProfile);

  return (
    <Screen theme={theme}>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 12, padding: 20, gap: 12, paddingBottom: 40 }}>
        <Pressable onPress={() => router.back()}><Text style={{ color: theme.accent, fontWeight: '700' }}>Back</Text></Pressable>
        <Title theme={theme}>Settings</Title>
        <Button theme={theme} label="Notifications" onPress={() => router.push('/notifications')} />
        <Button theme={theme} label="Privacy & data" onPress={() => router.push('/privacy')} />
        <Button theme={theme} label="Privacy Policy" onPress={() => router.push('/privacy-policy')} />
        <Button theme={theme} label="Terms of Service" onPress={() => router.push('/terms')} />
        <Button theme={theme} label="Support" onPress={() => router.push('/support')} />
        <Button theme={theme} label="How the score works" onPress={() => router.push('/score')} />
        <Button theme={theme} label="About" onPress={() => router.push('/about')} />
        <Card theme={theme} style={{ gap: 8 }}>
          <Text style={{ color: theme.ink, fontWeight: '800' }}>Smoking reduction (optional)</Text>
          <Body theme={theme}>Set a personal daily target if you want to cut down. DailyMe will never shame you.</Body>
          <Button
            theme={theme}
            variant="soft"
            label={profile?.smokingGoalPerDay !== undefined ? `Target: ${profile.smokingGoalPerDay}/day` : 'Set a reduce goal'}
            onPress={() => {
              const next = profile?.smokingGoalPerDay === undefined ? 4 : profile.smokingGoalPerDay <= 1 ? undefined : profile.smokingGoalPerDay - 1;
              void updateProfile({ smokingGoalPerDay: next });
            }}
          />
        </Card>
        <Body theme={theme} style={{ fontSize: 12 }}>{HEALTH_DISCLAIMER}</Body>
        <Body theme={theme} style={{ fontSize: 12 }}>{SCORE_EXPLAINER.note}</Body>
      </ScrollView>
    </Screen>
  );
}
