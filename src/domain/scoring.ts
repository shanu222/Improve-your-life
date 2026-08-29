import type { LogEntry, NutrientSet, NutritionEstimate, UserProfile } from './types';
import { formatHoursMinutes, sleepBand } from './sleep';
import { GLASS_ML } from './types';

const WEIGHTS = {
  sleep: 18,
  hydration: 14,
  nutrition: 16,
  movement: 14,
  personalCare: 10,
  mood: 10,
  healthyHabits: 10,
} as const;

export const SCORE_EXPLAINER = {
  title: 'How this score works',
  body: 'Your Daily Balance Score is a friendly lifestyle snapshot — not a medical score. It looks at sleep, water, food variety, movement, personal care, mood, and a few healthy extras. One rough area cannot wipe out the whole day.',
  weights: [
    { label: 'Sleep', value: WEIGHTS.sleep },
    { label: 'Hydration', value: WEIGHTS.hydration },
    { label: 'Nutrition variety', value: WEIGHTS.nutrition },
    { label: 'Movement', value: WEIGHTS.movement },
    { label: 'Personal care', value: WEIGHTS.personalCare },
    { label: 'Mood', value: WEIGHTS.mood },
    { label: 'Healthy extras', value: WEIGHTS.healthyHabits },
  ],
  note: 'Smoking, sugary drinks, and junk food can lower the score a little if you have a reduction goal — never enough to erase the rest of your day.',
};

function clamp(n: number, min = 0, max = 100): number {
  return Math.min(max, Math.max(min, n));
}

function active(entries: LogEntry[]): LogEntry[] {
  return entries.filter((e) => !e.deletedAt);
}

export function sumWaterMl(entries: LogEntry[]): number {
  return active(entries)
    .filter((e) => e.type === 'water')
    .reduce((sum, e) => sum + Number(e.payload.ml ?? 0), 0);
}

export function sleepMinutesForDay(entries: LogEntry[]): number {
  return active(entries)
    .filter((e) => e.type === 'sleep')
    .reduce((sum, e) => sum + Number(e.payload.minutes ?? 0), 0);
}

export function movementMinutes(entries: LogEntry[]): number {
  return active(entries)
    .filter((e) => e.type === 'exercise')
    .reduce((sum, e) => sum + Number(e.payload.minutes ?? 0), 0);
}

export function latestMoodScore(entries: LogEntry[]): number | undefined {
  const moods = active(entries)
    .filter((e) => e.type === 'mood')
    .sort((a, b) => a.occurredAt.localeCompare(b.occurredAt));
  const last = moods[moods.length - 1];
  return last ? Number(last.payload.score) : undefined;
}

export function smokingCount(entries: LogEntry[]): number {
  return active(entries)
    .filter((e) => e.type === 'smoking')
    .reduce((sum, e) => sum + Number(e.payload.count ?? 1), 0);
}

export function caffeineMg(entries: LogEntry[]): number {
  return active(entries)
    .filter((e) => e.type === 'caffeine')
    .reduce((sum, e) => sum + Number(e.payload.mgEstimate ?? 0), 0);
}

export function hygieneKinds(entries: LogEntry[]): Set<string> {
  return new Set(
    active(entries)
      .filter((e) => e.type === 'hygiene')
      .map((e) => String(e.payload.kind ?? '')),
  );
}

export function countType(entries: LogEntry[], type: LogEntry['type']): number {
  return active(entries).filter((e) => e.type === type).length;
}

export function mealsByKind(entries: LogEntry[]): Set<string> {
  return new Set(
    active(entries)
      .filter((e) => e.type === 'meal')
      .map((e) => String(e.payload.kind ?? 'snack')),
  );
}

export function emptyNutrients(): NutrientSet {
  return {
    calories: 0,
    proteinG: 0,
    carbsG: 0,
    fatG: 0,
    fiberG: 0,
    ironMg: 0,
    calciumMg: 0,
    vitaminCMg: 0,
    vitaminDIu: 0,
    potassiumMg: 0,
    magnesiumMg: 0,
  };
}

