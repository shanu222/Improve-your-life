import type { Insight, LogEntry } from './types';
import { latestMoodScore, movementMinutes, sleepMinutesForDay, sumWaterMl } from './scoring';

const MIN_DAYS = 7;

function avg(nums: number[]): number {
  if (!nums.length) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

export function detectInsights(
  days: { date: string; entries: LogEntry[] }[],
): Insight[] {
  if (days.length < MIN_DAYS) return [];
  const insights: Insight[] = [];

  const withExercise: number[] = [];
  const withoutExercise: number[] = [];
  const sleepWithExercise: number[] = [];
  const sleepWithout: number[] = [];
  const waterBusy: number[] = [];
  const waterCalm: number[] = [];

  for (const day of days) {
    const live = day.entries.filter((e) => !e.deletedAt);
    const move = movementMinutes(live);
    const mood = latestMoodScore(live);
    const sleep = sleepMinutesForDay(live);
    const water = sumWaterMl(live);
    const busy = live.length >= 8 || live.some((e) => e.type === 'screen' && Number(e.payload.minutes ?? 0) >= 300);

    if (mood !== undefined) {
      if (move >= 15) withExercise.push(mood);
      else withoutExercise.push(mood);
    }
    if (sleep > 0) {
      if (move >= 15) sleepWithExercise.push(sleep);
      else sleepWithout.push(sleep);
    }
    if (busy) waterBusy.push(water);
    else waterCalm.push(water);
  }

  if (withExercise.length >= 3 && withoutExercise.length >= 3 && avg(withExercise) - avg(withoutExercise) >= 0.8) {
    insights.push({
      id: 'mood_movement',
      sampleSize: withExercise.length + withoutExercise.length,
      text: "You've logged higher mood on days when you exercised.",
    });
  }

  if (sleepWithExercise.length >= 3 && sleepWithout.length >= 3 && avg(sleepWithExercise) - avg(sleepWithout) >= 20) {
    insights.push({
      id: 'sleep_movement',
      sampleSize: sleepWithExercise.length + sleepWithout.length,
      text: "You've logged longer sleep on days when you exercised.",
    });
  }

  if (waterBusy.length >= 3 && waterCalm.length >= 3 && avg(waterCalm) - avg(waterBusy) >= 250) {
    insights.push({
      id: 'water_busy',
      sampleSize: waterBusy.length + waterCalm.length,
      text: 'You tend to drink less water on busier days.',
    });
  }

  return insights.slice(0, 4);
}
