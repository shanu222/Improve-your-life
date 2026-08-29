import type { LogEntry } from './types';
import { movementMinutes, sleepMinutesForDay, sumWaterMl } from './scoring';

export interface WellbeingBar {
  id: string;
  label: string;
  value: number;
}

export function wellbeingBars(entries: LogEntry[], goals: { waterMl: number; sleepMin: number; moveMin: number }): WellbeingBar[] {
  const live = entries.filter((e) => !e.deletedAt);
  const water = Math.min(100, (sumWaterMl(live) / Math.max(1, goals.waterMl)) * 100);
  const sleep = sleepMinutesForDay(live) > 0 ? Math.min(100, (sleepMinutesForDay(live) / Math.max(1, goals.sleepMin)) * 100) : 0;
  const meals = new Set(live.filter((e) => e.type === 'meal').map((e) => e.payload.kind)).size;
  const nutrition = Math.min(100, (meals / 3) * 100);
  const movement = Math.min(100, (movementMinutes(live) / Math.max(20, goals.moveMin)) * 100);
  const hygiene = Math.min(100, (new Set(live.filter((e) => e.type === 'hygiene').map((e) => e.payload.kind)).size / 3) * 100);
  const mood = live.some((e) => e.type === 'mood') ? 80 : 0;
  const focus = Math.min(100, (live.filter((e) => e.type === 'focus').length / 2) * 100);
  const breaks = live.some((e) => e.type === 'break') ? 80 : 0;
  return [
    { id: 'sleep', label: 'Sleep', value: Math.round(sleep) },
    { id: 'water', label: 'Water', value: Math.round(water) },
    { id: 'nutrition', label: 'Nutrition', value: Math.round(nutrition) },
    { id: 'movement', label: 'Movement', value: Math.round(movement) },
    { id: 'hygiene', label: 'Hygiene', value: Math.round(hygiene) },
    { id: 'mood', label: 'Mood', value: Math.round(mood) },
    { id: 'focus', label: 'Focus', value: Math.round(focus) },
    { id: 'breaks', label: 'Breaks', value: Math.round(breaks) },
  ];
}

export function barFill(value: number): string {
  const n = Math.max(0, Math.min(10, Math.round(value / 10)));
  return `${'█'.repeat(n)}${'░'.repeat(10 - n)}`;
}
