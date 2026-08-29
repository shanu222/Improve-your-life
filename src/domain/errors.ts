export class AppError extends Error {
  readonly code: string;
  readonly userMessage: string;

  constructor(userMessage: string, code = 'UNKNOWN') {
    super(userMessage);
    this.name = 'AppError';
    this.code = code;
    this.userMessage = userMessage;
  }
}

export const MESSAGES = {
  generic: 'Something went wrong. Please try again.',
  unauthorized: 'You cannot access that.',
  notFound: 'We could not find that item.',
  network: 'You appear to be offline. Your entries are saved on this device.',
  validation: 'Please check what you entered and try again.',
};

export function toUserMessage(error: unknown): string {
  if (error instanceof AppError) return error.userMessage;
  return MESSAGES.generic;
}

export function logInternalError(context: string, error: unknown): void {
  const detail = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
  // Technical details stay internal — never shown in UI.
  console.error(`[daily:${context}] ${detail}`);
}

export function assertOwned(resourceUserId: string, sessionUserId: string): void {
  if (!resourceUserId || !sessionUserId || resourceUserId !== sessionUserId) {
    throw new AppError(MESSAGES.unauthorized, 'UNAUTHORIZED');
  }
}

export function sanitizeText(input: string, max = 500): string {
  return input.replace(/\s+/g, ' ').trim().slice(0, max);
}

export function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

const buckets = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(key: string, max: number, windowMs: number): void {
  const now = Date.now();
  const current = buckets.get(key);
  if (!current || now > current.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return;
  }
  current.count += 1;
  if (current.count > max) {
    throw new AppError('Please wait a moment and try again.', 'RATE_LIMIT');
  }
}

export function resetRateLimits(): void {
  buckets.clear();
}
