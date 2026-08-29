import { buildCoachAdvice } from '../domain/coach';
import {
  createLocalUser,
  defaultHabits,
  defaultNotificationPref,
  defaultProfile,
  defaultSettings,
} from '../domain/defaults';
import { AppError, MESSAGES, assertOwned, rateLimit, sanitizeText } from '../domain/errors';
import { createId, nowIso } from '../domain/ids';
import { detectInsights } from '../domain/insights';
import { parseMeal } from '../domain/mealParser';
import { estimateExerciseCalories } from '../domain/nutrition';
import { buildReminderPlan, reminderCategory } from '../domain/reminders';
import { buildDailyReport, buildWeeklyReport } from '../domain/reports';
import {
  computeDailyScore,
  countType,
  caffeineMg,
  hygieneKinds,
  latestMoodScore,
  mealsByKind,
  movementMinutes,
  sleepMinutesForDay,
  smokingCount,
  sumWaterMl,
} from '../domain/scoring';
import { sleepDurationMinutes } from '../domain/sleep';
import { STREAK_KINDS, applyStreakDay, dayCompletesStreak } from '../domain/streaks';
import { addDays, getLocalDate, startOfWeek } from '../domain/timezone';
import type {
  AppSettings,
  CaffeineKind,
  EntryType,
  ExerciseKind,
  ExportPayload,
  Habit,
  HygieneKind,
  LogEntry,
  MealKind,
  MoodKey,
  NotificationPreference,
  Streak,
  User,
  UserProfile,
} from '../domain/types';
import { GLASS_ML, MOOD_OPTIONS } from '../domain/types';
import { newlyEarnedBadges, totalXp, xpForEntry } from '../domain/xp';
import type { DailyStore } from '../db/types';

export class DailyService {
  constructor(
    private readonly store: DailyStore,
    private readonly clock: () => Date = () => new Date(),
  ) {}

  async bootstrap(): Promise<{ user: User; profile: UserProfile; settings: AppSettings }> {
    const users = await this.store.listUsers();
    let user = users[0];
    if (!user) {
      user = createLocalUser();
      await this.store.upsertUser(user);
    }
    let profile = await this.store.getProfile(user.id);
    if (!profile) {
      profile = defaultProfile(user.id);
      await this.store.upsertProfile(profile);
    }
    let settings = await this.store.getSettings(user.id);
    if (!settings) {
      settings = defaultSettings(user.id);
      await this.store.upsertSettings(settings);
    }
    let notif = await this.store.getNotificationPref(user.id);
    if (!notif) {
      notif = defaultNotificationPref(user.id);
      await this.store.upsertNotificationPref(notif);
    }
    const habits = await this.store.listHabits(user.id);
    if (habits.length === 0) {
      for (const habit of defaultHabits(user.id)) {
        await this.store.upsertHabit(habit);
      }
    }
    const streaks = await this.store.listStreaks(user.id);
    if (streaks.length === 0) {
      for (const kind of STREAK_KINDS) {
        await this.store.upsertStreak({
          id: createId(),
          userId: user.id,
          kind,
          currentCount: 0,
          bestCount: 0,
          enabled: true,
        });
      }
    }
    return { user, profile, settings };
  }

  async completeOnboarding(
    userId: string,
    patch: Partial<UserProfile> & { name?: string },
  ): Promise<UserProfile> {
    const profile = await this.requireProfile(userId);
    const next: UserProfile = {
      ...profile,
      ...patch,
      name: sanitizeText(patch.name ?? profile.name, 40),
      onboardingComplete: true,
      updatedAt: nowIso(this.clock()),
    };
    await this.store.upsertProfile(next);
    return next;
  }

  async updateProfile(userId: string, patch: Partial<UserProfile>): Promise<UserProfile> {
    const profile = await this.requireProfile(userId);
    const next = { ...profile, ...patch, userId, updatedAt: nowIso(this.clock()) };
    if (patch.name !== undefined) next.name = sanitizeText(patch.name, 40);
    await this.store.upsertProfile(next);
    return next;
  }

