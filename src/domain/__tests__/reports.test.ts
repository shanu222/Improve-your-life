import { buildDailyReport } from '../reports';
import { defaultProfile } from '../defaults';
import type { LogEntry } from '../types';

const profile = defaultProfile('u1');

const entries: LogEntry[] = [
  {
    id: '1',
    userId: 'u1',
    type: 'water',
    payload: { ml: 1000 },
    occurredAt: 't',
    localDate: '2026-08-29',
    createdAt: 't',
    updatedAt: 't',
  },
  {
    id: '2',
    userId: 'u1',
    type: 'exercise',
    payload: { minutes: 32 },
    occurredAt: 't',
    localDate: '2026-08-29',
    createdAt: 't',
    updatedAt: 't',
  },
];

describe('daily report copy', () => {
  it('stays encouraging', () => {
    const report = buildDailyReport('2026-08-29', entries, profile);
    expect(report.closer).toMatch(/better choice/i);
    expect(JSON.stringify(report)).not.toMatch(/poor performance|you slept badly|you only drank/i);
    expect(report.improve.toLowerCase()).not.toContain('failed');
  });
});
