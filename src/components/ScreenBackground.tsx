import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';

import { palette } from '@/theme';

type Props = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Where the warm ambient light pools. */
  glow?: 'top' | 'center' | 'none';
};

/**
 * The app-wide backdrop: a #090909 base with a soft warm light bloom that gives
 * every screen the cinematic depth of the reference without any hard gradients.
 */
export function ScreenBackground({ children, style, glow = 'top' }: Props) {
  return (
    <View style={[styles.root, style]}>
      {glow !== 'none' && (
        <Svg
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
          preserveAspectRatio="xMidYMin slice"
        >
          <Defs>
            <RadialGradient
              id="warm"
              cx="50%"
              cy={glow === 'top' ? '0%' : '38%'}
              r="75%"
            >
              <Stop offset="0%" stopColor="#3A2214" stopOpacity="0.55" />
              <Stop offset="42%" stopColor="#1C130D" stopOpacity="0.35" />
              <Stop offset="100%" stopColor="#090909" stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Rect x="0" y="0" width="100%" height="100%" fill="url(#warm)" />
        </Svg>
      )}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: palette.background,
  },
});
