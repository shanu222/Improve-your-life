import { router } from 'expo-router';

export function routeForNotificationData(data: Record<string, unknown> | undefined): string {
  const route = typeof data?.route === 'string' ? data.route : '';
  if (route.startsWith('/')) return route;
  const action = String(data?.action ?? '');
  const type = String(data?.type ?? '');
  if (action === 'open_meal_log' || type === 'meal_reminder') {
    if (route.includes('lunch') || String(data?.slot) === 'lunch') return '/meal?kind=lunch';
    if (route.includes('dinner') || String(data?.slot) === 'dinner') return '/meal?kind=dinner';
    return '/meal?kind=breakfast';
  }
  if (action === 'open_mood' || type === 'mood_check') return '/now';
  if (action === 'open_water' || type === 'water_reminder') return '/quick';
  if (action === 'open_hygiene' || type === 'hygiene_reminder' || type === 'freshness_check') {
    return '/check-in?type=hygiene';
  }
  if (action === 'open_report' || type === 'daily_summary' || type === 'evening_check') return '/day-report';
  if (action === 'open_now') return '/now';
  return '/(tabs)';
}

export function openNotificationRoute(data: Record<string, unknown> | undefined): void {
  const href = routeForNotificationData(data);
  try {
    router.push(href as never);
  } catch {
    router.replace('/(tabs)');
  }
}
