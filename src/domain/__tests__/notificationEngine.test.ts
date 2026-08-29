import { decideNextNotification, notificationLogicalId, type EngineInput } from '../notificationEngine';

function base(partial: Partial<EngineInput> = {}): EngineInput {
  return {
    uid: 'user1',
    prefs: {
      enabled: true,
      reminderMode: 'helpful',
      quietHoursEnabled: true,
      quietHoursStart: '23:00',
      quietHoursEnd: '07:00',
      timezone: 'UTC',
      wakeTime: '07:00',
      breakfastTime: '08:00',
      lunchTime: '13:00',
      dinnerTime: '20:00',
      sleepTime: '23:00',
      waterGoalMl: 2000,
      categories: {},
    },
    today: {
      breakfast: false,
      lunch: false,
      dinner: false,
      waterMl: 0,
      waterRecent: false,
      hygiene: false,
      shower: false,
      mood: false,
      exercise: false,
      sleep: false,
      activity: false,
      focus: false,
    },
    sentIds: [],
    lastOpenedAt: new Date().toISOString(),
    now: new Date('2026-08-30T08:00:00.000Z'),
    inactivityHours: 20,
    minGapMinutes: 50,
    maxOrdinaryPerDay: 6,
    windowMinutes: 18,
    historyDays: 1,
    ...partial,
  };
}

describe('notification engine', () => {
  it('asks about breakfast in the breakfast window', () => {
    const decision = decideNextNotification(base());
    expect(decision?.slot).toBe('breakfast');
    expect(decision?.route).toContain('/meal');
  });

  it('does not ask about breakfast when already logged', () => {
    const decision = decideNextNotification(
      base({
        today: { ...base().today, breakfast: true },
      }),
    );
    expect(decision?.slot).not.toBe('breakfast');
  });

  it('respects quiet hours', () => {
    const decision = decideNextNotification(
      base({
        now: new Date('2026-08-30T23:30:00.000Z'),
      }),
    );
    expect(decision).toBeNull();
  });

  it('does not send a duplicate logical id', () => {
    const first = decideNextNotification(base());
    expect(first).toBeTruthy();
    const again = decideNextNotification(
      base({
        sentIds: [first!.logicalId],
      }),
    );
    expect(again?.logicalId).not.toBe(first!.logicalId);
  });

  it('skips when the category is disabled', () => {
    const decision = decideNextNotification(
      base({
        prefs: {
          ...base().prefs,
          categories: { breakfast: false, breakfastReminder: false },
        },
      }),
    );
    expect(decision?.slot).not.toBe('breakfast');
  });

  it('rate-limits ordinary notifications', () => {
    const decision = decideNextNotification(
      base({
        lastNotificationAt: new Date('2026-08-30T07:30:00.000Z').toISOString(),
      }),
    );
    expect(decision).toBeNull();
  });

  it('builds a stable logical id', () => {
    expect(notificationLogicalId('u', 'lunch', '2026-08-30')).toBe('u_lunch_2026-08-30_lunch');
  });

  it('does not invent weekly comparisons without history', () => {
    const decision = decideNextNotification(
      base({
        now: new Date('2026-08-30T22:40:00.000Z'),
        historyDays: 1,
      }),
    );
    if (decision?.slot === 'daily_summary') {
      expect(decision.body).toContain('few more days');
    }
  });
});
