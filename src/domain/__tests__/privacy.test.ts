import { assertOwned, AppError, rateLimit, resetRateLimits, sanitizeText, toUserMessage } from '../errors';

describe('privacy and authorization', () => {
  it('blocks cross-user access', () => {
    expect(() => assertOwned('a', 'b')).toThrow(AppError);
    expect(() => assertOwned('a', 'a')).not.toThrow();
  });

  it('never surfaces technical errors', () => {
    expect(toUserMessage(new Error('Prisma P2002'))).toBe('Something went wrong. Please try again.');
    expect(toUserMessage(new AppError('Please wait a moment and try again.', 'RATE_LIMIT'))).toBe(
      'Please wait a moment and try again.',
    );
  });

  it('rate-limits sensitive operations', () => {
    resetRateLimits();
    rateLimit('delete:u1', 2, 60_000);
    rateLimit('delete:u1', 2, 60_000);
    expect(() => rateLimit('delete:u1', 2, 60_000)).toThrow(AppError);
  });

  it('trims user input', () => {
    expect(sanitizeText('  hello   world  ')).toBe('hello world');
  });
});
