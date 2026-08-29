import Constants from 'expo-constants';
import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';

type PublicFirebase = {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
};

const FALLBACK: PublicFirebase = {
  apiKey: 'AIzaSyBlI951Ve6D7f5JcNzPJQmBGBavvYbk58o',
  authDomain: 'dailyme-e11ef.firebaseapp.com',
  projectId: 'dailyme-e11ef',
  storageBucket: 'dailyme-e11ef.firebasestorage.app',
  messagingSenderId: '710882308081',
  appId: '1:710882308081:android:c576eeaa60e3539efb9e50',
};

export function firebasePublicConfig(): PublicFirebase {
  const extra = (Constants.expoConfig?.extra as { firebase?: Partial<PublicFirebase> } | undefined)?.firebase;
  return {
    apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || extra?.apiKey || FALLBACK.apiKey,
    authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || extra?.authDomain || FALLBACK.authDomain,
    projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || extra?.projectId || FALLBACK.projectId,
    storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || extra?.storageBucket || FALLBACK.storageBucket,
    messagingSenderId:
      process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || extra?.messagingSenderId || FALLBACK.messagingSenderId,
    appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || extra?.appId || FALLBACK.appId,
  };
}

export function firebaseConfigured(): boolean {
  const c = firebasePublicConfig();
  return Boolean(c.apiKey && c.projectId && c.appId);
}

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

export function getFirebaseApp(): FirebaseApp | null {
  if (!firebaseConfigured()) return null;
  if (!app) {
    app = getApps()[0] ?? initializeApp(firebasePublicConfig());
  }
  return app;
}

export function getFirebaseAuth(): Auth | null {
  const instance = getFirebaseApp();
  if (!instance) return null;
  auth ??= getAuth(instance);
  return auth;
}

export function getFirestoreDb(): Firestore | null {
  const instance = getFirebaseApp();
  if (!instance) return null;
  db ??= getFirestore(instance);
  return db;
}
