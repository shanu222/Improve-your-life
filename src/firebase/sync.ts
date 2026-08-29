import { deleteDoc, doc, setDoc } from 'firebase/firestore';
import type { LogEntry, NotificationPreference, UserProfile } from '../domain/types';
import { stripImageFromPayload } from '../domain/foodVision';
import { logInternalError } from '../domain/errors';
import { getFirestoreDb } from './client';

export async function syncProfileToCloud(
  uid: string,
  profile: UserProfile,
  email?: string,
  extras?: { notificationEnabled?: boolean },
): Promise<void> {
  const db = getFirestoreDb();
  if (!db) return;
  await setDoc(
    doc(db, 'users', uid),
    {
      uid,
      email: email ?? null,
      displayName: profile.name,
      timezone: profile.timezone,
      notificationEnabled: extras?.notificationEnabled ?? false,
      notificationsEnabled: extras?.notificationEnabled ?? false,
      onboardingCompleted: profile.onboardingComplete,
      lastOpenedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    { merge: true },
  );
}

export async function syncEntryToCloud(uid: string, entry: LogEntry): Promise<boolean> {
  const db = getFirestoreDb();
  if (!db) return false;
  const payload = stripImageFromPayload(entry.payload);
  if (entry.type === 'meal') {
    await setDoc(doc(db, 'users', uid, 'meals', entry.id), {
      mealType: payload.kind ?? 'snack',
      description: payload.text ?? '',
      estimatedCalories: (payload.estimate as { calories?: number } | undefined)?.calories ?? 0,
      protein: (payload.estimate as { proteinG?: number } | undefined)?.proteinG ?? 0,
      carbs: (payload.estimate as { carbsG?: number } | undefined)?.carbsG ?? 0,
      fat: (payload.estimate as { fatG?: number } | undefined)?.fatG ?? 0,
      foodItems: (payload.estimate as { items?: unknown } | undefined)?.items ?? [],
      createdAt: entry.createdAt,
    });
    return true;
  }
  if (entry.type === 'mood') {
    await setDoc(doc(db, 'users', uid, 'mood_logs', entry.id), {
      mood: payload.key,
      text: payload.note ?? '',
      timestamp: entry.occurredAt,
    });
    return true;
  }
  if (entry.type === 'activity') {
    await setDoc(doc(db, 'users', uid, 'activities', entry.id), {
      activity: payload.activity,
      description: payload.description ?? '',
      startedAt: entry.occurredAt,
    });
    return true;
  }
  if (entry.type === 'focus') {
    await setDoc(doc(db, 'users', uid, 'focus_sessions', entry.id), {
      duration: payload.duration,
      completed: payload.status === 'completed',
      startedAt: entry.occurredAt,
    });
    return true;
  }
  await setDoc(
    doc(db, 'users', uid, 'daily_logs', entry.localDate),
    {
      date: entry.localDate,
      updatedAt: entry.updatedAt,
      [`entry_${entry.id}`]: { type: entry.type, payload, occurredAt: entry.occurredAt },
    },
    { merge: true },
  );
  return true;
}

export async function syncNotificationPrefs(
  uid: string,
  pref: NotificationPreference,
  timezone?: string,
): Promise<void> {
  const db = getFirestoreDb();
  if (!db) return;
  const tz = timezone || '';
  const settings = {
    enabled: pref.enabled,
    breakfastReminder: pref.categories.breakfast !== false,
    lunchReminder: pref.categories.lunch !== false,
    dinnerReminder: pref.categories.dinner !== false,
    waterReminder: pref.categories.water !== false,
    hygieneReminder: pref.categories.sleep !== false,
    moodReminder: pref.categories.mood !== false,
    activityReminder: pref.categories.break !== false,
    inactivityReminder: true,
    dailySummary: pref.categories.endOfDay !== false,
    smartReminders: true,
    quietHoursEnabled: true,
    quietHoursStart: pref.quietHoursStart,
    quietHoursEnd: pref.quietHoursEnd,
    quietHours: `${pref.quietHoursStart}-${pref.quietHoursEnd}`,
    timezone: tz,
    reminderMode: pref.reminderMode,
    ...pref.categories,
    updatedAt: new Date().toISOString(),
  };
  await setDoc(doc(db, 'users', uid, 'notification_preferences', 'settings'), settings, { merge: true });
  await setDoc(
    doc(db, 'users', uid),
    { notificationSettings: settings, notificationEnabled: pref.enabled, notificationsEnabled: pref.enabled },
    { merge: true },
  );
}

export type DeviceTokenPayload = {
  fcmToken?: string | null;
  token?: string | null;
  platform: string;
  appVersion?: string;
  enabled?: boolean;
  notificationPermission?: string;
  timezone?: string;
  lastSeen?: string;
  updatedAt?: string;
};

export async function registerDeviceToken(uid: string, deviceId: string, payload: DeviceTokenPayload): Promise<void> {
  const db = getFirestoreDb();
  if (!db) return;
  const token = payload.fcmToken || payload.token || '';
  const now = new Date().toISOString();
  const body = {
    deviceId,
    fcmToken: token || null,
    token: token || null,
    platform: payload.platform,
    appVersion: payload.appVersion ?? '',
    enabled: payload.enabled !== false && Boolean(token),
    disabled: payload.enabled === false || !token,
    notificationPermission: payload.notificationPermission ?? 'undetermined',
    timezone: payload.timezone ?? '',
    lastSeen: payload.lastSeen ?? now,
    updatedAt: payload.updatedAt ?? now,
  };
  await setDoc(doc(db, 'users', uid, 'devices', deviceId || 'device'), body, { merge: true });
  if (token) {
    const legacyId = token.slice(-24);
    if (legacyId && legacyId !== deviceId) {
      await setDoc(doc(db, 'users', uid, 'devices', legacyId), { ...body, disabled: true, enabled: false }, { merge: true });
    }
  }
}

export async function touchDevicePresence(uid: string, deviceId: string, timezone: string): Promise<void> {
  const db = getFirestoreDb();
  if (!db) return;
  const now = new Date().toISOString();
  await setDoc(
    doc(db, 'users', uid, 'devices', deviceId || 'device'),
    { lastSeen: now, updatedAt: now, timezone },
    { merge: true },
  );
  await setDoc(doc(db, 'users', uid), { lastOpenedAt: now, lastSeen: now, timezone }, { merge: true });
}

export async function disableDeviceToken(uid: string, deviceId: string, token?: string | null): Promise<void> {
  const db = getFirestoreDb();
  if (!db) return;
  const now = new Date().toISOString();
  await setDoc(
    doc(db, 'users', uid, 'devices', deviceId || 'device'),
    { enabled: false, disabled: true, updatedAt: now },
    { merge: true },
  ).catch((error) => logInternalError('device.disable', error));
  if (token) {
    await deleteDoc(doc(db, 'users', uid, 'devices', token.slice(-24))).catch((error) =>
      logInternalError('device.delete', error),
    );
  }
}

export async function safeCloudSync(fn: () => Promise<void>): Promise<void> {
  try {
    await fn();
  } catch (error) {
    logInternalError('firestore.sync', error);
  }
}
