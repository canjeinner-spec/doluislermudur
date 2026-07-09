import React from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { palette, spacing, typography } from '@/theme';

type Props = {
  title?: string;
  titleNode?: React.ReactNode;
  left?: React.ReactNode;
  right?: React.ReactNode;
  /** Removes the safe-area top padding (for sheets that draw their own grabber). */
  compact?: boolean;
  showSeparator?: boolean;
  style?: StyleProp<ViewStyle>;
};

/**
 * A large-title-free navigation bar sized to the iOS 44pt standard, with
 * balanced left/right action clusters and an optional hairline separator.
 */
export function NavBar({
  title,
  titleNode,
  left,
  right,
  compact = false,
  showSeparator = false,
  style,
}: Props) {
  const insets = useSafeAreaInsets();
  return (
    <View
      style={[
        styles.container,
        { paddingTop: compact ? spacing.sm : insets.top + spacing.xs },
        showSeparator && styles.separator,
        style,
      ]}
    >
      <View style={styles.bar}>
        <View style={[styles.side, styles.left]}>{left}</View>
        <View style={styles.center} pointerEvents="box-none">
          {titleNode ??
            (title ? (
              <Text style={[typography.headline, styles.title]} numberOfLines={1}>
                {title}
              </Text>
            ) : null)}
        </View>
        <View style={[styles.side, styles.right]}>{right}</View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  separator: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: palette.separator,
  },
  bar: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  side: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minWidth: 44,
  },
  left: {
    justifyContent: 'flex-start',
  },
  right: {
    justifyContent: 'flex-end',
  },
  center: {
    position: 'absolute',
    left: 60,
    right: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: palette.textPrimary,
    textAlign: 'center',
  },
});
