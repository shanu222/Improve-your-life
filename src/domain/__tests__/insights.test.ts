import { detectInsights } from '../insights';
import type { LogEntry } from '../types';

function day(date: string, move: number, mood: number): { date: string; entries: LogEntry[] } {
  const entries: LogEntry[] = [
    {
      id: `${date}-m`,
      userId: 'u1',
      type: 'mood',
      payload: { score: mood },
      occurredAt: `${date}T12:00:00.000Z`,
      localDate: date,
      createdAt: 't',
      updatedAt: 't',
    },
  ];
  if (move > 0) {
    entries.push({
      id: `${date}-e`,
      userId: 'u1',
      type: 'exercise',
      payload: { minutes: move },
      occurredAt: `${date}T12:00:00.000Z`,
      localDate: date,
      createdAt: 't',
      updatedAt: 't',
    });
  }
  return { date, entries };
}

describe('insights', () => {
  it('requires enough data', () => {
    expect(detectInsights([day('2026-08-29', 30, 8)])).toEqual([]);
  });

  it('reports correlation language, not causation', () => {
    const days = [
      day('2026-08-20', 30, 8),
      day('2026-08-21', 30, 9),
      day('2026-08-22', 30, 8),
      day('2026-08-23', 0, 5),
      day('2026-08-24', 0, 4),
      day('2026-08-25', 0, 5),
      day('2026-08-26', 30, 8),
    ];
    const insights = detectInsights(days);
    expect(insights.some((i) => i.id === 'mood_movement')).toBe(true);
    expect(JSON.stringify(insights)).not.toMatch(/caused/i);
    expect(JSON.stringify(insights)).toMatch(/logged higher mood/i);
  });
});
