import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { onRequest } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions';
import { addDays, getLocalDate } from './timezone';
import { decideNextNotification, type EnginePrefs, type EngineToday } from './notificationEngine';

initializeApp();

const BATCH = 80;
const INACTIVITY_HOURS = 20;
const MIN_GAP_MINUTES = 50;
const MAX_ORDINARY_PER_DAY = 6;
const WINDOW_MINUTES = 18;

type DeviceRow = {
  fcmToken?: string;
  token?: string;
  enabled?: boolean;
  disabled?: boolean;
};

function tokenOf(row: DeviceRow): string | null {
  const token = row.fcmToken || row.token || '';
  if (!token || row.disabled || row.enabled === false) return null;
  return token;
}

function prefsFromUser(data: FirebaseFirestore.DocumentData, fallback?: FirebaseFirestore.DocumentData): EnginePrefs {
  const settings = (data.notificationSettings || fallback || {}) as Record<string, unknown>;
  const quiet = String(settings.quietHours || `${settings.quietHoursStart || '22:30'}-${settings.quietHoursEnd || '07:00'}`);
  const [start, end] = quiet.split('-');
  return {
    enabled: Boolean(settings.enabled ?? data.notificationEnabled ?? data.notificationsEnabled),
    reminderMode: (settings.reminderMode as EnginePrefs['reminderMode']) || 'balanced',
    quietHoursEnabled: settings.quietHoursEnabled !== false,
    quietHoursStart: String(settings.quietHoursStart || start || '22:30'),
    quietHoursEnd: String(settings.quietHoursEnd || end || '07:00'),
    timezone: String(settings.timezone || data.timezone || 'UTC'),
    wakeTime: String(data.wakeTime || settings.wakeTime || '07:00'),
    breakfastTime: String(data.breakfastTime || settings.breakfastTime || '08:00'),
    lunchTime: String(data.lunchTime || settings.lunchTime || '13:30'),
    dinnerTime: String(data.dinnerTime || settings.dinnerTime || '20:00'),
    sleepTime: String(data.sleepTime || settings.sleepTime || '23:00'),
    waterGoalMl: Number(data.waterGoalMl || settings.waterGoalMl || 2000),
    categories: settings as Record<string, boolean | undefined>,
  };
}

function todayFromLogs(
  daily?: FirebaseFirestore.DocumentData,
  meals: Array<FirebaseFirestore.DocumentData> = [],
  nowMs = Date.now(),
): EngineToday {
  const today: EngineToday = {
    breakfast: false,
    lunch: false,
    dinner: false,
    waterMl: 0,
    waterRecent: false,
    hygiene: false,
    shower: false,
    mood: false,
    exercise: false,
    sleep: false,
    activity: false,
    focus: false,
  };

  for (const meal of meals) {
    const kind = String(meal.mealType || meal.kind || '');
    if (kind === 'breakfast') today.breakfast = true;
    if (kind === 'lunch') today.lunch = true;
    if (kind === 'dinner') today.dinner = true;
  }

  if (daily) {
    for (const [key, value] of Object.entries(daily)) {
      if (!key.startsWith('entry_') || !value || typeof value !== 'object') continue;
      const entry = value as { type?: string; payload?: Record<string, unknown>; occurredAt?: string };
      const type = String(entry.type || '');
      const payload = entry.payload || {};
      if (type === 'water') {
        today.waterMl += Number(payload.ml || 0);
        if (entry.occurredAt && nowMs - Date.parse(entry.occurredAt) < 2 * 60 * 60 * 1000) today.waterRecent = true;
      }
      if (type === 'hygiene') {
        today.hygiene = true;
        if (payload.kind === 'bath') today.shower = true;
      }
      if (type === 'mood') today.mood = true;
      if (type === 'exercise') today.exercise = true;
      if (type === 'sleep') today.sleep = true;
      if (type === 'activity') today.activity = true;
      if (type === 'focus') today.focus = true;
      if (type === 'meal') {
        const kind = String(payload.kind || '');
        if (kind === 'breakfast') today.breakfast = true;
        if (kind === 'lunch') today.lunch = true;
        if (kind === 'dinner') today.dinner = true;
      }
    }
  }
  return today;
}