  async updateSettings(userId: string, patch: Partial<AppSettings>): Promise<AppSettings> {
    const current = (await this.store.getSettings(userId)) ?? defaultSettings(userId);
    const next = { ...current, ...patch, userId };
    await this.store.upsertSettings(next);
    return next;
  }

  async updateNotifications(
    userId: string,
    patch: Partial<NotificationPreference>,
  ): Promise<NotificationPreference> {
    const defaults = defaultNotificationPref(userId);
    const current = (await this.store.getNotificationPref(userId)) ?? defaults;
    const next = {
      ...defaults,
      ...current,
      ...patch,
      userId,
      categories: { ...defaults.categories, ...current.categories, ...patch.categories },
    };
    await this.store.upsertNotificationPref(next);
    return next;
  }

  async logEntry(
    userId: string,
    type: EntryType,
    payload: Record<string, unknown>,
    occurredAt?: Date,
  ): Promise<LogEntry> {
    const profile = await this.requireProfile(userId);
    const when = occurredAt ?? this.clock();
    const entry: LogEntry = {
      id: createId(),
      userId,
      type,
      payload,
      occurredAt: when.toISOString(),
      localDate: getLocalDate(when, profile.timezone),
      createdAt: nowIso(when),
      updatedAt: nowIso(when),
    };
    await this.store.insertEntry(entry);
    await this.afterLog(userId, entry);
    return entry;
  }

  async logWater(userId: string, ml: number): Promise<LogEntry> {
    const amount = Math.max(50, Math.min(2000, Math.round(ml)));
    return this.logEntry(userId, 'water', { ml: amount });
  }

  async logSleep(userId: string, sleepTime: string, wakeTime: string): Promise<LogEntry> {
    const minutes = sleepDurationMinutes(sleepTime, wakeTime);
    return this.logEntry(userId, 'sleep', { sleepTime, wakeTime, minutes });
  }

  async logMeal(userId: string, kind: MealKind, text: string): Promise<LogEntry> {
    const cleaned = sanitizeText(text, 400);
    if (!cleaned) throw new AppError('Add a few words about what you ate.', 'VALIDATION');
    const estimate = parseMeal(cleaned);
    return this.logEntry(userId, 'meal', { kind, text: cleaned, estimate });
  }

  async logExercise(userId: string, kind: ExerciseKind, minutes: number, label?: string): Promise<LogEntry> {
    const mins = Math.max(1, Math.min(180, Math.round(minutes)));
    const profile = await this.requireProfile(userId);
    const caloriesEstimate = estimateExerciseCalories(kind, mins, profile.weightKg ?? 70);
    return this.logEntry(userId, 'exercise', { kind, minutes: mins, caloriesEstimate, label });
  }

  async logMood(userId: string, key: MoodKey, note?: string): Promise<LogEntry> {
    const option = MOOD_OPTIONS.find((m) => m.key === key);
    if (!option) throw new AppError(MESSAGES.validation, 'VALIDATION');
    return this.logEntry(userId, 'mood', {
      key,
      score: option.score,
      note: note ? sanitizeText(note, 240) : undefined,
    });
  }

  async logSmoking(userId: string, count = 1): Promise<LogEntry> {
    return this.logEntry(userId, 'smoking', { count: Math.max(1, Math.min(5, count)) });
  }

  async logCaffeine(userId: string, kind: CaffeineKind, servings = 1): Promise<LogEntry> {
    const mgMap: Record<CaffeineKind, number> = { coffee: 95, tea: 40, energy: 80, other: 50 };
    const servingsClamped = Math.max(0.5, Math.min(4, servings));
    return this.logEntry(userId, 'caffeine', {
      kind,
      servings: servingsClamped,
      mgEstimate: Math.round(mgMap[kind] * servingsClamped),
    });
  }

  async logHygiene(userId: string, kind: HygieneKind): Promise<LogEntry> {
    return this.logEntry(userId, 'hygiene', { kind });
  }

  async logSimple(userId: string, type: 'fruit' | 'vegetables' | 'junk' | 'sugary' | 'read' | 'relax'): Promise<LogEntry> {
    return this.logEntry(userId, type, { count: 1 });
  }

