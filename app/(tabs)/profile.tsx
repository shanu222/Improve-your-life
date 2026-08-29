import { router } from 'expo-router';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Body, Button, Card, Screen, Title } from '../../src/components/ui';
import { TimeStepper } from '../../src/components/TimeStepper';
import { levelFromXp } from '../../src/domain/xp';
import { useAppStore } from '../../src/store/appStore';
import { useAppTheme } from '../../src/theme';
import { GLASS_ML } from '../../src/domain/types';
import { useState } from 'react';

export default function ProfileScreen() {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const profile = useAppStore((s) => s.profile);
  const settings = useAppStore((s) => s.settings);
  const today = useAppStore((s) => s.today);
  const user = useAppStore((s) => s.user);
  const updateProfile = useAppStore((s) => s.updateProfile);
  const updateSettings = useAppStore((s) => s.updateSettings);
  const setEmail = useAppStore((s) => s.setEmail);
  const [name, setName] = useState(profile?.name ?? '');
  const [email, setEmailField] = useState(user?.email ?? '');
  const [waterGlasses, setWaterGlasses] = useState(String(Math.round((profile?.waterGoalMl ?? 2000) / GLASS_ML)));
  const level = levelFromXp(today?.xpTotal ?? 0);

  return (
    <Screen theme={theme}>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 16, padding: 18, gap: 14, paddingBottom: 40 }}>
        <Title theme={theme}>Profile</Title>
        <Card theme={theme} style={{ gap: 6 }}>
          <Text style={{ fontSize: 28 }}>{profile?.name || 'You'}</Text>
          <Body theme={theme}>Level {level.level} · {level.name}</Body>
        </Card>

        <Field theme={theme} label="Name (optional)" value={name} onChange={setName} onBlur={() => void updateProfile({ name })} />
        <Field theme={theme} label="Email (optional, never used for ads)" value={email} onChange={setEmailField} onBlur={() => void setEmail(email)} keyboard="email-address" />

        <Text style={{ color: theme.ink, fontWeight: '800' }}>Routine</Text>
        <Card theme={theme} style={{ gap: 16 }}>
          <TimeStepper theme={theme} label="Wake" value={profile?.wakeTime ?? '07:00'} onChange={(v) => void updateProfile({ wakeTime: v })} />
          <TimeStepper theme={theme} label="Sleep" value={profile?.sleepTime ?? '23:00'} onChange={(v) => void updateProfile({ sleepTime: v })} />
        </Card>

        <Text style={{ color: theme.ink, fontWeight: '800' }}>Water goal</Text>
        <Body theme={theme}>General guidance, not a medical requirement. Default is 8 glasses.</Body>
        <Field
          theme={theme}
          label="Glasses per day"
          value={waterGlasses}
          onChange={setWaterGlasses}
          keyboard="numeric"
          onBlur={() => {
            const n = Math.max(4, Math.min(16, Number(waterGlasses) || 8));
            void updateProfile({ waterGoalMl: n * GLASS_ML });
          }}
        />

        <Row label="Theme" value={settings?.theme ?? 'system'} onPress={() => {
          const order = ['system', 'light', 'dark'] as const;
          const i = order.indexOf(settings?.theme ?? 'system');
          void updateSettings({ theme: order[(i + 1) % order.length] ?? 'system' });
        }} />
        <Row label="Units" value={settings?.units ?? 'metric'} onPress={() => void updateSettings({ units: settings?.units === 'metric' ? 'imperial' : 'metric' })} />

        <Button theme={theme} label="Notifications" onPress={() => router.push('/notifications')} />
        <Button theme={theme} variant="soft" label="Privacy & data" onPress={() => router.push('/privacy')} />
        <Button theme={theme} variant="ghost" label="Settings" onPress={() => router.push('/settings')} />
        <Button theme={theme} variant="ghost" label="About & disclaimer" onPress={() => router.push('/about')} />
      </ScrollView>
    </Screen>
  );
}

function Field({
  theme,
  label,
  value,
  onChange,
  onBlur,
  keyboard,
}: {
  theme: ReturnType<typeof useAppTheme>;
  label: string;
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
  keyboard?: 'email-address' | 'numeric';
}) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={{ color: theme.muted, fontWeight: '700' }}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        onBlur={onBlur}
        keyboardType={keyboard}
        autoCapitalize="none"
        accessibilityLabel={label}
        style={{
          backgroundColor: theme.surface,
          borderRadius: 16,
          padding: 14,
          color: theme.ink,
          minHeight: 48,
        }}
      />
    </View>
  );
}

function Row({ label, value, onPress }: { label: string; value: string; onPress: () => void }) {
  const theme = useAppTheme();
  return (
    <Pressable onPress={onPress} accessibilityRole="button" style={{ minHeight: 52 }}>
      <Card theme={theme} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text style={{ color: theme.ink, fontWeight: '700' }}>{label}</Text>
        <Text style={{ color: theme.accent, fontWeight: '700', textTransform: 'capitalize' }}>{value}</Text>
      </Card>
    </Pressable>
  );
}
