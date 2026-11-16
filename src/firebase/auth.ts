import {
  EmailAuthProvider,
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  fetchSignInMethodsForEmail,
  reauthenticateWithCredential,
  sendPasswordResetEmail,
  signInWithCredential,
  signInWithEmailAndPassword,
  signOut,
  updatePassword,
  type User as FirebaseUser,
} from 'firebase/auth';
import { GoogleSignin, isErrorWithCode, statusCodes } from '@react-native-google-signin/google-signin';
import { AppError } from '../domain/errors';
import { authConflictMessage, firebaseAuthUserMessage } from '../domain/authConflicts';
import { getFirebaseAuth, firebaseConfigured } from './client';
import { googleWebClientId } from '../auth/google';
import { settleWithTimeout } from '../lib/timeout';

let googleConfigured = false;

export function configureGoogleSignIn(): void {
  if (googleConfigured) return;
  const webClientId = googleWebClientId();
  if (!webClientId) return;
  GoogleSignin.configure({
    webClientId,
    offlineAccess: false,
  });
  googleConfigured = true;
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

export async function signInWithGoogleNative(): Promise<FirebaseUser | 'cancelled'> {
  configureGoogleSignIn();
  if (!googleWebClientId()) {
    throw new AppError('Google Sign-In is not configured for this build.', 'CONFIG');
  }
  try {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    const result = await GoogleSignin.signIn();
    if (result.type === 'cancelled') return 'cancelled';
    const idToken = result.data?.idToken;
    if (!idToken) {
      throw new AppError('Google did not return a sign-in token. Try again.', 'AUTH');
    }
    return await signInGoogleIdToken(idToken);
  } catch (error) {
    if (error === 'cancelled' || (typeof error === 'object' && error && 'type' in error && (error as { type: string }).type === 'cancelled')) {
      return 'cancelled';
    }
    if (isErrorWithCode(error)) {
      if (error.code === statusCodes.SIGN_IN_CANCELLED) return 'cancelled';
      if (error.code === statusCodes.IN_PROGRESS) {
        throw new AppError('Google sign-in is already in progress.', 'AUTH');
      }
      if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        throw new AppError('Google Play services are required for Google Sign-In.', 'AUTH');
      }
    }
    if (error instanceof AppError) throw error;
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

export async function changeCloudPassword(currentPassword: string, nextPassword: string): Promise<void> {
  const auth = requireAuth();
  const user = auth.currentUser;
  if (!user?.email) throw new AppError('Sign in with email and password to change your password.', 'AUTH');
  if (nextPassword.trim().length < 6) throw new AppError('Please choose a longer password.', 'AUTH');
  try {
    const cred = EmailAuthProvider.credential(user.email, currentPassword);
    await reauthenticateWithCredential(user, cred);
    await updatePassword(user, nextPassword);
  } catch (error) {
    throw new AppError(mapErr(error), 'AUTH');
  }
}

export async function reauthenticateWithPassword(password: string): Promise<void> {
  const auth = requireAuth();
  const user = auth.currentUser;
  if (!user?.email) throw new AppError('Sign in with email and password first.', 'AUTH');
  if (!password.trim()) throw new AppError('Enter your current password to continue.', 'AUTH');
  try {
    await reauthenticateWithCredential(user, EmailAuthProvider.credential(user.email, password));
  } catch (error) {
    throw new AppError(mapErr(error), 'AUTH');
  }
}

export async function reauthenticateWithGoogle(): Promise<void | 'cancelled'> {
  configureGoogleSignIn();
  const auth = requireAuth();
  const user = auth.currentUser;
  if (!user) throw new AppError('Please sign in again, then try again.', 'AUTH');
  try {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    const result = await GoogleSignin.signIn();
    if (result.type === 'cancelled') return 'cancelled';
    const idToken = result.data?.idToken;
    if (!idToken) throw new AppError('Google did not confirm your account. Try again.', 'AUTH');
    await reauthenticateWithCredential(user, GoogleAuthProvider.credential(idToken));
  } catch (error) {
    if (isErrorWithCode(error) && error.code === statusCodes.SIGN_IN_CANCELLED) return 'cancelled';
    if (error instanceof AppError) throw error;
    throw new AppError(mapErr(error), 'AUTH');
  }
}

export async function signOutCloud(): Promise<void> {
  await settleWithTimeout(
    (async () => {
      try {
        if (GoogleSignin.hasPreviousSignIn()) {
          await GoogleSignin.revokeAccess().catch(() => undefined);
          await GoogleSignin.signOut();
        }
      } catch {
        /* Firebase sign-out still required */
      }
    })(),
    8000,
  );
  const auth = getFirebaseAuth();
  if (!auth) return;
  await settleWithTimeout(signOut(auth), 8000);
}

export function cloudReady(): boolean {
  return firebaseConfigured();
}

function mapErr(error: unknown): string {
  const code = typeof error === 'object' && error && 'code' in error ? String((error as { code: string }).code) : '';
  return firebaseAuthUserMessage(code);
}
