import { Redirect } from 'expo-router';
import { ActivityIndicator, Text, View } from 'react-native';
import { Button } from '../src/components/ui';
import { firebaseConfigured } from '../src/firebase/client';
import { useAppStore } from '../src/store/appStore';
import { useAppTheme } from '../src/theme';

export default function Gate() {
  const ready = useAppStore((s) => s.ready);
  const booting = useAppStore((s) => s.booting);
  const profile = useAppStore((s) => s.profile);
  const user = useAppStore((s) => s.user);
  const error = useAppStore((s) => s.error);
  const hydrate = useAppStore((s) => s.hydrate);
  const theme = useAppTheme();

  if (!ready && booting) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.bg, padding: 24, gap: 12 }}>
        <ActivityIndicator color={theme.accent} />
        <Text style={{ color: theme.muted, textAlign: 'center' }}>Starting DailyMe…</Text>
      </View>
    );
  }

  if (!ready) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.bg, padding: 24, gap: 16 }}>
        <Text style={{ color: theme.ink, fontWeight: '800', fontSize: 20, textAlign: 'center' }}>DailyMe could not start</Text>
        <Text style={{ color: theme.muted, textAlign: 'center' }}>{error || 'Something went wrong while opening your data.'}</Text>
        <Button theme={theme} label="Try again" onPress={() => void hydrate()} />
      </View>
    );
  }

  if (!profile?.onboardingComplete) {
    return <Redirect href="/onboarding" />;
  }

  if (firebaseConfigured() && !user?.firebaseUid) {
    return <Redirect href="/auth" />;
  }

  return <Redirect href="/(tabs)" />;
}
