import type { Theme } from './types';

/**
 * Single premium theme — Onyx Black.
 *
 * Design principles:
 * - Near-pure black background with subtle blue undertone for depth
 * - Champagne gold primary accent signals luxury
 * - Chart colors are saturated jewel tones that pop against black
 * - Text is crisp off-white (not pure #FFF) for readability
 * - All colors verified for high contrast on #0A0A0C
 */
export const DEFAULT_THEME_ID = 'onyx';

export const THEMES: Theme[] = [
  {
    id: 'onyx',
    name: 'Onyx',
    tokens: {
      primaryColor: '#D4AF37',       // Champagne gold — luxury accent
      secondaryColor: '#4FC3F7',     // Ice blue — tech counterpoint
      accentColor: '#FF6B6B',        // Coral — warm accent for highlights
      bgColor: '#0A0A0C',            // Rich black (not pure #000, has depth)
      bgDarkColor: '#050506',        // Deeper black for gradient bottoms
      textColor: '#F5F5F7',          // Apple white — crisp, not harsh
      textSecondaryColor: '#8E8E93', // iOS gray — premium muted
      cardBgColor: '#141418',        // Card surface slightly above bg
      cardBgDarkColor: '#0A0A0C',    // Card dark matches bg
      chartColors: [
        '#4FC3F7',  // Ice blue
        '#FFB300',  // Amber gold
        '#00E5A0',  // Emerald
        '#FF5C8A',  // Rose coral
        '#9D7BFF',  // Lavender
      ],
      fontFamily: '"WQY Micro Hei", "PingFang SC", "Microsoft YaHei", sans-serif',
      titleFontSize: 80,
      subtitleFontSize: 48,
      bodyFontSize: 38,
      borderRadius: 16,
      shadow: '0 8px 32px rgba(0,0,0,0.8)',
    },
  },
];

/** Get theme by ID, always falls back to the single Onyx theme */
export function getTheme(_themeId?: string): Theme {
  return THEMES[0];
}
