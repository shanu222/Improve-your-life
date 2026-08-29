import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import type { Theme } from '../theme';

export function PasswordField({
  theme,
  value,
  onChangeText,
  label,
  placeholder,
}: {
  theme: Theme;
  value: string;
  onChangeText: (value: string) => void;
  label: string;
  placeholder: string;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <View style={{ gap: 6 }}>
      <Text style={{ color: theme.muted, fontWeight: '700' }}>{label}</Text>
      <View
        style={{
          backgroundColor: theme.surface,
          borderRadius: 16,
          minHeight: 52,
          flexDirection: 'row',
          alignItems: 'center',
          paddingRight: 8,
        }}
      >
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={theme.faint}
          secureTextEntry={!visible}
          autoCapitalize="none"
          autoCorrect={false}
          textContentType="password"
          accessibilityLabel={label}
          style={{ flex: 1, padding: 14, color: theme.ink, minHeight: 52 }}
        />
        <Pressable
          onPress={() => setVisible((v) => !v)}
          accessibilityRole="button"
          accessibilityLabel={visible ? 'Hide password' : 'Show password'}
          style={{ minHeight: 44, minWidth: 64, alignItems: 'center', justifyContent: 'center' }}
        >
          <Text style={{ color: theme.accent, fontWeight: '800' }}>{visible ? 'Hide' : 'Show'}</Text>
        </Pressable>
      </View>
    </View>
  );
}
