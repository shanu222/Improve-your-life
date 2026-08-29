const pad = (n: number) => String(n).padStart(2, '0');

export function detectTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}

export function getLocalDate(now: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  const year = parts.find((p) => p.type === 'year')?.value;
  const month = parts.find((p) => p.type === 'month')?.value;
  const day = parts.find((p) => p.type === 'day')?.value;
  if (!year || !month || !day) {
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  }
  return `${year}-${month}-${day}`;
}

export function getLocalMinutes(now: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(now);
  const hour = Number(parts.find((p) => p.type === 'hour')?.value ?? 0);
  const minute = Number(parts.find((p) => p.type === 'minute')?.value ?? 0);
  return hour * 60 + minute;
}

export function getLocalTimeHHmm(now: Date, timeZone: string): string {
  const mins = getLocalMinutes(now, timeZone);
  return minutesToHHmm(mins);
}

export function parseTimeToMinutes(hhmm: string): number {
  const match = /^(\d{1,2}):(\d{2})$/.exec(hhmm.trim());
  if (!match) return 0;
  const h = Number(match[1]);
  const m = Number(match[2]);
  if (h < 0 || h > 23 || m < 0 || m > 59) return 0;
  return h * 60 + m;
}

export function minutesToHHmm(total: number): string {
  const normalized = ((total % (24 * 60)) + 24 * 60) % (24 * 60);
  const h = Math.floor(normalized / 60);
  const m = normalized % 60;
  return `${pad(h)}:${pad(m)}`;
}

export function addDays(localDate: string, days: number): string {
  const [y, mo, d] = localDate.split('-').map(Number);
  const dt = new Date(Date.UTC(y ?? 1970, (mo ?? 1) - 1, d ?? 1));
  dt.setUTCDate(dt.getUTCDate() + days);
  return `${dt.getUTCFullYear()}-${pad(dt.getUTCMonth() + 1)}-${pad(dt.getUTCDate())}`;
}

export function dateDiffDays(a: string, b: string): number {
  const [ay, am, ad] = a.split('-').map(Number);
  const [by, bm, bd] = b.split('-').map(Number);
  const da = Date.UTC(ay ?? 0, (am ?? 1) - 1, ad ?? 1);
  const db = Date.UTC(by ?? 0, (bm ?? 1) - 1, bd ?? 1);
  return Math.round((db - da) / 86_400_000);
}

export function startOfWeek(localDate: string): string {
  const [y, mo, d] = localDate.split('-').map(Number);
  const dt = new Date(Date.UTC(y ?? 1970, (mo ?? 1) - 1, d ?? 1));
  const day = dt.getUTCDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  dt.setUTCDate(dt.getUTCDate() + mondayOffset);
  return `${dt.getUTCFullYear()}-${pad(dt.getUTCMonth() + 1)}-${pad(dt.getUTCDate())}`;
}

export function greetingForMinutes(minutes: number): 'morning' | 'afternoon' | 'evening' {
  if (minutes < 12 * 60) return 'morning';
  if (minutes < 17 * 60) return 'afternoon';
  return 'evening';
}

export function formatGreeting(minutes: number, name?: string): string {
  const part = greetingForMinutes(minutes);
  const word = part === 'morning' ? 'Good morning' : part === 'afternoon' ? 'Good afternoon' : 'Good evening';
  const trimmed = name?.trim();
  return trimmed ? `${word}, ${trimmed} 👋` : `${word} 👋`;
}

export function formatDuration(minutes: number): string {
  const abs = Math.max(0, Math.round(minutes));
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export function formatMl(ml: number, units: 'metric' | 'imperial' = 'metric'): string {
  if (units === 'imperial') {
    const oz = ml / 29.5735;
    return `${oz.toFixed(oz >= 10 ? 0 : 1)} oz`;
  }
  if (ml >= 1000) return `${(ml / 1000).toFixed(ml % 1000 === 0 ? 1 : 2).replace(/\.00$/, '.0')}L`;
  return `${Math.round(ml)} ml`;
}

export function glassesFromMl(ml: number, glassMl = 250): number {
  return ml / glassMl;
}

export function isInQuietHours(currentMinutes: number, start: string, end: string): boolean {
  const s = parseTimeToMinutes(start);
  const e = parseTimeToMinutes(end);
  if (s === e) return false;
  if (s < e) return currentMinutes >= s && currentMinutes < e;
  return currentMinutes >= s || currentMinutes < e;
}

export function localDateFromOccurredAt(iso: string, timeZone: string): string {
  return getLocalDate(new Date(iso), timeZone);
}
