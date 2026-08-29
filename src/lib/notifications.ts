import { Linking, Platform } from 'react-native';
import type { ScheduledReminder, UserProfile } from '../domain/types';
import { logInternalError } from '../domain/errors';

export type PermissionState = 'granted' | 'denied' | 'undetermined';

let handlerReady = false;
let channelsReady = false;

async function notificationsModule() {
  return import('expo-notifications');
}

export async function ensureNotificationHandler(): Promise<void> {
  if (Platform.OS === 'web' || handlerReady) return;
  try {
    const Notifications = await notificationsModule();
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
      }),
    });
    handlerReady = true;
  } catch (error) {
    logInternalError('notifications.handler', error);
  }
}

export async function ensureNotificationChannels(): Promise<void> {
  if (Platform.OS !== 'android' || channelsReady) return;
  try {
    const Notifications = await notificationsModule();
    await Notifications.setNotificationChannelAsync('dailyme_reminders', {
      name: 'DailyMe Reminders',
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 180],
      sound: undefined,
    });
    await Notifications.setNotificationChannelAsync('dailyme_summary', {
      name: 'DailyMe Daily Summary',
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 120],
      sound: undefined,
    });
    await Notifications.setNotificationChannelAsync('dailyme_important', {
      name: 'DailyMe Important',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250],
      sound: undefined,
    });
    channelsReady = true;
  } catch (error) {
    logInternalError('notifications.channels', error);
  }
}

export async function getNotificationPermissionStatus(): Promise<PermissionState> {
  if (Platform.OS === 'web') return 'denied';
  try {
    const Notifications = await notificationsModule();
    const current = await Notifications.getPermissionsAsync();
    if (current.granted) return 'granted';
    if (current.status === 'denied' || current.canAskAgain === false) return 'denied';
    return 'undetermined';
  } catch (error) {
    logInternalError('notifications.status', error);
    return 'denied';
  }
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  try {
    await ensureNotificationHandler();
    await ensureNotificationChannels();
    const Notifications = await notificationsModule();
    const current = await Notifications.getPermissionsAsync();
    if (current.granted) return true;
    if (current.canAskAgain === false) return false;
    const asked = await Notifications.requestPermissionsAsync();
    return asked.granted;
  } catch (error) {
    logInternalError('notifications.permission', error);
    return false;
  }
}

export async function openSystemNotificationSettings(): Promise<void> {
  try {
    await Linking.openSettings();
  } catch (error) {
    logInternalError('notifications.settings', error);
  }
}

export async function syncScheduledReminders(
  reminders: ScheduledReminder[],
  profile: UserProfile,
  enabled: boolean,
  options?: { preferRemoteEngine?: boolean },
): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    await ensureNotificationHandler();
    await ensureNotificationChannels();
    const Notifications = await notificationsModule();
    await Notifications.cancelAllScheduledNotificationsAsync();
    if (!enabled) return;
    // Signed-in users get context-aware FCM from Cloud Functions. Local dailies
    // would duplicate those reminders and cannot skip already-logged meals.
    if (options?.preferRemoteEngine) return;
    for (const reminder of reminders) {
      const hours = Math.floor(reminder.minutesFromMidnight / 60);
      const minutes = reminder.minutesFromMidnight % 60;
      await Notifications.scheduleNotificationAsync({
        content: {
          title: reminder.title,
          body: reminder.body,
          sound: false,
          data: { type: reminder.type, action: 'open_today', route: '/(tabs)' },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: hours,
          minute: minutes,
          channelId: 'dailyme_reminders',
        },
      });
    }
    void profile;
  } catch (error) {
    logInternalError('notifications.sync', error);
  }
}
