import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { palette, posterGradients, shadow, spacing, typography } from '@/theme';
import type { Room } from '@/data';
import { AvatarStack } from './AvatarStack';
import { GlassSurface } from './GlassSurface';
import { Icon } from './icons';
import { PlatformLogo } from './icons/PlatformLogo';
import { PressableScale } from './PressableScale';

type Props = {
  room: Room;
  onPress?: () => void;
  onLongPress?: () => void;
};

const CARD_HEIGHT = 88;
const THUMB_WIDTH = 152;

/**
 * Rave-style room card: a pill-rounded row with an edge-to-edge landscape video
 * thumbnail on the left (platform badge + play glyph) and the title + a stack of
 * participant avatars on the right. No subtitle — clean, exactly like Rave.
 */
export function RoomCard({ room, onPress, onLongPress }: Props) {
  const live = room.status === 'watching';
  const colors = posterGradients[room.posterIndex % posterGradients.length];

  return (
    <PressableScale
      onPress={onPress}
      onLongPress={onLongPress}
      activeScale={0.98}
      accessibilityLabel={`${room.title}, ${room.participantCount} kişi`}
      style={shadow.card}
    >
      <GlassSurface borderRadius={24} intensity={26} style={styles.card}>
      {/* Thumbnail bleeds to the card's rounded left edge (card clips it). */}
      <View style={styles.thumb}>
        <LinearGradient
          colors={colors}
          start={{ x: 0.1, y: 0 }}
          end={{ x: 0.9, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.35)']}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.playGlyph}>
          <Icon name="play" size={16} color="rgba(255,255,255,0.92)" filled />
        </View>
        <View style={styles.platformBadge}>
          <PlatformLogo id={room.platform} size={22} />
        </View>
        {live && (
          <View style={styles.livePill}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>CANLI</Text>
          </View>
        )}
      </View>

      <View style={styles.body}>
        <Text style={[typography.subheadEmphasized, styles.title]} numberOfLines={2}>
          {room.title}
        </Text>
        <View style={styles.metaRow}>
          {room.participants.length > 0 ? (
            <AvatarStack
              participants={room.participants}
              max={5}
              size={22}
              overflowCount={Math.max(0, room.participantCount - 5)}
              ringColor={palette.surface}
            />
          ) : (
            <View style={styles.countChip}>
              <Icon name="users" size={13} color={palette.textSecondary} />
              <Text style={[typography.caption1, styles.countChipText]}>{room.participantCount}</Text>
            </View>
          )}
          {!room.isPublic && (
            <Icon name="lock" size={12} color={palette.textTertiary} strokeWidth={2.2} />
          )}
        </View>
      </View>
      </GlassSurface>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    height: CARD_HEIGHT,
    alignItems: 'stretch',
  },
  thumb: {
    width: THUMB_WIDTH,
    height: CARD_HEIGHT,
    overflow: 'hidden',
  },
  playGlyph: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  platformBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    borderRadius: 7,
    overflow: 'hidden',
  },
  livePill: {
    position: 'absolute',
    bottom: 8,
    left: 8,
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
  body: {
    flex: 1,
    justifyContent: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  title: {
    color: palette.textPrimary,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  countChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: spacing.sm,
    height: 24,
    borderRadius: 12,
    backgroundColor: palette.glass,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.glassBorder,
  },
  countChipText: {
    color: palette.textSecondary,
    fontWeight: '700',
  },
});
