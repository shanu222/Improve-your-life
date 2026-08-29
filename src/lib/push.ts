import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { logInternalError } from '../domain/errors';
import { detectTimezone } from '../domain/timezone';
import { disableDeviceToken, registerDeviceToken, safeCloudSync, touchDevicePresence } from '../firebase/sync';
import { apiDelete, apiPost } from './apiClient';
import { getNotificationPermissionStatus } from './notifications';

export interface PushDiagnostics {
  firebaseReady: boolean;
  authenticated: boolean;
  permission: 'granted' | 'denied' | 'undetermined';
  tokenPresent: boolean;
  tokenSuffix: string;
  stored: boolean;
  platform: string;
}

async function notificationsModule() {
  return import('expo-notifications');
}

async function secureStore() {
  return import('expo-secure-store');
}

export async function getStableDeviceId(): Promise<string> {
  const key = 'dailyme.device.id';
  try {
    const SecureStore = await secureStore();
    const existing = await SecureStore.getItemAsync(key);
    if (existing) return existing;
    const created = `${Platform.OS}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
    await SecureStore.setItemAsync(key, created);
    return created;
  } catch {
    return `${Platform.OS}-fallback`;
  }
}

export async function getPushToken(): Promise<string | null> {
  if (Platform.OS === 'web') return null;
  try {
    const Notifications = await notificationsModule();
    const token = await Notifications.getDevicePushTokenAsync();
    return token.data || null;
  } catch (error) {
    logInternalError('push.token', error);
    return null;
  }
}

function appVersion(): string {
  return Constants.expoConfig?.version || '1.0.0';
}

export async function registerPushForUser(uid: string): Promise<boolean> {
  try {
    const permission = await getNotificationPermissionStatus();
    const token = permission === 'granted' ? await getPushToken() : null;
    const deviceId = await getStableDeviceId();
    const payload = {
      fcmToken: token,
      token,
      platform: Platform.OS,
      appVersion: appVersion(),
      enabled: permission === 'granted' && Boolean(token),
      notificationPermission: permission,
      timezone: detectTimezone(),
      lastSeen: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await safeCloudSync(() => registerDeviceToken(uid, deviceId, payload));
    if (token) {
      try {
        await apiPost('/api/notifications/register', {
          token,
          deviceId,
          platform: Platform.OS,
          appVersion: payload.appVersion,
          timezone: payload.timezone,
          notificationPermission: permission,
          enabled: payload.enabled,
        });
      } catch (error) {
        logInternalError('push.register', error);
      }
    }
    return Boolean(token);
  } catch (error) {
    logInternalError('push.register', error);
    return false;
  }
}

export async function touchPushPresence(uid: string): Promise<void> {
  try {
    const deviceId = await getStableDeviceId();
    await safeCloudSync(() => touchDevicePresence(uid, deviceId, detectTimezone()));
  } catch (error) {
    logInternalError('push.presence', error);
  }
}

export async function unregisterPushForUser(uid: string): Promise<void> {
  try {
    const token = await getPushToken();
    const deviceId = await getStableDeviceId();
    await safeCloudSync(() => disableDeviceToken(uid, deviceId, token));
    try {
      await apiDelete('/api/notifications/device', { token, deviceId });
    } catch (error) {
      logInternalError('push.unregister', error);
    }
  } catch (error) {
    logInternalError('push.unregister', error);
  }
}

export async function getPushDiagnostics(uid?: string): Promise<PushDiagnostics> {
  const permission = await getNotificationPermissionStatus();
  const token = permission === 'granted' ? await getPushToken() : null;
  return {
    firebaseReady: Boolean(uid),
    authenticated: Boolean(uid),
    permission,
    tokenPresent: Boolean(token),
    tokenSuffix: token ? token.slice(-8) : '',
    stored: Boolean(uid && token),
    platform: Platform.OS,
  };
}