  async logScreen(userId: string, minutes: number): Promise<LogEntry> {
    return this.logEntry(userId, 'screen', { minutes: Math.max(1, Math.min(24 * 60, minutes)), source: 'manual' });
  }

  async logBreak(userId: string, action: 'start' | 'complete', minutes?: number): Promise<LogEntry> {
    return this.logEntry(userId, 'break', { action, minutes });
  }

  async logAlcohol(userId: string, drinks = 1): Promise<LogEntry> {
    return this.logEntry(userId, 'alcohol', { drinks: Math.max(1, Math.min(8, drinks)) });
  }

  async logNote(userId: string, text: string): Promise<LogEntry> {
    const cleaned = sanitizeText(text, 500);
    if (!cleaned) throw new AppError('Add a short note.', 'VALIDATION');
    return this.logEntry(userId, 'note', { text: cleaned });
  }

  async logActivity(userId: string, activity: string, description?: string): Promise<LogEntry> {
    return this.logEntry(userId, 'activity', {
      activity: sanitizeText(activity, 40),
      description: description ? sanitizeText(description, 400) : undefined,
    });
  }

  async logFocus(
    userId: string,
    payload: { title: string; duration: number; status?: string; action: 'start' | 'complete' },
  ): Promise<LogEntry> {
    return this.logEntry(userId, 'focus', {
      title: sanitizeText(payload.title, 80),
      duration: Math.max(5, Math.min(90, payload.duration)),
      status: payload.status,
      action: payload.action,
    });
  }

  async logWeather(
    userId: string,
    payload: { celsius?: number; condition?: string; feelingHot?: boolean },
  ): Promise<LogEntry> {
    return this.logEntry(userId, 'weather', payload);
  }

  async logMealEstimate(
    userId: string,
    kind: MealKind,
    text: string,
    estimate: Record<string, unknown>,
  ): Promise<LogEntry> {
    const cleaned = sanitizeText(text, 400);
    if (!cleaned) throw new AppError('Add a few words about what you ate.', 'VALIDATION');
    const safe = { ...estimate };
    delete safe.image;
    delete safe.base64;
    delete safe.photo;
    return this.logEntry(userId, 'meal', { kind, text: cleaned, estimate: { ...safe, isEstimate: true } });
  }

  async editEntry(userId: string, id: string, payload: Record<string, unknown>): Promise<LogEntry> {
    const existing = await this.store.getEntry(userId, id);
    if (!existing) throw new AppError(MESSAGES.notFound, 'NOT_FOUND');
    assertOwned(existing.userId, userId);
    return this.store.updateEntry(userId, id, { payload });
  }

  async deleteEntry(userId: string, id: string): Promise<void> {
    const existing = await this.store.getEntry(userId, id);
    if (!existing) throw new AppError(MESSAGES.notFound, 'NOT_FOUND');
    assertOwned(existing.userId, userId);
    await this.store.updateEntry(userId, id, { deletedAt: nowIso(this.clock()) });
  }

  async todaySnapshot(userId: string) {
    const profile = await this.requireProfile(userId);
    const localDate = getLocalDate(this.clock(), profile.timezone);
    const entries = await this.store.getEntriesForDate(userId, localDate);
    const scored = computeDailyScore(entries, profile);
    const xp = await this.store.listXp(userId);
    const streaks = await this.store.listStreaks(userId);
    const badges = await this.store.listBadges(userId);
    const habits = await this.store.listHabits(userId);
    const habitLogs = await this.store.listHabitLogs(userId, localDate, localDate);
    const coach = buildCoachAdvice(entries, profile, this.clock());
    return {
      localDate,
      entries,
      scored,
      waterMl: sumWaterMl(entries),
      sleepMinutes: sleepMinutesForDay(entries),
      movementMinutes: movementMinutes(entries),
      mood: latestMoodScore(entries),
      smoking: smokingCount(entries),
      caffeineMg: caffeineMg(entries),
      meals: mealsByKind(entries),
      hygiene: hygieneKinds(entries),
      fruit: countType(entries, 'fruit'),
      vegetables: countType(entries, 'vegetables'),
      xpTotal: totalXp(xp),
      streaks,
      badges,
      habits,
      habitLogs,
      coach,
    };
  }

