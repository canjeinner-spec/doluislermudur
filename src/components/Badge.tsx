import React from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';

import { palette, radius, spacing, typography } from '@/theme';
import { Icon, IconName } from './icons';

type Tone = 'neutral' | 'accent' | 'live' | 'success' | 'muted';

type Props = {
  label: string;
  tone?: Tone;
  icon?: IconName;
  /** Pulsing dot before the label (used by the live indicator). */
  dot?: boolean;
  uppercase?: boolean;
  style?: StyleProp<ViewStyle>;
};

const toneColors: Record<Tone, { bg: string; fg: string; dot: string }> = {
  neutral: { bg: 'rgba(255,255,255,0.10)', fg: palette.textSecondary, dot: palette.textSecondary },
  accent: { bg: palette.accentTintSoft, fg: palette.amber, dot: palette.amber },
  live: { bg: 'rgba(227,163,102,0.16)', fg: palette.amberBright, dot: palette.amberBright },
  success: { bg: 'rgba(78,208,138,0.14)', fg: palette.online, dot: palette.online },
  muted: { bg: 'rgba(255,255,255,0.06)', fg: palette.textTertiary, dot: palette.textTertiary },
};

/** Compact status / metadata pill. */
export function Badge({
  label,
  tone = 'neutral',
  icon,
  dot = false,
  uppercase = false,
  style,
}: Props) {
  const c = toneColors[tone];
  return (
    <View style={[styles.pill, { backgroundColor: c.bg }, style]}>
      {dot && <View style={[styles.dot, { backgroundColor: c.dot }]} />}
      {icon && <Icon name={icon} size={11} color={c.fg} strokeWidth={2.2} />}
      <Text
        style={[
          typography.caption2,
          styles.label,
          { color: c.fg },
          uppercase && styles.upper,
        ]}
        allowFontScaling={false}
        numberOfLines={1}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    height: 20,
    borderRadius: radius.pill,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  label: {
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  upper: {
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    fontSize: 10,
  },
});
