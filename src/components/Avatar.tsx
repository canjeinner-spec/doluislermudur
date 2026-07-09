import React from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { palette } from '@/theme';

type Props = {
  name: string;
  tint: string;
  size?: number;
  online?: boolean;
  /** Ring color to separate overlapping avatars (defaults to background). */
  ringColor?: string;
  ringWidth?: number;
  style?: StyleProp<ViewStyle>;
};

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/** Monogram avatar with a soft two-tone fill and optional online dot. */
export function Avatar({
  name,
  tint,
  size = 34,
  online,
  ringColor = palette.background,
  ringWidth = 0,
  style,
}: Props) {
  const fontSize = Math.round(size * 0.4);
  const dot = Math.max(9, Math.round(size * 0.3));

  return (
    <View style={[{ width: size, height: size }, style]}>
      <View
        style={[
          styles.ring,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: ringWidth,
            borderColor: ringColor,
          },
        ]}
      >
        <LinearGradient
          colors={[shade(tint, 0.22), shade(tint, -0.16)]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[StyleSheet.absoluteFill, { borderRadius: size / 2 }]}
        />
        <Text
          style={[
            styles.text,
            { fontSize, lineHeight: fontSize + 2 },
          ]}
          allowFontScaling={false}
        >
          {initials(name)}
        </Text>
      </View>
      {online != null && (
        <View
          style={[
            styles.dot,
            {
              width: dot,
              height: dot,
              borderRadius: dot / 2,
              backgroundColor: online ? palette.online : palette.textQuaternary,
              borderColor: ringColor,
            },
          ]}
        />
      )}
    </View>
  );
}

/** Lighten (>0) or darken (<0) a hex color by `amount` (0..1). */
function shade(hex: string, amount: number): string {
  const c = hex.replace('#', '');
  const num = parseInt(c.length === 3 ? c.replace(/(.)/g, '$1$1') : c, 16);
  let r = (num >> 16) & 0xff;
  let g = (num >> 8) & 0xff;
  let b = num & 0xff;
  const t = amount < 0 ? 0 : 255;
  const p = Math.abs(amount);
  r = Math.round((t - r) * p) + r;
  g = Math.round((t - g) * p) + g;
  b = Math.round((t - b) * p) + b;
  return `rgb(${r},${g},${b})`;
}

const styles = StyleSheet.create({
  ring: {
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: palette.white,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  dot: {
    position: 'absolute',
    right: -1,
    bottom: -1,
    borderWidth: 2,
  },
});
