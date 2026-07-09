import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

import { palette, radius } from '@/theme';
import { GlassSurface } from './GlassSurface';
import { Icon, IconName } from './icons';
import { PressableScale } from './PressableScale';

type Props = {
  icon: IconName;
  onPress?: () => void;
  size?: number;
  iconSize?: number;
  color?: string;
  variant?: 'glass' | 'plain' | 'solid';
  style?: StyleProp<ViewStyle>;
  accessibilityLabel: string;
  badge?: number;
};

/** Circular tap target used across nav bars, players and toolbars. */
export function IconButton({
  icon,
  onPress,
  size = 40,
  iconSize,
  color = palette.textPrimary,
  variant = 'glass',
  style,
  accessibilityLabel,
  badge,
}: Props) {
  const body = (
    <View style={[styles.center, { width: size, height: size }]}>
      <Icon name={icon} size={iconSize ?? Math.round(size * 0.5)} color={color} />
      {badge != null && badge > 0 && (
        <View style={styles.badge}>
          <View style={styles.badgeInner} />
        </View>
      )}
    </View>
  );

  return (
    <PressableScale
      onPress={onPress}
      accessibilityLabel={accessibilityLabel}
      activeScale={0.9}
      style={style}
    >
      {variant === 'glass' ? (
        <GlassSurface
          borderRadius={radius.pill}
          intensity={30}
          style={{ width: size, height: size }}
        >
          {body}
        </GlassSurface>
      ) : variant === 'solid' ? (
        <View
          style={[
            styles.solid,
            { width: size, height: size, borderRadius: size / 2 },
          ]}
        >
          {body}
        </View>
      ) : (
        body
      )}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  solid: {
    backgroundColor: palette.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: 7,
    right: 7,
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: palette.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: palette.danger,
  },
});
