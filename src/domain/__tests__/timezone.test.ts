import { parseTimeToMinutes, getLocalDate, addDays, dateDiffDays, isInQuietHours, greetingForMinutes, startOfWeek, minutesToHHmm } from '../timezone';

describe('timezone', () => {
  it('parses HH:mm', () => {
    expect(parseTimeToMinutes('07:30')).toBe(450);
    expect(parseTimeToMinutes('23:00')).toBe(1380);
    expect(parseTimeToMinutes('not-a-time')).toBe(0);
  });

  it('formats minutes back to HH:mm', () => {
    expect(minutesToHHmm(450)).toBe('07:30');
    expect(minutesToHHmm(0)).toBe('00:00');
  });

  it('computes local date in a timezone rather than UTC', () => {
    const utcMorning = new Date('2026-08-29T01:30:00.000Z');
    expect(getLocalDate(utcMorning, 'UTC')).toBe('2026-08-29');
    expect(getLocalDate(utcMorning, 'Asia/Karachi')).toBe('2026-08-29');
    const utcLate = new Date('2026-08-29T20:30:00.000Z');
    expect(getLocalDate(utcLate, 'UTC')).toBe('2026-08-29');
    expect(getLocalDate(utcLate, 'Pacific/Auckland')).toBe('2026-08-30');
  });

  it('handles midnight boundary in UTC+5', () => {
    const justBefore = new Date('2026-08-28T18:59:00.000Z');
    const justAfter = new Date('2026-08-28T19:01:00.000Z');
    expect(getLocalDate(justBefore, 'Asia/Karachi')).toBe('2026-08-28');
    expect(getLocalDate(justAfter, 'Asia/Karachi')).toBe('2026-08-29');
  });

  it('adds days across month ends', () => {
    expect(addDays('2026-01-31', 1)).toBe('2026-02-01');
    expect(addDays('2026-08-29', -1)).toBe('2026-08-28');
  });

  it('diffs dates', () => {
    expect(dateDiffDays('2026-08-29', '2026-08-30')).toBe(1);
  });

  it('detects quiet hours wrapping midnight', () => {
    expect(isInQuietHours(23 * 60, '22:30', '07:00')).toBe(true);
    expect(isInQuietHours(8 * 60, '22:30', '07:00')).toBe(false);
    expect(isInQuietHours(6 * 60, '22:30', '07:00')).toBe(true);
  });

  it('greets by local minutes', () => {
    expect(greetingForMinutes(9 * 60)).toBe('morning');
    expect(greetingForMinutes(13 * 60)).toBe('afternoon');
    expect(greetingForMinutes(20 * 60)).toBe('evening');
  });

  it('starts week on Monday', () => {
    expect(startOfWeek('2026-08-29')).toBe('2026-08-24');
  });
});
