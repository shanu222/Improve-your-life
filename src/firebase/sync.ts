import { deleteDoc, doc, setDoc } from 'firebase/firestore';
import type { LogEntry, NotificationPreference, UserProfile } from '../domain/types';
import { stripImageFromPayload } from '../domain/foodVision';
import { logInternalError } from '../domain/errors';
import { getFirestoreDb } from './client';

export async function syncProfileToCloud(uid: string, profile: UserProfile, email?: string): Promise<void> {
  const db = getFirestoreDb();
  if (!db) return;
  await setDoc(
    doc(db, 'users', uid),
    {
      uid,
      email: email ?? null,
      displayName: profile.name,
      timezone: profile.timezone,
      notificationEnabled: false,
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

export async function syncNotificationPrefs(uid: string, pref: NotificationPreference): Promise<void> {
  const db = getFirestoreDb();
  if (!db) return;
  await setDoc(doc(db, 'users', uid, 'notification_preferences', 'settings'), {
    enabled: pref.enabled,
    quietHours: `${pref.quietHoursStart}-${pref.quietHoursEnd}`,
    timezone: '',
    ...pref.categories,
  });
}

export async function registerDeviceToken(uid: string, token: string, platform: string): Promise<void> {
  const db = getFirestoreDb();
  if (!db) return;
  const id = token.slice(-24) || 'device';
  await setDoc(doc(db, 'users', uid, 'devices', id), {
    token,
    platform,
    updatedAt: new Date().toISOString(),
    disabled: false,
  });
}

export async function disableDeviceToken(uid: string, token: string): Promise<void> {
  const db = getFirestoreDb();
  if (!db) return;
  const id = token.slice(-24) || 'device';
  await deleteDoc(doc(db, 'users', uid, 'devices', id)).catch((error) => logInternalError('device.delete', error));
}

export async function safeCloudSync(fn: () => Promise<void>): Promise<void> {
  try {
    await fn();
  } catch (error) {
    logInternalError('firestore.sync', error);
  }
}
