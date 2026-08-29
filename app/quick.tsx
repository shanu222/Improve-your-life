import { router } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Screen, Title } from '../src/components/ui';
import { GLASS_ML } from '../src/domain/types';
import { tapFeedback, successFeedback } from '../src/lib/haptics';
import { useAppStore } from '../src/store/appStore';
import { useAppTheme } from '../src/theme';

const ACTIONS = [
  { id: 'meal', emoji: '🍽', label: 'Log meal', route: '/meal' },
  { id: 'water', emoji: '💧', label: 'Log water' },
  { id: 'mood', emoji: '🙂', label: 'Log mood', route: '/(tabs)' },
  { id: 'activity', emoji: '✨', label: 'Log activity', route: '/now' },
  { id: 'sleep', emoji: '😴', label: 'Log sleep', route: '/sleep-log' },
  { id: 'hygiene', emoji: '🧼', label: 'Log hygiene', route: '/check-in' },
  { id: 'smoking', emoji: '🚬', label: 'Log cigarettes' },
  { id: 'focus', emoji: '🎯', label: 'Start focus', route: '/focus' },
  { id: 'note', emoji: '📝', label: 'Add note', route: '/note' },
  { id: 'checkin', emoji: '👋', label: 'Check-in', route: '/now' },
  { id: 'alcohol', emoji: '🍷', label: 'Log alcohol' },
  { id: 'weather', emoji: '🌤️', label: 'Weather', route: '/weather' },
] as const;

export default function QuickScreen() {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const logWater = useAppStore((s) => s.logWater);
  const logSmoking = useAppStore((s) => s.logSmoking);
  const logAlcohol = useAppStore((s) => s.logAlcohol);

  const run = async (id: string, route?: string) => {
    await tapFeedback();
    if (id === 'water') {
      await logWater(GLASS_ML);
      await successFeedback();
      router.back();
      return;
    }
    if (id === 'smoking') {
      await logSmoking();
      router.back();
      return;
    }
    if (id === 'alcohol') {
      await logAlcohol(1);
      router.back();
      return;
    }
    if (id === 'hygiene') {
      router.replace({ pathname: '/check-in', params: { type: 'hygiene' } });
      return;
    }
    if (route) {
      router.replace(route as '/meal');
    }
  };

  return (
    <Screen theme={theme}>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 12, padding: 20, gap: 14, paddingBottom: 40 }}>
        <Pressable onPress={() => router.back()}><Text style={{ color: theme.accent, fontWeight: '700' }}>Close</Text></Pressable>
        <Title theme={theme}>Quick log</Title>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          {ACTIONS.map((action) => (
            <Pressable
              key={action.id}
              onPress={() => void run(action.id, 'route' in action ? action.route : undefined)}
              accessibilityRole="button"
              accessibilityLabel={action.label}
              style={{
                width: '48%',
                minHeight: 88,
                borderRadius: 20,
                backgroundColor: theme.surface,
                borderWidth: 1,
                borderColor: theme.line,
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
              }}
            >
              <Text style={{ fontSize: 26 }}>{action.emoji}</Text>
              <Text style={{ color: theme.ink, fontWeight: '800' }}>{action.label}</Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </Screen>
  );
}
