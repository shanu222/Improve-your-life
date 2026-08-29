import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  fetchSignInMethodsForEmail,
  sendPasswordResetEmail,
  signInWithCredential,
  signInWithEmailAndPassword,
  signOut,
  type User as FirebaseUser,
} from 'firebase/auth';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { AppError } from '../domain/errors';
import { authConflictMessage, firebaseAuthUserMessage } from '../domain/authConflicts';
import { getFirebaseAuth, firebaseConfigured } from './client';
import { googleAndroidClientId, googleWebClientId } from '../auth/google';

WebBrowser.maybeCompleteAuthSession();

export { Google };

export function useGoogleAuthRequest() {
  const web = googleWebClientId();
  const android = googleAndroidClientId();
  return Google.useIdTokenAuthRequest({
    clientId: web || undefined,
    androidClientId: android || undefined,
    webClientId: web || undefined,
  });
}

function requireAuth() {
  const auth = getFirebaseAuth();
  if (!auth) throw new AppError('Cloud sign-in is not configured yet.', 'CONFIG');
  return auth;
}

export async function checkEmailMethods(email: string): Promise<string[]> {
  const auth = requireAuth();
  try {
    return await fetchSignInMethodsForEmail(auth, email.trim().toLowerCase());
  } catch {
    return [];
  }
}

export async function registerWithEmail(email: string, password: string): Promise<FirebaseUser> {
  const auth = requireAuth();
  const cleaned = email.trim().toLowerCase();
  const methods = await checkEmailMethods(cleaned);
  const conflict = authConflictMessage(cleaned, methods);
  if (conflict) throw new AppError(conflict, 'AUTH_CONFLICT');
  try {
    const cred = await createUserWithEmailAndPassword(auth, cleaned, password);
    return cred.user;
  } catch (error) {
    throw new AppError(mapErr(error), 'AUTH');
  }
}

export async function signInWithEmail(email: string, password: string): Promise<FirebaseUser> {
  const auth = requireAuth();
  const cleaned = email.trim().toLowerCase();
  const methods = await checkEmailMethods(cleaned);
  const conflict = authConflictMessage(cleaned, methods);
  if (conflict && methods.includes('google.com') && !methods.includes('password')) {
    throw new AppError(conflict, 'AUTH_CONFLICT');
  }
  try {
    const cred = await signInWithEmailAndPassword(auth, cleaned, password);
    return cred.user;
  } catch (error) {
    throw new AppError(mapErr(error), 'AUTH');
  }
}

export async function signInGoogleIdToken(idToken: string): Promise<FirebaseUser> {
  const auth = requireAuth();
  try {
    const cred = await signInWithCredential(auth, GoogleAuthProvider.credential(idToken));
    return cred.user;
  } catch (error) {
    throw new AppError(mapErr(error), 'AUTH');
  }
}

export async function requestPasswordReset(email: string): Promise<void> {
  const auth = requireAuth();
  try {
    await sendPasswordResetEmail(auth, email.trim().toLowerCase());
  } catch (error) {
    throw new AppError(mapErr(error), 'AUTH');
  }
}

export async function signOutCloud(): Promise<void> {
  const auth = getFirebaseAuth();
  if (!auth) return;
  await signOut(auth);
}

export function cloudReady(): boolean {
  return firebaseConfigured();
}

function mapErr(error: unknown): string {
  const code = typeof error === 'object' && error && 'code' in error ? String((error as { code: string }).code) : '';
  return firebaseAuthUserMessage(code);
}
