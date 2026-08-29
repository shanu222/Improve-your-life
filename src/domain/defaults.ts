import { detectTimezone } from './timezone';
import { estimatedCaloriesFromProfile } from './mealParser';
import type { AppSettings, Habit, NotificationPreference, User, UserProfile } from './types';
import { createId, nowIso } from './ids';

export const DEFAULT_WATER_GOAL_ML = 2000;
export const DEFAULT_SLEEP_GOAL_MINUTES = 480;
export const DEFAULT_EXERCISE_GOAL_MINUTES = 30;

export function createLocalUser(): User {
  const ts = nowIso();
  return {
    id: createId(),
    createdAt: ts,
    updatedAt: ts,
    authProvider: 'local',
  };
}

export function defaultProfile(userId: string, partial: Partial<UserProfile> = {}): UserProfile {
  const ts = nowIso();
  const base = {
    userId,
    name: '',
    activityLevel: 'light' as const,
    timezone: detectTimezone(),
    onboardingComplete: false,
    focusAreas: [] as UserProfile['focusAreas'],
    wakeTime: '07:00',
    sleepTime: '23:00',
    breakfastTime: '08:00',
    lunchTime: '13:30',
    dinnerTime: '20:00',
    waterGoalMl: DEFAULT_WATER_GOAL_ML,
    sleepGoalMinutes: DEFAULT_SLEEP_GOAL_MINUTES,
    exerciseGoalMinutes: DEFAULT_EXERCISE_GOAL_MINUTES,
    calorieEstimate: 2000,
    reminderMode: 'balanced' as const,
    createdAt: ts,
    updatedAt: ts,
  };
  const merged = { ...base, ...partial, userId };
  merged.calorieEstimate = estimatedCaloriesFromProfile(merged);
  return merged;
}

export function defaultSettings(userId: string): AppSettings {
  return { userId, theme: 'system', units: 'metric', language: 'en', streaksEnabled: true };
}

export function defaultNotificationPref(userId: string): NotificationPreference {
  return {
    userId,
    enabled: false,
    quietHoursStart: '22:30',
    quietHoursEnd: '07:00',
    snoozeMinutes: 15,
    reminderMode: 'balanced',
    disabledTypes: [],
    categories: {
      morning: true,
      breakfast: true,
      lunch: true,
      dinner: true,
      water: true,
      break: true,
      mood: true,
      sleep: true,
      endOfDay: true,
    },
  };
}

export function defaultHabits(userId: string): Habit[] {
  const ts = nowIso();
  const mk = (name: string, icon: string, color: string, kind: string): Habit => ({
    id: createId(),
    userId,
    name,
    icon,
    color,
    goal: 'Daily',
    frequency: 'daily',
    enabled: true,
    isCustom: false,
    kind,
    createdAt: ts,
    updatedAt: ts,
  });
  return [
    mk('Drink water', '💧', '#3B9EFF', 'water'),
    mk('Move a little', '🏃', '#34C759', 'exercise'),
    mk('Brush teeth', '🪥', '#2EC4B6', 'hygiene'),
    mk('Read a few pages', '📚', '#F5C518', 'read'),
  ];
}

export const QUICK_ACTIONS = [
  { type: 'water', emoji: '💧', label: 'Water' },
  { type: 'meal', kind: 'breakfast', emoji: '🍳', label: 'Breakfast' },
  { type: 'meal', kind: 'lunch', emoji: '🍱', label: 'Lunch' },
  { type: 'meal', kind: 'dinner', emoji: '🍽', label: 'Dinner' },
  { type: 'fruit', emoji: '🍎', label: 'Fruit' },
  { type: 'vegetables', emoji: '🥗', label: 'Vegetables' },
  { type: 'exercise', kind: 'custom', emoji: '🏃', label: 'Exercise' },
  { type: 'exercise', kind: 'walk', emoji: '🚶', label: 'Walk' },
  { type: 'hygiene', kind: 'bath', emoji: '🧼', label: 'Bath/Shower' },
  { type: 'hygiene', kind: 'brush', emoji: '🪥', label: 'Brush Teeth' },
  { type: 'hygiene', kind: 'face', emoji: '🧴', label: 'Wash Face' },
  { type: 'caffeine', emoji: '☕', label: 'Caffeine' },
  { type: 'smoking', emoji: '🚬', label: 'Cigarettes' },
  { type: 'sugary', emoji: '🥤', label: 'Sugary Drink' },
  { type: 'junk', emoji: '🍟', label: 'Junk Food' },
  { type: 'relax', emoji: '🧘', label: 'Relax' },
  { type: 'read', emoji: '📚', label: 'Read' },
  { type: 'screen', emoji: '📱', label: 'Screen Time' },
  { type: 'sleep', emoji: '😴', label: 'Sleep' },
] as const;
