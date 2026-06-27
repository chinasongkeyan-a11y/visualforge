import type { Theme } from './types';

/**
 * Built-in themes — redesigned for premium aesthetics and high contrast.
 *
 * Design principles:
 * - Dark themes: bg is deep, text is pure white/near-white (never colored text as body)
 * - Light themes: bg is off-white, text is near-black
 * - primaryColor is bright/vivid against bg (used for accents, not body text)
 * - cardBgColor is always distinct from bgColor (lighter on dark themes, white on light)
 * - chartColors are all bright/distinct, never similar to bg
 * - Font sizes tuned for 720x1280 canvas (mobile-first)
 */
export const THEMES: Theme[] = [
  // ── 1. Tech Blue — Deep navy + electric blue ──────────────────────
  {
    id: 'tech_blue',
    name: 'Tech Blue',
    tokens: {
      primaryColor: '#3b82f6',
      secondaryColor: '#06b6d4',
      accentColor: '#f59e0b',
      bgColor: '#0a1628',
      bgDarkColor: '#06101f',
      textColor: '#ffffff',
      textSecondaryColor: '#8ba3c7',
      cardBgColor: '#0f1e35',
      cardBgDarkColor: '#0a1628',
      chartColors: ['#3b82f6', '#06b6d4', '#f59e0b', '#10b981', '#ec4899'],
      fontFamily: '"WQY Micro Hei", "PingFang SC", "Microsoft YaHei", sans-serif',
      titleFontSize: 80,
      subtitleFontSize: 48,
      bodyFontSize: 38,
      borderRadius: 16,
      shadow: '0 8px 32px rgba(0,0,0,0.4)',
    },
  },

  // ── 2. Dark Mode — Carbon black + emerald ─────────────────────────
  {
    id: 'dark_mode',
    name: 'Dark Mode',
    tokens: {
      primaryColor: '#10b981',
      secondaryColor: '#3b82f6',
      accentColor: '#f59e0b',
      bgColor: '#0f0f0f',
      bgDarkColor: '#050505',
      textColor: '#f5f5f5',
      textSecondaryColor: '#9ca3af',
      cardBgColor: '#1a1a1a',
      cardBgDarkColor: '#0f0f0f',
      chartColors: ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#a855f7'],
      fontFamily: '"WQY Micro Hei", "PingFang SC", "Microsoft YaHei", sans-serif',
      titleFontSize: 80,
      subtitleFontSize: 48,
      bodyFontSize: 38,
      borderRadius: 16,
      shadow: '0 8px 32px rgba(0,0,0,0.6)',
    },
  },

  // ── 3. Business Gray — Charcoal + steel blue ──────────────────────
  {
    id: 'business_gray',
    name: 'Business Gray',
    tokens: {
      primaryColor: '#4a9eff',
      secondaryColor: '#7c8db5',
      accentColor: '#ff6b6b',
      bgColor: '#1c1f26',
      bgDarkColor: '#121419',
      textColor: '#e8eaed',
      textSecondaryColor: '#9aa0a6',
      cardBgColor: '#252830',
      cardBgDarkColor: '#1c1f26',
      chartColors: ['#4a9eff', '#7c8db5', '#ff6b6b', '#26c6da', '#ffca28'],
      fontFamily: '"WQY Micro Hei", "PingFang SC", "Microsoft YaHei", sans-serif',
      titleFontSize: 80,
      subtitleFontSize: 48,
      bodyFontSize: 38,
      borderRadius: 12,
      shadow: '0 6px 24px rgba(0,0,0,0.4)',
    },
  },

  // ── 4. Vibrant Orange — Dark coffee + amber ───────────────────────
  {
    id: 'vibrant_orange',
    name: 'Vibrant Orange',
    tokens: {
      primaryColor: '#ff8c42',
      secondaryColor: '#e07a5f',
      accentColor: '#3d9eff',
      bgColor: '#1a0f0a',
      bgDarkColor: '#0d0705',
      textColor: '#fff5ed',
      textSecondaryColor: '#b08968',
      cardBgColor: '#251611',
      cardBgDarkColor: '#1a0f0a',
      chartColors: ['#ff8c42', '#e07a5f', '#3d9eff', '#81b29a', '#f2cc8f'],
      fontFamily: '"WQY Micro Hei", "PingFang SC", "Microsoft YaHei", sans-serif',
      titleFontSize: 80,
      subtitleFontSize: 48,
      bodyFontSize: 38,
      borderRadius: 20,
      shadow: '0 8px 32px rgba(255,140,66,0.2)',
    },
  },

  // ── 5. Warm Earth — Deep espresso + antique gold ─────────────────
  {
    id: 'warm_earth',
    name: 'Warm Earth',
    tokens: {
      primaryColor: '#d4a056',
      secondaryColor: '#c4915c',
      accentColor: '#7eb8a5',
      bgColor: '#1e1410',
      bgDarkColor: '#110a08',
      textColor: '#f5e6d3',
      textSecondaryColor: '#a08878',
      cardBgColor: '#2a1c16',
      cardBgDarkColor: '#1e1410',
      chartColors: ['#d4a056', '#c4915c', '#7eb8a5', '#cb997e', '#a5a58d'],
      fontFamily: '"WQY Micro Hei", "PingFang SC", "Microsoft YaHei", serif',
      titleFontSize: 80,
      subtitleFontSize: 48,
      bodyFontSize: 38,
      borderRadius: 12,
      shadow: '0 6px 24px rgba(30,20,16,0.4)',
    },
  },

  // ── 6. Minimal White — Off-white + bold black ─────────────────────
  {
    id: 'minimal_white',
    name: 'Minimal White',
    tokens: {
      primaryColor: '#111111',
      secondaryColor: '#444444',
      accentColor: '#ef4444',
      bgColor: '#fafafa',
      bgDarkColor: '#f0f0f0',
      textColor: '#111111',
      textSecondaryColor: '#666666',
      cardBgColor: '#ffffff',
      cardBgDarkColor: '#f5f5f5',
      chartColors: ['#111111', '#666666', '#ef4444', '#3b82f6', '#10b981'],
      fontFamily: '"WQY Micro Hei", "PingFang SC", "Microsoft YaHei", sans-serif',
      titleFontSize: 80,
      subtitleFontSize: 48,
      bodyFontSize: 38,
      borderRadius: 8,
      shadow: '0 4px 20px rgba(0,0,0,0.08)',
    },
  },

  // ── 7. Neon Night — Black + neon cyan (readable white text) ───────
  {
    id: 'neon_night',
    name: 'Neon Night',
    tokens: {
      primaryColor: '#00e5ff',
      secondaryColor: '#ff0080',
      accentColor: '#ccff00',
      bgColor: '#050508',
      bgDarkColor: '#020203',
      textColor: '#ffffff',
      textSecondaryColor: '#7788aa',
      cardBgColor: '#0d0d1a',
      cardBgDarkColor: '#050508',
      chartColors: ['#00e5ff', '#ff0080', '#ccff00', '#ff6b35', '#9d4edd'],
      fontFamily: '"WQY Micro Hei", "PingFang SC", "Microsoft YaHei", sans-serif',
      titleFontSize: 80,
      subtitleFontSize: 48,
      bodyFontSize: 38,
      borderRadius: 20,
      shadow: '0 0 30px rgba(0,229,255,0.25)',
    },
  },
];

/** Get theme by ID, fallback to tech_blue */
export function getTheme(themeId: string): Theme {
  return THEMES.find((t) => t.id === themeId) ?? THEMES[0];
}
