import { Platform } from 'react-native';
import type { ScheduledReminder, UserProfile } from '../domain/types';
import { logInternalError } from '../domain/errors';

export async function requestNotificationPermission(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  try {
    const Notifications = await import('expo-notifications');
    const current = await Notifications.getPermissionsAsync();
    if (current.granted) return true;
    const asked = await Notifications.requestPermissionsAsync();
    return asked.granted;
  } catch (error) {
    logInternalError('notifications.permission', error);
    return false;
  }
}

export async function syncScheduledReminders(
  reminders: ScheduledReminder[],
  profile: UserProfile,
  enabled: boolean,
): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    const Notifications = await import('expo-notifications');
    await Notifications.cancelAllScheduledNotificationsAsync();
    if (!enabled) return;
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
      }),
    });
    for (const reminder of reminders) {
      const hours = Math.floor(reminder.minutesFromMidnight / 60);
      const minutes = reminder.minutesFromMidnight % 60;
      await Notifications.scheduleNotificationAsync({
        content: { title: reminder.title, body: reminder.body, sound: false },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: hours,
          minute: minutes,
        },
      });
    }
    void profile;
  } catch (error) {
    logInternalError('notifications.sync', error);
  }
}
