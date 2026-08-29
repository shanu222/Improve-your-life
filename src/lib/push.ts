import { Platform } from 'react-native';
import { logInternalError } from '../domain/errors';
import { apiDelete, apiPost } from './apiClient';
import { disableDeviceToken, registerDeviceToken, safeCloudSync } from '../firebase/sync';

export async function getPushToken(): Promise<string | null> {
  if (Platform.OS === 'web') return null;
  try {
    const Notifications = await import('expo-notifications');
    const token = await Notifications.getDevicePushTokenAsync();
    return token.data || null;
  } catch (error) {
    logInternalError('push.token', error);
    return null;
  }
}

export async function registerPushForUser(uid: string): Promise<void> {
  const token = await getPushToken();
  if (!token) return;
  await safeCloudSync(() => registerDeviceToken(uid, token, Platform.OS));
  try {
    await apiPost('/api/notifications/register', { token, platform: Platform.OS });
  } catch (error) {
    logInternalError('push.register', error);
  }
}

export async function unregisterPushForUser(uid: string): Promise<void> {
  const token = await getPushToken();
  if (!token) return;
  await safeCloudSync(() => disableDeviceToken(uid, token));
  try {
    await apiDelete('/api/notifications/device', { token });
  } catch (error) {
    logInternalError('push.unregister', error);
  }
}
