export type ReminderMode = 'minimal' | 'balanced' | 'helpful';
export type ThemePreference = 'system' | 'light' | 'dark';
export type Units = 'metric' | 'imperial';
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active';
export type Gender = 'female' | 'male' | 'nonbinary' | 'unspecified';

export type FocusArea =
  | 'sleep'
  | 'nutrition'
  | 'hydration'
  | 'exercise'
  | 'personal_care'
  | 'stress'
  | 'smoking'
  | 'screen_time'
  | 'productivity'
  | 'general';

export type EntryType =
  | 'water'
  | 'sleep'
  | 'wake'
  | 'meal'
  | 'exercise'
  | 'mood'
  | 'smoking'
  | 'caffeine'
  | 'hygiene'
  | 'screen'
  | 'break'
  | 'fruit'
  | 'vegetables'
  | 'junk'
  | 'sugary'
  | 'read'
  | 'relax'
  | 'custom'
  | 'wind_down'
  | 'alcohol'
  | 'weather'
  | 'note'
  | 'activity'
  | 'focus';

export type MealKind = 'breakfast' | 'lunch' | 'dinner' | 'snack';
export type HygieneKind = 'brush' | 'bath' | 'face' | 'hands' | 'skincare' | 'grooming' | 'clothes';
export type ExerciseKind = 'walk' | 'run' | 'gym' | 'cycle' | 'sports' | 'stretch' | 'custom';
export type CaffeineKind = 'coffee' | 'tea' | 'energy' | 'other';
export type MoodKey = 'great' | 'good' | 'okay' | 'low' | 'stressed' | 'tired' | 'irritated';

export type StatusTone = 'good' | 'almost' | 'attention' | 'neutral';

export interface User {
  id: string;
  createdAt: string;
  updatedAt: string;
  email?: string;
  authProvider: 'local' | 'google' | 'password';
  firebaseUid?: string;
  emailVerified?: boolean;
}

