import type { VercelRequest, VercelResponse } from '@vercel/node';
import { json, requireUser, userError, readJson, firestoreAdmin } from '../_lib/http';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return userError(res, 405);
  const uid = await requireUser(req, res);
  if (!uid) return;
  const body = readJson<{ token?: string; platform?: string }>(req);
  const token = String(body.token ?? '');
  if (token.length < 10) return userError(res, 400, 'Something went wrong. Please try again.');
  const id = token.slice(-24);
  await firestoreAdmin()
    .collection('users')
    .doc(uid)
    .collection('devices')
    .doc(id)
    .set({
      token,
      platform: body.platform ?? 'unknown',
      updatedAt: new Date().toISOString(),
      disabled: false,
    });
  return json(res, 200, { ok: true });
}
