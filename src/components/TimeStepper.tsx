import { Pressable, Text, View } from 'react-native';
import type { Theme } from '../theme';
import { parseTimeToMinutes, minutesToHHmm } from '../domain/timezone';

export function TimeStepper({
  theme,
  value,
  onChange,
  label,
}: {
  theme: Theme;
  value: string;
  onChange: (next: string) => void;
  label: string;
}) {
  const mins = parseTimeToMinutes(value);
  const bump = (delta: number) => onChange(minutesToHHmm(mins + delta));
  return (
    <View accessibilityLabel={label} style={{ gap: 8 }}>
      <Text style={{ color: theme.muted, fontWeight: '700' }}>{label}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
        <Stepper theme={theme} label="Minus 15 minutes" onPress={() => bump(-15)} text="−" />
        <Text style={{ color: theme.ink, fontSize: 32, fontWeight: '800', minWidth: 110, textAlign: 'center' }}>
          {value}
        </Text>
        <Stepper theme={theme} label="Plus 15 minutes" onPress={() => bump(15)} text="+" />
      </View>
    </View>
  );
}

function Stepper({
  theme,
  label,
  onPress,
  text,
}: {
  theme: Theme;
  label: string;
  onPress: () => void;
  text: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={{
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: theme.surface2,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text style={{ color: theme.ink, fontSize: 24, fontWeight: '700' }}>{text}</Text>
    </Pressable>
  );
}