  async range(userId: string, from: string, to: string) {
    await this.requireProfile(userId);
    return this.store.getEntriesInRange(userId, from, to);
  }

  async generateDailyReport(userId: string, localDate?: string) {
    const profile = await this.requireProfile(userId);
    const date = localDate ?? getLocalDate(this.clock(), profile.timezone);
    const entries = await this.store.getEntriesForDate(userId, date);
    const payload = buildDailyReport(date, entries, profile);
    await this.store.upsertDailyReport({
      id: createId(),
      userId,
      localDate: date,
      score: payload.score,
      payload,
      createdAt: nowIso(this.clock()),
    });
    return payload;
  }

  async generateWeeklyReport(userId: string, weekStart?: string) {
    const profile = await this.requireProfile(userId);
    const today = getLocalDate(this.clock(), profile.timezone);
    const start = weekStart ?? startOfWeek(today);
    const end = addDays(start, 6);
    const entries = await this.store.getEntriesInRange(userId, start, end);
    const byDay: { date: string; entries: LogEntry[] }[] = [];
    for (let i = 0; i < 7; i += 1) {
      const date = addDays(start, i);
      byDay.push({ date, entries: entries.filter((e) => e.localDate === date) });
    }
    const payload = buildWeeklyReport(start, byDay, profile);
    await this.store.upsertWeeklyReport({
      id: createId(),
      userId,
      weekStart: start,
      payload,
      createdAt: nowIso(this.clock()),
    });
    return payload;
  }

  async insights(userId: string) {
    const profile = await this.requireProfile(userId);
    const today = getLocalDate(this.clock(), profile.timezone);
    const from = addDays(today, -27);
    const entries = await this.store.getEntriesInRange(userId, from, today);
    const dates = new Set(entries.map((e) => e.localDate));
    const days = [...dates].sort().map((date) => ({
      date,
      entries: entries.filter((e) => e.localDate === date),
    }));
    return detectInsights(days);
  }

  async upsertHabit(
    userId: string,
    habit: Partial<Habit> & { name: string; frequency: Habit['frequency']; enabled: boolean; isCustom: boolean },
  ) {
    const existing = habit.id ? (await this.store.listHabits(userId)).find((h) => h.id === habit.id) : undefined;
    if (existing) assertOwned(existing.userId, userId);
    const now = nowIso(this.clock());
    const row: Habit = {
      id: habit.id ?? createId(),
      userId,
      name: sanitizeText(habit.name, 40),
      icon: habit.icon || '⭐',
      color: habit.color || '#F5C518',
      goal: sanitizeText(habit.goal || 'Daily', 40),
      frequency: habit.frequency,
      reminderTime: habit.reminderTime,
      enabled: habit.enabled,
      isCustom: habit.isCustom,
      kind: habit.kind,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };
    await this.store.upsertHabit(row);
    return row;
  }

  async toggleHabit(userId: string, habitId: string, localDate: string, completed: boolean) {
    const habits = await this.store.listHabits(userId);
    const habit = habits.find((h) => h.id === habitId);
    if (!habit) throw new AppError(MESSAGES.notFound, 'NOT_FOUND');
    assertOwned(habit.userId, userId);
    await this.store.upsertHabitLog({
      id: createId(),
      habitId,
      userId,
      localDate,
      completed,
      occurredAt: nowIso(this.clock()),
    });
    if (completed) {
      await this.logEntry(userId, 'custom', { habitId, name: habit.name });
    }
  }

  async reminderPlan(userId: string) {
    const profile = await this.requireProfile(userId);
    const pref = (await this.store.getNotificationPref(userId)) ?? defaultNotificationPref(userId);
    return buildReminderPlan(profile, pref.reminderMode).filter((reminder) => {
      const category = reminderCategory(reminder.type);
      if (category in pref.categories) {
        return pref.categories[category as keyof typeof pref.categories] !== false;
      }
      return true;
    });
  }

