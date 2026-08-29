import Constants from 'expo-constants';
import { getFirebaseAuth } from '../firebase/client';
import { AppError, logInternalError } from '../domain/errors';

export function apiBase(): string {
  const extra = Constants.expoConfig?.extra as { apiBase?: string } | undefined;
  return (process.env.EXPO_PUBLIC_API_BASE || extra?.apiBase || 'https://improve-your-life-ten.vercel.app').replace(
    /\/$/,
    '',
  );
}

async function bearer(): Promise<string | undefined> {
  const auth = getFirebaseAuth();
  const user = auth?.currentUser;
  if (!user) return undefined;
  try {
    return await user.getIdToken();
  } catch (error) {
    logInternalError('auth.token', error);
    return undefined;
  }
}

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = await bearer();
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(init.body ? { 'Content-Type': 'application/json' } : {}),
    ...(init.headers as Record<string, string> | undefined),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  let response: Response;
  try {
    response = await fetch(`${apiBase()}${path}`, { ...init, headers });
  } catch (error) {
    logInternalError('api.network', error);
    throw new AppError("We couldn't save this right now. Your information will be synced when you're back online.", 'NETWORK');
  }

  let body: { error?: string } & T;
  try {
    body = (await response.json()) as { error?: string } & T;
  } catch {
    if (!response.ok) throw new AppError('Something went wrong. Please try again.', 'API');
    throw new AppError('Something went wrong. Please try again.', 'API');
  }

  if (!response.ok) {
    throw new AppError(body.error || 'Something went wrong. Please try again.', 'API');
  }
  return body;
}

export function apiPost<T>(path: string, body: unknown): Promise<T> {
  return apiRequest<T>(path, { method: 'POST', body: JSON.stringify(body) });
}

export function apiDelete<T>(path: string, body?: unknown): Promise<T> {
  return apiRequest<T>(path, { method: 'DELETE', body: body ? JSON.stringify(body) : undefined });
}

export function apiGet<T>(path: string): Promise<T> {
  return apiRequest<T>(path, { method: 'GET' });
}
