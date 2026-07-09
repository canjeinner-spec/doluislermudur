import React from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { accentGradient, palette, radius, shadow, spacing, typography } from '@/theme';
import { Icon, IconName } from './icons';
import { PressableScale } from './PressableScale';

type Props = {
  label: string;
  onPress?: () => void;
  icon?: IconName;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  variant?: 'primary' | 'glass';
  size?: 'lg' | 'md';
};

/**
 * The warm copper CTA seen on "Oda Oluştur" / "Devam Et". A soft accent glow
 * grounds it against the near-black background without looking neon.
 */
export function GradientButton({
  label,
  onPress,
  icon,
  disabled = false,
  style,
  variant = 'primary',
  size = 'lg',
}: Props) {
  const height = size === 'lg' ? 56 : 46;
  const isGlass = variant === 'glass';

  return (
    <PressableScale
      onPress={onPress}
      disabled={disabled}
      activeScale={0.975}
      accessibilityLabel={label}
      style={[!isGlass && shadow.accentGlow, style]}
    >
      <View style={[styles.wrap, { height, borderRadius: radius.lg }]}>
        {isGlass ? (
          <View style={[StyleSheet.absoluteFill, styles.glass]} />
        ) : (
          <LinearGradient
            colors={accentGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        )}
        <View style={styles.content}>
          {icon && (
            <Icon
              name={icon}
              size={19}
              color={isGlass ? palette.textPrimary : palette.white}
            />
          )}
          <Text
            style={[
              typography.headline,
              { color: isGlass ? palette.textPrimary : palette.white },
            ]}
          >
            {label}
          </Text>
        </View>
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  wrap: {
    overflow: 'hidden',
    justifyContent: 'center',
  },
  glass: {
    backgroundColor: palette.glassStrong,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.glassBorder,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
});
