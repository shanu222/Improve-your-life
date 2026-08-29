import { AppError, MESSAGES, assertOwned } from '../domain/errors';
import { nowIso } from '../domain/ids';
import type {
  AppSettings,
  Badge,
  DailyReportRecord,
  ExportPayload,
  Habit,
  HabitLog,
  LogEntry,
  NotificationPreference,
  Reminder,
  Streak,
  User,
  UserProfile,
  WeeklyReportRecord,
  XpTransaction,
} from '../domain/types';
import type { DailyStore, Snapshot } from './types';
import { emptySnapshot } from './types';

export class MemoryStore implements DailyStore {
  data: Snapshot;

  constructor(
    initial: Snapshot = emptySnapshot(),
    private readonly persist?: (data: Snapshot) => Promise<void>,
  ) {
    this.data = structuredClone(initial);
  }

  private async flush(): Promise<void> {
    if (this.persist) await this.persist(structuredClone(this.data));
  }

  async getUser(id: string): Promise<User | null> {
    return this.data.users.find((u) => u.id === id) ?? null;
  }

  async listUsers(): Promise<User[]> {
    return [...this.data.users];
  }

  async upsertUser(user: User): Promise<void> {
    const i = this.data.users.findIndex((u) => u.id === user.id);
    if (i >= 0) this.data.users[i] = user;
    else this.data.users.push(user);
    await this.flush();
  }

  async getProfile(userId: string): Promise<UserProfile | null> {
    return this.data.profiles.find((p) => p.userId === userId) ?? null;
  }

  async upsertProfile(profile: UserProfile): Promise<void> {
    const i = this.data.profiles.findIndex((p) => p.userId === profile.userId);
    if (i >= 0) this.data.profiles[i] = profile;
    else this.data.profiles.push(profile);
    await this.flush();
  }

  async getSettings(userId: string): Promise<AppSettings | null> {
    return this.data.settings.find((s) => s.userId === userId) ?? null;
  }

  async upsertSettings(settings: AppSettings): Promise<void> {
    const i = this.data.settings.findIndex((s) => s.userId === settings.userId);
    if (i >= 0) this.data.settings[i] = settings;
    else this.data.settings.push(settings);
    await this.flush();
  }

  async getNotificationPref(userId: string): Promise<NotificationPreference | null> {
    return this.data.notificationPrefs.find((p) => p.userId === userId) ?? null;
  }

  async upsertNotificationPref(pref: NotificationPreference): Promise<void> {
    const i = this.data.notificationPrefs.findIndex((p) => p.userId === pref.userId);
    if (i >= 0) this.data.notificationPrefs[i] = pref;
    else this.data.notificationPrefs.push(pref);
    await this.flush();
  }

  async insertEntry(entry: LogEntry): Promise<void> {
    this.data.entries.push(entry);
    await this.flush();
  }

  async updateEntry(userId: string, id: string, patch: Partial<LogEntry>): Promise<LogEntry> {
    const entry = this.data.entries.find((e) => e.id === id);
    if (!entry) throw new AppError(MESSAGES.notFound, 'NOT_FOUND');
    assertOwned(entry.userId, userId);
    Object.assign(entry, patch, { updatedAt: nowIso() });
    await this.flush();
    return entry;
  }

  async getEntry(userId: string, id: string): Promise<LogEntry | null> {
    const entry = this.data.entries.find((e) => e.id === id && !e.deletedAt) ?? null;
    if (entry) assertOwned(entry.userId, userId);
    return entry;
  }

  async getEntriesForDate(userId: string, localDate: string): Promise<LogEntry[]> {
    return this.data.entries
      .filter((e) => e.userId === userId && e.localDate === localDate && !e.deletedAt)
      .sort((a, b) => a.occurredAt.localeCompare(b.occurredAt));
  }

  async getEntriesInRange(userId: string, from: string, to: string): Promise<LogEntry[]> {
    return this.data.entries
      .filter((e) => e.userId === userId && e.localDate >= from && e.localDate <= to && !e.deletedAt)
      .sort((a, b) => a.occurredAt.localeCompare(b.occurredAt));
  }

  async listHabits(userId: string): Promise<Habit[]> {
    return this.data.habits.filter((h) => h.userId === userId);
  }

  async upsertHabit(habit: Habit): Promise<void> {
    const i = this.data.habits.findIndex((h) => h.id === habit.id);
    if (i >= 0) {
      assertOwned(this.data.habits[i]!.userId, habit.userId);
      this.data.habits[i] = habit;
    } else this.data.habits.push(habit);
    await this.flush();
  }

  async deleteHabit(userId: string, id: string): Promise<void> {
    const habit = this.data.habits.find((h) => h.id === id);
    if (!habit) return;
    assertOwned(habit.userId, userId);
    this.data.habits = this.data.habits.filter((h) => h.id !== id);
    this.data.habitLogs = this.data.habitLogs.filter((l) => l.habitId !== id);
    await this.flush();
  }

  async listHabitLogs(userId: string, from: string, to: string): Promise<HabitLog[]> {
    return this.data.habitLogs.filter(
      (l) => l.userId === userId && l.localDate >= from && l.localDate <= to,
    );
  }

