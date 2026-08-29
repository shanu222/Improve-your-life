export type AuthProviderHint = 'google.com' | 'password' | 'none';

export function authConflictMessage(email: string, methods: string[]): string | null {
  void email;
  const unique = new Set(methods);
  const google = unique.has('google.com');
  const password = unique.has('password');
  if (google && !password) {
    return 'This email is already registered with Google Sign In. Please continue with Google.';
  }
  if (password && !google) {
    return 'This email is already registered with email/password. Please sign in using your email and password.';
  }
  return null;
}

export function firebaseAuthUserMessage(code: string): string {
  switch (code) {
    case 'auth/email-already-in-use':
      return 'This email is already registered. Try signing in instead.';
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'That email or password does not match.';
    case 'auth/weak-password':
      return 'Please choose a longer password.';
    case 'auth/invalid-email':
      return 'Please enter a valid email.';
    case 'auth/too-many-requests':
      return 'Please wait a moment and try again.';
    case 'auth/account-exists-with-different-credential':
      return 'This email is already registered with another sign-in method.';
    default:
      return 'Something went wrong. Please try again.';
  }
}

export function generateVerificationCode(random = Math.random, now = Date.now()): { code: string; expiresAt: number } {
  const n = Math.floor(100000 + random() * 900000);
  return { code: String(n), expiresAt: now + 10 * 60 * 1000 };
}

export function verificationCodeValid(input: string, expected: string, expiresAt: number, now: number): boolean {
  if (now > expiresAt) return false;
  return input.trim() === expected;
}
