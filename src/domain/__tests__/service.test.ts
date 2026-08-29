import { DailyService } from '../../api/dailyService';
import { MemoryStore } from '../../db/memoryStore';
import { AppError, resetRateLimits } from '../errors';
import { addDays, getLocalDate } from '../timezone';

function service(now = new Date('2026-08-29T10:00:00.000Z')) {
  return new DailyService(new MemoryStore(), () => now);
}

describe('DailyService', () => {
  beforeEach(() => resetRateLimits());

  it('bootstraps a local user without forcing an account', async () => {
    const api = service();
    const { user, profile } = await api.bootstrap();
    expect(user.authProvider).toBe('local');
    expect(profile.onboardingComplete).toBe(false);
    expect(user.email).toBeUndefined();
  });

  it('tracks water with multiple taps and never loses entries', async () => {
    const api = service();
    const { user } = await api.bootstrap();
    await api.logWater(user.id, 250);
    await api.logWater(user.id, 250);
    const today = await api.todaySnapshot(user.id);
    expect(today.waterMl).toBe(500);
    expect(today.entries.filter((e) => e.type === 'water')).toHaveLength(2);
  });

  it('prevents a user from editing another user entry', async () => {
    const store = new MemoryStore();
    const api = new DailyService(store, () => new Date('2026-08-29T10:00:00.000Z'));
    const a = await api.bootstrap();
    const water = await api.logWater(a.user.id, 250);
    await expect(api.editEntry('someone-else', water.id, { ml: 999 })).rejects.toBeInstanceOf(AppError);
    await expect(api.deleteEntry('someone-else', water.id)).rejects.toBeInstanceOf(AppError);
  });

  it('does not leak another user entries in queries', async () => {
    const store = new MemoryStore();
    const now = new Date('2026-08-29T10:00:00.000Z');
    const api = new DailyService(store, () => now);
    const a = await api.bootstrap();
    await api.logWater(a.user.id, 250);
    const b = {
      id: 'user-b',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      authProvider: 'local' as const,
    };
    await store.upsertUser(b);
    await store.upsertProfile({ ...(await store.getProfile(a.user.id))!, userId: b.id });
    const rows = await api.range(b.id, '2026-08-29', '2026-08-29');
    expect(rows).toEqual([]);
  });

  it('calculates sleep across midnight', async () => {
    const api = service();
    const { user } = await api.bootstrap();
    const entry = await api.logSleep(user.id, '23:00', '07:12');
    expect(entry.payload.minutes).toBe(8 * 60 + 12);
  });

  it('estimates meals', async () => {
    const api = service();
    const { user } = await api.bootstrap();
    const meal = await api.logMeal(user.id, 'breakfast', '2 eggs, 2 roti and tea');
    const estimate = meal.payload.estimate as { isEstimate: boolean; calories: number };
    expect(estimate.isEstimate).toBe(true);
    expect(estimate.calories).toBeGreaterThan(0);
  });

  it('tracks custom habits', async () => {
    const api = service();
    const { user } = await api.bootstrap();
    const habit = await api.upsertHabit(user.id, {
      name: 'Practice coding',
      icon: '💻',
      color: '#7C6BF0',
      goal: '1 hour',
      frequency: 'daily',
      enabled: true,
      isCustom: true,
    });
    const date = getLocalDate(new Date('2026-08-29T10:00:00.000Z'), 'UTC');
    await api.toggleHabit(user.id, habit.id, date, true);
    const today = await api.todaySnapshot(user.id);
    expect(today.habitLogs.some((l) => l.habitId === habit.id && l.completed)).toBe(true);
  });

  it('exports and deletes only the owner data', async () => {
    const api = service();
    const { user } = await api.bootstrap();
    await api.logWater(user.id, 250);
    const exported = await api.exportData(user.id);
    expect(exported.entries).toHaveLength(1);
    expect(exported.user.id).toBe(user.id);
    await api.deleteAllData(user.id);
    await expect(api.exportData(user.id)).rejects.toBeInstanceOf(AppError);
  });

  it('assigns entries to the user local date, not UTC', async () => {
    const now = new Date('2026-08-28T19:30:00.000Z');
    const api = new DailyService(new MemoryStore(), () => now);
    const { user, profile } = await api.bootstrap();
    await api.updateProfile(user.id, { timezone: 'Asia/Karachi' });
    const entry = await api.logWater(user.id, 250);
    expect(entry.localDate).toBe('2026-08-29');
    expect(profile).toBeTruthy();
  });

  it('builds reports from logged data', async () => {
    const api = service();
    const { user } = await api.bootstrap();
    await api.logWater(user.id, 2000);
    await api.logExercise(user.id, 'walk', 20);
    const daily = await api.generateDailyReport(user.id);
    expect(daily.score).toBeGreaterThan(0);
    expect(daily.closer).toMatch(/better choice/i);
    const weekly = await api.generateWeeklyReport(user.id);
    expect(weekly.exerciseDays).toBeGreaterThanOrEqual(1);
  });

  it('soft-deletes entries so edits do not leave duplicates', async () => {
    const api = service();
    const { user } = await api.bootstrap();
    const row = await api.logWater(user.id, 250);
    await api.deleteEntry(user.id, row.id);
    const today = await api.todaySnapshot(user.id);
    expect(today.waterMl).toBe(0);
  });
});

describe('date helpers used by reports', () => {
  it('walks a week without gaps', () => {
    expect(addDays('2026-08-24', 6)).toBe('2026-08-30');
  });
});
