export type NowActivity =
  | 'working'
  | 'studying'
  | 'exercising'
  | 'eating'
  | 'resting'
  | 'travelling'
  | 'socializing'
  | 'sleeping'
  | 'other';

export const NOW_ACTIVITIES: { id: NowActivity; label: string; emoji: string }[] = [
  { id: 'working', label: 'Working', emoji: '💻' },
  { id: 'studying', label: 'Studying', emoji: '📚' },
  { id: 'exercising', label: 'Exercising', emoji: '🏃' },
  { id: 'eating', label: 'Eating', emoji: '🍽' },
  { id: 'resting', label: 'Resting', emoji: '🌿' },
  { id: 'travelling', label: 'Travelling', emoji: '🚌' },
  { id: 'socializing', label: 'Socializing', emoji: '👋' },
  { id: 'sleeping', label: 'Sleeping', emoji: '😴' },
  { id: 'other', label: 'Other', emoji: '✨' },
];

export function coachForNowText(text: string): { reply: string; offerFocus: boolean } {
  const t = text.toLowerCase();
  const stuck = /don't feel|dont feel|unmotivated|can't focus|cant focus|tired of|not feel like/.test(t);
  if (stuck) {
    return {
      reply: "That happens. Try working for just 10 minutes instead of focusing on finishing the whole task.",
      offerFocus: true,
    };
  }
  if (/break|rest|exhausted/.test(t)) {
    return { reply: 'A short pause can help. Five to ten minutes away from the screen is enough.', offerFocus: false };
  }
  return { reply: "Got it. I'm here when you want a tiny next step.", offerFocus: true };
}

export function moodSupport(key: string, text?: string): string {
  if (key === 'irritated' || /irritat/.test(text ?? '')) {
    return "You've marked yourself as irritated today. A short walk, some water, a break from your screen, or talking to someone you trust may help. If this continues or becomes difficult to manage, consider speaking with a qualified professional.";
  }
  if (key === 'low' || key === 'stressed') {
    return 'A small reset can help — water, a short walk, or a few slow breaths. If this continues or feels hard to manage, consider speaking with a qualified professional.';
  }
  if (key === 'tired') {
    return 'A short break or an earlier wind-down tonight may help you feel more refreshed.';
  }
  return 'Thanks for checking in.';
}

export type FocusResult = 'completed' | 'partial' | 'distracted' | 'didnt_start';

export const FOCUS_RESULTS: { id: FocusResult; label: string }[] = [
  { id: 'completed', label: 'Completed' },
  { id: 'partial', label: 'Partially completed' },
  { id: 'distracted', label: 'Distracted' },
  { id: 'didnt_start', label: "Didn't start" },
];
