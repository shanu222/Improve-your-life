import { addDays } from './timezone';
import type { LogEntry, Streak, UserProfile } from './types';
import { hygieneKinds, movementMinutes, sleepMinutesForDay, sumWaterMl } from './scoring';

export const STREAK_KINDS = [
  'water',
  'sleep',
  'exercise',
  'reading',
  'personal_care',
  'no_sugary',
  'smoking_reduction',
] as const;

export type StreakKind = (typeof STREAK_KINDS)[number];

export function dayCompletesStreak(
  kind: StreakKind,
  entries: LogEntry[],
  profile: UserProfile,
): boolean {
  const live = entries.filter((e) => !e.deletedAt);
  switch (kind) {
    case 'water':
      return sumWaterMl(live) >= profile.waterGoalMl * 0.9;
    case 'sleep':
      return sleepMinutesForDay(live) >= profile.sleepGoalMinutes - 45;
    case 'exercise':
      return movementMinutes(live) >= 10;
    case 'reading':
      return live.some((e) => e.type === 'read');
    case 'personal_care': {
      const kinds = hygieneKinds(live);
      return kinds.has('brush');
    }
    case 'no_sugary':
      return live.length > 0 && !live.some((e) => e.type === 'sugary');
    case 'smoking_reduction': {
      if (profile.smokingGoalPerDay === undefined) return false;
      const smoked = live.filter((e) => e.type === 'smoking').reduce((s, e) => s + Number(e.payload.count ?? 1), 0);
      return smoked <= profile.smokingGoalPerDay;
    }
    default:
      return false;
  }
}

export function applyStreakDay(
  streak: Streak,
  localDate: string,
  completed: boolean,
): Streak {
  if (!streak.enabled) return streak;
  if (streak.lastDate === localDate) {
    return completed
      ? streak
      : { ...streak, currentCount: 0, lastDate: localDate };
  }
  if (!completed) {
    return { ...streak, currentCount: 0, lastDate: localDate };
  }
  const yesterday = addDays(localDate, -1);
  const continued = streak.lastDate === yesterday && streak.currentCount > 0;
  const currentCount = continued ? streak.currentCount + 1 : 1;
  return {
    ...streak,
    currentCount,
    bestCount: Math.max(streak.bestCount, currentCount),
    lastDate: localDate,
  };
}

export function streakBrokenCopy(): string {
  return "Your streak ended, but your progress didn't. Start again today.";
}
