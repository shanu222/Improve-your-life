import { router } from 'expo-router';
import { useState } from 'react';
import { Platform, Pressable, ScrollView, Share, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DeleteAccountControls } from '../src/components/DeleteAccountControls';
import { LegalLinks } from '../src/components/LegalDocument';
import { Body, Button, Card, Screen, Title } from '../src/components/ui';
import { toUserMessage } from '../src/domain/errors';
import { HEALTH_DISCLAIMER } from '../src/domain/types';
import { LEGAL } from '../src/legal/config';
import { useAppStore } from '../src/store/appStore';
import { useAppTheme } from '../src/theme';

export default function PrivacyScreen() {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const exportData = useAppStore((s) => s.exportData);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onExport = async () => {
    setBusy(true);
    setError(null);
    try {
      const json = await exportData();
      if (!json) {
        setError('DailyMe could not export your data.');
        return;
      }
      if (Platform.OS === 'web' && typeof document !== 'undefined') {
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'dailyme-export.json';
        a.click();
        URL.revokeObjectURL(url);
      } else {
        await Share.share({ message: json, title: 'DailyMe data export' });
      }
    } catch (err) {
      setError(toUserMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen theme={theme}>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 12, padding: 20, gap: 14, paddingBottom: 40 }}>
        <Pressable onPress={() => router.back()} accessibilityRole="button" style={{ minHeight: 44, justifyContent: 'center' }}>
          <Text style={{ color: theme.accent, fontWeight: '700' }}>Back</Text>
        </Pressable>
        <Title theme={theme}>Privacy & data</Title>
        <Card theme={theme} style={{ gap: 8 }}>
          <Body theme={theme}>Your data is private and belongs to your account. DailyMe never sells personal wellbeing data. There is no public profile.</Body>
          <Body theme={theme}>Food photos are not permanently stored. They are processed only to estimate nutritional information, then discarded. Only the estimate and your description are saved.</Body>
          <Body theme={theme}>You can export or delete your account and data at any time. AI insights are informational and not a medical diagnosis.</Body>
          <Body theme={theme}>{HEALTH_DISCLAIMER}</Body>
          <Body theme={theme}>Full policy last updated {LEGAL.effectiveDate}.</Body>
        </Card>
        <LegalLinks compact />
        {error ? <Body theme={theme}>{error}</Body> : null}
        <Button theme={theme} label={busy ? 'Working…' : 'Export my data'} onPress={() => void onExport()} disabled={busy} />
        <DeleteAccountControls />
      </ScrollView>
    </Screen>
  );
}
