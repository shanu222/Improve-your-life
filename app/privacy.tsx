import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, Share, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Body, Button, Card, Screen, Title } from '../src/components/ui';
import { HEALTH_DISCLAIMER } from '../src/domain/types';
import { useAppStore } from '../src/store/appStore';
import { useAppTheme } from '../src/theme';

export default function PrivacyScreen() {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const exportData = useAppStore((s) => s.exportData);
  const deleteAllData = useAppStore((s) => s.deleteAllData);
  const [busy, setBusy] = useState(false);

  const onExport = async () => {
    setBusy(true);
    try {
      const json = await exportData();
      if (!json) return;
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
    } finally {
      setBusy(false);
    }
  };

  const onDelete = () => {
    const go = async () => {
      await deleteAllData();
      router.replace('/');
    };
    if (Platform.OS === 'web') {
      const ok =
        typeof globalThis.confirm === 'function' &&
        globalThis.confirm('Delete your account? Your account and personal data will be permanently removed.');
      if (ok) void go();
      return;
    }
    Alert.alert('Delete your account?', 'Your account and personal data will be permanently removed.', [
      { text: 'Keep account', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => void go() },
    ]);
  };

  return (
    <Screen theme={theme}>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 12, padding: 20, gap: 14, paddingBottom: 40 }}>
        <Pressable onPress={() => router.back()}><Text style={{ color: theme.accent, fontWeight: '700' }}>Back</Text></Pressable>
        <Title theme={theme}>Privacy</Title>
        <Card theme={theme} style={{ gap: 8 }}>
          <Body theme={theme}>Your data is private and belongs to your account. DailyMe never sells personal wellbeing data. There is no public profile.</Body>
          <Body theme={theme}>Food photos are not permanently stored. They are processed only to estimate nutritional information, then discarded. Only the estimate and your description are saved.</Body>
          <Body theme={theme}>You can delete your account and data at any time. AI insights are informational and not a medical diagnosis.</Body>
          <Body theme={theme}>{HEALTH_DISCLAIMER}</Body>
        </Card>
        <Button theme={theme} label={busy ? 'Working…' : 'Export my data'} onPress={() => void onExport()} disabled={busy} />
        <Button theme={theme} variant="ghost" label="Delete account and data" onPress={onDelete} />
      </ScrollView>
    </Screen>
  );
}
