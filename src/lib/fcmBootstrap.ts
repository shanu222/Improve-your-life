import { AppState, type AppStateStatus } from 'react-native';
import { logInternalError } from '../domain/errors';
import { openNotificationRoute } from './notificationRouting';
import {
  ensureNotificationChannels,
  ensureNotificationHandler,
  getNotificationPermissionStatus,
} from './notifications';
import { registerPushForUser, touchPushPresence } from './push';

let listenersBound = false;
let coldStartHandled = false;
let currentUid: string | undefined;
let appStateSub: { remove: () => void } | undefined;
let tokenSub: { remove: () => void } | undefined;
let responseSub: { remove: () => void } | undefined;

async function notificationsModule() {
  return import('expo-notifications');
}

export async function startFcmRuntime(uid?: string, notificationsEnabled?: boolean): Promise<void> {
  currentUid = uid;
  try {
    await ensureNotificationHandler();
    await ensureNotificationChannels();
    if (!listenersBound) {
      const Notifications = await notificationsModule();
      tokenSub = Notifications.addPushTokenListener(() => {
        if (currentUid) void registerPushForUser(currentUid);
      });
      responseSub = Notifications.addNotificationResponseReceivedListener((response) => {
        const data = (response.notification.request.content.data ?? {}) as Record<string, unknown>;
        openNotificationRoute(data);
      });
      appStateSub = AppState.addEventListener('change', (state: AppStateStatus) => {
        if (state === 'active' && currentUid) {
          void touchPushPresence(currentUid);
          if (notificationsEnabled !== false) {
            void getNotificationPermissionStatus().then((status) => {
              if (status === 'granted' && currentUid) void registerPushForUser(currentUid);
            });
          }
        }
      });
      listenersBound = true;
    }

    if (uid && notificationsEnabled) {
      const status = await getNotificationPermissionStatus();
      if (status === 'granted') await registerPushForUser(uid);
      else await touchPushPresence(uid);
    }

    if (!coldStartHandled) {
      coldStartHandled = true;
      const last = await NotificationsLastResponse();
      const tappedAt = last?.notification.date ? new Date(last.notification.date).getTime() : 0;
      if (last && tappedAt && Date.now() - tappedAt < 90_000) {
        const data = (last.notification.request.content.data ?? {}) as Record<string, unknown>;
        openNotificationRoute(data);
      }
    }
  } catch (error) {
    logInternalError('fcm.bootstrap', error);
  }
}

async function NotificationsLastResponse() {
  try {
    const Notifications = await notificationsModule();
    return Notifications.getLastNotificationResponseAsync();
  } catch {
    return null;
  }
}

export function stopFcmRuntime(): void {
  currentUid = undefined;
  tokenSub?.remove();
  responseSub?.remove();
  appStateSub?.remove();
  tokenSub = undefined;
  responseSub = undefined;
  appStateSub = undefined;
  listenersBound = false;
}
