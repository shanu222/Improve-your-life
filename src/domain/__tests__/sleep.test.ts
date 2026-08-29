import { sleepBand, sleepDurationMinutes, sleepEncouragement } from '../sleep';

describe('sleep', () => {
  it('calculates overnight duration', () => {
    expect(sleepDurationMinutes('23:00', '07:00')).toBe(8 * 60);
    expect(sleepDurationMinutes('22:30', '06:45')).toBe(8 * 60 - 45 + 60);
  });

  it('handles same-calendar-day sleep (nap / after midnight bedtime)', () => {
    expect(sleepDurationMinutes('01:00', '07:30')).toBe(6 * 60 + 30);
  });

  it('returns 0 for identical times', () => {
    expect(sleepDurationMinutes('07:00', '07:00')).toBe(0);
  });

  it('categorizes without diagnosing', () => {
    expect(sleepBand(5 * 60).label).toBe('Short sleep');
    expect(sleepBand(6.5 * 60).label).toBe('Could use more');
    expect(sleepBand(8 * 60).label).toBe('Great');
    expect(sleepBand(10 * 60).label).toBe('Longer than your usual target');
  });

  it('uses encouraging copy', () => {
    expect(sleepEncouragement(5 * 60 + 20)).toMatch(/more rest/i);
    expect(sleepEncouragement(6 * 60 + 20)).toMatch(/closer to your/i);
    expect(sleepEncouragement(8 * 60)).toMatch(/solid/i);
  });
});
