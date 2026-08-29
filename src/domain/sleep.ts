export function sleepDurationMinutes(sleepTime: string, wakeTime: string): number {
  const [sh, sm] = sleepTime.split(':').map(Number);
  const [wh, wm] = wakeTime.split(':').map(Number);
  if ([sh, sm, wh, wm].some((n) => Number.isNaN(n))) return 0;
  const s = (sh ?? 0) * 60 + (sm ?? 0);
  const w = (wh ?? 0) * 60 + (wm ?? 0);
  if (w === s) return 0;
  if (w > s) return w - s;
  return 24 * 60 - s + w;
}

export type SleepBand = 'short' | 'more' | 'great' | 'long';

export function sleepBand(minutes: number, goalMinutes = 480): { key: SleepBand; label: string } {
  const hours = minutes / 60;
  if (hours < 6) return { key: 'short', label: 'Short sleep' };
  if (hours < 7) return { key: 'more', label: 'Could use more' };
  if (hours <= 9 || minutes <= goalMinutes + 60) return { key: 'great', label: 'Great' };
  return { key: 'long', label: 'Longer than your usual target' };
}

export function sleepEncouragement(minutes: number, goalMinutes = 480): string {
  const hours = formatHoursMinutes(minutes);
  if (minutes <= 0) return 'Log last night when you can — even a rough estimate helps.';
  if (minutes < 6 * 60) {
    return `You got ${hours}. A little more rest tonight may help you feel more refreshed.`;
  }
  if (minutes < goalMinutes) {
    return `You got ${hours}. A bit closer to your ${formatHoursMinutes(goalMinutes)} goal tonight could feel nice.`;
  }
  if (minutes <= 9 * 60) return `You got ${hours}. That looks like a solid night.`;
  return `You got ${hours}. If that felt like too much, you can ease toward your usual target tonight.`;
}

export function formatHoursMinutes(minutes: number): string {
  const abs = Math.max(0, Math.round(minutes));
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  if (m === 0) return `${h}h`;
  return `${h}h ${String(m).padStart(2, '0')}m`;
}
