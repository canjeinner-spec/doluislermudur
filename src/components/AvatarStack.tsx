import React from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';

import { palette, typography } from '@/theme';
import type { Participant } from '@/data';
import { Avatar } from './Avatar';

type Props = {
  participants: Participant[];
  max?: number;
  size?: number;
  overflowCount?: number;
  ringColor?: string;
  style?: StyleProp<ViewStyle>;
};

/** Overlapping row of avatars with a "+N" chip, as on the room cards. */
export function AvatarStack({
  participants,
  max = 4,
  size = 26,
  overflowCount,
  ringColor = palette.surface,
  style,
}: Props) {
  const shown = participants.slice(0, max);
  const extra =
    overflowCount != null
      ? overflowCount
      : Math.max(0, participants.length - shown.length);
  const overlap = Math.round(size * 0.34);

  return (
    <View style={[styles.row, style]}>
      {shown.map((p, i) => (
        <Avatar
          key={p.id}
          name={p.name}
          tint={p.tint}
          size={size}
          ringColor={ringColor}
          ringWidth={1.5}
          style={{ marginLeft: i === 0 ? 0 : -overlap, zIndex: shown.length - i }}
        />
      ))}
      {extra > 0 && (
        <View
          style={[
            styles.more,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              marginLeft: -overlap,
              borderColor: ringColor,
            },
          ]}
        >
          <Text style={[typography.caption2, styles.moreText]} allowFontScaling={false}>
            +{extra}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  more: {
    backgroundColor: palette.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    zIndex: 0,
  },
  moreText: {
    color: palette.textSecondary,
    fontWeight: '700',
  },
});
