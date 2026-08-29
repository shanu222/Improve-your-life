import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getApps, initializeApp, cert, applicationDefault } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

export function json(res: VercelResponse, status: number, body: unknown) {
  res.status(status).json(body);
}

export function userError(res: VercelResponse, status = 400, message = 'Something went wrong. Please try again.') {
  json(res, status, { error: message });
}

const buckets = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const cur = buckets.get(key);
  if (!cur || now > cur.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  cur.count += 1;
  return cur.count <= max;
}

export function adminReady(): boolean {
  return Boolean(process.env.FIREBASE_SERVICE_ACCOUNT_JSON || process.env.GOOGLE_APPLICATION_CREDENTIALS);
}

export function getAdminApp() {
  if (getApps().length) return getApps()[0]!;
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    const parsed = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON) as {
      projectId?: string;
      project_id?: string;
      clientEmail?: string;
      client_email?: string;
      privateKey?: string;
      private_key?: string;
    };
    return initializeApp({
      credential: cert({
        projectId: parsed.projectId || parsed.project_id,
        clientEmail: parsed.clientEmail || parsed.client_email,
        privateKey: (parsed.privateKey || parsed.private_key)?.replace(/\\n/g, '\n'),
      }),
    });
  }
  return initializeApp({ credential: applicationDefault() });
}

export async function requireUser(req: VercelRequest, res: VercelResponse): Promise<string | null> {
  const header = req.headers.authorization;
  const token = header?.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token) {
    userError(res, 401, 'Please sign in to continue.');
    return null;
  }
  if (!adminReady()) {
    userError(res, 503, 'Something went wrong. Please try again.');
    return null;
  }
  try {
    const decoded = await getAuth(getAdminApp()).verifyIdToken(token);
    return decoded.uid;
  } catch {
    userError(res, 401, 'Please sign in to continue.');
    return null;
  }
}

export function firestoreAdmin() {
  return getFirestore(getAdminApp());
}

export function readJson<T>(req: VercelRequest): T {
  return (typeof req.body === 'string' ? JSON.parse(req.body) : req.body) as T;
}
