import React, { useMemo, useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { BlurView } from 'expo-blur';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import {
  BottomSheet,
  Icon,
  IconButton,
  ListRow,
  PlatformLogo,
  PressableScale,
  ScreenBackground,
  VideoPlayer,
  WebPlayer,
} from '@/components';
import {
  CURRENT_USER,
  ROOMS,
  getPlatform,
  userAgentFor,
  type Participant,
  type Room,
} from '@/data';
import { palette, radius, spacing, typography } from '@/theme';
import type { RootStackParamList } from '@/navigation/types';
import { InviteFriendsSheet } from './sheets';
import { ChatView } from './room/ChatView';
import { UsersPanel } from './room/UsersPanel';

type Props = NativeStackScreenProps<RootStackParamList, 'Room'>;

/** Build a Room from an existing id, or synthesize one from the create draft. */
function useRoom(params: Props['route']['params']): Room {
  return useMemo(() => {
    if (params.roomId) {
      const found = ROOMS.find((r) => r.id === params.roomId);
      if (found) return found;
    }
    const platform = getPlatform(params.platformId ?? 'netflix');
    const base = ROOMS[0];
    const participants: Participant[] = [
      { id: 'me', name: CURRENT_USER.name, handle: CURRENT_USER.handle, role: 'host', online: true, watching: true, tint: CURRENT_USER.tint },
      ...base.participants.slice(1, 4),
    ];
    const title = params.title?.trim();
    return {
      id: 'new',
      title: title && title.length > 0 ? title : `${platform?.name ?? 'Netflix'} Odası`,
      subtitle: 'Şimdi oynatılıyor',
      platform: platform?.id ?? 'netflix',
      platformLabel: platform?.name ?? 'Netflix',
      status: 'watching',
      isPublic: params.draft?.isPublic ?? true,
      hostName: CURRENT_USER.name,
      participantCount: participants.length,
      maxParticipants: 10,
      posterIndex: base.posterIndex,
      participants,
    };
  }, [params]);
}

export function RoomScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const room = useRoom(route.params);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [usersOpen, setUsersOpen] = useState(false);

  const usersProgress = useSharedValue(0);
  const openUsers = () => {
    setUsersOpen(true);
    usersProgress.value = withTiming(1, { duration: 280 });
  };
  const closeUsers = () => {
    usersProgress.value = withTiming(0, { duration: 240 });
    setTimeout(() => setUsersOpen(false), 240);
  };

  const usersStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: (1 - usersProgress.value) * 400 }],
  }));
  const scrimStyle = useAnimatedStyle(() => ({ opacity: usersProgress.value }));

  return (
    <ScreenBackground glow="none">
      {/* Top bar — X + settings · title · invite + participants */}
      <View style={[styles.topBar, { paddingTop: insets.top + spacing.xs }]}>
        <View style={styles.topSide}>
          <IconButton icon="close" size={38} variant="glass" accessibilityLabel="Odadan çık" onPress={() => navigation.goBack()} />
          <IconButton icon="settings" size={38} variant="glass" accessibilityLabel="Oda ayarları" onPress={() => setSettingsOpen(true)} />
        </View>
        <View style={styles.titleWrap} pointerEvents="none">
          <Text style={[typography.subheadEmphasized, styles.title]} numberOfLines={1}>
            {room.title}
          </Text>
          <View style={styles.subRow}>
            <PlatformLogo id={room.platform} size={12} />
            <Text style={[typography.caption2, styles.sub]} numberOfLines={1}>
              {room.platformLabel}
            </Text>
          </View>
        </View>
        <View style={[styles.topSide, styles.topRight]}>
          <IconButton icon="person-add" size={38} variant="glass" accessibilityLabel="Davet et" onPress={() => setInviteOpen(true)} />
          <PressableCount count={room.participantCount} onPress={openUsers} />
        </View>
      </View>

      {/* Player */}
      <View style={styles.playerWrap}>
        {route.params.contentUrl ? (
          <WebPlayer uri={route.params.contentUrl} userAgent={userAgentFor(room.platform, Platform.OS)} />
        ) : (
          <VideoPlayer posterIndex={room.posterIndex} />
        )}
      </View>

      {/* Chat fills the rest of the screen */}
      <ChatView bottomInset={insets.bottom} nowPlaying={room.title} />

      {/* Users slide-over from the right */}
      {usersOpen && (
        <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
          <Animated.View style={[StyleSheet.absoluteFill, styles.scrim, scrimStyle]} onTouchEnd={closeUsers} />
          <Animated.View style={[styles.usersPanel, usersStyle]}>
            <BlurView intensity={Platform.OS === 'ios' ? 40 : 60} tint="dark" style={StyleSheet.absoluteFill} />
            <View style={[StyleSheet.absoluteFill, styles.usersFill]} />
            <View style={{ paddingTop: insets.top + spacing.sm, flex: 1 }}>
              <View style={styles.usersGrabberRow}>
                <View style={styles.usersGrabber} />
              </View>
              <View style={styles.usersHeader}>
                <View>
                  <Text style={[typography.title3, styles.usersTitle]}>Kullanıcılar</Text>
                  <Text style={[typography.footnote, styles.usersSub]}>{room.participantCount} katılımcı</Text>
                </View>
                <IconButton icon="close" size={32} iconSize={16} variant="solid" accessibilityLabel="Kapat" onPress={closeUsers} />
              </View>
              <UsersPanel participants={room.participants} bottomInset={insets.bottom} onInvite={() => { closeUsers(); setTimeout(() => setInviteOpen(true), 260); }} />
            </View>
          </Animated.View>
        </View>
      )}

      <BottomSheet visible={inviteOpen} onClose={() => setInviteOpen(false)} title="Arkadaş Davet Et" height={0.7}>
        <InviteFriendsSheet roomName={room.title} />
      </BottomSheet>

      <BottomSheet visible={settingsOpen} onClose={() => setSettingsOpen(false)} title="Oda" height={0.42}>
        <View style={styles.actions}>
          <ListRow title="Arkadaş Davet Et" subtitle="Bu odaya davet linki gönder" leadingIcon="person-add" showChevron onPress={() => { setSettingsOpen(false); setTimeout(() => setInviteOpen(true), 220); }} />
          <ListRow title="Davet Linkini Kopyala" subtitle="astera.app/join/8F3K2Q" leadingIcon="share" showChevron onPress={() => setSettingsOpen(false)} />
          <ListRow title="Odadan Ayrıl" leadingIcon="close" leadingTint={palette.danger} destructive onPress={() => { setSettingsOpen(false); setTimeout(() => navigation.goBack(), 200); }} />
        </View>
      </BottomSheet>
    </ScreenBackground>
  );
}

