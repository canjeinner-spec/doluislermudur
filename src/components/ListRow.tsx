import React from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';

import { palette, radius, spacing, typography } from '@/theme';
import { Icon, IconName } from './icons';
import { PressableScale } from './PressableScale';

type Props = {
  title: string;
  subtitle?: string;
  leading?: React.ReactNode;
  leadingIcon?: IconName;
  leadingTint?: string;
  trailing?: React.ReactNode;
  showChevron?: boolean;
  onPress?: () => void;
  onLongPress?: () => void;
  size?: 'md' | 'lg';
  style?: StyleProp<ViewStyle>;
  destructive?: boolean;
};

/**
 * Insettable grouped-list row used by the platform picker, settings and the
 * sidebar. Large variant matches the platform-selection cards in the reference.
 */
export function ListRow({
  title,
  subtitle,
  leading,
  leadingIcon,
  leadingTint = palette.copper,
  trailing,
  showChevron = false,
  onPress,
  onLongPress,
  size = 'md',
  style,
  destructive = false,
}: Props) {
  const lg = size === 'lg';
  const iconBox = lg ? 46 : 34;

  const content = (
    <View style={[styles.row, lg ? styles.rowLg : styles.rowMd, style]}>
      {leading ?? (
        leadingIcon && (
          <View
            style={[
              styles.iconBox,
              { width: iconBox, height: iconBox, borderRadius: lg ? radius.md : radius.sm },
            ]}
          >
            <Icon name={leadingIcon} size={lg ? 22 : 19} color={leadingTint} />
          </View>
        )
      )}
      <View style={styles.textCol}>
        <Text
          style={[
            lg ? typography.headline : typography.body,
            { color: destructive ? palette.danger : palette.textPrimary },
          ]}
          numberOfLines={1}
        >
          {title}
        </Text>
        {subtitle && (
          <Text style={[typography.footnote, styles.subtitle]} numberOfLines={1}>
            {subtitle}
          </Text>
        )}
      </View>
      {trailing}
      {showChevron && (
        <Icon name="chevron-right" size={18} color={palette.textTertiary} strokeWidth={2.2} />
      )}
    </View>
  );

  if (!onPress && !onLongPress) return content;

  return (
    <PressableScale
      onPress={onPress}
      onLongPress={onLongPress}
      activeScale={0.985}
      activeOpacity={0.7}
      accessibilityLabel={title}
    >
      {content}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: palette.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.glassBorder,
  },
  rowMd: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    minHeight: 54,
  },
  rowLg: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderRadius: radius.lg,
    minHeight: 72,
  },
  iconBox: {
    backgroundColor: palette.accentTintSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textCol: {
    flex: 1,
    gap: 2,
  },
  subtitle: {
    color: palette.textSecondary,
  },
});
