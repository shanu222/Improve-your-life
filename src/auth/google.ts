import Constants from 'expo-constants';

export function googleClientId(): string {
  const extra = Constants.expoConfig?.extra as { googleClientId?: string } | undefined;
  return extra?.googleClientId || process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || '';
}

export function googleSignInAvailable(): boolean {
  return googleClientId().length > 0;
}
