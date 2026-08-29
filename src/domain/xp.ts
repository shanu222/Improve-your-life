import type { LogEntry, UserProfile, XpTransaction } from './types';

export const LEVEL_NAMES = [
  'First Light',
  'Showing Up',
  'Finding Rhythm',
  'Getting Better',
  'Steady Glow',
  'Daily Spark',
  'In the Groove',
  'Soft Strength',
  'Bright Routine',
  'Quiet Power',
  'Well Tuned',
  'Getting Better',
  'Deep Roots',
  'Warm Momentum',
  'Everyday Magic',
  'Radiant Pace',
  'Lived-in Calm',
  'Open Horizon',
  'Full Bloom',
  'Daily Legend',
];

export const XP_RULES: { source: string; amount: number; reason: string; dailyCap: number }[] = [
  { source: 'water', amount: 5, reason: 'Water logged', dailyCap: 20 },
  { source: 'exercise', amount: 15, reason: 'Movement logged', dailyCap: 15 },
  { source: 'sleep_goal', amount: 20, reason: 'Sleep close to your goal', dailyCap: 20 },
  { source: 'meal_healthy', amount: 10, reason: 'Meal logged', dailyCap: 30 },
  { source: 'hygiene', amount: 5, reason: 'Personal care', dailyCap: 15 },
  { source: 'read', amount: 10, reason: 'Reading logged', dailyCap: 10 },
  { source: 'fruit', amount: 5, reason: 'Fruit logged', dailyCap: 10 },
  { source: 'vegetables', amount: 5, reason: 'Vegetables logged', dailyCap: 10 },
  { source: 'relax', amount: 5, reason: 'A moment to reset', dailyCap: 10 },
  { source: 'habit', amount: 10, reason: 'Custom habit', dailyCap: 40 },
];

const BLOCKED = new Set(['smoking', 'junk', 'sugary', 'alcohol']);

export function xpForEntry(
  entry: LogEntry,
  profile: UserProfile,
  existingToday: XpTransaction[],
): { amount: number; reason: string; source: string } | null {
  if (BLOCKED.has(entry.type)) return null;

  let source = entry.type as string;
  let amount = 0;
  let reason = '';

  if (entry.type === 'water') {
    source = 'water';
    amount = 5;
    reason = 'Water logged';
  } else if (entry.type === 'exercise') {
    const minutes = Number(entry.payload.minutes ?? 0);
    if (minutes <= 0) return null;
    amount = 15;
    reason = 'Movement logged';
    source = 'exercise';
  } else if (entry.type === 'sleep') {
    const minutes = Number(entry.payload.minutes ?? 0);
    const goal = profile.sleepGoalMinutes;
    if (minutes < goal - 60) return null;
    amount = 20;
    reason = 'Sleep close to your goal';
    source = 'sleep_goal';
  } else if (entry.type === 'meal') {
    amount = 10;
    reason = 'Meal logged';
    source = 'meal_healthy';
  } else if (entry.type === 'hygiene') {
    amount = 5;
    reason = 'Personal care';
    source = 'hygiene';
  } else if (entry.type === 'read' || entry.type === 'fruit' || entry.type === 'vegetables' || entry.type === 'relax') {
    const rule = XP_RULES.find((r) => r.source === entry.type);
    amount = rule?.amount ?? 5;
    reason = rule?.reason ?? 'Healthy action';
    source = entry.type;
  } else if (entry.type === 'custom') {
    amount = 10;
    reason = 'Custom habit';
    source = 'habit';
  } else if (entry.type === 'focus' && entry.payload.status === 'completed') {
    amount = 10;
    reason = 'Focus session';
    source = 'habit';
  } else {
    return null;
  }

  const rule = XP_RULES.find((r) => r.source === source);
  const cap = rule?.dailyCap ?? amount;
  const already = existingToday.filter((t) => t.source === source).reduce((s, t) => s + t.amount, 0);
  const remaining = cap - already;
  if (remaining <= 0) return null;
  return { amount: Math.min(amount, remaining), reason, source };
}

export function totalXp(transactions: XpTransaction[]): number {
  return transactions.reduce((s, t) => s + t.amount, 0);
}

export function levelFromXp(xp: number): { level: number; name: string; current: number; intoLevel: number; needed: number } {
  const per = 100;
  const level = Math.floor(xp / per) + 1;
  const intoLevel = xp % per;
  const name = LEVEL_NAMES[Math.min(level - 1, LEVEL_NAMES.length - 1)] ?? 'Getting Better';
  return { level, name, current: xp, intoLevel, needed: per };
}

export interface BadgeDef {
  key: string;
  name: string;
  emoji: string;
  description: string;
}

export const BADGE_DEFS: BadgeDef[] = [
  { key: 'first_step', name: 'First Step', emoji: '🌱', description: 'Logged your first check-in' },
  { key: 'streak_7', name: '7 Day Streak', emoji: '🔥', description: 'Kept a 7-day streak going' },
  { key: 'hydration_hero', name: 'Hydration Hero', emoji: '💧', description: 'Hit your water goal 7 days in a row' },
  { key: 'sleep_champion', name: 'Sleep Champion', emoji: '🌙', description: 'Met your sleep goal 7 days in a row' },
  { key: 'moving', name: 'Moving', emoji: '🏃', description: 'Moved your body on 5 days' },
  { key: 'consistent_learner', name: 'Consistent Learner', emoji: '📚', description: 'Read on 5 days' },
  { key: 'care_glow', name: 'Care Glow', emoji: '✨', description: 'Personal care complete 7 days in a row' },
];

export function newlyEarnedBadges(input: {
  totalEntries: number;
  streaks: { kind: string; currentCount: number }[];
  exerciseDays: number;
  readingDays: number;
  owned: Set<string>;
}): BadgeDef[] {
  const earned: BadgeDef[] = [];
  const maybe = (key: string, ok: boolean) => {
    const def = BADGE_DEFS.find((b) => b.key === key);
    if (ok && def && !input.owned.has(key)) earned.push(def);
  };
  maybe('first_step', input.totalEntries >= 1);
  maybe('streak_7', input.streaks.some((s) => s.currentCount >= 7));
  maybe('hydration_hero', input.streaks.some((s) => s.kind === 'water' && s.currentCount >= 7));
  maybe('sleep_champion', input.streaks.some((s) => s.kind === 'sleep' && s.currentCount >= 7));
  maybe('moving', input.exerciseDays >= 5);
  maybe('consistent_learner', input.readingDays >= 5);
  maybe('care_glow', input.streaks.some((s) => s.kind === 'personal_care' && s.currentCount >= 7));
  return earned;
}
