import Constants from 'expo-constants';

type GoogleExtra = {
  googleClientId?: string;
  googleWebClientId?: string;
  googleAndroidClientId?: string;
};

function extra(): GoogleExtra {
  return (Constants.expoConfig?.extra as GoogleExtra | undefined) ?? {};
}

export function googleWebClientId(): string {
  return (
    process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ||
    extra().googleWebClientId ||
    extra().googleClientId ||
    process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID ||
    ''
  );
}

export function googleAndroidClientId(): string {
  return process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || extra().googleAndroidClientId || '';
}

export function googleClientId(): string {
  return googleWebClientId();
}

export function googleSignInAvailable(): boolean {
  return googleWebClientId().length > 0;
}
