import type { DailyReport, LogEntry, StatusTone, UserProfile, WeeklyReport } from './types';
import {
  computeDailyScore,
  countType,
  hygieneKinds,
  latestMoodScore,
  mealsByKind,
  movementMinutes,
  sleepMinutesForDay,
  smokingCount,
  sumWaterMl,
} from './scoring';
import { formatHoursMinutes } from './sleep';
import { GLASS_ML } from './types';
import { addDays } from './timezone';

function toneFromRatio(value: number, goal: number): StatusTone {
  if (value <= 0) return 'neutral';
  if (value >= goal) return 'good';
  if (value >= goal * 0.7) return 'almost';
  return 'attention';
}

export function buildDailyReport(
  localDate: string,
  entries: LogEntry[],
  profile: UserProfile,
): DailyReport {
  const live = entries.filter((e) => !e.deletedAt);
  const scored = computeDailyScore(live, profile);
  const sleepMin = sleepMinutesForDay(live);
  const water = sumWaterMl(live);
  const move = movementMinutes(live);
  const mood = latestMoodScore(live);
  const smoked = smokingCount(live);
  const care = hygieneKinds(live);
  const meals = mealsByKind(live);

  const wins: string[] = [];
  const improve: string[] = [];

  if (sleepMin >= profile.sleepGoalMinutes - 30 && sleepMin > 0) wins.push('sleep');
  else if (sleepMin > 0) improve.push('sleep');

  if (water >= profile.waterGoalMl) wins.push('water');
  else if (water > 0) improve.push('water');

  if (move >= Math.min(20, profile.exerciseGoalMinutes)) wins.push('movement');
  else improve.push('movement');

  if (meals.size >= 2) wins.push('meals');
  if (care.has('brush') && (care.has('bath') || care.has('face'))) wins.push('personal care');
  else if (live.length > 0) improve.push('personal care');

  const winText =
    wins.length >= 2
      ? `Your ${wins.slice(0, 2).join(' and ')} were strong today.`
      : wins.length === 1
        ? `Your ${wins[0]} stood out today.`
        : 'You showed up. That counts.';

  const improveText =
    improve[0] === 'water'
      ? `Water was a little below your target (${Math.round(water / GLASS_ML)}/${Math.round(profile.waterGoalMl / GLASS_ML)} glasses).`
      : improve[0] === 'movement'
        ? 'A short walk tomorrow would be a gentle lift.'
        : improve[0] === 'sleep'
          ? 'A slightly earlier wind-down could help tomorrow night.'
          : improve[0] === 'personal care'
            ? 'One personal-care check-in is an easy win tomorrow.'
            : 'Pick one tiny habit to repeat tomorrow.';

  const tomorrow =
    improve[0] === 'water'
      ? 'Try drinking one glass shortly after waking up.'
      : improve[0] === 'movement'
        ? 'Take a 10-minute walk after lunch.'
        : 'One better choice tomorrow is enough.';

  const smokingBlock =
    smoked > 0 || profile.smokingGoalPerDay !== undefined
      ? {
          label: `${smoked}`,
          tone: (profile.smokingGoalPerDay !== undefined
            ? smoked <= profile.smokingGoalPerDay
              ? 'good'
              : 'almost'
            : 'neutral') as StatusTone,
          count: smoked,
        }
      : undefined;

  return {
    localDate,
    score: scored.score ?? 0,
    sleep: {
      label: sleepMin > 0 ? formatHoursMinutes(sleepMin) : 'Not logged',
      tone: sleepMin <= 0 ? 'neutral' : sleepMin >= 7 * 60 ? 'good' : sleepMin >= 6 * 60 ? 'almost' : 'attention',
      minutes: sleepMin || undefined,
    },
    water: {
      label: `${Math.round(water / GLASS_ML)}/${Math.round(profile.waterGoalMl / GLASS_ML)}`,
      tone: toneFromRatio(water, profile.waterGoalMl),
      ml: water,
      goalMl: profile.waterGoalMl,
    },
    nutrition: {
      label: meals.size >= 3 ? 'Good variety' : meals.size === 0 ? 'Nothing logged yet' : 'Some meals logged',
      tone: meals.size >= 2 ? 'good' : meals.size === 1 ? 'almost' : 'neutral',
    },
    movement: {
      label: `${move} min`,
      tone: toneFromRatio(move, Math.max(20, profile.exerciseGoalMinutes)),
      minutes: move,
    },
    mood: {
      label: mood !== undefined ? `${mood}/10` : 'Not logged',
      tone: mood === undefined ? 'neutral' : mood >= 7 ? 'good' : mood >= 5 ? 'almost' : 'attention',
      score: mood,
    },
    personalCare: {
      label: care.size >= 3 ? 'Complete' : care.size > 0 ? `${care.size} logged` : 'Not logged',
      tone: care.size >= 3 ? 'good' : care.size > 0 ? 'almost' : 'neutral',
    },
    smoking: smokingBlock,
    wins: winText,
    improve: improveText,
    tomorrow,
    closer: 'One better choice tomorrow is enough. 🌱',
  };
}

