import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  BackHandler,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LegalLinks } from '../src/components/LegalDocument';
import { Body, Button, Card, Screen, Title } from '../src/components/ui';
import { PasswordField } from '../src/components/PasswordField';
import { LEGAL } from '../src/legal/config';
import { toUserMessage } from '../src/domain/errors';
import {
  registerWithEmail,
  requestPasswordReset,
  signInWithEmail,
  signInWithGoogleNative,
} from '../src/firebase/auth';
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
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => sub.remove();
  }, []);

  const finish = async (user: { uid: string; email: string | null; emailVerified: boolean }, provider: 'google' | 'password') => {
    await linkCloudAccount({
      firebaseUid: user.uid,
      email: user.email ?? email,
      authProvider: provider,
      emailVerified: user.emailVerified,
    });
    void registerPushForUser(user.uid);
    router.replace('/(tabs)');
  };

  const onRegister = async () => {
    setBusy(true);
    setError(null);
    setInfo(null);
    try {
      const user = await registerWithEmail(email, password);
      setUid(user.uid);
      await apiPost('/api/auth/send-code', { email });
      setMode('verify');
      setInfo('We sent a 6-digit code to your email. Check Spam if you do not see it.');
    } catch (err) {
      setError(toUserMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const onVerify = async () => {
    setBusy(true);
    setError(null);
    setInfo(null);
    try {
      await apiPost('/api/auth/verify-code', { email, code, uid });
      const user = await signInWithEmail(email, password);
      await finish(user, 'password');
    } catch (err) {
      setError(toUserMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const onSignIn = async () => {
    setBusy(true);
    setError(null);
    setInfo(null);
    try {
      const user = await signInWithEmail(email, password);
      if (!user.emailVerified) {
        setUid(user.uid);
        await apiPost('/api/auth/send-code', { email });
        setMode('verify');
        setInfo('Enter the verification code from your email to continue.');
        return;
      }
      await finish(user, 'password');
    } catch (err) {
      setError(toUserMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const onGoogle = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    setInfo(null);
    try {
      const user = await signInWithGoogleNative();
      if (user === 'cancelled') {
        setInfo('Google sign-in was cancelled.');
        return;
      }
      await finish(user, 'google');
    } catch (err) {
      setError(toUserMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const onReset = async () => {
    setBusy(true);
    setError(null);
    setInfo(null);
    try {
      await requestPasswordReset(email);
      setInfo('If this email has a password account, Firebase sent a reset link. Check Spam if you do not see it.');
    } catch (err) {
      setError(toUserMessage(err));
    } finally {
      setBusy(false);
    }
  };

  if (!firebaseConfigured()) {
    return (
      <Screen theme={theme}>
        <ScrollView contentContainerStyle={{ paddingTop: insets.top + 24, padding: 20, gap: 14 }}>
          <Title theme={theme}>Sign in unavailable</Title>
          <Body theme={theme}>Firebase is not configured in this build, so DailyMe cannot create an account.</Body>
        </ScrollView>
      </Screen>
    );
  }

  return (
    <Screen theme={theme}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={{ paddingTop: insets.top + 24, padding: 20, gap: 14, paddingBottom: insets.bottom + 32 }}
          keyboardShouldPersistTaps="handled"
        >
          <Title theme={theme}>
            {mode === 'register' ? 'Create account' : mode === 'verify' ? 'Verify your email' : mode === 'reset' ? 'Reset password' : 'Sign in'}
          </Title>
          <Body theme={theme}>
            Sign in to use DailyMe. Google and email/password cannot be mixed for the same address.
          </Body>

          {mode !== 'verify' ? (
            <View style={{ gap: 6 }}>
              <Text style={{ color: theme.muted, fontWeight: '700' }}>Email</Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="you@email.com"
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
                accessibilityLabel="Email"
                placeholderTextColor={theme.faint}
                style={{ backgroundColor: theme.surface, borderRadius: 16, padding: 14, color: theme.ink, minHeight: 52 }}
              />
            </View>
          ) : null}

          {mode === 'signin' || mode === 'register' ? (
            <PasswordField
              theme={theme}
              label="Password"
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
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

          {error ? (
            <Card theme={theme}>
              <Text style={{ color: theme.attention, fontWeight: '700' }}>{error}</Text>
            </Card>
          ) : null}
          {info ? (
            <Card theme={theme}>
              <Text style={{ color: theme.ink, fontWeight: '700' }}>{info}</Text>
            </Card>
          ) : null}

          {busy ? (
            <View style={{ alignItems: 'center', gap: 8, paddingVertical: 8 }}>
              <ActivityIndicator color={theme.accent} />
              <Body theme={theme}>Working… this will not stay here if something fails.</Body>
            </View>
          ) : null}

          {mode === 'signin' || mode === 'register' ? (
            <View style={{ gap: 8 }}>
              <Pressable
                onPress={() => setAcceptedTerms((v) => !v)}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: acceptedTerms }}
                accessibilityLabel={`I am ${LEGAL.minimumAge} or older and I agree to the Terms of Service and Privacy Policy`}
                style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start', minHeight: 48 }}
              >
                <View
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 6,
                    borderWidth: 2,
                    borderColor: acceptedTerms ? theme.accent : theme.line,
                    backgroundColor: acceptedTerms ? theme.accent : 'transparent',
                    marginTop: 2,
                  }}
                />
                <Text style={{ flex: 1, color: theme.ink, fontWeight: '700', lineHeight: 22 }}>
                  I am {LEGAL.minimumAge} or older and I agree to the Terms of Service and Privacy Policy.
                </Text>
              </Pressable>
              <LegalLinks compact />
            </View>
          ) : null}

          {mode === 'signin' ? (
            <>
              <Button theme={theme} label="Sign in" disabled={busy || !email || !password} onPress={() => void onSignIn()} />
              {googleSignInAvailable() ? (
                <Button
                  theme={theme}
                  variant="soft"
                  label="Continue with Google"
                  disabled={busy || !acceptedTerms}
                  onPress={() => void onGoogle()}
                />
              ) : null}
              <Button theme={theme} variant="ghost" label="Create an account" disabled={busy} onPress={() => setMode('register')} />
              <Pressable onPress={() => setMode('reset')} disabled={busy} style={{ minHeight: 44, justifyContent: 'center' }}>
                <Text style={{ color: theme.accent, fontWeight: '700' }}>Forgot password?</Text>
              </Pressable>
            </>
          ) : null}

          {mode === 'register' ? (
            <>
              <Button
                theme={theme}
                label="Send verification code"
                disabled={busy || !acceptedTerms || !email || password.length < 6}
                onPress={() => void onRegister()}
              />
              <Button theme={theme} variant="ghost" label="I already have an account" disabled={busy} onPress={() => setMode('signin')} />
            </>
          ) : null}

          {mode === 'verify' ? (
            <>
              <Button theme={theme} label="Verify and continue" disabled={busy || code.length < 6} onPress={() => void onVerify()} />
              <Button
                theme={theme}
                variant="ghost"
                label="Resend code"
                disabled={busy}
                onPress={() => {
                  void (async () => {
                    setBusy(true);
                    setError(null);
                    try {
                      await apiPost('/api/auth/send-code', { email });
                      setInfo('We sent a new code. Check Spam if you do not see it.');
                    } catch (err) {
                      setError(toUserMessage(err));
                    } finally {
                      setBusy(false);
                    }
                  })();
                }}
              />
            </>
          ) : null}

          {mode === 'reset' ? (
            <>
              <Button theme={theme} label="Send reset email" disabled={busy || !email} onPress={() => void onReset()} />
              <Button theme={theme} variant="ghost" label="Back to sign in" disabled={busy} onPress={() => setMode('signin')} />
            </>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
