import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { useAppStore } from '../src/store/appStore';
import { useAppTheme } from '../src/theme';

export default function Gate() {
  const ready = useAppStore((s) => s.ready);
  const profile = useAppStore((s) => s.profile);
  const theme = useAppTheme();

  if (!ready) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.bg }}>
        <ActivityIndicator color={theme.accent} />
      </View>
    );
  }

  if (!profile?.onboardingComplete) {
    return <Redirect href="/onboarding" />;
  }

  return <Redirect href="/(tabs)" />;
}
