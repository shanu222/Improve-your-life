import { router } from 'expo-router';
import { Pressable, ScrollView, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Body, Screen, Title } from '../src/components/ui';
import { HEALTH_DISCLAIMER } from '../src/domain/types';
import { useAppTheme } from '../src/theme';

export default function AboutScreen() {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  return (
    <Screen theme={theme}>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 12, padding: 20, gap: 14, paddingBottom: 40 }}>
        <Pressable onPress={() => router.back()}><Text style={{ color: theme.accent, fontWeight: '700' }}>Back</Text></Pressable>
        <Title theme={theme}>Daily</Title>
        <Body theme={theme} style={{ fontSize: 18 }}>Small habits. Better days.</Body>
        <Body theme={theme}>{HEALTH_DISCLAIMER}</Body>
        <Body theme={theme}>Language is available for translation later. This version ships in English.</Body>
        <Body theme={theme}>Google Sign-In can be enabled by setting extra.googleClientId. Passwords are never stored in Daily.</Body>
      </ScrollView>
    </Screen>
  );
}
