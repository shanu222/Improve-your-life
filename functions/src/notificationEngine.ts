import { getLocalDate, getLocalMinutes, isInQuietHours, parseTimeToMinutes } from './timezone';

export type NotificationSlot =
  | 'morning'
  | 'breakfast'
  | 'water_am'
  | 'lunch'
  | 'afternoon'
  | 'mood'
  | 'work'
  | 'water_pm'
  | 'dinner'
  | 'hygiene'
  | 'freshness'
  | 'evening'
  | 'daily_summary'
  | 'inactivity';

export type EngineReminderMode = 'minimal' | 'balanced' | 'helpful';

export interface EngineToday {
  breakfast: boolean;
  lunch: boolean;
  dinner: boolean;
  waterMl: number;
  waterRecent: boolean;
  hygiene: boolean;
  shower: boolean;
  mood: boolean;
  exercise: boolean;
  sleep: boolean;
  activity: boolean;
  focus: boolean;
}

export interface EnginePrefs {
  enabled: boolean;
  reminderMode: EngineReminderMode;
  quietHoursEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
  timezone: string;
  wakeTime: string;
  breakfastTime: string;
  lunchTime: string;
  dinnerTime: string;
  sleepTime: string;
  waterGoalMl: number;
  categories: Record<string, boolean | undefined>;
}

export interface EngineInput {
  uid: string;
  prefs: EnginePrefs;
  today: EngineToday;
  sentIds: string[];
  lastOpenedAt?: string | null;
  lastNotificationAt?: string | null;
  now: Date;
  inactivityHours: number;
  minGapMinutes: number;
  maxOrdinaryPerDay: number;
  windowMinutes: number;
  historyDays: number;
  yesterdayWaterMl?: number;
  yesterdaySleepMinutes?: number;
  todaySleepMinutes?: number;
  breakfastStreak?: number;
}

export interface EngineDecision {
  slot: NotificationSlot;
  type: string;
  action: string;
  route: string;
  channelId: 'dailyme_reminders' | 'dailyme_summary' | 'dailyme_important';
  title: string;
  body: string;
  logicalId: string;
}

const SLOT_WINDOWS: Array<{
  slot: NotificationSlot;
  modes: EngineReminderMode[];
  category: string;
  minutes: (p: EnginePrefs) => number;
}> = [
  { slot: 'morning', modes: ['minimal', 'balanced', 'helpful'], category: 'morning', minutes: (p) => parseTimeToMinutes(p.wakeTime) + 5 },
  { slot: 'breakfast', modes: ['balanced', 'helpful'], category: 'breakfast', minutes: (p) => parseTimeToMinutes(p.breakfastTime) },
  { slot: 'water_am', modes: ['balanced', 'helpful'], category: 'water', minutes: (p) => parseTimeToMinutes(p.breakfastTime) + 120 },
  { slot: 'lunch', modes: ['minimal', 'balanced', 'helpful'], category: 'lunch', minutes: (p) => parseTimeToMinutes(p.lunchTime) },
  { slot: 'mood', modes: ['balanced', 'helpful'], category: 'mood', minutes: (p) => parseTimeToMinutes(p.lunchTime) + 90 },
  { slot: 'afternoon', modes: ['helpful'], category: 'activity', minutes: (p) => parseTimeToMinutes(p.lunchTime) + 180 },
  { slot: 'work', modes: ['helpful'], category: 'activity', minutes: (p) => parseTimeToMinutes(p.lunchTime) + 210 },
  { slot: 'water_pm', modes: ['balanced', 'helpful'], category: 'water', minutes: (p) => parseTimeToMinutes(p.lunchTime) + 200 },
  { slot: 'dinner', modes: ['balanced', 'helpful'], category: 'dinner', minutes: (p) => parseTimeToMinutes(p.dinnerTime) },
  { slot: 'hygiene', modes: ['helpful'], category: 'hygiene', minutes: (p) => parseTimeToMinutes(p.dinnerTime) + 50 },
  { slot: 'freshness', modes: ['helpful'], category: 'hygiene', minutes: (p) => parseTimeToMinutes(p.sleepTime) - 140 },
  { slot: 'evening', modes: ['balanced', 'helpful'], category: 'endOfDay', minutes: (p) => parseTimeToMinutes(p.sleepTime) - 60 },
  { slot: 'daily_summary', modes: ['minimal', 'balanced', 'helpful'], category: 'dailySummary', minutes: (p) => parseTimeToMinutes(p.sleepTime) - 20 },
];

