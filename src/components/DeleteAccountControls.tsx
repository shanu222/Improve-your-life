import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Platform } from 'react-native';
import { toUserMessage } from '../domain/errors';
import { useAppStore } from '../store/appStore';
import { useAppTheme } from '../theme';
import { Body, Button } from './ui';

export function DeleteAccountControls() {
  const theme = useAppTheme();
  const deleteAllData = useAppStore((s) => s.deleteAllData);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const go = async () => {
    setBusy(true);
    setError(null);
    try {
      await deleteAllData();
      router.replace('/auth');
    } catch (err) {
      setError(toUserMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const onDelete = () => {
    if (Platform.OS === 'web') {
      const ok =
        typeof globalThis.confirm === 'function' &&
        globalThis.confirm('Delete your account? Your account and personal data will be permanently removed.');
      if (ok) void go();
      return;
    }
    Alert.alert('Delete your account?', 'Your account and personal data will be permanently removed. This cannot be undone.', [
      { text: 'Keep account', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => void go() },
    ]);
  };

  return (
    <>
      {error ? <Body theme={theme}>{error}</Body> : null}
      <Button theme={theme} variant="ghost" label={busy ? 'Deleting…' : 'Delete account and data'} onPress={onDelete} disabled={busy} />
    </>
  );
}
