import { authConflictMessage, generateVerificationCode, verificationCodeValid } from '../authConflicts';
import { compareMetric, totalsFromEntries } from '../comparison';
import { stripImageFromPayload } from '../foodVision';
import { noteResponse } from '../notesSafety';
import { coachForNowText, moodSupport } from '../nowActivity';
import { reminderCategory, shouldFireReminder } from '../reminders';
import { defaultProfile } from '../defaults';
import { xpForEntry } from '../xp';
import { DailyService } from '../../api/dailyService';
import { MemoryStore } from '../../db/memoryStore';
import type { LogEntry, ScheduledReminder } from '../types';

describe('auth conflicts', () => {
  it('directs Google-only emails to Google Sign In', () => {
    expect(authConflictMessage('a@b.com', ['google.com'])).toMatch(/Google Sign In/);
  });

  it('directs password-only emails to email and password', () => {
    expect(authConflictMessage('a@b.com', ['password'])).toMatch(/email and password/);
  });

  it('allows verification codes before expiry only', () => {
    const { code, expiresAt } = generateVerificationCode(() => 0.123456, 1_000);
    expect(verificationCodeValid(code, code, expiresAt, 1_000)).toBe(true);
    expect(verificationCodeValid(code, code, expiresAt, expiresAt + 1)).toBe(false);
    expect(verificationCodeValid('000000', code, expiresAt, 1_000)).toBe(false);
  });
});

describe('comparison and vision privacy', () => {
  it('describes water improvements without medical claims', () => {
    expect(compareMetric('Water', '💧', 2100, 1400, 'ml')).toMatch(/700/);
  });

  it('never keeps photo bytes in stored payloads', () => {
    const cleaned = stripImageFromPayload({ text: 'biryani', image: 'abc', photo: 'x', base64: 'y' });
    expect(cleaned).toEqual({ text: 'biryani' });
  });

  it('builds day totals from entries', () => {
    const entries: LogEntry[] = [
      {
        id: '1',
        userId: 'u',
        type: 'water',
        payload: { ml: 500 },
        occurredAt: 't',
        localDate: '2026-08-29',
        createdAt: 't',
        updatedAt: 't',
      },
    ];
    expect(totalsFromEntries('2026-08-29', entries).waterMl).toBe(500);
  });
});

describe('notes, mood, and now', () => {
  it('does not diagnose and flags urgent language', () => {
    const mild = noteResponse('I have irritation.');
    expect(mild.urgent).toBe(false);
    expect(mild.reply).toMatch(/can't diagnose/i);
    const urgent = noteResponse('I have chest pain');
    expect(urgent.urgent).toBe(true);
  });

  it('offers a short focus when the user feels stuck', () => {
    const reply = coachForNowText("I'm working on my project but I don't feel like working.");
    expect(reply.offerFocus).toBe(true);
    expect(reply.reply).toMatch(/10 minutes/);
  });

  it('supports irritated mood without diagnosing', () => {
    expect(moodSupport('irritated')).toMatch(/qualified professional/);
  });
});

describe('reminders categories and xp', () => {
  it('skips a category the user turned off', () => {
    const reminder: ScheduledReminder = {
      type: 'breakfast',
      minutesFromMidnight: 8 * 60,
      title: 'b',
      body: '',
      skipIf: ['meal'],
    };
    const fire = shouldFireReminder({
      reminder,
      entries: [],
      profile: defaultProfile('u1'),
      currentMinutes: 8 * 60,
      quietStart: '22:30',
      quietEnd: '07:00',
      enabled: true,
      disabledTypes: [],
      alreadyFiredToday: false,
      categories: { breakfast: false },
    });
    expect(fire).toBe(false);
    expect(reminderCategory('water_afternoon')).toBe('water');
  });

  it('never awards xp for alcohol or smoking', () => {
    const profile = defaultProfile('u1');
    const alcohol: LogEntry = {
      id: 'a',
      userId: 'u1',
      type: 'alcohol',
      payload: { drinks: 1 },
      occurredAt: 't',
      localDate: '2026-08-29',
      createdAt: 't',
      updatedAt: 't',
    };
    expect(xpForEntry(alcohol, profile, [])).toBeNull();
  });
});

describe('meal estimates', () => {
  it('saves edited estimates without any image field', async () => {
    const api = new DailyService(new MemoryStore(), () => new Date('2026-08-29T10:00:00.000Z'));
    const { user } = await api.bootstrap();
    const meal = await api.logMealEstimate(user.id, 'lunch', 'chicken biryani', {
      calories: 620,
      proteinG: 28,
      image: 'should-not-keep',
      photo: 'nope',
    });
    const estimate = meal.payload.estimate as Record<string, unknown>;
    expect(estimate.image).toBeUndefined();
    expect(estimate.photo).toBeUndefined();
    expect(estimate.isEstimate).toBe(true);
    expect(estimate.calories).toBe(620);
  });
});