const VARIANTS: Record<NotificationSlot, Array<{ title: string; body: string }>> = {
  morning: [
    { title: 'Good morning ☀️', body: 'What are you planning to accomplish today?' },
    { title: 'Morning ☀️', body: 'A new day — what’s one thing you’d like to get done?' },
    { title: 'Hey, good morning', body: 'How did you sleep, and what’s first today?' },
  ],
  breakfast: [
    { title: 'Good morning ☀️ Have you had breakfast?', body: 'A quick log is enough if you already ate.' },
    { title: 'Breakfast check 🍳', body: 'Did you eat this morning?' },
    { title: 'Morning check-in', body: 'Have you had something to eat?' },
  ],
  water_am: [
    { title: 'Quick hydration check 💧', body: 'Have you had some water recently?' },
    { title: 'Water check 💧', body: 'A glass now keeps the morning on track.' },
    { title: 'Hydration check', body: 'Grab some water if you haven’t yet.' },
  ],
  lunch: [
    { title: 'Have you had lunch?', body: 'Log it when you can — even a short note helps.' },
    { title: 'Lunch check 🍽', body: 'Have you eaten around now?' },
    { title: 'Midday check-in', body: 'Have you had lunch?' },
  ],
  afternoon: [
    { title: 'Quick check', body: 'What are you doing right now?' },
    { title: 'Afternoon check-in', body: 'How is the afternoon going?' },
    { title: 'Hey 👋', body: 'Want to log what you’re up to?' },
  ],
  mood: [
    { title: 'How are you feeling right now?', body: 'A one-tap mood log is enough.' },
    { title: 'Quick mood check', body: 'How are things landing today?' },
    { title: 'Check-in', body: 'How are you feeling right now?' },
  ],
  work: [
    { title: 'Focus check', body: 'Are you working on something important right now?' },
    { title: 'Work check-in', body: 'If you’re stuck, try just 10 minutes on the next small task.' },
    { title: 'Productivity nudge', body: 'Don’t finish everything — just start the next small step.' },
  ],
  water_pm: [
    { title: 'Quick water check 💧', body: 'Have you had some water recently?' },
    { title: 'Afternoon hydration', body: 'A few sips still count.' },
    { title: 'Hydration check', body: 'Grab some water if you haven’t.' },
  ],
  dinner: [
    { title: 'Dinner time 🍽 Have you eaten?', body: 'Log dinner when you’re ready.' },
    { title: 'Evening check', body: 'Have you had dinner?' },
    { title: 'Have you had your evening meal?', body: 'A quick note is enough.' },
  ],
  hygiene: [
    { title: 'Have you taken a shower today?', body: 'A short reset can help you feel fresher.' },
    { title: 'Hygiene check', body: 'Shower, face wash, or fresh clothes — whatever fits.' },
    { title: 'Feeling fresh?', body: 'Have you had a chance to freshen up today?' },
  ],
  freshness: [
    { title: 'Are you feeling fresh?', body: 'If not, a short shower, fresh clothes and water can help.' },
    { title: 'Evening reset', body: 'Would a quick freshen-up help tonight?' },
    { title: 'Freshness check', body: 'No pressure — just a gentle reminder.' },
  ],
  evening: [
    { title: 'How was your day?', body: 'A short evening check-in is enough.' },
    { title: 'Evening wrap', body: 'Want to look back on today?' },
    { title: 'End of day', body: 'How did today go?' },
  ],
  daily_summary: [
    { title: 'Your day so far', body: 'See what you logged — missing items stay as “Not logged”.' },
    { title: 'Daily snapshot', body: 'A calm look at meals, water, mood and habits.' },
    { title: 'Today’s summary', body: 'Open your report when you’re ready.' },
  ],
  inactivity: [
    { title: 'Where have you been? 👋', body: "DailyMe hasn’t heard from you today." },
    { title: 'Still here 👋', body: 'Want to check in when you have a minute?' },
    { title: 'Hey, we missed you', body: 'No rush — DailyMe is here when you are.' },
  ],
};