function PressableCount({ count, onPress }: { count: number; onPress: () => void }) {
  return (
    <PressableScale onPress={onPress} activeScale={0.9} accessibilityLabel={`${count} katılımcı`}>
      <View style={styles.countBtn}>
        <Icon name="users" size={18} color={palette.textPrimary} />
        <Text style={[typography.footnoteEmphasized, styles.countText]}>{count}</Text>
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    gap: spacing.sm,
  },
  topSide: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  topRight: { justifyContent: 'flex-end' },
  titleWrap: { flex: 1, alignItems: 'center', gap: 1 },
  title: { color: palette.textPrimary, maxWidth: 180 },
  subRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  sub: { color: palette.textSecondary },
  playerWrap: { paddingHorizontal: spacing.lg, paddingBottom: spacing.sm },
  scrim: { backgroundColor: 'rgba(0,0,0,0.55)' },
  usersPanel: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: '82%',
    maxWidth: 360,
    borderTopLeftRadius: 28,
    borderBottomLeftRadius: 28,
    overflow: 'hidden',
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderLeftColor: palette.separatorStrong,
    shadowColor: '#000',
    shadowOffset: { width: -8, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 20,
  },
  usersFill: { backgroundColor: 'rgba(18,17,16,0.82)' },
  usersGrabberRow: { alignItems: 'center', paddingBottom: spacing.md },
  usersGrabber: {
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: palette.textQuaternary,
  },
  usersHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.md,
  },
  usersTitle: { color: palette.textPrimary },
  usersSub: { color: palette.textTertiary, marginTop: 1 },
  actions: { gap: spacing.sm, paddingTop: spacing.xs },
  countBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    height: 38,
    paddingHorizontal: spacing.md,
    borderRadius: 19,
    backgroundColor: palette.glass,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.glassBorder,
  },
  countText: { color: palette.textPrimary },
});

