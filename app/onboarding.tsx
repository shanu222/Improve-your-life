import { useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Body, Button, Chip, Screen, Title } from '../src/components/ui';
import { TimeStepper } from '../src/components/TimeStepper';
import { AGE_RANGES, FOCUS_OPTIONS, type FocusArea, type ReminderMode } from '../src/domain/types';
import { requestNotificationPermission, syncScheduledReminders } from '../src/lib/notifications';
import { registerPushForUser } from '../src/lib/push';
import { useAppStore } from '../src/store/appStore';
import { useAppTheme } from '../src/theme';

export default function Onboarding() {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const profile = useAppStore((s) => s.profile);
  const user = useAppStore((s) => s.user);
  const service = useAppStore((s) => s.service);
  const complete = useAppStore((s) => s.completeOnboarding);
  const updateNotifications = useAppStore((s) => s.updateNotifications);
  const [step, setStep] = useState(0);
  const [name, setName] = useState(profile?.name ?? '');
  const [ageRange, setAgeRange] = useState(profile?.ageRange ?? '');
  const [focus, setFocus] = useState<FocusArea[]>(profile?.focusAreas ?? []);
  const [wakeTime, setWake] = useState(profile?.wakeTime ?? '07:00');
  const [sleepTime, setSleep] = useState(profile?.sleepTime ?? '23:00');
  const [breakfastTime, setBreakfast] = useState(profile?.breakfastTime ?? '08:00');
  const [lunchTime, setLunch] = useState(profile?.lunchTime ?? '13:30');
  const [dinnerTime, setDinner] = useState(profile?.dinnerTime ?? '20:00');
  const [reminderMode, setMode] = useState<ReminderMode>(profile?.reminderMode ?? 'balanced');

  const toggle = (id: FocusArea) => {
    setFocus((curr) => (curr.includes(id) ? curr.filter((x) => x !== id) : [...curr, id]));
  };

  const finish = async (enableNotifs: boolean | null) => {
    if (enableNotifs === true) {
      const ok = await requestNotificationPermission();
      await updateNotifications({ enabled: ok, reminderMode });
      if (ok && service && user && profile) {
        const plan = await service.reminderPlan(user.id);
        await syncScheduledReminders(
          plan,
          { ...profile, wakeTime, sleepTime, breakfastTime, lunchTime, dinnerTime },
          true,
          { preferRemoteEngine: Boolean(user.firebaseUid) },
        );
        if (user.firebaseUid) void registerPushForUser(user.firebaseUid);
      }
    } else if (enableNotifs === false) {
      await updateNotifications({ enabled: false, reminderMode });
    }
    await complete({
      name: name.trim(),
      ageRange,
      focusAreas: focus,
      wakeTime,
      sleepTime,
      breakfastTime,
      lunchTime,
      dinnerTime,
      reminderMode,
    });
    router.replace(user?.firebaseUid ? '/(tabs)' : '/auth');
  };

  return (
    <Screen theme={theme}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 24,
          paddingBottom: insets.bottom + 28,
          paddingHorizontal: 22,
          gap: 18,
          flexGrow: 1,
        }}
      >
        {step === 0 ? (
          <View style={{ flex: 1, justifyContent: 'flex-end', gap: 16, paddingBottom: 40 }}>
            <Text style={{ fontSize: 56 }}>☀️</Text>
            <Title theme={theme}>Welcome to DailyMe</Title>
            <Body theme={theme} style={{ fontSize: 18 }}>Take care of yourself, one day at a time.</Body>
            <Body theme={theme}>Understand your day. Build better habits. Feel better.</Body>
            <Body theme={theme}>DailyMe is for adults 18 and older. You will need an account. DailyMe is wellness software, not medical care.</Body>
            <Pressable onPress={() => router.push('/privacy-policy')} style={{ minHeight: 44, justifyContent: 'center' }}>
              <Text style={{ color: theme.accent, fontWeight: '700' }}>Privacy Policy</Text>
            </Pressable>
            <Pressable onPress={() => router.push('/terms')} style={{ minHeight: 44, justifyContent: 'center' }}>
              <Text style={{ color: theme.accent, fontWeight: '700' }}>Terms of Service</Text>
            </Pressable>
            <Button theme={theme} label="Get started" onPress={() => setStep(1)} />
          </View>
        ) : null}

        {step === 1 ? (
          <View style={{ gap: 16 }}>
            <Title theme={theme}>What should we call you?</Title>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Your name"
              placeholderTextColor={theme.faint}
              accessibilityLabel="Your name"
              style={{ backgroundColor: theme.surface, borderRadius: 18, padding: 16, fontSize: 18, color: theme.ink, minHeight: 52 }}
            />
            <Title theme={theme} style={{ fontSize: 22 }}>Age range</Title>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {AGE_RANGES.map((range) => (
                <Chip key={range} theme={theme} label={range} selected={ageRange === range} onPress={() => setAgeRange(range)} />
              ))}
            </View>
            <Nav theme={theme} onBack={() => setStep(0)} onNext={() => setStep(2)} />
          </View>
        ) : null}

        {step === 2 ? (
          <View style={{ gap: 16 }}>
            <Title theme={theme}>What would you like to improve?</Title>
            <Body theme={theme}>Pick as many as you like. You can change this later.</Body>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
              {FOCUS_OPTIONS.map((opt) => (
                <Chip
                  key={opt.id}
                  theme={theme}
                  emoji={opt.emoji}
                  label={opt.label}
                  selected={focus.includes(opt.id)}
                  onPress={() => toggle(opt.id)}
                />
              ))}
            </View>
            <Nav theme={theme} onBack={() => setStep(1)} onNext={() => setStep(3)} />
          </View>
        ) : null}

        {step === 3 ? (
          <View style={{ gap: 16 }}>
            <Title theme={theme}>What time do you usually wake up?</Title>
            <TimeStepper theme={theme} label="Wake time" value={wakeTime} onChange={setWake} />
            <Nav theme={theme} onBack={() => setStep(2)} onNext={() => setStep(4)} />
          </View>
        ) : null}

        {step === 4 ? (
          <View style={{ gap: 16 }}>
            <Title theme={theme}>What time do you usually sleep?</Title>
            <TimeStepper theme={theme} label="Sleep time" value={sleepTime} onChange={setSleep} />
            <Nav theme={theme} onBack={() => setStep(3)} onNext={() => setStep(5)} />
          </View>
        ) : null}

        {step === 5 ? (
          <View style={{ gap: 18 }}>
            <Title theme={theme}>What are your usual meal times?</Title>
            <TimeStepper theme={theme} label="Breakfast" value={breakfastTime} onChange={setBreakfast} />
            <TimeStepper theme={theme} label="Lunch" value={lunchTime} onChange={setLunch} />
            <TimeStepper theme={theme} label="Dinner" value={dinnerTime} onChange={setDinner} />
            <Nav theme={theme} onBack={() => setStep(4)} onNext={() => setStep(6)} />
          </View>
        ) : null}

        {step === 6 ? (
          <View style={{ gap: 16 }}>
            <Title theme={theme}>How often should DailyMe remind you?</Title>
            {(['minimal', 'balanced', 'helpful'] as const).map((mode) => (
              <Pressable
                key={mode}
                onPress={() => setMode(mode)}
                accessibilityRole="button"
                accessibilityState={{ selected: reminderMode === mode }}
                style={{
                  padding: 18,
                  borderRadius: 20,
                  backgroundColor: reminderMode === mode ? theme.accentSoft : theme.surface,
                  borderWidth: 1,
                  borderColor: reminderMode === mode ? theme.accent : theme.line,
                }}
              >
                <Text style={{ color: theme.ink, fontWeight: '800', textTransform: 'capitalize' }}>{mode}</Text>
                <Body theme={theme}>
                  {mode === 'minimal'
                    ? 'Just morning, lunch, and wind-down.'
                    : mode === 'balanced'
                      ? 'A gentle handful of check-ins.'
                      : 'More nudges, still never spammy.'}
                </Body>
              </Pressable>
            ))}
            <Nav theme={theme} onBack={() => setStep(5)} onNext={() => setStep(7)} />
          </View>
        ) : null}

        {step === 7 ? (
          <View style={{ flex: 1, justifyContent: 'flex-end', gap: 16, paddingBottom: 24 }}>
            <Title theme={theme}>Would you like DailyMe to remind you throughout the day?</Title>
            <Body theme={theme}>DailyMe uses reminders to help you stay on track with meals, water, hygiene, mood, sleep and daily habits.</Body>
            <Body theme={theme}>Never required. You can change this anytime.</Body>
            <Button theme={theme} label="Yes, enable reminders" onPress={() => void finish(true)} />
            <Button theme={theme} variant="soft" label="Not now" onPress={() => void finish(false)} />
            <Button theme={theme} variant="ghost" label="Back" onPress={() => setStep(6)} />
          </View>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

function Nav({ theme, onBack, onNext }: { theme: ReturnType<typeof useAppTheme>; onBack: () => void; onNext: () => void }) {
  return (
    <View style={{ gap: 10, marginTop: 12 }}>
      <Button theme={theme} label="Continue" onPress={onNext} />
      <Button theme={theme} variant="ghost" label="Back" onPress={onBack} />
    </View>
  );
}
