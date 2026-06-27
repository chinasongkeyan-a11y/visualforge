import type { Theme } from './types';

/** Built-in themes for P0 MVP */
export const THEMES: Theme[] = [
  {
    id: 'tech_blue',
    name: 'Tech Blue',
    tokens: {
      primaryColor: '#0071e3',
      secondaryColor: '#5ac8fa',
      accentColor: '#ff6b35',
      bgColor: '#f5f5f7',
      bgDarkColor: '#1a1a2e',
      textColor: '#1d1d1f',
      textSecondaryColor: '#6e6e73',
      cardBgColor: '#ffffff',
      cardBgDarkColor: '#16213e',
      chartColors: ['#0071e3', '#5ac8fa', '#ff6b35', '#34c759', '#ff9500'],
      fontFamily: '"WQY Micro Hei", "PingFang SC", "Microsoft YaHei", sans-serif',
      titleFontSize: 64,
      subtitleFontSize: 36,
      bodyFontSize: 28,
      borderRadius: 16,
      shadow: '0 8px 32px rgba(0,0,0,0.12)',
    },
  },
  {
    id: 'dark_mode',
    name: 'Dark Mode',
    tokens: {
      primaryColor: '#00d4aa',
      secondaryColor: '#00a8ff',
      accentColor: '#ff6b35',
      bgColor: '#0d1117',
      bgDarkColor: '#161b22',
      textColor: '#e6edf3',
      textSecondaryColor: '#7d8590',
      cardBgColor: '#161b22',
      cardBgDarkColor: '#21262d',
      chartColors: ['#00d4aa', '#00a8ff', '#ff6b35', '#facc15', '#a78bfa'],
      fontFamily: '"WQY Micro Hei", "PingFang SC", "Microsoft YaHei", sans-serif',
      titleFontSize: 64,
      subtitleFontSize: 36,
      bodyFontSize: 28,
      borderRadius: 16,
      shadow: '0 8px 32px rgba(0,0,0,0.4)',
    },
  },
];

/** Get theme by ID, fallback to tech_blue */
export function getTheme(themeId: string): Theme {
  return THEMES.find((t) => t.id === themeId) ?? THEMES[0];
}
