import { useColorScheme } from 'react-native';
import { useAppStore } from '../store/appStore';

export const palette = {
  coral: '#E85D4C',
  coralSoft: '#FFD9D2',
  ink: '#1A1613',
  sand: '#F3EEE6',
  cream: '#FFFBF7',
  mist: '#E7E1D8',
  sleep: '#7C6BF0',
  water: '#3B9EFF',
  food: '#F5A524',
  movement: '#34C759',
  mood: '#FF6B9D',
  care: '#2EC4B6',
  habits: '#F5C518',
  good: '#2F9E6B',
  almost: '#D97706',
  attention: '#C2410C',
};

export type Theme = {
  scheme: 'light' | 'dark';
  bg: string;
  bgAlt: string;
  surface: string;
  surface2: string;
  ink: string;
  muted: string;
  faint: string;
  line: string;
  accent: string;
  accentSoft: string;
  onAccent: string;
  cardShadow: string;
  overlay: string;
  tab: string;
  good: string;
  almost: string;
  attention: string;
  sleep: string;
  water: string;
  food: string;
  movement: string;
  mood: string;
  care: string;
  habits: string;
};

export const lightTheme: Theme = {
  scheme: 'light',
  bg: '#F3EEE6',
  bgAlt: '#EBE4D9',
  surface: '#FFFBF7',
  surface2: '#F7F1EA',
  ink: '#1A1613',
  muted: '#6F675F',
  faint: '#9A9288',
  line: '#E6DFD4',
  accent: '#E85D4C',
  accentSoft: '#FFD9D2',
  onAccent: '#FFFFFF',
  cardShadow: 'rgba(44, 32, 22, 0.08)',
  overlay: 'rgba(26, 22, 19, 0.45)',
  tab: '#FFFBF7',
  good: '#2F9E6B',
  almost: '#C47B17',
  attention: '#C2410C',
  sleep: '#7C6BF0',
  water: '#2B8CFF',
  food: '#E39412',
  movement: '#2FB24F',
  mood: '#E85A8A',
  care: '#1DB3A6',
  habits: '#D4A017',
};

export const darkTheme: Theme = {
  scheme: 'dark',
  bg: '#12110F',
  bgAlt: '#1A1815',
  surface: '#1C1B19',
  surface2: '#262421',
  ink: '#FAF7F2',
  muted: '#B7AFA6',
  faint: '#8A8278',
  line: '#2E2B27',
  accent: '#FF7A68',
  accentSoft: '#3A2420',
  onAccent: '#1A1613',
  cardShadow: 'rgba(0,0,0,0.35)',
  overlay: 'rgba(0,0,0,0.55)',
  tab: '#161513',
  good: '#3DCE88',
  almost: '#E0A03A',
  attention: '#F0754A',
  sleep: '#9B90FF',
  water: '#5AB0FF',
  food: '#FFB44A',
  movement: '#4CD964',
  mood: '#FF86B0',
  care: '#3ED6C8',
  habits: '#F5C518',
};

export function useAppTheme(): Theme {
  const preference = useAppStore((s) => s.settings?.theme ?? 'system');
  const system = useColorScheme();
  const scheme = preference === 'system' ? (system === 'dark' ? 'dark' : 'light') : preference;
  return scheme === 'dark' ? darkTheme : lightTheme;
}

export const fonts = {
  regular: 'System',
  medium: 'System',
  semibold: 'System',
  bold: 'System',
};

export const radii = { sm: 12, md: 18, lg: 24, xl: 32, full: 999 };
export const space = { xs: 6, sm: 10, md: 16, lg: 24, xl: 32 };
