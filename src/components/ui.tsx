import { type ReactNode } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type PressableProps,
  type TextProps,
  type ViewStyle,
} from 'react-native';
import type { Theme } from '../theme';
import { radii, space } from '../theme';

export function Screen({ theme, children, style }: { theme: Theme; children: ReactNode; style?: ViewStyle }) {
  return (
    <View style={[{ flex: 1, backgroundColor: theme.bg }, style]}>{children}</View>
  );
}

export function Card({
  theme,
  children,
  style,
}: {
  theme: Theme;
  children: ReactNode;
  style?: ViewStyle;
}) {
  return (
    <View
      style={[
        {
          backgroundColor: theme.surface,
          borderRadius: radii.lg,
          padding: space.lg,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: theme.line,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function Title({ children, theme, ...rest }: TextProps & { theme: Theme }) {
  return (
    <Text
      maxFontSizeMultiplier={1.4}
      {...rest}
      style={[
        { color: theme.ink, fontSize: 28, fontWeight: '800', letterSpacing: -0.6 },
        rest.style,
      ]}
    >
      {children}
    </Text>
  );
}

export function Body({ children, theme, ...rest }: TextProps & { theme: Theme }) {
  return (
    <Text maxFontSizeMultiplier={1.4} {...rest} style={[{ color: theme.muted, fontSize: 16, lineHeight: 22 }, rest.style]}>
      {children}
    </Text>
  );
}

export function Button({
  theme,
  label,
  onPress,
  variant = 'primary',
  disabled,
  accessibilityHint,
}: {
  theme: Theme;
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'ghost' | 'soft';
  disabled?: boolean;
  accessibilityHint?: string;
} & Omit<PressableProps, 'onPress'>) {
  const bg = variant === 'primary' ? theme.accent : variant === 'soft' ? theme.accentSoft : 'transparent';
  const color = variant === 'primary' ? theme.onAccent : theme.ink;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      style={({ pressed }) => ({
        backgroundColor: bg,
        minHeight: 52,
        borderRadius: radii.full,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 22,
        opacity: disabled ? 0.5 : pressed ? 0.86 : 1,
        borderWidth: variant === 'ghost' ? 1 : 0,
        borderColor: theme.line,
      })}
    >
      <Text style={{ color, fontWeight: '800', fontSize: 16 }}>{label}</Text>
    </Pressable>
  );
}

export function Chip({
  theme,
  label,
  selected,
  onPress,
  emoji,
}: {
  theme: Theme;
  label: string;
  selected?: boolean;
  onPress: () => void;
  emoji?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: Boolean(selected) }}
      accessibilityLabel={label}
      style={{
        minHeight: 44,
        paddingHorizontal: 14,
        borderRadius: radii.full,
        backgroundColor: selected ? theme.accent : theme.surface,
        borderWidth: 1,
        borderColor: selected ? theme.accent : theme.line,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: 6,
      }}
    >
      {emoji ? <Text>{emoji}</Text> : null}
      <Text style={{ color: selected ? theme.onAccent : theme.ink, fontWeight: '700' }}>{label}</Text>
    </Pressable>
  );
}

export function EmptyState({
  theme,
  emoji,
  title,
  body,
  action,
  onAction,
}: {
  theme: Theme;
  emoji: string;
  title: string;
  body: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <Card theme={theme} style={{ alignItems: 'center', gap: 8 }}>
      <Text style={{ fontSize: 36 }}>{emoji}</Text>
      <Text style={{ color: theme.ink, fontWeight: '800', fontSize: 18, textAlign: 'center' }}>{title}</Text>
      <Body theme={theme} style={{ textAlign: 'center' }}>
        {body}
      </Body>
      {action && onAction ? <Button theme={theme} label={action} onPress={onAction} /> : null}
    </Card>
  );
}

export function TonePill({
  theme,
  tone,
  label,
}: {
  theme: Theme;
  tone: 'good' | 'almost' | 'attention' | 'neutral';
  label: string;
}) {
  const color =
    tone === 'good' ? theme.good : tone === 'almost' ? theme.almost : tone === 'attention' ? theme.attention : theme.muted;
  const prefix = tone === 'good' ? 'Good' : tone === 'almost' ? 'Almost there' : tone === 'attention' ? 'Needs attention' : 'Not logged';
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color }} />
      <Text style={{ color, fontWeight: '700', fontSize: 13 }}>
        {label || prefix}
      </Text>
    </View>
  );
}
