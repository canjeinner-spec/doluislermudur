/** Spacing, radii, and shadow tokens shared across ASTERA. */

export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 40,
} as const;

export const radius = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 18,
  xl: 22,
  xxl: 28,
  pill: 999,
} as const;

export const hitSlop = { top: 8, bottom: 8, left: 8, right: 8 } as const;

/** Soft, diffuse shadows — never hard or gamey. iOS reads these natively. */
export const shadow = {
  none: {},
  soft: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 6,
  },
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 10,
  },
  floating: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.5,
    shadowRadius: 30,
    elevation: 16,
  },
  accentGlow: {
    shadowColor: '#B5612E',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.45,
    shadowRadius: 22,
    elevation: 12,
  },
} as const;

/** Standard spring for interactive/native-feeling motion. */
export const springs = {
  gentle: { damping: 22, stiffness: 220, mass: 1 },
  snappy: { damping: 26, stiffness: 320, mass: 0.9 },
  soft: { damping: 20, stiffness: 160, mass: 1 },
} as const;