  async upsertHabitLog(log: HabitLog): Promise<void> {
    const i = this.data.habitLogs.findIndex((l) => l.habitId === log.habitId && l.localDate === log.localDate);
    if (i >= 0) {
      assertOwned(this.data.habitLogs[i]!.userId, log.userId);
      this.data.habitLogs[i] = log;
    } else this.data.habitLogs.push(log);
    await this.flush();
  }

  async listStreaks(userId: string): Promise<Streak[]> {
    return this.data.streaks.filter((s) => s.userId === userId);
  }

  async upsertStreak(streak: Streak): Promise<void> {
    const i = this.data.streaks.findIndex((s) => s.id === streak.id);
    if (i >= 0) this.data.streaks[i] = streak;
    else this.data.streaks.push(streak);
    await this.flush();
  }

  async listXp(userId: string): Promise<XpTransaction[]> {
    return this.data.xp.filter((x) => x.userId === userId);
  }

  async insertXp(tx: XpTransaction): Promise<void> {
    this.data.xp.push(tx);
    await this.flush();
  }

  async listBadges(userId: string): Promise<Badge[]> {
    return this.data.badges.filter((b) => b.userId === userId);
  }

  async insertBadge(badge: Badge): Promise<void> {
    if (this.data.badges.some((b) => b.userId === badge.userId && b.badgeKey === badge.badgeKey)) return;
    this.data.badges.push(badge);
    await this.flush();
  }

  async listReminders(userId: string): Promise<Reminder[]> {
    return this.data.reminders.filter((r) => r.userId === userId);
  }

  async upsertReminder(reminder: Reminder): Promise<void> {
    const i = this.data.reminders.findIndex((r) => r.id === reminder.id);
    if (i >= 0) this.data.reminders[i] = reminder;
    else this.data.reminders.push(reminder);
    await this.flush();
  }

  async upsertDailyReport(report: DailyReportRecord): Promise<void> {
    const i = this.data.dailyReports.findIndex(
      (r) => r.userId === report.userId && r.localDate === report.localDate,
    );
    if (i >= 0) this.data.dailyReports[i] = report;
    else this.data.dailyReports.push(report);
    await this.flush();
  }

  async getDailyReport(userId: string, localDate: string): Promise<DailyReportRecord | null> {
    return this.data.dailyReports.find((r) => r.userId === userId && r.localDate === localDate) ?? null;
  }

  async upsertWeeklyReport(report: WeeklyReportRecord): Promise<void> {
    const i = this.data.weeklyReports.findIndex(
      (r) => r.userId === report.userId && r.weekStart === report.weekStart,
    );
    if (i >= 0) this.data.weeklyReports[i] = report;
    else this.data.weeklyReports.push(report);
    await this.flush();
  }

  async getWeeklyReport(userId: string, weekStart: string): Promise<WeeklyReportRecord | null> {
    return this.data.weeklyReports.find((r) => r.userId === userId && r.weekStart === weekStart) ?? null;
  }

  async deleteAllUserData(userId: string): Promise<void> {
    const keep = <T extends { userId?: string; id?: string }>(rows: T[], key: 'userId' | 'id' = 'userId') =>
      rows.filter((r) => (key === 'id' ? (r as { id?: string }).id !== userId : r.userId !== userId));
    this.data.users = this.data.users.filter((u) => u.id !== userId);
    this.data.profiles = keep(this.data.profiles);
    this.data.settings = keep(this.data.settings);
    this.data.notificationPrefs = keep(this.data.notificationPrefs);
    this.data.entries = keep(this.data.entries);
    this.data.habits = keep(this.data.habits);
    this.data.habitLogs = keep(this.data.habitLogs);
    this.data.streaks = keep(this.data.streaks);
    this.data.xp = keep(this.data.xp);
    this.data.badges = keep(this.data.badges);
    this.data.reminders = keep(this.data.reminders);
    this.data.dailyReports = keep(this.data.dailyReports);
    this.data.weeklyReports = keep(this.data.weeklyReports);
    await this.flush();
  }

  async exportUserData(userId: string): Promise<ExportPayload> {
    const user = await this.getUser(userId);
    if (!user) throw new AppError(MESSAGES.notFound, 'NOT_FOUND');
    return {
      exportedAt: nowIso(),
      version: 1,
      user,
      profile: await this.getProfile(userId),
      settings: await this.getSettings(userId),
      notificationPreference: await this.getNotificationPref(userId),
      entries: this.data.entries.filter((e) => e.userId === userId),
      habits: this.data.habits.filter((h) => h.userId === userId),
      habitLogs: this.data.habitLogs.filter((h) => h.userId === userId),
      streaks: this.data.streaks.filter((s) => s.userId === userId),
      xpTransactions: this.data.xp.filter((x) => x.userId === userId),
      badges: this.data.badges.filter((b) => b.userId === userId),
      dailyReports: this.data.dailyReports.filter((r) => r.userId === userId),
      weeklyReports: this.data.weeklyReports.filter((r) => r.userId === userId),
    };
  }
}
