import type { VercelRequest, VercelResponse } from '@vercel/node';
import { json, requireUser, userError, readJson, firestoreAdmin } from '../_lib/http';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return userError(res, 405);
  const uid = await requireUser(req, res);
  if (!uid) return;
  const body = readJson<{
    enabled?: boolean;
    timezone?: string;
    quietHours?: string;
    categories?: Record<string, boolean>;
  }>(req);
  await firestoreAdmin()
    .collection('users')
    .doc(uid)
    .collection('notification_preferences')
    .doc('settings')
    .set(
      {
        enabled: Boolean(body.enabled),
        timezone: body.timezone ?? 'UTC',
        quietHours: body.quietHours ?? '22:30-07:00',
        ...(body.categories ?? {}),
        updatedAt: new Date().toISOString(),
      },
      { merge: true },
    );
  return json(res, 200, { ok: true });
}
