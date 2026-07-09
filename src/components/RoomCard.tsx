import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { palette, radius, shadow, spacing, typography } from '@/theme';
import type { Room } from '@/data';
import { AvatarStack } from './AvatarStack';
import { Badge } from './Badge';
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
 * Home room card: poster + metadata + participant stack, with a status pill and
 * privacy/host affordances. Mirrors the reference layout and hierarchy.
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
      <Poster index={room.posterIndex} width={58} height={78} borderRadius={radius.sm} />

      <View style={styles.body}>
        <View style={styles.headerRow}>
          <View style={styles.titleWrap}>
            <Text style={[typography.headline, styles.title]} numberOfLines={1}>
              {room.title}
            </Text>
            <Text style={[typography.footnote, styles.subtitle]} numberOfLines={1}>
              {room.subtitle}
            </Text>
          </View>
          <Badge
            label={live ? 'İZLENİYOR' : 'BEKLEMEDE'}
            tone={live ? 'live' : 'muted'}
            dot={live}
            uppercase
          />
        </View>

        <View style={styles.metaRow}>
          <View style={styles.platform}>
            <PlatformLogo id={room.platform} size={16} />
            <Text style={[typography.caption1, styles.platformLabel]} numberOfLines={1}>
              {room.platformLabel}
            </Text>
          </View>

          <View style={styles.spacer} />

          <AvatarStack
            participants={room.participants}
            max={3}
            size={22}
            overflowCount={Math.max(0, room.participantCount - 3)}
            ringColor={palette.surface}
          />
          <View style={styles.count}>
            <Icon name="users" size={12} color={palette.textTertiary} strokeWidth={2} />
            <Text style={[typography.caption1, styles.countText]}>
              {room.participantCount}/{room.maxParticipants}
            </Text>
          </View>
        </View>

        <View style={styles.footerRow}>
          <View style={styles.hostChip}>
            <Icon name="crown" size={12} color={palette.amber} filled />
            <Text style={[typography.caption2, styles.hostText]}>{room.hostName}</Text>
          </View>
          <Badge
            label={room.isPublic ? 'Herkese Açık' : 'Özel'}
            tone="neutral"
            icon={room.isPublic ? 'globe' : 'lock'}
          />
        </View>
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: palette.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.glassBorder,
  },
  body: {
    flex: 1,
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  titleWrap: {
    flex: 1,
    gap: 1,
  },
  title: {
    color: palette.textPrimary,
  },
  subtitle: {
    color: palette.textSecondary,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  platform: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 1,
  },
  platformLabel: {
    color: palette.textSecondary,
    fontWeight: '600',
  },
  spacer: {
    flex: 1,
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
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  hostChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  hostText: {
    color: palette.textSecondary,
    fontWeight: '600',
  },
});
