import { buildCoachAdvice } from '../coach';
import { defaultProfile } from '../defaults';
import type { LogEntry } from '../types';

const profile = defaultProfile('u1', { timezone: 'UTC', waterGoalMl: 2000 });

function entry(type: LogEntry['type'], payload: Record<string, unknown> = {}): LogEntry {
  return {
    id: type,
    userId: 'u1',
    type,
    payload,
    occurredAt: '2026-08-29T10:00:00.000Z',
    localDate: '2026-08-29',
    createdAt: 't',
    updatedAt: 't',
  };
}

describe('daily coach', () => {
  it('does not invent advice when water is already done', () => {
    const now = new Date('2026-08-29T15:00:00.000Z');
    const advice = buildCoachAdvice(
      [entry('water', { ml: 2000 }), entry('exercise', { minutes: 30 }), entry('hygiene', { kind: 'brush' })],
      profile,
      now,
    );
    expect(advice.priorities.every((p) => !p.text.toLowerCase().includes('water'))).toBe(true);
  });

  it('asks for water when logged intake is low', () => {
    const now = new Date('2026-08-29T15:00:00.000Z');
    const advice = buildCoachAdvice([entry('water', { ml: 250 })], profile, now);
    expect(advice.priorities.some((p) => p.emoji === '💧')).toBe(true);
  });

  it('uses actual logged data, not random tips', () => {
    const now = new Date('2026-08-29T15:00:00.000Z');
    const empty = buildCoachAdvice([], profile, now);
    expect(empty.greeting).toMatch(/nothing logged/i);
  });
});
