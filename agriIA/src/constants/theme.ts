import '@/global.css';
import { Platform } from 'react-native';
import { useAppTheme } from '@/context/ThemeContext';

export const Colors = {
  light: {
    text:               '#000000',
    background:         '#ffffff',
    backgroundElement:  '#F0F0F3',
    backgroundSelected: '#E0E1E6',
    textSecondary:      '#60646C',
    primary:            '#3cb95a',
    primaryDark:        '#2d9148',
    primaryLight:       '#6fe08d',
    primaryFaint:       '#c8ebd0',
    primaryBg:          '#f4f9f5',
    primaryBorder:      'rgba(60,185,90,0.18)', // ← ajouté
    card:               '#ffffff',
    cardBorder:         'rgba(0,0,0,0.07)',
    warning:            '#f5a623',
    danger:             '#e74c3c',
    info:               '#3498db',
    success:            '#27ae60',
  },
  dark: {
    text:               '#ffffff',
    background:         '#000000',
    backgroundElement:  '#212225',
    backgroundSelected: '#2E3135',
    textSecondary:      '#B0B4BA',
    primary:            '#3cb95a',
    primaryDark:        '#27a047',
    primaryLight:       '#6fe08d',
    primaryFaint:       '#8fd4a0',
    primaryBg:          '#0d1f10',
    primaryBorder:      'rgba(60,185,90,0.25)', // ← ajouté
    card:               '#1a1d1a',
    cardBorder:         'rgba(255,255,255,0.08)',
    warning:            '#f5a623',
    danger:             '#e74c3c',
    info:               '#3498db',
    success:            '#27ae60',
  },
  splash: {
    bgDark:      '#1a3a1f',
    bgMid:       '#2d6a35',
    green:       '#3cb95a',
    greenLight:  '#6fe08d',
    greenPale:   '#8fd4a0',
    greenFaint:  '#c8ebd0',
    white:       '#ffffff',
    whiteFaded:  'rgba(255,255,255,0.07)',
    whiteBorder: 'rgba(255,255,255,0.15)',
    textMuted:   'rgba(143,212,160,0.5)',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios:     { sans: 'system-ui', serif: 'ui-serif', rounded: 'ui-rounded', mono: 'ui-monospace' },
  default: { sans: 'normal',    serif: 'serif',    rounded: 'normal',     mono: 'monospace'    },
  web:     { sans: 'var(--font-display)', serif: 'var(--font-serif)', rounded: 'var(--font-rounded)', mono: 'var(--font-mono)' },
});

export const Spacing = {
  half: 2, one: 4, two: 8, three: 16, four: 24, five: 32, six: 64,
  xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 64,
} as const;

export const Radius = { sm: 8, md: 12, lg: 18, xl: 24, full: 999 } as const;

export const Shadows = {
  green: { shadowColor: '#3cb95a', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.35, shadowRadius: 16, elevation: 10 },
  card:  { shadowColor: '#000000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8,  elevation: 4  },
} as const;

export const BottomTabInset  = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;

export function useThemeColors() {
  const { isDark } = useAppTheme();
  return { colors: Colors[isDark ? 'dark' : 'light'], isDark } as const;
}