function waterFromDaily(daily?: FirebaseFirestore.DocumentData): number {
  if (!daily) return 0;
  let ml = 0;
  for (const [key, value] of Object.entries(daily)) {
    if (!key.startsWith('entry_') || !value || typeof value !== 'object') continue;
    const entry = value as { type?: string; payload?: { ml?: number } };
    if (entry.type === 'water') ml += Number(entry.payload?.ml || 0);
  }
  return ml;
}

function sleepFromDaily(daily?: FirebaseFirestore.DocumentData): number {
  if (!daily) return 0;
  for (const [key, value] of Object.entries(daily)) {
    if (!key.startsWith('entry_') || !value || typeof value !== 'object') continue;
    const entry = value as { type?: string; payload?: { minutes?: number } };
    if (entry.type === 'sleep') return Number(entry.payload?.minutes || 0);
  }
  return 0;
}

async function processUser(
  uid: string,
  userData: FirebaseFirestore.DocumentData,
): Promise<{ sent: boolean; invalid: number }> {
  const db = getFirestore();
  const userRef = db.collection('users').doc(uid);
  let fallback: FirebaseFirestore.DocumentData | undefined;
  if (!userData.notificationSettings) {
    const prefSnap = await userRef.collection('notification_preferences').doc('settings').get();
    fallback = prefSnap.data();
  }
  const prefs = prefsFromUser(userData, fallback);
  if (!prefs.enabled) return { sent: false, invalid: 0 };

  const devicesSnap = await userRef.collection('devices').get();
  const tokens: Array<{ token: string; id: string }> = [];
  const seen = new Set<string>();
  for (const docSnap of devicesSnap.docs) {
    const token = tokenOf(docSnap.data() as DeviceRow);
    if (!token || seen.has(token)) continue;
    seen.add(token);
    tokens.push({ token, id: docSnap.id });
  }
  if (!tokens.length) return { sent: false, invalid: 0 };

  const now = new Date();
  const localDate = getLocalDate(now, prefs.timezone || 'UTC');
  const yesterday = addDays(localDate, -1);
  const [dailySnap, mealsSnap, yesterdaySnap, sentSnap] = await Promise.all([
    userRef.collection('daily_logs').doc(localDate).get(),
    userRef.collection('meals').limit(30).get(),
    userRef.collection('daily_logs').doc(yesterday).get(),
    userRef.collection('sent_notifications').where('localDate', '==', localDate).limit(20).get(),
  ]);

  const mealsToday = mealsSnap.docs
    .map((d) => d.data())
    .filter((meal) => {
      const created = String(meal.createdAt || '');
      if (!created) return false;
      return getLocalDate(new Date(created), prefs.timezone || 'UTC') === localDate;
    });

  const sentIds = [
    ...((userData.sentNotificationIds as string[]) || []),
    ...sentSnap.docs.map((d) => d.id),
  ];

  const decision = decideNextNotification({
    uid,
    prefs,
    today: todayFromLogs(dailySnap.data(), mealsToday, now.getTime()),
    sentIds,
    lastOpenedAt: userData.lastOpenedAt || userData.lastSeen,
    lastNotificationAt: userData.lastNotificationAt,
    now,
    inactivityHours: INACTIVITY_HOURS,
    minGapMinutes: MIN_GAP_MINUTES,
    maxOrdinaryPerDay: MAX_ORDINARY_PER_DAY,
    windowMinutes: WINDOW_MINUTES,
    historyDays: yesterdaySnap.exists ? 2 : 1,
    yesterdayWaterMl: waterFromDaily(yesterdaySnap.data()),
    yesterdaySleepMinutes: sleepFromDaily(yesterdaySnap.data()),
    todaySleepMinutes: sleepFromDaily(dailySnap.data()),
  });
  if (!decision) return { sent: false, invalid: 0 };

  const sentRef = userRef.collection('sent_notifications').doc(decision.logicalId);
  const created = await db.runTransaction(async (tx) => {
    const existing = await tx.get(sentRef);
    if (existing.exists) return false;
    tx.set(sentRef, {
      type: decision.type,
      slot: decision.slot,
      localDate,
      createdAt: now.toISOString(),
    });
    return true;
  });
  if (!created) return { sent: false, invalid: 0 };

  const response = await getMessaging().sendEachForMulticast({
    tokens: tokens.map((t) => t.token),
    notification: { title: decision.title, body: decision.body },
    data: {
      type: decision.type,
      action: decision.action,
      route: decision.route,
      slot: decision.slot,
    },
    android: {
      collapseKey: decision.slot,
      priority: 'normal',
      notification: {
        channelId: decision.channelId,
        notificationCount: 1,
      },
    },
    apns: { headers: { 'apns-collapse-id': decision.slot } },
  });

  let invalid = 0;
  response.responses.forEach((item, index) => {
    if (item.success) return;
    const code = item.error?.code || '';
    if (code.includes('registration-token-not-registered') || code.includes('invalid-registration-token')) {
      invalid += 1;
      const device = tokens[index];
      if (device) {
        void userRef.collection('devices').doc(device.id).set(
          { enabled: false, disabled: true, updatedAt: now.toISOString() },
          { merge: true },
        );
      }
    } else {
      logger.warn('fcm.send.failed', { uid, code });
    }
  });

  const nextIds = [...sentIds, decision.logicalId].slice(-24);
  await userRef.set(
    {
      lastNotificationAt: now.toISOString(),
      lastNotificationType: decision.type,
      sentNotificationIds: nextIds,
    },
    { merge: true },
  );

  return { sent: response.successCount > 0, invalid };
}

