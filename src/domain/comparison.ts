import { formatHoursMinutes } from './sleep';
import { movementMinutes, sleepMinutesForDay, smokingCount, sumWaterMl } from './scoring';
import type { LogEntry } from './types';
import { GLASS_ML } from './types';

export interface DayTotals {
  date: string;
  waterMl: number;
  sleepMinutes: number;
  movementMinutes: number;
  smoking: number;
  calories: number;
  mood?: number;
  focusMinutes: number;
}

export function compareMetric(
  label: string,
  emoji: string,
  today: number,
  yesterday: number,
  unit: 'ml' | 'min' | 'count' | 'kcal',
): string {
  const delta = today - yesterday;
  if (unit === 'ml') {
    if (delta > 50) return `${emoji} Nice improvement. You're drinking about ${Math.round(delta)} ml more water than yesterday.`;
    if (delta < -50) return `${emoji} Water is a little lower than yesterday. A glass now still counts.`;
    return `${emoji} Water is similar to yesterday.`;
  }
  if (unit === 'min' && label === 'Sleep') {
    return `${emoji} Your sleep was ${formatHoursMinutes(today)} today compared with ${formatHoursMinutes(yesterday)} yesterday.`;
  }
  if (unit === 'count' && label === 'Smoking') {
    if (delta < 0) return `That's ${Math.abs(delta)} fewer than yesterday.`;
    if (delta > 0) return `${today} today, compared with ${yesterday} yesterday.`;
    return `Same as yesterday.`;
  }
  if (delta > 0) return `${emoji} ${label} is up compared with yesterday.`;
  if (delta < 0) return `${emoji} ${label} is a little lower than yesterday.`;
  return `${emoji} ${label} is similar to yesterday.`;
}

export function percentChange(current: number, previous: number): number | null {
  if (previous <= 0) return null;
  return Math.round(((current - previous) / previous) * 100);
}

export function glassesLabel(ml: number): string {
  return `${(ml / GLASS_ML).toFixed(1)} glasses`;
}

export function average(values: number[]): number {
  if (!values.length) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

export function totalsFromEntries(date: string, entries: LogEntry[]): DayTotals {
  const live = entries.filter((e) => !e.deletedAt);
  const calories = live
    .filter((e) => e.type === 'meal')
    .reduce((sum, e) => {
      const estimate = e.payload.estimate as { calories?: number; estimatedCalories?: number } | undefined;
      return sum + Number(estimate?.calories ?? estimate?.estimatedCalories ?? 0);
    }, 0);
  const focusMinutes = live
    .filter((e) => e.type === 'focus')
    .reduce((sum, e) => sum + Number(e.payload.duration ?? 0), 0);
  return {
    date,
    waterMl: sumWaterMl(live),
    sleepMinutes: sleepMinutesForDay(live),
    movementMinutes: movementMinutes(live),
    smoking: smokingCount(live),
    calories,
    focusMinutes,
  };
}
