import { buildReminderPlan, shouldFireReminder } from '../reminders';
import { defaultProfile } from '../defaults';
import type { LogEntry, ScheduledReminder } from '../types';

const profile = defaultProfile('u1', {
  timezone: 'UTC',
  wakeTime: '07:00',
  breakfastTime: '08:00',
  lunchTime: '13:30',
  dinnerTime: '20:00',
  sleepTime: '23:00',
  reminderMode: 'helpful',
});

const waterReminder: ScheduledReminder = {
  type: 'water_mid_morning',
  minutesFromMidnight: 9 * 60 + 30,
  title: 'water',
  body: '',
  skipIf: 'water_goal',
};

describe('reminders', () => {
  it('builds fewer reminders in minimal mode', () => {
    const min = buildReminderPlan(profile, 'minimal');
    const bal = buildReminderPlan(profile, 'balanced');
    const help = buildReminderPlan(profile, 'helpful');
    expect(min.length).toBeLessThan(bal.length);
    expect(bal.length).toBeLessThanOrEqual(help.length);
  });

  it('does not fire when already completed', () => {
    const entries: LogEntry[] = [
      {
        id: 'w',
        userId: 'u1',
        type: 'water',
        payload: { ml: 2000 },
        occurredAt: 't',
        localDate: '2026-08-29',
        createdAt: 't',
        updatedAt: 't',
      },
    ];
    const fire = shouldFireReminder({
      reminder: waterReminder,
      entries,
      profile,
      currentMinutes: 9 * 60 + 30,
      quietStart: '22:30',
      quietEnd: '07:00',
      enabled: true,
      disabledTypes: [],
      alreadyFiredToday: false,
    });
    expect(fire).toBe(false);
  });

  it('does not duplicate after already firing', () => {
    const fire = shouldFireReminder({
      reminder: waterReminder,
      entries: [],
      profile,
      currentMinutes: 9 * 60 + 30,
      quietStart: '22:30',
      quietEnd: '07:00',
      enabled: true,
      disabledTypes: [],
      alreadyFiredToday: true,
    });
    expect(fire).toBe(false);
  });

  it('respects quiet hours and disabled types', () => {
    const quiet = shouldFireReminder({
      reminder: { ...waterReminder, minutesFromMidnight: 23 * 60 },
      entries: [],
      profile,
      currentMinutes: 23 * 60,
      quietStart: '22:30',
      quietEnd: '07:00',
      enabled: true,
      disabledTypes: [],
      alreadyFiredToday: false,
    });
    expect(quiet).toBe(false);

    const disabled = shouldFireReminder({
      reminder: waterReminder,
      entries: [],
      profile,
      currentMinutes: 9 * 60 + 30,
      quietStart: '22:30',
      quietEnd: '07:00',
      enabled: true,
      disabledTypes: ['water_mid_morning'],
      alreadyFiredToday: false,
    });
    expect(disabled).toBe(false);
  });
});
