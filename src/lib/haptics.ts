import { AccessibilityInfo, Platform } from 'react-native';

let reduceMotion = false;
if (Platform.OS !== 'web') {
  AccessibilityInfo.isReduceMotionEnabled?.().then((v) => {
    reduceMotion = Boolean(v);
  });
  AccessibilityInfo.addEventListener?.('reduceMotionChanged', (v) => {
    reduceMotion = Boolean(v);
  });
}

export function prefersReducedMotion(): boolean {
  return reduceMotion;
}

export async function tapFeedback(): Promise<void> {
  if (prefersReducedMotion()) return;
  try {
    const Haptics = await import('expo-haptics');
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  } catch {
    // Haptics are optional.
  }
}

export async function successFeedback(): Promise<void> {
  if (prefersReducedMotion()) return;
  try {
    const Haptics = await import('expo-haptics');
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } catch {
    // optional
  }
}