export function sumNutrition(entries: LogEntry[]): NutrientSet {
  const total = emptyNutrients();
  for (const entry of active(entries).filter((e) => e.type === 'meal')) {
    const estimate = entry.payload.estimate as NutritionEstimate | undefined;
    if (!estimate) continue;
    (Object.keys(total) as (keyof NutrientSet)[]).forEach((key) => {
      total[key] += Number(estimate[key] ?? 0);
    });
  }
  return total;
}

function sleepScore(minutes: number, goal: number): number {
  if (minutes <= 0) return 0;
  const goalClamped = Math.max(360, goal);
  if (minutes >= 7 * 60 && minutes <= 9 * 60) return 100;
  if (minutes >= goalClamped - 30 && minutes <= goalClamped + 45) return 95;
  if (minutes < 6 * 60) return clamp((minutes / (6 * 60)) * 55);
  if (minutes < 7 * 60) return 70 + ((minutes - 360) / 60) * 25;
  return clamp(100 - (minutes - 9 * 60) / 12);
}

function hydrationScore(ml: number, goal: number): number {
  if (goal <= 0) return 0;
  return clamp((ml / goal) * 100);
}

function nutritionScore(entries: LogEntry[]): number {
  const meals = mealsByKind(entries);
  let score = 0;
  if (meals.has('breakfast')) score += 24;
  if (meals.has('lunch')) score += 24;
  if (meals.has('dinner')) score += 24;
  if (countType(entries, 'fruit') > 0 || mealsHaveTag(entries, 'fruit')) score += 10;
  if (countType(entries, 'vegetables') > 0 || mealsHaveTag(entries, 'vegetable')) score += 10;
  if (countType(entries, 'junk') === 0) score += 8;
  return clamp(score);
}

function mealsHaveTag(entries: LogEntry[], tag: string): boolean {
  return active(entries)
    .filter((e) => e.type === 'meal')
    .some((e) => {
      const estimate = e.payload.estimate as NutritionEstimate | undefined;
      return estimate?.items.some((item) => item.name.toLowerCase().includes(tag));
    });
}

function movementScore(minutes: number, goal: number): number {
  if (minutes <= 0) return 0;
  const target = Math.max(20, goal);
  return clamp((minutes / target) * 100);
}

function careScore(entries: LogEntry[]): number {
  const kinds = hygieneKinds(entries);
  const core = ['brush', 'face', 'bath'] as const;
  const hit = core.filter((k) => kinds.has(k)).length;
  if (hit === 0 && kinds.size === 0) return 0;
  return clamp((hit / core.length) * 100);
}

function moodScore(score: number | undefined): number {
  if (score === undefined) return 0;
  return clamp(score * 10);
}

function extrasScore(entries: LogEntry[]): number {
  let score = 0;
  if (countType(entries, 'fruit') > 0) score += 25;
  if (countType(entries, 'vegetables') > 0) score += 25;
  if (countType(entries, 'read') > 0) score += 25;
  if (countType(entries, 'relax') > 0) score += 25;
  return clamp(score);
}

function penalties(entries: LogEntry[], profile: UserProfile): number {
  let penalty = 0;
  const smoked = smokingCount(entries);
  if (profile.smokingGoalPerDay !== undefined) {
    const over = smoked - profile.smokingGoalPerDay;
    if (over > 0) penalty += Math.min(8, over * 2);
  }
  penalty += Math.min(6, countType(entries, 'junk') * 2);
  penalty += Math.min(4, countType(entries, 'sugary'));
  penalty += Math.min(4, countType(entries, 'alcohol'));
  return Math.min(12, penalty);
}

