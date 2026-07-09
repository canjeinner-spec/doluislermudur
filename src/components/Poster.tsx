import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { Icon } from './icons';
import { palette, posterGradients, radius } from '@/theme';

type Props = {
  index: number;
  width: number;
  height: number;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
};

/**
 * Stand-in movie poster: a moody two-stop gradient with a faint film glyph.
 * Real artwork would drop in behind the same frame and corner radius.
 */
export function Poster({ index, width, height, borderRadius = radius.sm, style }: Props) {
  const colors = posterGradients[index % posterGradients.length];
  return (
    <View
      style={[
        styles.frame,
        { width, height, borderRadius },
        style,
      ]}
    >
      <LinearGradient
        colors={colors}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.center}>
        <Icon name="film" size={Math.min(width, height) * 0.34} color="rgba(255,255,255,0.14)" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.glassBorder,
    backgroundColor: palette.surfaceSecondary,
  },
  center: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
