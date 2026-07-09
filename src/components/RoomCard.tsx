import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { palette, radius, shadow, spacing, typography } from '@/theme';
import type { Room } from '@/data';
import { AvatarStack } from './AvatarStack';
import { Icon } from './icons';
import { PlatformLogo } from './icons/PlatformLogo';
import { Poster } from './Poster';
import { PressableScale } from './PressableScale';

type Props = {
  room: Room;
  onPress?: () => void;
  onLongPress?: () => void;
};

/**
 * Rave-style room card: a wide landscape thumbnail on the left with a platform
 * badge and live indicator, and the title + participant stack on the right.
 */
export function RoomCard({ room, onPress, onLongPress }: Props) {
  const live = room.status === 'watching';
  return (
    <PressableScale
      onPress={onPress}
      onLongPress={onLongPress}
      activeScale={0.98}
      accessibilityLabel={`${room.title}, ${room.participantCount} kişi`}
      style={[styles.card, shadow.card]}
    >
      <View style={styles.thumbWrap}>
        <Poster index={room.posterIndex} width={132} height={78} borderRadius={radius.md} />
        <View style={styles.platformBadge}>
          <PlatformLogo id={room.platform} size={20} />
        </View>
        {live && (
          <View style={styles.livePill}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>CANLI</Text>
          </View>
        )}
        {!room.isPublic && (
          <View style={styles.lockBadge}>
            <Icon name="lock" size={11} color={palette.white} strokeWidth={2.2} />
          </View>
        )}
      </View>

      <View style={styles.body}>
        <Text style={[typography.subheadEmphasized, styles.title]} numberOfLines={2}>
          {room.title}
        </Text>
        <Text style={[typography.caption1, styles.subtitle]} numberOfLines={1}>
          {room.platformLabel} · {room.hostName}
        </Text>
        <View style={styles.metaRow}>
          <AvatarStack
            participants={room.participants}
            max={4}
            size={24}
            overflowCount={Math.max(0, room.participantCount - 4)}
            ringColor={palette.surface}
          />
          <View style={styles.count}>
            <Icon name="users" size={12} color={palette.textTertiary} strokeWidth={2} />
            <Text style={[typography.caption1, styles.countText]}>{room.participantCount}</Text>
          </View>
        </View>
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.sm + 2,
    borderRadius: radius.lg,
    backgroundColor: palette.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.glassBorder,
    alignItems: 'center',
  },
  thumbWrap: {
    width: 132,
    height: 78,
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  platformBadge: {
    position: 'absolute',
    top: 5,
    right: 5,
    borderRadius: 6,
    overflow: 'hidden',
  },
  livePill: {
    position: 'absolute',
    bottom: 5,
    left: 5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  liveDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: palette.danger },
  liveText: {
    ...typography.caption2,
    color: palette.white,
    fontWeight: '800',
    fontSize: 9,
    letterSpacing: 0.5,
  },
  lockBadge: {
    position: 'absolute',
    top: 5,
    left: 5,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
    gap: 3,
    paddingVertical: 2,
  },
  title: {
    color: palette.textPrimary,
  },
  subtitle: {
    color: palette.textTertiary,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: 2,
  },
  count: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  countText: {
    color: palette.textTertiary,
    fontWeight: '600',
  },
});
