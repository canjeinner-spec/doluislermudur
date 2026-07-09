import React from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';

import { palette, spacing, typography } from '@/theme';

type Props = {
  title: string;
  trailing?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

/** Uppercase grouped-list section label, Settings-app style. */
export function SectionHeader({ title, trailing, style }: Props) {
  return (
    <View style={[styles.row, style]}>
      <Text style={[typography.sectionHeader, styles.title]}>{title}</Text>
      {trailing}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xs,
    marginBottom: spacing.sm,
  },
  title: {
    color: palette.textTertiary,
  },
});
