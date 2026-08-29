const URGENT =
  /\b(chest pain|can't breathe|cant breathe|suicidal|suicide|overdose|unconscious|severe bleeding|stroke)\b/i;

export function noteResponse(text: string): { reply: string; urgent: boolean } {
  if (URGENT.test(text)) {
    return {
      urgent: true,
      reply:
        "That sounds serious. DailyMe can't provide emergency care. Please seek appropriate medical help now, or contact local emergency services.",
    };
  }
  return {
    urgent: false,
    reply:
      "That sounds uncomfortable. I can help you track how you're feeling, but I can't diagnose medical conditions. Rest, water, and a quieter environment are low-risk starting points. If this continues or you're concerned, consider speaking with a qualified healthcare professional.",
  };
}

export function hygieneEncouragement(done: boolean): string {
  if (done) return 'Personal care complete ✨';
  return 'No problem. A quick shower might help you feel more refreshed.';
}

export function weatherSuggestion(celsius?: number, hot?: boolean): string {
  if (hot || (celsius !== undefined && celsius >= 30)) {
    return "Looks hot today. Remember to stay hydrated.";
  }
  if (celsius !== undefined && celsius <= 10) {
    return "It's on the cooler side. A warm drink and layers can help.";
  }
  return 'Noted. Dress for how you feel, and keep water nearby.';
}

export function smokingCompareCopy(today: number, yesterday: number): string {
  const delta = yesterday - today;
  if (delta > 0) return `That's ${delta} fewer than yesterday. Reducing smoking can have important health benefits. If you'd like to quit or reduce, consider speaking with a qualified healthcare professional.`;
  return `${today} today. If you're working toward reducing, you're currently ${today > yesterday ? 'above' : 'around'} yesterday's count.`;
}