const ROUTES: Record<NotificationSlot, { type: string; action: string; route: string }> = {
  morning: { type: 'morning', action: 'open_now', route: '/now' },
  breakfast: { type: 'meal_reminder', action: 'open_meal_log', route: '/meal?kind=breakfast' },
  water_am: { type: 'water_reminder', action: 'open_water', route: '/quick' },
  lunch: { type: 'meal_reminder', action: 'open_meal_log', route: '/meal?kind=lunch' },
  afternoon: { type: 'activity_check', action: 'open_now', route: '/now' },
  mood: { type: 'mood_check', action: 'open_mood', route: '/now' },
  work: { type: 'work_check', action: 'open_now', route: '/now' },
  water_pm: { type: 'water_reminder', action: 'open_water', route: '/quick' },
  dinner: { type: 'meal_reminder', action: 'open_meal_log', route: '/meal?kind=dinner' },
  hygiene: { type: 'hygiene_reminder', action: 'open_hygiene', route: '/check-in?type=hygiene' },
  freshness: { type: 'freshness_check', action: 'open_hygiene', route: '/check-in?type=hygiene' },
  evening: { type: 'evening_check', action: 'open_report', route: '/day-report' },
  daily_summary: { type: 'daily_summary', action: 'open_report', route: '/day-report' },
  inactivity: { type: 'inactivity', action: 'open_today', route: '/(tabs)' },
};

export function notificationLogicalId(uid: string, slot: NotificationSlot, localDate: string): string {
  return `${uid}_${slot}_${localDate}_${slot}`;
}

export function categoryEnabled(prefs: EnginePrefs, category: string): boolean {
  const map: Record<string, string[]> = {
    morning: ['morning'],
    breakfast: ['breakfast', 'breakfastReminder'],
    lunch: ['lunch', 'lunchReminder'],
    dinner: ['dinner', 'dinnerReminder'],
    water: ['water', 'waterReminder'],
    mood: ['mood', 'moodReminder'],
    activity: ['activity', 'activityReminder', 'break'],
    hygiene: ['hygiene', 'hygieneReminder', 'sleep'],
    endOfDay: ['endOfDay', 'dailySummary'],
    dailySummary: ['dailySummary', 'endOfDay'],
    inactivity: ['inactivity', 'inactivityReminder'],
  };
  const keys = map[category] ?? [category];
  return keys.every((key) => prefs.categories[key] !== false);
}

export function inTimeWindow(nowMinutes: number, targetMinutes: number, windowMinutes: number): boolean {
  const span = 24 * 60;
  const target = ((targetMinutes % span) + span) % span;
  const delta = Math.abs(nowMinutes - target);
  return delta <= windowMinutes || delta >= span - windowMinutes;
}

function pickVariant(slot: NotificationSlot, uid: string, localDate: string): { title: string; body: string } {
  const list = VARIANTS[slot];
  let hash = 0;
  const key = `${uid}:${localDate}:${slot}`;
  for (let i = 0; i < key.length; i += 1) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  const picked = list[hash % list.length];
  return picked ?? { title: 'DailyMe', body: 'Quick check-in' };
}

function alreadySent(sentIds: string[], logicalId: string): boolean {
  return sentIds.includes(logicalId);
}

function skipIfLogged(slot: NotificationSlot, today: EngineToday, waterGoalMl: number): boolean {
  if (slot === 'breakfast' && today.breakfast) return true;
  if (slot === 'lunch' && today.lunch) return true;
  if (slot === 'dinner' && today.dinner) return true;
  if (slot === 'mood' && today.mood) return true;
  if ((slot === 'hygiene' || slot === 'freshness') && (today.shower || today.hygiene)) return true;
  if (slot === 'water_am' && (today.waterRecent || today.waterMl >= 250)) return true;
  if (slot === 'water_pm' && (today.waterRecent || today.waterMl >= Math.max(500, Math.floor(waterGoalMl / 2)))) return true;
  if (slot === 'afternoon' && today.activity) return true;
  if (slot === 'work' && today.focus) return true;
  if (slot === 'morning' && today.sleep) return true;
  return false;
}

