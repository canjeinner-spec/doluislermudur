import React from 'react';
import { Platform, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';

import { glassGradient, palette, radius } from '@/theme';

type Props = {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  intensity?: number;
  borderRadius?: number;
  /** Adds the faint top-down sheen used on large iOS 26 glass panels. */
  sheen?: boolean;
  /** Hairline 1px border for definition against dark content. */
  bordered?: boolean;
  tint?: 'dark' | 'systemThickMaterialDark' | 'systemChromeMaterialDark';
};

/**
 * iOS 26 "Liquid Glass" material: a real blur layer, a translucent fill, an
 * optional diagonal sheen and a hairline border. On platforms where BlurView is
 * unavailable it degrades to a solid translucent surface so nothing breaks.
 */
export function GlassSurface({
  children,
  style,
  intensity = 40,
  borderRadius = radius.lg,
  sheen = true,
  bordered = true,
  tint = 'dark',
}: Props) {
  const canBlur = Platform.OS === 'ios' || Platform.OS === 'android';

  return (
    <View
      style={[
        styles.container,
        { borderRadius },
        bordered && styles.bordered,
        style,
      ]}
    >
      {canBlur ? (
        <BlurView
          intensity={intensity}
          tint={tint}
          style={StyleSheet.absoluteFill}
        />
      ) : (
        <View style={[StyleSheet.absoluteFill, styles.fallback]} />
      )}
      <View style={[StyleSheet.absoluteFill, styles.fill]} />
      {sheen && (
        <LinearGradient
          colors={glassGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 0.6, y: 1 }}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
      )}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
  bordered: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.glassBorder,
  },
  fill: {
    backgroundColor: palette.glass,
  },
  fallback: {
    backgroundColor: 'rgba(22,22,22,0.86)',
  },
});
