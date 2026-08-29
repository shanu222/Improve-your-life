import { router } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ProgressRing, ScoreNumber } from '../../src/components/ProgressRing';
import { Body, Button, Card, EmptyState, Screen, Title, TonePill } from '../../src/components/ui';
import { QUICK_ACTIONS } from '../../src/domain/defaults';
import { formatDuration, formatGreeting, getLocalMinutes, glassesFromMl } from '../../src/domain/timezone';
import { formatHoursMinutes } from '../../src/domain/sleep';
import { waterStatus, sleepStatus } from '../../src/domain/scoring';
import { GLASS_ML, MOOD_OPTIONS } from '../../src/domain/types';
import { tapFeedback, successFeedback } from '../../src/lib/haptics';
import { useAppStore } from '../../src/store/appStore';
import { useAppTheme } from '../../src/theme';

export default function TodayScreen() {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const profile = useAppStore((s) => s.profile);
  const today = useAppStore((s) => s.today);
  const error = useAppStore((s) => s.error);
  const clearError = useAppStore((s) => s.clearError);
  const logWater = useAppStore((s) => s.logWater);
  const logSimple = useAppStore((s) => s.logSimple);
  const logHygiene = useAppStore((s) => s.logHygiene);
  const logSmoking = useAppStore((s) => s.logSmoking);
  const logMood = useAppStore((s) => s.logMood);
  const deleteEntry = useAppStore((s) => s.deleteEntry);

  const minutes = getLocalMinutes(new Date(), profile?.timezone ?? 'UTC');
  const hello = formatGreeting(minutes, profile?.name);

  const water = waterStatus(today?.waterMl ?? 0, profile?.waterGoalMl ?? 2000);
  const sleep = sleepStatus(today?.sleepMinutes ?? 0);

  const timeline = useMemo(() => {
    return (today?.entries ?? []).map((entry) => ({
      id: entry.id,
      time: new Date(entry.occurredAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
      label: labelFor(entry.type, entry.payload),
    }));
  }, [today?.entries]);

  const onQuick = async (action: (typeof QUICK_ACTIONS)[number]) => {
    await tapFeedback();
    if (action.type === 'water') {
      await logWater(GLASS_ML);
      await successFeedback();
      return;
    }
    if (action.type === 'fruit' || action.type === 'vegetables' || action.type === 'junk' || action.type === 'sugary' || action.type === 'read' || action.type === 'relax') {
      await logSimple(action.type);
      return;
    }
    if (action.type === 'hygiene' && 'kind' in action) {
      await logHygiene(action.kind as 'brush' | 'bath' | 'face');
      return;
    }
    if (action.type === 'smoking') {
      await logSmoking();
      return;
    }
    if (action.type === 'meal') {
      router.push({ pathname: '/meal', params: { kind: 'kind' in action ? String(action.kind) : 'snack' } });
      return;
    }
    if (action.type === 'sleep') {
      router.push('/sleep-log');
      return;
    }
    router.push({ pathname: '/check-in', params: { type: action.type, kind: 'kind' in action ? String(action.kind) : '' } });
  };

  return (
    <Screen theme={theme}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 12,
          paddingBottom: 120,
          paddingHorizontal: 18,
          gap: 16,
        }}
      >
        <Text style={{ color: theme.muted, fontWeight: '700' }}>{hello}</Text>
        <Title theme={theme} style={{ fontSize: 22 }}>
          How are you doing today?
        </Title>

        {error ? (
          <Pressable onPress={clearError} accessibilityRole="button">
            <Card theme={theme} style={{ backgroundColor: theme.accentSoft }}>
              <Text style={{ color: theme.ink, fontWeight: '700' }}>{error}</Text>
            </Card>
          </Pressable>
        ) : null}

        <Card theme={theme} style={{ alignItems: 'center', gap: 8 }}>
          <ProgressRing
            progress={(today?.scored.score ?? 0) / 100}
            color={theme.accent}
            track={theme.line}
          >
            <ScoreNumber theme={theme} score={today?.scored.score ?? null} />
          </ProgressRing>
          <Text style={{ color: theme.ink, fontWeight: '700', fontSize: 16 }}>Daily Balance Score</Text>
          <Body theme={theme} style={{ textAlign: 'center' }}>
            {today?.scored.headline}
          </Body>
          <Pressable onPress={() => router.push('/score')} accessibilityRole="button" accessibilityLabel="How this score works">
            <Text style={{ color: theme.accent, fontWeight: '700' }}>How this score works</Text>
          </Pressable>
        </Card>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          <Mini theme={theme} title="Sleep" value={sleep.value} detail={sleep.detail} tone={sleep.tone} color={theme.sleep} />
          <Mini theme={theme} title="Water" value={water.value} detail={water.detail} tone={water.tone} color={theme.water} />
          <Mini
            theme={theme}
            title="Food"
            value={today?.meals.size ? `${today.meals.size} meals` : 'Not logged'}
            detail={today && today.meals.size >= 2 ? 'Good balance' : 'Add a meal'}
            tone={today && today.meals.size >= 2 ? 'good' : 'neutral'}
            color={theme.food}
          />
          <Mini
            theme={theme}
            title="Movement"
            value={formatDuration(today?.movementMinutes ?? 0)}
            detail={(today?.movementMinutes ?? 0) >= 20 ? 'Nice' : 'A short walk helps'}
            tone={(today?.movementMinutes ?? 0) >= 20 ? 'good' : 'neutral'}
            color={theme.movement}
          />
          <Mini
            theme={theme}
            title="Mood"
            value={today?.mood ? `${today.mood}/10` : '—'}
            detail="How are you feeling?"
            tone={today?.mood && today.mood >= 7 ? 'good' : 'neutral'}
            color={theme.mood}
          />
          <Mini
            theme={theme}
            title="Personal care"
            value={`${today?.hygiene.size ?? 0}/4`}
            detail={(today?.hygiene.size ?? 0) >= 3 ? 'Complete ✨' : 'A tiny win'}
            tone={(today?.hygiene.size ?? 0) >= 3 ? 'good' : 'neutral'}
            color={theme.care}
          />
          {profile?.focusAreas.includes('smoking') || (today?.smoking ?? 0) > 0 ? (
            <Mini
              theme={theme}
              title="Smoking"
              value={`${today?.smoking ?? 0}`}
              detail={
                profile?.smokingGoalPerDay !== undefined
                  ? (today?.smoking ?? 0) <= profile.smokingGoalPerDay
                    ? "You're moving in the right direction."
                    : `Above your personal target of ${profile.smokingGoalPerDay}/day.`
                  : 'Logged today'
              }
              tone="neutral"
              color={theme.muted}
            />
          ) : null}
        </View>

        <Card theme={theme} style={{ gap: 12 }}>
          <Text style={{ color: theme.ink, fontWeight: '800', fontSize: 18 }}>How are you feeling?</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {MOOD_OPTIONS.map((m) => (
              <Pressable
                key={m.key}
                onPress={() => void logMood(m.key)}
                accessibilityRole="button"
                accessibilityLabel={m.label}
                style={{
                  width: '30%',
                  minHeight: 64,
                  borderRadius: 16,
                  backgroundColor: theme.surface2,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ fontSize: 24 }}>{m.emoji}</Text>
                <Text style={{ color: theme.muted, fontWeight: '700', fontSize: 12 }}>{m.label}</Text>
              </Pressable>
            ))}
          </View>
        </Card>

        <Text style={{ color: theme.ink, fontWeight: '800', fontSize: 18 }}>Quick check-in</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {QUICK_ACTIONS.map((action) => (
            <Pressable
              key={`${action.type}-${action.label}`}
              onPress={() => void onQuick(action)}
              accessibilityRole="button"
              accessibilityLabel={action.label}
              style={{
                width: '31%',
                minHeight: 76,
                borderRadius: 18,
                backgroundColor: theme.surface,
                borderWidth: 1,
                borderColor: theme.line,
                alignItems: 'center',
                justifyContent: 'center',
                gap: 4,
                padding: 8,
              }}
            >
              <Text style={{ fontSize: 22 }}>{action.emoji}</Text>
              <Text style={{ color: theme.ink, fontWeight: '700', fontSize: 12, textAlign: 'center' }}>{action.label}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={{ color: theme.ink, fontWeight: '800', fontSize: 18 }}>{"Today's timeline"}</Text>
        {timeline.length === 0 ? (
          <EmptyState
            theme={theme}
            emoji="🌱"
            title="Your day is a blank page"
            body="One tap is enough to start. You're doing okay — let's make today a little better."
          />
        ) : (
          <Card theme={theme} style={{ gap: 12, paddingVertical: 8 }}>
            {timeline.map((item) => (
              <View key={item.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 44 }}>
                <Text style={{ color: theme.faint, width: 72, fontWeight: '700' }}>{item.time}</Text>
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: theme.accent }} />
                <Text style={{ color: theme.ink, fontWeight: '700', flex: 1 }}>{item.label}</Text>
                <Pressable onPress={() => void deleteEntry(item.id)} accessibilityRole="button" accessibilityLabel="Delete entry">
                  <Text style={{ color: theme.muted }}>✕</Text>
                </Pressable>
              </View>
            ))}
          </Card>
        )}

        <Button theme={theme} label="✨ Improve my day" onPress={() => router.push('/coach')} />
        <Button theme={theme} variant="ghost" label="End-of-day report" onPress={() => router.push('/day-report')} />
      </ScrollView>
    </Screen>
  );
}