async function runTick(): Promise<{ scanned: number; sent: number; invalid: number }> {
  const db = getFirestore();
  let scanned = 0;
  let sent = 0;
  let invalid = 0;
  let last: FirebaseFirestore.QueryDocumentSnapshot | undefined;

  for (let page = 0; page < 20; page += 1) {
    let query: FirebaseFirestore.Query = db.collection('users').limit(BATCH);
    if (last) query = db.collection('users').startAfter(last).limit(BATCH);
    const snap = await query.get();
    if (snap.empty) break;
    last = snap.docs[snap.docs.length - 1];
    for (const userDoc of snap.docs) {
      scanned += 1;
      try {
        const result = await processUser(userDoc.id, userDoc.data());
        if (result.sent) sent += 1;
        invalid += result.invalid;
      } catch (error) {
        logger.error('notify.user.failed', { uid: userDoc.id, message: error instanceof Error ? error.message : 'error' });
      }
    }
    if (snap.size < BATCH) break;
  }

  logger.info('notify.tick', { scanned, sent, invalid });
  return { scanned, sent, invalid };
}

export const dailymeNotifyTick = onSchedule(
  {
    schedule: 'every 15 minutes',
    timeZone: 'UTC',
    region: 'us-central1',
    timeoutSeconds: 180,
    memory: '256MiB',
  },
  async () => {
    await runTick();
  },
);

export const dailymeNotifyManual = onRequest(
  { region: 'us-central1', timeoutSeconds: 180, memory: '256MiB' },
  async (req, res) => {
    const secret = process.env.CRON_SECRET || process.env.NOTIFY_SECRET;
    if (secret && req.get('authorization') !== `Bearer ${secret}`) {
      res.status(401).json({ error: 'unauthorized' });
      return;
    }
    const result = await runTick();
    res.json(result);
  },
);
