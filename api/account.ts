import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getAuth } from 'firebase-admin/auth';
import { firestoreAdmin, getAdminApp, json, requireUser, userError } from '../_lib/http';

const SUBS = [
  'daily_logs',
  'meals',
  'mood_logs',
  'activities',
  'tasks',
  'focus_sessions',
  'habits',
  'habit_logs',
  'insights',
  'daily_reports',
  'weekly_reports',
  'notification_preferences',
  'devices',
];

async function deleteCollection(uid: string, name: string) {
  const db = firestoreAdmin();
  const snap = await db.collection('users').doc(uid).collection(name).listDocuments();
  await Promise.all(snap.map((doc) => doc.delete()));
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'DELETE' && req.method !== 'POST') return userError(res, 405);
  const uid = await requireUser(req, res);
  if (!uid) return;

  for (const name of SUBS) {
    await deleteCollection(uid, name);
  }
  await firestoreAdmin().collection('users').doc(uid).delete();
  try {
    await getAuth(getAdminApp()).deleteUser(uid);
  } catch {
    return userError(res, 400, 'Your data was removed. Please try signing out if you still see an account.');
  }
  return json(res, 200, { ok: true });
}
