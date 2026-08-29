import { router } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Body, Button, Card, EmptyState, Screen, Title } from '../../src/components/ui';
import { streakBrokenCopy } from '../../src/domain/streaks';
import { levelFromXp, BADGE_DEFS } from '../../src/domain/xp';
import { useAppStore } from '../../src/store/appStore';
import { useAppTheme } from '../../src/theme';

const LABELS: Record<string, string> = {
  water: '💧 Water',
  sleep: '🌙 Sleep',
  exercise: '🏃 Movement',
  reading: '📚 Reading',
  personal_care: '✨ Personal care',
  no_sugary: '🥤 Fewer sugary drinks',
  smoking_reduction: '🌿 Smoking reduction',
};

export default function HabitsScreen() {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const today = useAppStore((s) => s.today);
  const profile = useAppStore((s) => s.profile);
  const settings = useAppStore((s) => s.settings);
  const run = useAppStore((s) => s.run);
  const updateSettings = useAppStore((s) => s.updateSettings);
  const localDate = today?.localDate ?? '';
  const level = levelFromXp(today?.xpTotal ?? 0);

  return (
    <Screen theme={theme}>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 16, padding: 18, gap: 14, paddingBottom: 40 }}>
        <Title theme={theme}>Habits</Title>
        <Card theme={theme} style={{ gap: 6 }}>
          <Text style={{ color: theme.faint, fontWeight: '700' }}>LEVEL {level.level}</Text>
          <Text style={{ color: theme.ink, fontSize: 22, fontWeight: '800' }}>{level.name}</Text>
          <View style={{ height: 8, backgroundColor: theme.line, borderRadius: 8, overflow: 'hidden' }}>
            <View style={{ width: `${level.intoLevel}%`, height: 8, backgroundColor: theme.accent }} />
          </View>
          <Body theme={theme}>{level.intoLevel} / {level.needed} XP this level</Body>
        </Card>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ color: theme.ink, fontWeight: '800', fontSize: 18 }}>Streaks</Text>
          <Pressable onPress={() => void updateSettings({ streaksEnabled: !(settings?.streaksEnabled ?? true) })}>
            <Text style={{ color: theme.accent, fontWeight: '700' }}>
              {(settings?.streaksEnabled ?? true) ? 'Optional · on' : 'Optional · off'}
            </Text>
          </Pressable>
        </View>

        {(today?.streaks ?? []).map((streak) => (
          <Card key={streak.id} theme={theme} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View>
              <Text style={{ color: theme.ink, fontWeight: '800' }}>{LABELS[streak.kind] ?? streak.kind}</Text>
              <Body theme={theme}>
                {streak.currentCount > 0
                  ? `🔥 ${streak.currentCount} day streak`
                  : streakBrokenCopy()}
              </Body>
            </View>
            <Text style={{ color: theme.muted, fontWeight: '700' }}>best {streak.bestCount}</Text>
          </Card>
        ))}

        <Text style={{ color: theme.ink, fontWeight: '800', fontSize: 18 }}>Your habits</Text>
        {(today?.habits ?? []).length === 0 ? (
          <EmptyState theme={theme} emoji="⭐" title="No custom habits yet" body="Add something that matters to you." action="New habit" onAction={() => router.push('/habit-new')} />
        ) : (
          (today?.habits ?? []).map((habit) => {
            const done = today?.habitLogs.some((l) => l.habitId === habit.id && l.completed);
            return (
              <Pressable
                key={habit.id}
                onPress={() =>
                  void run((api, userId) => api.toggleHabit(userId, habit.id, localDate, !done))
                }
                accessibilityRole="button"
                accessibilityState={{ checked: Boolean(done) }}
              >
                <Card theme={theme} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <Text style={{ fontSize: 24 }}>{habit.icon}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: theme.ink, fontWeight: '800' }}>{habit.name}</Text>
                    <Body theme={theme}>{habit.goal}</Body>
                  </View>
                  <View
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 14,
                      backgroundColor: done ? theme.good : theme.surface2,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Text style={{ color: '#fff', fontWeight: '800' }}>{done ? '✓' : ''}</Text>
                  </View>
                </Card>
              </Pressable>
            );
          })
        )}
        <Button theme={theme} label="Add a custom habit" onPress={() => router.push('/habit-new')} />

        <Text style={{ color: theme.ink, fontWeight: '800', fontSize: 18 }}>Badges</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {BADGE_DEFS.map((badge) => {
            const owned = today?.badges.some((b) => b.badgeKey === badge.key);
            return (
              <View
                key={badge.key}
                style={{
                  width: '48%',
                  opacity: owned ? 1 : 0.45,
                  backgroundColor: theme.surface,
                  borderRadius: 16,
                  padding: 12,
                  gap: 4,
                }}
              >
                <Text style={{ fontSize: 22 }}>{badge.emoji}</Text>
                <Text style={{ color: theme.ink, fontWeight: '800' }}>{badge.name}</Text>
                <Body theme={theme} style={{ fontSize: 12 }}>{badge.description}</Body>
              </View>
            );
          })}
        </View>
        {profile?.smokingGoalPerDay !== undefined ? (
          <Body theme={theme}>Smoking reduction goal: {profile.smokingGoalPerDay}/day. Never shamed — just tracked.</Body>
        ) : null}
      </ScrollView>
    </Screen>
  );
}
