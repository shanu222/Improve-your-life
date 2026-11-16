import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Platform, View } from 'react-native';
import { PasswordField } from './PasswordField';
import { reauthenticateWithGoogle, reauthenticateWithPassword } from '../firebase/auth';
import { toUserMessage } from '../domain/errors';
import { useAppStore } from '../store/appStore';
import { useAppTheme } from '../theme';
import { Body, Button } from './ui';

export function DeleteAccountControls() {
  const theme = useAppTheme();
  const deleteAllData = useAppStore((s) => s.deleteAllData);
  const provider = useAppStore((s) => s.user?.authProvider);
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const go = async () => {
    setBusy(true);
    setError(null);
    try {
      if (provider === 'password') {
        if (!password.trim()) {
          setError('Enter your current password to delete this account.');
          return;
        }
        await reauthenticateWithPassword(password);
      } else if (provider === 'google') {
        const result = await reauthenticateWithGoogle();
        if (result === 'cancelled') {
          setError('Account deletion was cancelled.');
          return;
        }
      }
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
    <View style={{ gap: 10 }}>
      {provider === 'password' ? (
        <PasswordField
          theme={theme}
          label="Current password"
          placeholder="Required to delete this account"
          value={password}
          onChangeText={setPassword}
        />
      ) : (
        <Body theme={theme}>Google will ask you to confirm it is you before the account is deleted.</Body>
      )}
      {error ? <Body theme={theme}>{error}</Body> : null}
      <Button
        theme={theme}
        variant="ghost"
        label={busy ? 'Deleting…' : 'Delete account and data'}
        onPress={onDelete}
        disabled={busy || (provider === 'password' && !password.trim())}
      />
    </View>
  );
}
