import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createHash } from 'crypto';
import { verificationCodeValid } from '../../src/domain/authConflicts';
import { json, rateLimit, userError, readJson, adminReady, firestoreAdmin, getAdminApp } from '../_lib/http';
import { getAuth } from 'firebase-admin/auth';

function emailKey(email: string): string {
  return createHash('sha256').update(email.trim().toLowerCase()).digest('hex');
}

function hashCode(code: string): string {
  return createHash('sha256').update(code).digest('hex');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return userError(res, 405);
  const ip = String(req.headers['x-forwarded-for'] ?? 'ip');
  if (!rateLimit(`verify:${ip}`, 15, 60_000)) return userError(res, 429, 'Please wait a moment and try again.');

  const body = readJson<{ email?: string; code?: string; uid?: string }>(req);
  const email = String(body.email ?? '').trim().toLowerCase();
  const code = String(body.code ?? '').trim();
  if (!email || !code) return userError(res, 400, 'Please enter the code from your email.');
  if (!adminReady()) return userError(res, 503, 'Something went wrong. Please try again.');

  const ref = firestoreAdmin().collection('verification_codes').doc(emailKey(email));
  const snap = await ref.get();
  if (!snap.exists) return userError(res, 400, 'That code is not valid or has expired.');
  const data = snap.data() as { hash: string; expiresAt: number; attempts?: number };
  if ((data.attempts ?? 0) >= 5) return userError(res, 429, 'Please wait a moment and try again.');
  if (!verificationCodeValid(hashCode(code), data.hash, data.expiresAt, Date.now())) {
    await ref.set({ attempts: (data.attempts ?? 0) + 1 }, { merge: true });
    return userError(res, 400, 'That code is not valid or has expired.');
  }

  await ref.delete();
  if (body.uid) {
    try {
      await getAuth(getAdminApp()).updateUser(body.uid, { emailVerified: true });
    } catch {
      return userError(res, 400, 'Please sign in to continue.');
    }
  }
  return json(res, 200, { ok: true, verified: true });
}