export function computeDailyScore(entries: LogEntry[], profile: UserProfile): {
  score: number | null;
  breakdown: {
    sleep: number;
    hydration: number;
    nutrition: number;
    movement: number;
    personalCare: number;
    mood: number;
    healthyHabits: number;
    penalty: number;
    total: number;
  };
  headline: string;
  empty: boolean;
} {
  const live = active(entries);
  const empty = live.length === 0;
  const sleep = sleepScore(sleepMinutesForDay(live), profile.sleepGoalMinutes);
  const hydration = hydrationScore(sumWaterMl(live), profile.waterGoalMl);
  const nutrition = nutritionScore(live);
  const movement = movementScore(movementMinutes(live), profile.exerciseGoalMinutes);
  const personalCare = careScore(live);
  const mood = moodScore(latestMoodScore(live));
  const healthyHabits = extrasScore(live);
  const penalty = penalties(live, profile);

  const weighted =
    (sleep * WEIGHTS.sleep +
      hydration * WEIGHTS.hydration +
      nutrition * WEIGHTS.nutrition +
      movement * WEIGHTS.movement +
      personalCare * WEIGHTS.personalCare +
      mood * WEIGHTS.mood +
      healthyHabits * WEIGHTS.healthyHabits) /
    100;

  const loggedComponents = [sleep, hydration, nutrition, movement, personalCare, mood, healthyHabits].filter(
    (n) => n > 0,
  ).length;

  let total = empty ? 0 : clamp(weighted - penalty);
  if (!empty) {
    total = Math.max(total, 22);
  }
  if (loggedComponents <= 1 && total > 55) {
    total = 55;
  }

  const headline = empty
    ? 'Start with one small check-in.'
    : total >= 80
      ? "You're doing great today."
      : total >= 60
        ? "You're doing pretty well today."
        : total >= 40
          ? 'A couple of small choices could lift today.'
          : "Today's still open. One small step is enough.";

  return {
    score: empty ? null : Math.round(total),
    breakdown: {
      sleep: Math.round(sleep),
      hydration: Math.round(hydration),
      nutrition: Math.round(nutrition),
      movement: Math.round(movement),
      personalCare: Math.round(personalCare),
      mood: Math.round(mood),
      healthyHabits: Math.round(healthyHabits),
      penalty: Math.round(penalty),
      total: empty ? 0 : Math.round(total),
    },
    headline,
    empty,
  };
}

export function scoreHeadline(score: number | null, empty: boolean): string {
  if (empty || score === null) return 'Start with one small check-in.';
  if (score >= 80) return "You're doing great today.";
  if (score >= 60) return "You're doing pretty well today.";
  if (score >= 40) return 'A couple of small choices could lift today.';
  return "Today's still open. One small step is enough.";
}

export function waterStatus(ml: number, goalMl: number): { tone: 'good' | 'almost' | 'attention' | 'neutral'; detail: string; value: string } {
  const glasses = ml / GLASS_ML;
  const goalGlasses = Math.max(1, Math.round(goalMl / GLASS_ML));
  const value = `${Math.round(glasses * 10) / 10} / ${goalGlasses} glasses`;
  if (ml <= 0) return { tone: 'neutral', detail: 'Not logged yet', value };
  if (ml >= goalMl) return { tone: 'good', detail: 'Goal reached', value };
  if (ml >= goalMl * 0.7) return { tone: 'almost', detail: 'Almost there', value };
  return { tone: 'attention', detail: "You're on your way", value };
}

export function sleepStatus(minutes: number): { tone: 'good' | 'almost' | 'attention' | 'neutral'; detail: string; value: string } {
  if (minutes <= 0) return { tone: 'neutral', detail: 'Not logged yet', value: '—' };
  const band = sleepBand(minutes);
  const value = formatHoursMinutes(minutes);
  if (band.key === 'great') return { tone: 'good', detail: band.label, value };
  if (band.key === 'more' || band.key === 'long') return { tone: 'almost', detail: band.label, value };
  return { tone: 'attention', detail: band.label, value };
}
