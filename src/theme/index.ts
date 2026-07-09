export { palette, accentGradient, glassGradient, posterGradients } from './colors';
export type { Palette } from './colors';
export { typography } from './typography';
export type { TypographyToken } from './typography';
export { spacing, radius, hitSlop, shadow, springs } from './layout';

import { palette } from './colors';

/** Convenience alias so screens can `import { colors } from '@/theme'`. */
export const colors = palette;
