import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createHash } from 'crypto';
import { generateVerificationCode } from '../../src/domain/authConflicts';
import { json, rateLimit, userError, readJson, adminReady, firestoreAdmin } from '../_lib/http';

function emailKey(email: string): string {
  return createHash('sha256').update(email.trim().toLowerCase()).digest('hex');
}

function hashCode(code: string): string {
  return createHash('sha256').update(code).digest('hex');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return userError(res, 405);
  const ip = String(req.headers['x-forwarded-for'] ?? 'ip');
  if (!rateLimit(`code:${ip}`, 8, 60_000)) return userError(res, 429, 'Please wait a moment and try again.');

  const body = readJson<{ email?: string }>(req);
  const email = String(body.email ?? '').trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return userError(res, 400, 'Please enter a valid email.');
  }
  if (!rateLimit(`code-email:${email}`, 5, 10 * 60_000)) {
    return userError(res, 429, 'Please wait a moment and try again.');
  }

  const { code, expiresAt } = generateVerificationCode();
  if (!adminReady()) {
    return userError(res, 503, 'Something went wrong. Please try again.');
  }

  await firestoreAdmin()
    .collection('verification_codes')
    .doc(emailKey(email))
    .set({
      email,
      hash: hashCode(code),
      expiresAt,
      attempts: 0,
      createdAt: Date.now(),
    });

  const key = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM || 'DailyMe <noreply@dailyme.app>';
  if (!key) {
    return userError(res, 503, 'We could not send a code right now. Please try again.');
  }

  const sent = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from,
      to: email,
      subject: 'Your DailyMe verification code',
      text: `Your DailyMe verification code is ${code}. It expires in 10 minutes. If you did not request this, you can ignore this email.`,
    }),
  });

  if (!sent.ok) return userError(res, 503, 'We could not send a code right now. Please try again.');
  return json(res, 200, { ok: true });
}