export function buildWeeklyReport(
  weekStart: string,
  days: { date: string; entries: LogEntry[] }[],
  profile: UserProfile,
): WeeklyReport {
  const weekEnd = addDays(weekStart, 6);
  const sleepVals: number[] = [];
  const waterVals: number[] = [];
  const moodVals: number[] = [];
  const screenVals: number[] = [];
  const smokeVals: number[] = [];
  let exerciseMinutes = 0;
  let exerciseDays = 0;
  let mealDays = 0;
  let careDays = 0;

  for (const day of days) {
    const live = day.entries.filter((e) => !e.deletedAt);
    const s = sleepMinutesForDay(live);
    if (s > 0) sleepVals.push(s);
    waterVals.push(sumWaterMl(live));
    const mood = latestMoodScore(live);
    if (mood !== undefined) moodVals.push(mood);
    const move = movementMinutes(live);
    exerciseMinutes += move;
    if (move >= 10) exerciseDays += 1;
    if (mealsByKind(live).size >= 2) mealDays += 1;
    if (hygieneKinds(live).has('brush')) careDays += 1;
    const smoked = smokingCount(live);
    if (smoked > 0 || live.length > 0) smokeVals.push(smoked);
    const screen = live.filter((e) => e.type === 'screen').reduce((n, e) => n + Number(e.payload.minutes ?? 0), 0);
    if (screen > 0) screenVals.push(screen);
  }

  const avg = (arr: number[]) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : undefined);

  const wins: string[] = [];
  if (exerciseDays >= 3) wins.push(`You exercised on ${exerciseDays} days this week.`);
  if ((avg(sleepVals) ?? 0) >= profile.sleepGoalMinutes - 30) wins.push('Your sleep stayed close to your goal.');
  if ((avg(waterVals) ?? 0) >= profile.waterGoalMl * 0.8) wins.push('Your water habit was consistent.');
  if (careDays >= 5) wins.push('Personal care was a steady part of your week.');
  if ((avg(moodVals) ?? 0) >= 7) wins.push('Your mood check-ins looked generally upbeat.');

  let nextFocus = 'Try repeating one small habit on more days next week.';
  const avgWaterGlasses = (avg(waterVals) ?? 0) / GLASS_ML;
  const goalGlasses = profile.waterGoalMl / GLASS_ML;
  if (avgWaterGlasses < goalGlasses * 0.8) nextFocus = 'Try improving your water consistency.';
  else if (exerciseDays < 3) nextFocus = 'Aim for a few short movement days next week.';
  else if (careDays < 5) nextFocus = 'Keep personal care simple and regular.';
  else if ((avg(sleepVals) ?? 0) < profile.sleepGoalMinutes - 45) nextFocus = 'Protect a slightly earlier wind-down.';

  return {
    weekStart,
    weekEnd,
    avgSleepMinutes: avg(sleepVals),
    avgWaterMl: avg(waterVals) ?? 0,
    avgMood: avg(moodVals),
    exerciseMinutes,
    exerciseDays,
    smokingAvg: smokeVals.length ? avg(smokeVals) : undefined,
    mealConsistency: mealDays / 7,
    personalCareConsistency: careDays / 7,
    avgScreenMinutes: avg(screenVals),
    biggestWin: wins[0] ?? 'You checked in with yourself this week.',
    nextFocus,
  };
}

export { countType };
