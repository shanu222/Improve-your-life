import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, Share, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Body, Button, Card, Screen, Title } from '../src/components/ui';
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
        a.download = 'daily-export.json';
        a.click();
        URL.revokeObjectURL(url);
      } else {
        await Share.share({ message: json, title: 'Daily data export' });
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
        globalThis.confirm('Delete all Daily data on this device? This cannot be undone.');
      if (ok) void go();
      return;
    }
    Alert.alert('Delete all data?', 'This removes your local Daily data. It cannot be undone.', [
      { text: 'Keep data', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => void go() },
    ]);
  };

  return (
    <Screen theme={theme}>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 12, padding: 20, gap: 14, paddingBottom: 40 }}>
        <Pressable onPress={() => router.back()}><Text style={{ color: theme.accent, fontWeight: '700' }}>Back</Text></Pressable>
        <Title theme={theme}>Privacy</Title>
        <Card theme={theme} style={{ gap: 8 }}>
          <Body theme={theme}>Your health and lifestyle logs stay on this device by default. Daily never sells personal health data. There is no public profile.</Body>
          <Body theme={theme}>Account creation is optional. Basic tracking works locally without an account.</Body>
        </Card>
        <Button theme={theme} label={busy ? 'Working…' : 'Export my data'} onPress={() => void onExport()} disabled={busy} />
        <Button theme={theme} variant="ghost" label="Delete all data / account" onPress={onDelete} />
      </ScrollView>
    </Screen>
  );
}
