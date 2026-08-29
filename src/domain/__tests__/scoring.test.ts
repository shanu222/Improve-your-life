import { computeDailyScore } from '../scoring';
import { defaultProfile } from '../defaults';
import type { LogEntry } from '../types';

const profile = defaultProfile('u1', { timezone: 'Asia/Karachi' });

function entry(type: LogEntry['type'], payload: Record<string, unknown>, hour = 10): LogEntry {
  return {
    id: `${type}-${hour}`,
    userId: 'u1',
    type,
    payload,
    occurredAt: `2026-08-29T${String(hour).padStart(2, '0')}:00:00.000Z`,
    localDate: '2026-08-29',
    createdAt: '2026-08-29T10:00:00.000Z',
    updatedAt: '2026-08-29T10:00:00.000Z',
  };
}

describe('daily balance score', () => {
  it('returns empty when nothing is logged', () => {
    const result = computeDailyScore([], profile);
    expect(result.empty).toBe(true);
    expect(result.score).toBeNull();
  });

  it('scores a balanced day highly without looking medical', () => {
    const result = computeDailyScore(
      [
        entry('sleep', { minutes: 480 }),
        entry('water', { ml: 2000 }),
        entry('meal', { kind: 'breakfast', estimate: { calories: 400, proteinG: 20, carbsG: 40, fatG: 10, fiberG: 5, ironMg: 2, calciumMg: 100, vitaminCMg: 20, vitaminDIu: 10, potassiumMg: 200, magnesiumMg: 20, isEstimate: true, unmatched: [], items: [] } }),
        entry('meal', { kind: 'lunch', estimate: { calories: 600, proteinG: 30, carbsG: 60, fatG: 18, fiberG: 8, ironMg: 3, calciumMg: 80, vitaminCMg: 15, vitaminDIu: 0, potassiumMg: 400, magnesiumMg: 40, isEstimate: true, unmatched: [], items: [] } }),
        entry('meal', { kind: 'dinner', estimate: { calories: 550, proteinG: 28, carbsG: 55, fatG: 16, fiberG: 7, ironMg: 2, calciumMg: 90, vitaminCMg: 18, vitaminDIu: 0, potassiumMg: 350, magnesiumMg: 30, isEstimate: true, unmatched: [], items: [] } }),
        entry('exercise', { minutes: 30 }),
        entry('mood', { score: 8 }),
        entry('hygiene', { kind: 'brush' }),
        entry('hygiene', { kind: 'face' }),
        entry('hygiene', { kind: 'bath' }),
        entry('fruit', { count: 1 }),
        entry('vegetables', { count: 1 }),
      ],
      profile,
    );
    expect(result.empty).toBe(false);
    expect(result.score).toBeGreaterThanOrEqual(80);
    expect(result.headline).toMatch(/great|pretty well/i);
  });

  it('does not let smoking destroy the whole score', () => {
    const base = [
      entry('sleep', { minutes: 480 }),
      entry('water', { ml: 2000 }),
      entry('exercise', { minutes: 30 }),
      entry('mood', { score: 8 }),
    ];
    const withSmoking = [...base, entry('smoking', { count: 8 })];
    const a = computeDailyScore(base, { ...profile, smokingGoalPerDay: 2 });
    const b = computeDailyScore(withSmoking, { ...profile, smokingGoalPerDay: 2 });
    expect(a.score).not.toBeNull();
    expect(b.score).not.toBeNull();
    expect((a.score ?? 0) - (b.score ?? 0)).toBeLessThanOrEqual(12);
    expect(b.score).toBeGreaterThanOrEqual(22);
  });

  it('ignores deleted entries', () => {
    const result = computeDailyScore(
      [entry('water', { ml: 2000 }), { ...entry('water', { ml: 2000 }, 11), deletedAt: '2026-08-29T11:00:00.000Z' }],
      profile,
    );
    expect(result.breakdown.hydration).toBe(100);
  });
});
