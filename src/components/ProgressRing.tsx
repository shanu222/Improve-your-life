import { Circle, Svg } from 'react-native-svg';
import type { ReactNode } from 'react';
import { Text, View } from 'react-native';
import type { Theme } from '../theme';

export function ProgressRing({
  progress,
  size = 168,
  stroke = 14,
  color,
  track,
  children,
}: {
  progress: number;
  size?: number;
  stroke?: number;
  color: string;
  track: string;
  children?: ReactNode;
}) {
  const radius = (size - stroke) / 2;
  const circ = 2 * Math.PI * radius;
  const clamped = Math.min(1, Math.max(0, progress));
  const offset = circ * (1 - clamped);

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <Circle cx={size / 2} cy={size / 2} r={radius} stroke={track} strokeWidth={stroke} fill="none" />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${circ} ${circ}`}
          strokeDashoffset={offset}
          rotation={-90}
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      {children}
    </View>
  );
}

export function ScoreNumber({
  score,
  theme,
  size = 56,
}: {
  score: number | null;
  theme: Theme;
  size?: number;
}) {
  return (
    <View style={{ alignItems: 'center' }}>
      <Text
        style={{ fontSize: size, fontWeight: '800', color: theme.ink, letterSpacing: -1.5 }}
        accessibilityRole="header"
      >
        {score === null ? '—' : score}
      </Text>
      <Text style={{ color: theme.muted, fontWeight: '600', marginTop: -4 }}>/100</Text>
    </View>
  );
}