export function buildDailySummaryBody(input: EngineInput): string {
  const t = input.today;
  const parts = [
    `Sleep: ${t.sleep ? 'logged' : 'Not logged'}`,
    `Breakfast: ${t.breakfast ? 'logged' : 'Not logged'}`,
    `Lunch: ${t.lunch ? 'logged' : 'Not logged'}`,
    `Dinner: ${t.dinner ? 'logged' : 'Not logged'}`,
    `Water: ${t.waterMl > 0 ? `${t.waterMl} ml` : 'Not logged'}`,
    `Hygiene: ${t.hygiene || t.shower ? 'logged' : 'Not logged'}`,
    `Mood: ${t.mood ? 'logged' : 'Not logged'}`,
    `Movement: ${t.exercise ? 'logged' : 'Not logged'}`,
  ];
  if (input.historyDays < 3) {
    parts.push('We need a few more days of data before we can compare your weekly trend.');
  } else {
    if (input.yesterdayWaterMl != null && t.waterMl > 0) {
      if (t.waterMl > input.yesterdayWaterMl) parts.push('Your water intake is higher than yesterday.');
      else if (t.waterMl < input.yesterdayWaterMl) parts.push('Your water intake is lower than yesterday.');
    }
    if (input.todaySleepMinutes != null && input.yesterdaySleepMinutes != null && input.todaySleepMinutes > 0) {
      const diff = input.todaySleepMinutes - input.yesterdaySleepMinutes;
      if (Math.abs(diff) >= 20) {
        parts.push(diff > 0 ? 'You slept more than yesterday.' : 'You slept less than yesterday.');
      }
    }
    if ((input.breakfastStreak ?? 0) >= 3) {
      parts.push(`You logged breakfast ${input.breakfastStreak} days in a row.`);
    }
  }
  return parts.join(' · ');
}

export function decideNextNotification(input: EngineInput): EngineDecision | null {
  const { prefs, today, uid } = input;
  if (!prefs.enabled) return null;
  if (prefs.categories.smartReminders === false) return null;

  const tz = prefs.timezone || 'UTC';
  const localDate = getLocalDate(input.now, tz);
  const nowMinutes = getLocalMinutes(input.now, tz);
  const quietOn = prefs.quietHoursEnabled !== false;

  if (quietOn && isInQuietHours(nowMinutes, prefs.quietHoursStart, prefs.quietHoursEnd)) {
    return null;
  }

  const todaySent = input.sentIds.filter((id) => id.includes(`_${localDate}_`));
  if (todaySent.length >= input.maxOrdinaryPerDay) return null;

  if (input.lastNotificationAt) {
    const gap = (input.now.getTime() - Date.parse(input.lastNotificationAt)) / 60000;
    if (Number.isFinite(gap) && gap < input.minGapMinutes) return null;
  }

  for (const row of SLOT_WINDOWS) {
    if (!row.modes.includes(prefs.reminderMode)) continue;
    if (!categoryEnabled(prefs, row.category)) continue;
    if (!inTimeWindow(nowMinutes, row.minutes(prefs), input.windowMinutes)) continue;
    if (skipIfLogged(row.slot, today, prefs.waterGoalMl)) continue;
    const logicalId = notificationLogicalId(uid, row.slot, localDate);
    if (alreadySent(input.sentIds, logicalId)) continue;
    const dest = ROUTES[row.slot];
    const copy = pickVariant(row.slot, uid, localDate);
    const body = row.slot === 'daily_summary' ? buildDailySummaryBody(input) : copy.body;
    return {
      slot: row.slot,
      type: dest.type,
      action: dest.action,
      route: dest.route,
      channelId: row.slot === 'daily_summary' ? 'dailyme_summary' : 'dailyme_reminders',
      title: copy.title,
      body,
      logicalId,
    };
  }

  const lastOpened = input.lastOpenedAt ? Date.parse(input.lastOpenedAt) : 0;
  const inactiveMs = input.inactivityHours * 60 * 60 * 1000;
  const inactive = !lastOpened || input.now.getTime() - lastOpened >= inactiveMs;
  if (inactive && categoryEnabled(prefs, 'inactivity') && nowMinutes >= 10 * 60 && nowMinutes <= 20 * 60) {
    const logicalId = notificationLogicalId(uid, 'inactivity', localDate);
    if (!alreadySent(input.sentIds, logicalId)) {
      const copy = pickVariant('inactivity', uid, localDate);
      const dest = ROUTES.inactivity;
      return {
        slot: 'inactivity',
        type: dest.type,
        action: dest.action,
        route: dest.route,
        channelId: 'dailyme_reminders',
        title: copy.title,
        body: copy.body,
        logicalId,
      };
    }
  }

  return null;
}
