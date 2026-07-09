/**
 * ASTERA color system — Dark Mode only.
 *
 * A near-black cinematic base with a warm copper / amber / ember accent family
 * inspired by Rave. No purple, no neon. All values are calibrated for AA
 * contrast against the #090909 background.
 */

export const palette = {
  // Backgrounds & surfaces
  background: '#090909',
  surface: '#121212',
  surfaceSecondary: '#1A1A1A',
  surfaceElevated: '#1F1D1B',

  // Glass materials (used over blurred content)
  glass: 'rgba(255,255,255,0.08)',
  glassStrong: 'rgba(255,255,255,0.12)',
  glassHairline: 'rgba(255,255,255,0.10)',
  glassBorder: 'rgba(255,255,255,0.06)',

  // Warm accent family — copper → amber → ember → brown
  copper: '#C87F4C',
  amber: '#E3A366',
  amberBright: '#F0B876',
  ember: '#B5612E',
  brown: '#6E4328',
  brownDeep: '#3A2517',

  // Accent tints
  accentTintSoft: 'rgba(200,127,76,0.14)',
  accentTintMed: 'rgba(200,127,76,0.22)',

  // Text
  textPrimary: '#F5F1EC',
  textSecondary: 'rgba(245,241,236,0.62)',
  textTertiary: 'rgba(245,241,236,0.38)',
  textQuaternary: 'rgba(245,241,236,0.22)',

  // Semantic
  live: '#E3A366',
  online: '#4ED08A',
  danger: '#E5484D',
  white: '#FFFFFF',
  black: '#000000',

  // Hairline separators
  separator: 'rgba(255,255,255,0.07)',
  separatorStrong: 'rgba(255,255,255,0.12)',
} as const;

/** Warm button / highlight gradient — top-left copper to bottom-right ember. */
export const accentGradient = ['#D68B52', '#A85A2E', '#7C4326'] as const;

/** Subtle surface sheen used on large glass cards. */
export const glassGradient = [
  'rgba(255,255,255,0.06)',
  'rgba(255,255,255,0.015)',
] as const;

/** Poster placeholder gradients keyed loosely by mood. */
export const posterGradients: readonly (readonly [string, string])[] = [
  ['#2A3038', '#0E1014'],
  ['#3A2A20', '#120B07'],
  ['#243036', '#0B0F12'],
  ['#332A2A', '#120C0C'],
  ['#2C2A32', '#0D0C11'],
  ['#38301F', '#12100A'],
];

export type Palette = typeof palette;
