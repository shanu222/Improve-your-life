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

export interface DailyStore {
  getUser(id: string): Promise<User | null>;
  listUsers(): Promise<User[]>;
  upsertUser(user: User): Promise<void>;
  getProfile(userId: string): Promise<UserProfile | null>;
  upsertProfile(profile: UserProfile): Promise<void>;
  getSettings(userId: string): Promise<AppSettings | null>;
  upsertSettings(settings: AppSettings): Promise<void>;
  getNotificationPref(userId: string): Promise<NotificationPreference | null>;
  upsertNotificationPref(pref: NotificationPreference): Promise<void>;
  insertEntry(entry: LogEntry): Promise<void>;
  updateEntry(userId: string, id: string, patch: Partial<LogEntry>): Promise<LogEntry>;
  getEntry(userId: string, id: string): Promise<LogEntry | null>;
  getEntriesForDate(userId: string, localDate: string): Promise<LogEntry[]>;
  getEntriesInRange(userId: string, from: string, to: string): Promise<LogEntry[]>;
  listHabits(userId: string): Promise<Habit[]>;
  upsertHabit(habit: Habit): Promise<void>;
  deleteHabit(userId: string, id: string): Promise<void>;
  listHabitLogs(userId: string, from: string, to: string): Promise<HabitLog[]>;
  upsertHabitLog(log: HabitLog): Promise<void>;
  listStreaks(userId: string): Promise<Streak[]>;
  upsertStreak(streak: Streak): Promise<void>;
  listXp(userId: string): Promise<XpTransaction[]>;
  insertXp(tx: XpTransaction): Promise<void>;
  listBadges(userId: string): Promise<Badge[]>;
  insertBadge(badge: Badge): Promise<void>;
  listReminders(userId: string): Promise<Reminder[]>;
  upsertReminder(reminder: Reminder): Promise<void>;
  upsertDailyReport(report: DailyReportRecord): Promise<void>;
  getDailyReport(userId: string, localDate: string): Promise<DailyReportRecord | null>;
  upsertWeeklyReport(report: WeeklyReportRecord): Promise<void>;
  getWeeklyReport(userId: string, weekStart: string): Promise<WeeklyReportRecord | null>;
  deleteAllUserData(userId: string): Promise<void>;
  exportUserData(userId: string): Promise<ExportPayload>;
}

export interface Snapshot {
  users: User[];
  profiles: UserProfile[];
  settings: AppSettings[];
  notificationPrefs: NotificationPreference[];
  entries: LogEntry[];
  habits: Habit[];
  habitLogs: HabitLog[];
  streaks: Streak[];
  xp: XpTransaction[];
  badges: Badge[];
  reminders: Reminder[];
  dailyReports: DailyReportRecord[];
  weeklyReports: WeeklyReportRecord[];
}

export function emptySnapshot(): Snapshot {
  return {
    users: [],
    profiles: [],
    settings: [],
    notificationPrefs: [],
    entries: [],
    habits: [],
    habitLogs: [],
    streaks: [],
    xp: [],
    badges: [],
    reminders: [],
    dailyReports: [],
    weeklyReports: [],
  };
}
