import type { LogEntry, UserProfile } from './types';
import { mealsByKind, movementMinutes, sleepMinutesForDay, smokingCount, sumWaterMl } from './scoring';
import { average } from './comparison';
import { formatHoursMinutes } from './sleep';

export function lifestyleObservations(
  days: { date: string; entries: LogEntry[] }[],
  profile: Pick<UserProfile, 'waterGoalMl' | 'sleepGoalMinutes' | 'wakeTime'>,
): string[] {
  if (days.length < 3) {
    return ['Keep logging for a few more days and DailyMe can share gentle patterns from your own data.'];
  }
  const notes: string[] = [];
  const sleep = days.map((d) => sleepMinutesForDay(d.entries)).filter((n) => n > 0);
  const water = days.map((d) => sumWaterMl(d.entries));
  const moveDays = days.filter((d) => movementMinutes(d.entries) >= 15).length;
  const breakfastDays = days.filter((d) => mealsByKind(d.entries).has('breakfast')).length;
  const smoked = days.map((d) => smokingCount(d.entries));

  if (sleep.length >= 3) {
    const min = Math.min(...sleep);
    const max = Math.max(...sleep);
    if (max - min >= 90) {
      notes.push('Based on your last few days, your sleep has been inconsistent.');
    } else {
      notes.push(`Your recent sleep logs average about ${formatHoursMinutes(Math.round(average(sleep)))}.`);
    }
  }

  const laterWater = water.slice(-3);
  const earlierWater = water.slice(0, Math.max(1, water.length - 3));
  if (laterWater.length && earlierWater.length && average(laterWater) - average(earlierWater) >= 200) {
    notes.push('Your water intake has improved compared with earlier logs.');
  } else if (average(water) < profile.waterGoalMl * 0.6) {
    notes.push('Your recent logs suggest you may be drinking less water than your personal target.');
  }

  if (days.length >= 5 && breakfastDays <= 2) {
    notes.push('You tend to skip breakfast on some days, based on what you logged.');
  }

  notes.push(`You logged movement on ${moveDays} of the last ${days.length} days.`);

  if (smoked.some((n) => n > 0)) {
    notes.push('Cigarette counts are tracked without judgment. Reducing smoking can have important health benefits.');
  }

  return notes.slice(0, 5);
}

export function nutrientPatternCopy(input: { name: string; low: boolean; foods: string[] }): string {
  if (!input.low) return '';
  return `Your recent food logs suggest you may be getting less ${input.name}-rich food than commonly recommended amounts. Consider adding foods such as ${input.foods.join(', ')}. If this pattern continues or you have symptoms, consider discussing your diet with a qualified healthcare professional.`;
}

export const INFORMATIONAL_FOOTER =
  'These are observations from your logged data, not medical facts or diagnoses.';
