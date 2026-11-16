import { collection, deleteDoc, doc, getDocs } from 'firebase/firestore';
import { deleteUser } from 'firebase/auth';
import { AppError } from '../domain/errors';
import { apiDelete } from '../lib/apiClient';
import { withTimeout } from '../lib/timeout';
import { getFirebaseAuth, getFirestoreDb } from './client';

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

async function deleteOwnCloudDocuments(uid: string): Promise<void> {
  const db = getFirestoreDb();
  if (!db) return;
  await Promise.all(
    SUBS.map(async (name) => {
      const snap = await getDocs(collection(db, 'users', uid, name));
      await Promise.all(snap.docs.map((row) => deleteDoc(row.ref)));
    }),
  );
  await deleteDoc(doc(db, 'users', uid));
}

export async function deleteCloudAccount(): Promise<void> {
  const auth = getFirebaseAuth();
  const current = auth?.currentUser;
  if (!current) {
    throw new AppError('Please sign in again, then delete your account.', 'AUTH');
  }
  let serverDeleted = false;
  try {
    await withTimeout(apiDelete('/api/account'), 20_000, 'Account deletion timed out.');
    serverDeleted = true;
  } catch {
    serverDeleted = false;
  }
  if (!serverDeleted) {
    try {
      await withTimeout(deleteOwnCloudDocuments(current.uid), 20_000, 'Could not remove cloud data.');
    } catch {
      throw new AppError('DailyMe could not delete your account data. Check your connection and try again.', 'API');
    }
    try {
      await current.reload();
    } catch {
      /* user may already be gone */
    }
    const stillThere = getFirebaseAuth()?.currentUser;
    if (stillThere) {
      try {
        await deleteUser(stillThere);
      } catch (error) {
        const code = typeof error === 'object' && error && 'code' in error ? String((error as { code: string }).code) : '';
        if (code === 'auth/requires-recent-login') {
          throw new AppError('Please confirm it is you, then delete the account again.', 'AUTH');
        }
        throw new AppError('DailyMe could not delete your sign-in. Try again.', 'AUTH');
      }
    }
  }
}
