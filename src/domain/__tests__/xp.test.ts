import { xpForEntry, levelFromXp, newlyEarnedBadges } from '../xp';
import { defaultProfile } from '../defaults';
import type { LogEntry, XpTransaction } from '../types';

const profile = defaultProfile('u1');

function tx(source: string, amount: number): XpTransaction {
  return { id: source, userId: 'u1', amount, reason: '', source, localDate: '2026-08-29', createdAt: 't' };
}

function entry(type: LogEntry['type'], payload: Record<string, unknown> = {}): LogEntry {
  return {
    id: 'e',
    userId: 'u1',
    type,
    payload,
    occurredAt: 't',
    localDate: '2026-08-29',
    createdAt: 't',
    updatedAt: 't',
  };
}

describe('xp', () => {
  it('awards water xp', () => {
    expect(xpForEntry(entry('water', { ml: 250 }), profile, [])?.amount).toBe(5);
  });

  it('never awards smoking, junk, or sugary drinks', () => {
    expect(xpForEntry(entry('smoking', { count: 1 }), profile, [])).toBeNull();
    expect(xpForEntry(entry('junk', { count: 1 }), profile, [])).toBeNull();
    expect(xpForEntry(entry('sugary', { count: 1 }), profile, [])).toBeNull();
  });

  it('caps exercise xp per day', () => {
    const first = xpForEntry(entry('exercise', { minutes: 20 }), profile, []);
    expect(first?.amount).toBe(15);
    const second = xpForEntry(entry('exercise', { minutes: 20 }), profile, [tx('exercise', 15)]);
    expect(second).toBeNull();
  });

  it('does not award sleep xp far below the goal', () => {
    expect(xpForEntry(entry('sleep', { minutes: 200 }), profile, [])).toBeNull();
    expect(xpForEntry(entry('sleep', { minutes: 480 }), profile, [])?.amount).toBe(20);
  });

  it('maps levels', () => {
    expect(levelFromXp(0).level).toBe(1);
    expect(levelFromXp(1200).level).toBe(13);
    expect(levelFromXp(1100).name).toBe('Getting Better');
  });

  it('earns first step badge', () => {
    const badges = newlyEarnedBadges({
      totalEntries: 1,
      streaks: [],
      exerciseDays: 0,
      readingDays: 0,
      owned: new Set(),
    });
    expect(badges.some((b) => b.key === 'first_step')).toBe(true);
  });
});
