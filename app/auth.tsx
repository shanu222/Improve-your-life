import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Body, Button, Card, Screen, Title } from '../src/components/ui';
import { toUserMessage } from '../src/domain/errors';
import { registerWithEmail, requestPasswordReset, signInGoogleIdToken, signInWithEmail, useGoogleAuthRequest } from '../src/firebase/auth';
import { firebaseConfigured } from '../src/firebase/client';
import { googleSignInAvailable } from '../src/auth/google';
import { apiPost } from '../src/lib/apiClient';
import { registerPushForUser } from '../src/lib/push';
import { useAppStore } from '../src/store/appStore';
import { useAppTheme } from '../src/theme';

export default function AuthScreen() {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const linkCloudAccount = useAppStore((s) => s.linkCloudAccount);
  const [mode, setMode] = useState<'signin' | 'register' | 'verify' | 'reset'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [uid, setUid] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [request, response, promptAsync] = useGoogleAuthRequest();

  const finish = async (user: { uid: string; email: string | null; emailVerified: boolean }, provider: 'google' | 'password') => {
    await linkCloudAccount({
      firebaseUid: user.uid,
      email: user.email ?? email,
      authProvider: provider,
      emailVerified: user.emailVerified,
    });
    void registerPushForUser(user.uid);
    router.back();
  };

  const onRegister = async () => {
    setBusy(true);
    setMessage(null);
    try {
      const user = await registerWithEmail(email, password);
      setUid(user.uid);
      try {
        await apiPost('/api/auth/send-code', { email });
        setMode('verify');
        setMessage('We sent a 6-digit code to your email.');
      } catch {
        await finish(user, 'password');
      }
    } catch (error) {
      setMessage(toUserMessage(error));
    } finally {
      setBusy(false);
    }
  };

  const onVerify = async () => {
    setBusy(true);
    setMessage(null);
    try {
      await apiPost('/api/auth/verify-code', { email, code, uid });
      const user = await signInWithEmail(email, password);
      await finish(user, 'password');
    } catch (error) {
      setMessage(toUserMessage(error));
    } finally {
      setBusy(false);
    }
  };

  const onSignIn = async () => {
    setBusy(true);
    setMessage(null);
    try {
      const user = await signInWithEmail(email, password);
      if (!user.emailVerified) {
        setUid(user.uid);
        try {
          await apiPost('/api/auth/send-code', { email });
          setMode('verify');
          setMessage('Please enter the verification code from your email.');
          return;
        } catch {
          await finish(user, 'password');
          return;
        }
      }
      await finish(user, 'password');
    } catch (error) {
      setMessage(toUserMessage(error));
    } finally {
      setBusy(false);
    }
  };

  const onGoogle = async () => {
    setBusy(true);
    setMessage(null);
    try {
      const result = await promptAsync();
      if (result.type !== 'success' || !('params' in result) || !result.params.id_token) {
        setBusy(false);
        return;
      }
      const user = await signInGoogleIdToken(String(result.params.id_token));
      await finish(user, 'google');
    } catch (error) {
      setMessage(toUserMessage(error));
    } finally {
      setBusy(false);
    }
  };

  const onReset = async () => {
    setBusy(true);
    setMessage(null);
    try {
      await requestPasswordReset(email);
      setMessage('If that email has a password account, a reset link is on its way.');
    } catch (error) {
      setMessage(toUserMessage(error));
    } finally {
      setBusy(false);
    }
  };

  void request;
  void response;

  if (!firebaseConfigured()) {
    return (
      <Screen theme={theme}>
        <ScrollView contentContainerStyle={{ paddingTop: insets.top + 12, padding: 20, gap: 14 }}>
          <Pressable onPress={() => router.back()}><Text style={{ color: theme.accent, fontWeight: '700' }}>Close</Text></Pressable>
          <Title theme={theme}>Cloud sign-in</Title>
          <Body theme={theme}>Tracking still works on this device. Cloud sign-in is not configured yet.</Body>
        </ScrollView>
      </Screen>
    );
  }

  return (
    <Screen theme={theme}>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 12, padding: 20, gap: 14, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
        <Pressable onPress={() => router.back()}><Text style={{ color: theme.accent, fontWeight: '700' }}>Close</Text></Pressable>
        <Title theme={theme}>{mode === 'register' ? 'Create account' : mode === 'verify' ? 'Enter your code' : mode === 'reset' ? 'Reset password' : 'Sign in'}</Title>
        <Body theme={theme}>Google or email. DailyMe never creates a second account for the same email.</Body>

        {mode !== 'verify' ? (
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="Email"
            autoCapitalize="none"
            keyboardType="email-address"
            accessibilityLabel="Email"
            placeholderTextColor={theme.faint}
            style={{ backgroundColor: theme.surface, borderRadius: 16, padding: 14, color: theme.ink, minHeight: 52 }}
          />
        ) : null}

        {mode === 'signin' || mode === 'register' ? (
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="Password"
            secureTextEntry
            accessibilityLabel="Password"
            placeholderTextColor={theme.faint}
            style={{ backgroundColor: theme.surface, borderRadius: 16, padding: 14, color: theme.ink, minHeight: 52 }}
          />
        ) : null}

        {mode === 'verify' ? (
          <TextInput
            value={code}
            onChangeText={setCode}
            placeholder="6-digit code"
            keyboardType="number-pad"
            accessibilityLabel="Verification code"
            placeholderTextColor={theme.faint}
            style={{ backgroundColor: theme.surface, borderRadius: 16, padding: 14, color: theme.ink, minHeight: 52, letterSpacing: 4 }}
          />
        ) : null}

        {message ? (
          <Card theme={theme}><Text style={{ color: theme.ink, fontWeight: '700' }}>{message}</Text></Card>
        ) : null}

        {busy ? <ActivityIndicator color={theme.accent} /> : null}

        {mode === 'signin' ? (
          <>
            <Button theme={theme} label="Sign in" disabled={busy || !email || !password} onPress={() => void onSignIn()} />
            {googleSignInAvailable() ? <Button theme={theme} variant="soft" label="Continue with Google" disabled={busy} onPress={() => void onGoogle()} /> : null}
            <Button theme={theme} variant="ghost" label="Create an account" onPress={() => setMode('register')} />
            <Button theme={theme} variant="ghost" label="Forgot password" onPress={() => setMode('reset')} />
          </>
        ) : null}

        {mode === 'register' ? (
          <>
            <Button theme={theme} label="Send verification code" disabled={busy || !email || password.length < 6} onPress={() => void onRegister()} />
            <Button theme={theme} variant="ghost" label="I already have an account" onPress={() => setMode('signin')} />
          </>
        ) : null}

        {mode === 'verify' ? (
          <Button theme={theme} label="Verify and continue" disabled={busy || code.length < 6} onPress={() => void onVerify()} />
        ) : null}

        {mode === 'reset' ? (
          <>
            <Button theme={theme} label="Send reset email" disabled={busy || !email} onPress={() => void onReset()} />
            <Button theme={theme} variant="ghost" label="Back to sign in" onPress={() => setMode('signin')} />
          </>
        ) : null}
      </ScrollView>
    </Screen>
  );
}
