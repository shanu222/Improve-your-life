import type { VercelRequest, VercelResponse } from '@vercel/node';
import { firestoreAdmin, json, readJson, requireUser, userError } from './_lib/http';

function actionOf(req: VercelRequest): string {
  const query = String(req.query.action ?? '');
  const url = String(req.url ?? '');
  if (query === 'register' || url.includes('register')) return 'register';
  if (query === 'device' || url.includes('device')) return 'device';
  if (query === 'schedule' || url.includes('schedule')) return 'schedule';
  return 'dispatch';
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const action = actionOf(req);
  if (action === 'register') return registerDevice(req, res);
  if (action === 'device') return disableDevice(req, res);
  if (action === 'schedule') return saveSchedule(req, res);
  return dispatch(req, res);
}

async function registerDevice(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return userError(res, 405);
  const uid = await requireUser(req, res);
  if (!uid) return;
  const body = readJson<{
    token?: string;
    deviceId?: string;
    platform?: string;
    appVersion?: string;
    timezone?: string;
    notificationPermission?: string;
    enabled?: boolean;
  }>(req);
  const token = String(body.token ?? '');
  if (token.length < 10) return userError(res, 400, 'Something went wrong. Please try again.');
  const now = new Date().toISOString();
  const id = String(body.deviceId || token.slice(-24));
  await firestoreAdmin()
    .collection('users')
    .doc(uid)
    .collection('devices')
    .doc(id)
    .set(
      {
        deviceId: id,
        token,
        fcmToken: token,
        platform: body.platform ?? 'unknown',
        appVersion: body.appVersion ?? '',
        enabled: body.enabled !== false,
        disabled: false,
        notificationPermission: body.notificationPermission ?? 'granted',
        timezone: body.timezone ?? '',
        lastSeen: now,
        updatedAt: now,
      },
      { merge: true },
    );
  return json(res, 200, { ok: true });
}

async function disableDevice(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'DELETE') return userError(res, 405);
  const uid = await requireUser(req, res);
  if (!uid) return;
  const body = readJson<{ token?: string; deviceId?: string }>(req);
  const token = String(body.token ?? '');
  const deviceId = String(body.deviceId || (token ? token.slice(-24) : ''));
  if (!deviceId) return userError(res, 400, 'Something went wrong. Please try again.');
  const ref = firestoreAdmin().collection('users').doc(uid).collection('devices').doc(deviceId);
  await ref.set({ enabled: false, disabled: true, updatedAt: new Date().toISOString() }, { merge: true });
  return json(res, 200, { ok: true });
}

async function saveSchedule(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return userError(res, 405);
  const uid = await requireUser(req, res);
  if (!uid) return;
  const body = readJson<{
    enabled?: boolean;
    timezone?: string;
    quietHours?: string;
    categories?: Record<string, boolean>;
  }>(req);
  const [quietStart, quietEnd] = String(body.quietHours ?? '22:30-07:00').split('-');
  const settings = {
    enabled: Boolean(body.enabled),
    timezone: body.timezone ?? 'UTC',
    quietHours: body.quietHours ?? '22:30-07:00',
    quietHoursEnabled: true,
    quietHoursStart: quietStart || '22:30',
    quietHoursEnd: quietEnd || '07:00',
    ...(body.categories ?? {}),
    updatedAt: new Date().toISOString(),
  };
  const userRef = firestoreAdmin().collection('users').doc(uid);
  await userRef.collection('notification_preferences').doc('settings').set(settings, { merge: true });
  await userRef.set({ notificationSettings: settings, notificationEnabled: Boolean(body.enabled) }, { merge: true });
  return json(res, 200, { ok: true });
}

async function dispatch(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST' && req.method !== 'GET') return userError(res, 405);
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.authorization !== `Bearer ${secret}`) {
    return userError(res, 401, 'Something went wrong. Please try again.');
  }
  return json(res, 200, {
    sent: 0,
    scheduler: 'cloud-functions',
    note: 'DailyMe reminders are sent by Firebase Cloud Functions, not Vercel cron.',
  });
}