export interface UserProfile {
  userId: string;
  name: string;
  age?: number;
  gender?: Gender;
  heightCm?: number;
  weightKg?: number;
  activityLevel: ActivityLevel;
  timezone: string;
  onboardingComplete: boolean;
  focusAreas: FocusArea[];
  wakeTime: string;
  sleepTime: string;
  breakfastTime: string;
  lunchTime: string;
  dinnerTime: string;
  waterGoalMl: number;
  sleepGoalMinutes: number;
  exerciseGoalMinutes: number;
  smokingGoalPerDay?: number;
  calorieEstimate: number;
  ageRange?: string;
  feltFresh?: boolean;
  reminderMode: ReminderMode;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationPreference {
  userId: string;
  enabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
  snoozeMinutes: number;
  reminderMode: ReminderMode;
  disabledTypes: string[];
  lastPermissionPromptAt?: string;
  categories: NotificationCategories;
}

export interface NotificationCategories {
  morning: boolean;
  breakfast: boolean;
  lunch: boolean;
  dinner: boolean;
  water: boolean;
  break: boolean;
  mood: boolean;
  sleep: boolean;
  endOfDay: boolean;
}

export interface AppSettings {
  userId: string;
  theme: ThemePreference;
  units: Units;
  language: string;
  streaksEnabled: boolean;
}

export interface LogEntry {
  id: string;
  userId: string;
  type: EntryType;
  occurredAt: string;
  localDate: string;
  payload: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface Habit {
  id: string;
  userId: string;
  name: string;
  icon: string;
  color: string;
  goal: string;
  frequency: 'daily' | 'weekly';
  reminderTime?: string;
  enabled: boolean;
  isCustom: boolean;
  kind?: string;
  createdAt: string;
  updatedAt: string;
}

export interface HabitLog {
  id: string;
  habitId: string;
  userId: string;
  localDate: string;
  completed: boolean;
  occurredAt: string;
}

export interface Streak {
  id: string;
  userId: string;
  kind: string;
  currentCount: number;
  bestCount: number;
  lastDate?: string;
  enabled: boolean;
}

export interface XpTransaction {
  id: string;
  userId: string;
  amount: number;
  reason: string;
  source: string;
  localDate: string;
  createdAt: string;
}

export interface Badge {
  id: string;
  userId: string;
  badgeKey: string;
  earnedAt: string;
}

export interface Reminder {
  id: string;
  userId: string;
  type: string;
  scheduledTime: string;
  enabled: boolean;
  lastFiredAt?: string;
  lastFiredDate?: string;
}

export interface DailyReportRecord {
  id: string;
  userId: string;
  localDate: string;
  score: number;
  payload: DailyReport;
  createdAt: string;
}

export interface WeeklyReportRecord {
  id: string;
  userId: string;
  weekStart: string;
  payload: WeeklyReport;
  createdAt: string;
}

export interface WaterPayload {
  ml: number;
}

export interface SleepPayload {
  sleepTime: string;
  wakeTime: string;
  minutes: number;
}

export interface MealPayload {
  kind: MealKind;
  text: string;
  estimate: NutritionEstimate;
}

export interface ExercisePayload {
  kind: ExerciseKind;
  minutes: number;
  caloriesEstimate?: number;
  label?: string;
}

export interface MoodPayload {
  key: MoodKey;
  score: number;
  note?: string;
}

export interface SmokingPayload {
  count: number;
}

export interface CaffeinePayload {
  kind: CaffeineKind;
  servings: number;
  mgEstimate: number;
  label?: string;
}

export interface HygienePayload {
  kind: HygieneKind;
}

export interface ScreenPayload {
  minutes: number;
  source: 'manual' | 'system';
}

export interface BreakPayload {
  action: 'start' | 'complete';
  minutes?: number;
}

export interface CountPayload {
  count: number;
}

export interface CustomHabitPayload {
  habitId: string;
  name: string;
}

export interface NutrientSet {
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number;
  ironMg: number;
  calciumMg: number;
  vitaminCMg: number;
  vitaminDIu: number;
  potassiumMg: number;
  magnesiumMg: number;
}

export interface NutritionEstimate extends NutrientSet {
  isEstimate: true;
  unmatched: string[];
  items: { foodId: string; name: string; servings: number; nutrients: NutrientSet }[];
}

export interface FoodItem {
  id: string;
  name: string;
  aliases: string[];
  servingLabel: string;
  region?: 'pk' | 'global';
  tags: string[];
  caffeineMg?: number;
  nutrients: NutrientSet;
}

export interface ScoreBreakdown {
  sleep: number;
  hydration: number;
  nutrition: number;
  movement: number;
  personalCare: number;
  mood: number;
  healthyHabits: number;
  penalty: number;
  total: number;
}

export interface DailyScoreResult {
  score: number | null;
  breakdown: ScoreBreakdown;
  headline: string;
  empty: boolean;
}

export interface StatusCard {
  id: string;
  title: string;
  value: string;
  detail: string;
  tone: StatusTone;
  color: string;
}

export interface CoachPriority {
  emoji: string;
  text: string;
  reason: string;
}

export interface CoachAdvice {
  greeting: string;
  priorities: CoachPriority[];
  easiest?: string;
}

export interface DailyReport {
  localDate: string;
  score: number;
  sleep: { label: string; tone: StatusTone; minutes?: number };
  water: { label: string; tone: StatusTone; ml: number; goalMl: number };
  nutrition: { label: string; tone: StatusTone };
  movement: { label: string; tone: StatusTone; minutes: number };
  mood: { label: string; tone: StatusTone; score?: number };
  personalCare: { label: string; tone: StatusTone };
  smoking?: { label: string; tone: StatusTone; count: number };
  wins: string;
  improve: string;
  tomorrow: string;
  closer: string;
}

export interface WeeklyReport {
  weekStart: string;
  weekEnd: string;
  avgSleepMinutes?: number;
  avgWaterMl: number;
  avgMood?: number;
  exerciseMinutes: number;
  exerciseDays: number;
  smokingAvg?: number;
  mealConsistency: number;
  personalCareConsistency: number;
  avgScreenMinutes?: number;
  biggestWin: string;
  nextFocus: string;
}

export interface Insight {
  id: string;
  text: string;
  sampleSize: number;
}

export interface ScheduledReminder {
  type: string;
  minutesFromMidnight: number;
  title: string;
  body: string;
  skipIf: EntryType[] | 'water_goal' | 'exercise_goal' | 'sleep_logged' | 'meals_logged';
}

export interface ExportPayload {
  exportedAt: string;
  version: 1;
  user: User;
  profile: UserProfile | null;
  settings: AppSettings | null;
  notificationPreference: NotificationPreference | null;
  entries: LogEntry[];
  habits: Habit[];
  habitLogs: HabitLog[];
  streaks: Streak[];
  xpTransactions: XpTransaction[];
  badges: Badge[];
  dailyReports: DailyReportRecord[];
  weeklyReports: WeeklyReportRecord[];
}

export const GLASS_ML = 250;

export const MOOD_OPTIONS: { key: MoodKey; emoji: string; label: string; score: number }[] = [
  { key: 'great', emoji: '😄', label: 'Great', score: 10 },
  { key: 'good', emoji: '🙂', label: 'Good', score: 8 },
  { key: 'okay', emoji: '😐', label: 'Okay', score: 6 },
  { key: 'low', emoji: '😔', label: 'Low', score: 4 },
  { key: 'stressed', emoji: '😣', label: 'Stressed', score: 3 },
  { key: 'tired', emoji: '😴', label: 'Tired', score: 5 },
  { key: 'irritated', emoji: '😡', label: 'Irritated', score: 3 },
];

export const FOCUS_OPTIONS: { id: FocusArea; label: string; emoji: string }[] = [
  { id: 'sleep', label: 'Sleep', emoji: '😴' },
  { id: 'nutrition', label: 'Nutrition', emoji: '🥗' },
  { id: 'hydration', label: 'Hydration', emoji: '💧' },
  { id: 'exercise', label: 'Exercise', emoji: '🏃' },
  { id: 'personal_care', label: 'Better hygiene', emoji: '✨' },
  { id: 'stress', label: 'Better mood', emoji: '🧘' },
  { id: 'smoking', label: 'Smoking', emoji: '🌿' },
  { id: 'screen_time', label: 'Screen time', emoji: '📱' },
  { id: 'productivity', label: 'Productivity', emoji: '🎯' },
  { id: 'general', label: 'General wellbeing', emoji: '🌱' },
];

export const AGE_RANGES = ['18–24', '25–34', '35–44', '45–54', '55+', 'Prefer not to say'] as const;

export const HEALTH_DISCLAIMER =
  'DailyMe is wellness and lifestyle software, not a medical diagnostic system. Nutrition numbers are estimates based on what you log. DailyMe never diagnoses conditions or predicts disease. Food photos are processed temporarily and are not stored. If a pattern continues or you are concerned about your health, consider speaking with a qualified healthcare professional.';
