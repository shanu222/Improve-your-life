import { applyStreakDay, dayCompletesStreak, streakBrokenCopy } from '../streaks';
import { defaultProfile } from '../defaults';
import type { LogEntry, Streak } from '../types';

const profile = defaultProfile('u1');

const water = (ml: number): LogEntry => ({
  id: 'w',
  userId: 'u1',
  type: 'water',
  payload: { ml },
  occurredAt: '2026-08-29T10:00:00.000Z',
  localDate: '2026-08-29',
  createdAt: 't',
  updatedAt: 't',
});

describe('streaks', () => {
  it('starts a streak on first completed day', () => {
    const streak: Streak = { id: 's', userId: 'u1', kind: 'water', currentCount: 0, bestCount: 0, enabled: true };
    const next = applyStreakDay(streak, '2026-08-29', true);
    expect(next.currentCount).toBe(1);
    expect(next.bestCount).toBe(1);
  });

  it('continues consecutive days', () => {
    const streak: Streak = {
      id: 's',
      userId: 'u1',
      kind: 'water',
      currentCount: 3,
      bestCount: 5,
      lastDate: '2026-08-28',
      enabled: true,
    };
    const next = applyStreakDay(streak, '2026-08-29', true);
    expect(next.currentCount).toBe(4);
    expect(next.bestCount).toBe(5);
  });

  it('resets after a miss without shaming copy', () => {
    const streak: Streak = {
      id: 's',
      userId: 'u1',
      kind: 'water',
      currentCount: 7,
      bestCount: 7,
      lastDate: '2026-08-27',
      enabled: true,
    };
    const next = applyStreakDay(streak, '2026-08-29', true);
    expect(next.currentCount).toBe(1);
    expect(streakBrokenCopy()).toMatch(/progress didn't/i);
  });

  it('does not double-count the same day', () => {
    const streak: Streak = {
      id: 's',
      userId: 'u1',
      kind: 'water',
      currentCount: 2,
      bestCount: 2,
      lastDate: '2026-08-29',
      enabled: true,
    };
    expect(applyStreakDay(streak, '2026-08-29', true).currentCount).toBe(2);
  });

  it('water streak requires near-goal', () => {
    expect(dayCompletesStreak('water', [water(500)], profile)).toBe(false);
    expect(dayCompletesStreak('water', [water(2000)], profile)).toBe(true);
  });
});