  async linkCloudAccount(
    userId: string,
    patch: { firebaseUid?: string; email?: string; authProvider: 'google' | 'password' | 'local'; emailVerified?: boolean },
  ): Promise<User> {
    const user = await this.store.getUser(userId);
    if (!user) throw new AppError(MESSAGES.notFound, 'NOT_FOUND');
    const next: User = {
      ...user,
      firebaseUid: patch.firebaseUid || undefined,
      email: patch.email ?? user.email,
      authProvider: patch.authProvider,
      emailVerified: patch.emailVerified,
      updatedAt: nowIso(this.clock()),
    };
    await this.store.upsertUser(next);
    return next;
  }

  async exportData(userId: string): Promise<ExportPayload> {
    rateLimit(`export:${userId}`, 5, 60_000);
    await this.requireProfile(userId);
    return this.store.exportUserData(userId);
  }

  async deleteAllData(userId: string): Promise<void> {
    rateLimit(`delete:${userId}`, 2, 60_000);
    await this.requireProfile(userId);
    await this.store.deleteAllUserData(userId);
  }

  async setEmail(userId: string, email: string): Promise<User> {
    const user = await this.store.getUser(userId);
    if (!user) throw new AppError(MESSAGES.notFound, 'NOT_FOUND');
    const cleaned = sanitizeText(email, 80).toLowerCase();
    if (cleaned && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleaned)) {
      throw new AppError('Please enter a valid email.', 'VALIDATION');
    }
    const next = { ...user, email: cleaned || undefined, updatedAt: nowIso(this.clock()) };
    await this.store.upsertUser(next);
    return next;
  }

  private async requireProfile(userId: string): Promise<UserProfile> {
    const profile = await this.store.getProfile(userId);
    if (!profile) throw new AppError(MESSAGES.notFound, 'NOT_FOUND');
    assertOwned(profile.userId, userId);
    return profile;
  }

  private async afterLog(userId: string, entry: LogEntry): Promise<void> {
    const profile = await this.requireProfile(userId);
    const entries = await this.store.getEntriesForDate(userId, entry.localDate);
    const xpToday = (await this.store.listXp(userId)).filter((x) => x.localDate === entry.localDate);
    const award = xpForEntry(entry, profile, xpToday);
    if (award) {
      await this.store.insertXp({
        id: createId(),
        userId,
        amount: award.amount,
        reason: award.reason,
        source: award.source,
        localDate: entry.localDate,
        createdAt: nowIso(this.clock()),
      });
    }

    const settings = await this.store.getSettings(userId);
    if (settings?.streaksEnabled !== false) {
      const streaks = await this.store.listStreaks(userId);
      for (const streak of streaks) {
        if (!STREAK_KINDS.includes(streak.kind as (typeof STREAK_KINDS)[number])) continue;
        const completed = dayCompletesStreak(streak.kind as (typeof STREAK_KINDS)[number], entries, profile);
        const next = applyStreakDay(streak, entry.localDate, completed);
        await this.store.upsertStreak(next);
      }
    }

    const allEntries = await this.store.getEntriesInRange(userId, addDays(entry.localDate, -40), entry.localDate);
    const streaks = await this.store.listStreaks(userId);
    const owned = new Set((await this.store.listBadges(userId)).map((b) => b.badgeKey));
    const exerciseDays = new Set(allEntries.filter((e) => e.type === 'exercise').map((e) => e.localDate)).size;
    const readingDays = new Set(allEntries.filter((e) => e.type === 'read').map((e) => e.localDate)).size;
    const fresh = newlyEarnedBadges({
      totalEntries: allEntries.length,
      streaks,
      exerciseDays,
      readingDays,
      owned,
    });
    for (const badge of fresh) {
      await this.store.insertBadge({
        id: createId(),
        userId,
        badgeKey: badge.key,
        earnedAt: nowIso(this.clock()),
      });
    }
  }
}

export { GLASS_ML };
export type { Streak };
