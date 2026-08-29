import { isInQuietHours, parseTimeToMinutes } from './timezone';
import type { EntryType, LogEntry, ReminderMode, ScheduledReminder, UserProfile } from './types';
import { movementMinutes, sleepMinutesForDay, sumWaterMl } from './scoring';

export function buildReminderPlan(
  profile: UserProfile,
  mode: ReminderMode = profile.reminderMode,
): ScheduledReminder[] {
  const wake = parseTimeToMinutes(profile.wakeTime);
  const breakfast = parseTimeToMinutes(profile.breakfastTime);
  const lunch = parseTimeToMinutes(profile.lunchTime);
  const dinner = parseTimeToMinutes(profile.dinnerTime);
  const sleep = parseTimeToMinutes(profile.sleepTime);

  const all: ScheduledReminder[] = [
    {
      type: 'morning',
      minutesFromMidnight: wake + 5,
      title: 'Good morning 👋',
      body: 'How did you sleep?',
      skipIf: 'sleep_logged',
    },
    {
      type: 'breakfast',
      minutesFromMidnight: breakfast,
      title: '🍳 Breakfast check-in',
      body: 'Have you had breakfast?',
      skipIf: ['meal'],
    },
    {
      type: 'water_mid_morning',
      minutesFromMidnight: wake + 150,
      title: '💧 Time for some water?',
      body: 'A glass now keeps the day on track.',
      skipIf: 'water_goal',
    },
    {
      type: 'lunch',
      minutesFromMidnight: lunch,
      title: '🍽 Have you had lunch?',
      body: 'A quick log is enough.',
      skipIf: ['meal'],
    },
    {
      type: 'movement',
      minutesFromMidnight: lunch + 180,
      title: "🚶 You've been sitting for a while.",
      body: 'Want to take a short walk?',
      skipIf: 'exercise_goal',
    },
    {
      type: 'water_afternoon',
      minutesFromMidnight: lunch + 150,
      title: '💧 Another glass?',
      body: 'Small sips still count.',
      skipIf: 'water_goal',
    },
    {
      type: 'dinner',
      minutesFromMidnight: dinner,
      title: '🍽 Dinner check-in',
      body: 'Whenever you’re ready.',
      skipIf: ['meal'],
    },
    {
      type: 'wind_down',
      minutesFromMidnight: sleep - 60,
      title: '🌙 Time to start winding down.',
      body: 'A calmer last hour can help tonight.',
      skipIf: ['wind_down'],
    },
    {
      type: 'night_report',
      minutesFromMidnight: sleep - 15,
      title: 'Your day is wrapping up',
      body: 'Take a look at today’s snapshot when you like.',
      skipIf: ['wind_down'],
    },
    {
      type: 'break',
      minutesFromMidnight: wake + 240,
      title: 'Take a 5–10 minute break',
      body: "You've been focused for a stretch.",
      skipIf: ['break'],
    },
  ];

  const allowed =
    mode === 'minimal'
      ? new Set(['morning', 'lunch', 'wind_down'])
      : mode === 'balanced'
        ? new Set(['morning', 'breakfast', 'water_mid_morning', 'lunch', 'dinner', 'wind_down'])
        : new Set(all.map((r) => r.type));

  return all.filter((r) => allowed.has(r.type)).map((r) => ({
    ...r,
    minutesFromMidnight: ((r.minutesFromMidnight % (24 * 60)) + 24 * 60) % (24 * 60),
  }));
}

export function shouldFireReminder(input: {
  reminder: ScheduledReminder;
  entries: LogEntry[];
  profile: UserProfile;
  currentMinutes: number;
  quietStart: string;
  quietEnd: string;
  enabled: boolean;
  disabledTypes: string[];
  alreadyFiredToday: boolean;
}): boolean {
  if (!input.enabled) return false;
  if (input.alreadyFiredToday) return false;
  if (input.disabledTypes.includes(input.reminder.type)) return false;
  if (isInQuietHours(input.currentMinutes, input.quietStart, input.quietEnd)) return false;
  if (Math.abs(input.currentMinutes - input.reminder.minutesFromMidnight) > 2) return false;

  const live = input.entries.filter((e) => !e.deletedAt);
  const skip = input.reminder.skipIf;
  if (skip === 'water_goal' && sumWaterMl(live) >= input.profile.waterGoalMl) return false;
  if (skip === 'exercise_goal' && movementMinutes(live) >= 15) return false;
  if (skip === 'sleep_logged' && sleepMinutesForDay(live) > 0) return false;
  if (Array.isArray(skip)) {
    const types = new Set(skip);
    if (live.some((e) => types.has(e.type as EntryType))) {
      if (skip.includes('meal')) {
        const kinds = new Set(live.filter((e) => e.type === 'meal').map((e) => e.payload.kind));
        if (input.reminder.type === 'breakfast' && kinds.has('breakfast')) return false;
        if (input.reminder.type === 'lunch' && kinds.has('lunch')) return false;
        if (input.reminder.type === 'dinner' && kinds.has('dinner')) return false;
        if (!['breakfast', 'lunch', 'dinner'].includes(input.reminder.type) && kinds.size > 0) return false;
      } else {
        return false;
      }
    }
  }
  return true;
}