function Mini({
  theme,
  title,
  value,
  detail,
  tone,
  color,
}: {
  theme: ReturnType<typeof useAppTheme>;
  title: string;
  value: string;
  detail: string;
  tone: 'good' | 'almost' | 'attention' | 'neutral';
  color: string;
}) {
  return (
    <View
      style={{
        width: '48%',
        backgroundColor: theme.surface,
        borderRadius: 20,
        padding: 14,
        borderWidth: 1,
        borderColor: theme.line,
        gap: 4,
        minHeight: 110,
      }}
    >
      <Text style={{ color, fontWeight: '800' }}>{title}</Text>
      <Text style={{ color: theme.ink, fontSize: 20, fontWeight: '800' }}>{value}</Text>
      <TonePill theme={theme} tone={tone} label={detail} />
    </View>
  );
}

function labelFor(type: string, payload: Record<string, unknown>): string {
  switch (type) {
    case 'water':
      return `💧 Water — ${glassesFromMl(Number(payload.ml ?? 0)).toFixed(1)} glass`;
    case 'sleep':
      return `😴 Sleep — ${formatHoursMinutes(Number(payload.minutes ?? 0))}`;
    case 'meal':
      return `${payload.kind === 'breakfast' ? '🍳' : payload.kind === 'lunch' ? '🍱' : payload.kind === 'dinner' ? '🍽' : '🍟'} ${String(payload.text ?? 'Meal')}`;
    case 'exercise':
      return `${payload.kind === 'walk' ? '🚶' : '🏃'} ${payload.kind === 'walk' ? 'Walk' : 'Exercise'} — ${payload.minutes} min`;
    case 'mood':
      return `🙂 Mood`;
    case 'smoking':
      return '🚬 Cigarette';
    case 'caffeine':
      return '☕ Caffeine';
    case 'hygiene':
      return payload.kind === 'brush' ? '🪥 Brush teeth' : payload.kind === 'face' ? '🧴 Wash face' : '🧼 Bath/shower';
    case 'fruit':
      return '🍎 Fruit';
    case 'vegetables':
      return '🥗 Vegetables';
    case 'junk':
      return '🍟 Junk food';
    case 'sugary':
      return '🥤 Sugary drink';
    case 'read':
      return '📚 Reading';
    case 'relax':
      return '🧘 Relax';
    case 'screen':
      return `📱 Screen time — ${payload.minutes} min`;
    case 'break':
      return payload.action === 'start' ? '☕ Break started' : '✅ Break complete';
    case 'custom':
      return `⭐ ${String(payload.name ?? 'Habit')}`;
    default:
      return type;
  }
}
