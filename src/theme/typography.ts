import { Platform, TextStyle } from 'react-native';

/**
 * Typography scale mapped to Apple's Human Interface Guidelines text styles.
 * On iOS we lean on the system font (San Francisco / SF Pro). On Android the
 * platform default (Roboto) is substituted automatically, and we nudge weights
 * so the hierarchy reads the same on both.
 */

const systemFont = Platform.select({
  ios: undefined, // undefined => San Francisco
  default: undefined, // Roboto on Android; keeps text engine native
});

type Weight = TextStyle['fontWeight'];

const weights: Record<string, Weight> = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  heavy: '800',
};

function style(
  fontSize: number,
  lineHeight: number,
  fontWeight: Weight,
  letterSpacing = 0
): TextStyle {
  return {
    fontFamily: systemFont,
    fontSize,
    lineHeight,
    fontWeight,
    letterSpacing,
  };
}

export const typography = {
  largeTitle: style(34, 41, weights.bold, 0.37),
  title1: style(28, 34, weights.bold, 0.36),
  title2: style(22, 28, weights.bold, 0.35),
  title3: style(20, 25, weights.semibold, 0.38),
  headline: style(17, 22, weights.semibold, -0.43),
  body: style(17, 22, weights.regular, -0.43),
  bodyEmphasized: style(17, 22, weights.semibold, -0.43),
  callout: style(16, 21, weights.regular, -0.32),
  subhead: style(15, 20, weights.regular, -0.24),
  subheadEmphasized: style(15, 20, weights.semibold, -0.24),
  footnote: style(13, 18, weights.regular, -0.08),
  footnoteEmphasized: style(13, 18, weights.semibold, -0.08),
  caption1: style(12, 16, weights.regular, 0),
  caption2: style(11, 13, weights.regular, 0.06),
  // Uppercase grouped-section header (Settings-style).
  sectionHeader: {
    ...style(13, 18, weights.semibold, 0.6),
    textTransform: 'uppercase' as const,
  },
} satisfies Record<string, TextStyle>;

export type TypographyToken = keyof typeof typography;
