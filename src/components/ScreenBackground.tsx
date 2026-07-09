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
 * The app-wide backdrop: a #090909 base with soft warm color blobs (copper /
 * amber / ember) bleeding through. It gives glassmorphism surfaces real color
 * to refract — the depth that makes frosted panels read like Rave's, without
 * any hard gradients or purple.
 */
export function ScreenBackground({ children, style, glow = 'top' }: Props) {
  return (
    <View style={[styles.root, style]}>
      <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
        <Defs>
          <RadialGradient id="blobA" cx="18%" cy="8%" r="55%">
            <Stop offset="0%" stopColor="#6E3F1E" stopOpacity={glow === 'none' ? 0.35 : 0.6} />
            <Stop offset="100%" stopColor="#6E3F1E" stopOpacity="0" />
          </RadialGradient>
          <RadialGradient id="blobB" cx="92%" cy="22%" r="52%">
            <Stop offset="0%" stopColor="#8A4A28" stopOpacity="0.42" />
            <Stop offset="100%" stopColor="#8A4A28" stopOpacity="0" />
          </RadialGradient>
          <RadialGradient id="blobC" cx="72%" cy="96%" r="60%">
            <Stop offset="0%" stopColor="#4A2E1A" stopOpacity="0.5" />
            <Stop offset="100%" stopColor="#4A2E1A" stopOpacity="0" />
          </RadialGradient>
          <RadialGradient id="blobD" cx="4%" cy="82%" r="46%">
            <Stop offset="0%" stopColor="#5B3A1F" stopOpacity="0.32" />
            <Stop offset="100%" stopColor="#5B3A1F" stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill={palette.background} />
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#blobC)" />
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#blobD)" />
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#blobB)" />
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#blobA)" />
      </Svg>
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
