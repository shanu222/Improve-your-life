import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getMessaging } from 'firebase-admin/messaging';
import { adminReady, firestoreAdmin, getAdminApp, json, userError } from '../_lib/http';

function inQuietHours(nowMinutes: number, start: string, end: string): boolean {
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  const s = (sh || 0) * 60 + (sm || 0);
  const e = (eh || 0) * 60 + (em || 0);
  if (s === e) return false;
  if (s < e) return nowMinutes >= s && nowMinutes < e;
  return nowMinutes >= s || nowMinutes < e;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST' && req.method !== 'GET') return userError(res, 405);
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.authorization !== `Bearer ${secret}`) {
    return userError(res, 401, 'Something went wrong. Please try again.');
  }
  if (!adminReady()) return json(res, 200, { sent: 0 });

  const db = firestoreAdmin();
  const users = await db.collection('users').limit(200).get();
  let sent = 0;
  const seenTokens = new Set<string>();

  for (const userDoc of users.docs) {
    const uid = userDoc.id;
    const profile = userDoc.data() as { lastOpenedAt?: string; timezone?: string; notificationEnabled?: boolean };
    const prefSnap = await db.collection('users').doc(uid).collection('notification_preferences').doc('settings').get();
    const pref = prefSnap.data() as { enabled?: boolean; quietHours?: string; timezone?: string } | undefined;
    if (!pref?.enabled && !profile.notificationEnabled) continue;

    const lastOpened = profile.lastOpenedAt ? Date.parse(profile.lastOpenedAt) : 0;
    if (Date.now() - lastOpened < 36 * 60 * 60 * 1000) continue;

    const tz = pref?.timezone || profile.timezone || 'UTC';
    let minutes = new Date().getUTCHours() * 60 + new Date().getUTCMinutes();
    try {
      const parts = new Intl.DateTimeFormat('en-GB', { timeZone: tz, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date());
      const hour = Number(parts.find((p) => p.type === 'hour')?.value ?? 0);
      const minute = Number(parts.find((p) => p.type === 'minute')?.value ?? 0);
      minutes = hour * 60 + minute;
    } catch {
      /* keep UTC */
    }
    const [quietStart, quietEnd] = String(pref?.quietHours ?? '22:30-07:00').split('-');
    if (inQuietHours(minutes, quietStart || '22:30', quietEnd || '07:00')) continue;

    const devices = await db.collection('users').doc(uid).collection('devices').get();
    const tokens = devices.docs
      .map((d) => d.data() as { token?: string; disabled?: boolean })
      .filter((d) => d.token && !d.disabled && !seenTokens.has(d.token!))
      .map((d) => d.token as string);

    for (const token of tokens) seenTokens.add(token);
    if (!tokens.length) continue;

    try {
      await getMessaging(getAdminApp()).sendEachForMulticast({
        tokens,
        notification: {
          title: 'Hey 👋',
          body: "How's everything going?",
        },
        android: { collapseKey: 'inactivity' },
        apns: { headers: { 'apns-collapse-id': 'inactivity' } },
      });
      sent += 1;
      await userDoc.ref.set({ lastInactivityPingAt: new Date().toISOString() }, { merge: true });
    } catch {
      /* skip device errors */
    }
  }

  return json(res, 200, { sent });
}
