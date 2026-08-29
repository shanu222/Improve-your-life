import { router } from 'expo-router';
import { Pressable, ScrollView, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LegalLinks } from '../src/components/LegalDocument';
import { Body, Card, Screen, Title } from '../src/components/ui';
import { HEALTH_DISCLAIMER } from '../src/domain/types';
import { LEGAL } from '../src/legal/config';
import { useAppTheme } from '../src/theme';

export default function AboutScreen() {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  return (
    <Screen theme={theme}>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 12, padding: 20, gap: 14, paddingBottom: 40 }}>
        <Pressable onPress={() => router.back()} accessibilityRole="button" style={{ minHeight: 44, justifyContent: 'center' }}>
          <Text style={{ color: theme.accent, fontWeight: '700' }}>Back</Text>
        </Pressable>
        <Title theme={theme}>DailyMe</Title>
        <Body theme={theme} style={{ fontSize: 18 }}>Take care of yourself, one day at a time.</Body>
        <Card theme={theme} style={{ gap: 8 }}>
          <Body theme={theme}>{HEALTH_DISCLAIMER}</Body>
          <Body theme={theme}>DailyMe is for adults {LEGAL.minimumAge} and older. An account is required. This version is in English.</Body>
          <Body theme={theme}>Package {LEGAL.packageName}. Policies last updated {LEGAL.effectiveDate}.</Body>
        </Card>
        <LegalLinks />
      </ScrollView>
    </Screen>
  );
}
