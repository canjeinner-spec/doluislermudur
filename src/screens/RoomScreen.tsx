import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Platform, StyleSheet, Text, View } from 'react-native';
import { BlurView } from 'expo-blur';
import * as ScreenOrientation from 'expo-screen-orientation';
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
  PlatformLogo,
  PressableScale,
  ScreenBackground,
  VideoPlayer,
  WebPlayer,
  type WebPlayerHandle,
} from '@/components';
import {
  CURRENT_USER,
  ROOMS,
  getPlatform,
  userAgentFor,
  type Participant,
  type Room,
} from '@/data';
import { isBackendConfigured, kickMember, useMyId, useRoomSession } from '@/backend';
import { palette, radius, spacing, typography } from '@/theme';
import type { RootStackParamList } from '@/navigation/types';
import { InviteFriendsSheet } from './sheets';
import { ChatView } from './room/ChatView';
import { UsersPanel } from './room/UsersPanel';
import { usePlaybackSync } from './room/usePlaybackSync';

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
    // A freshly created room only has you in it.
    const participants: Participant[] = [
      { id: 'me', name: CURRENT_USER.name, handle: CURRENT_USER.handle, role: 'host', online: true, watching: true, tint: CURRENT_USER.tint },
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

  // Backend room (live roster + join/leave) when configured; otherwise the
  // locally-synthesised room from the create flow.
  const backendRoomId = isBackendConfigured ? route.params.roomId : undefined;
  const session = useRoomSession(backendRoomId);
  const myId = useMyId();
  const localRoom = useRoom(route.params);
  const room = session.room ?? localRoom;
  const contentUrl = session.room ? session.contentUrl : route.params.contentUrl;
  const participants = session.room ? session.participants : room.participants;

  // Host-authoritative playback sync. You're the host of a room you created (or
  // any local/mock room); once the backend promotes a new host, isHost updates.
  const backend = isBackendConfigured && !!backendRoomId;
  // Default to follower until identities resolve, so we never have two "hosts".
  const isHost = !backend || (!!myId && !!session.hostId && session.hostId === myId);
  const playerRef = useRef<WebPlayerHandle>(null);
  const sync = usePlaybackSync({
    roomId: backendRoomId,
    isHost,
    enabled: backend,
    playerRef,
    onKicked: (userId) => {
      if (userId === myId) {
        Alert.alert('Odadan çıkarıldın', 'Host seni bu odadan çıkardı.');
        navigation.goBack();
      }
    },
  });

  const kickParticipant = useCallback(
    (p: Participant) => {
      if (!backendRoomId) return;
      kickMember(backendRoomId, p.id);
      sync.broadcastKick(p.id);
    },
    [backendRoomId, sync]
  );

  const [inviteOpen, setInviteOpen] = useState(false);
  const [usersOpen, setUsersOpen] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [chatTop, setChatTop] = useState(0);

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

  const toggleFullscreen = useCallback(async () => {
    const next = !fullscreen;
    setFullscreen(next);
    try {
      await ScreenOrientation.lockAsync(
        next ? ScreenOrientation.OrientationLock.LANDSCAPE : ScreenOrientation.OrientationLock.PORTRAIT_UP
      );
    } catch {
      /* ignore */
    }
  }, [fullscreen]);

  // Always restore portrait when leaving the room.
  useEffect(() => {
    return () => {
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP).catch(() => {});
    };
  }, []);

  const count = session.room ? participants.length : room.participantCount;

  const changeContent = () =>
    navigation.navigate('PlatformSelect', {
      draft: { isPublic: room.isPublic },
      returnToRoom: true,
      roomId: backendRoomId,
    });

  return (
    <ScreenBackground glow="none">
      {/* Top bar — X + fullscreen · title · invite + participants */}
      {!fullscreen && (
        <View style={[styles.topBar, { paddingTop: insets.top + spacing.xs }]}>
          <View style={styles.topSide}>
            <IconButton icon="close" size={38} variant="glass" accessibilityLabel="Odadan çık" onPress={() => navigation.goBack()} />
            <IconButton icon="fullscreen" size={38} variant="glass" accessibilityLabel="Tam ekran" onPress={toggleFullscreen} />
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
            <PressableCount count={count} onPress={openUsers} />
          </View>
        </View>
      )}

      {/* Player — full-bleed; expands to cover the screen in fullscreen */}
      <View style={[styles.playerWrap, fullscreen && styles.playerFull]}>
        {contentUrl ? (
          <WebPlayer
            ref={playerRef}
            key={contentUrl}
            uri={contentUrl}
            platform={room.platform}
            userAgent={userAgentFor(room.platform, Platform.OS)}
            fill={fullscreen}
            fullscreen={fullscreen}
            onToggleFullscreen={toggleFullscreen}
            onControl={sync.broadcastControl}
            canControl={isHost}
          />
        ) : session.loading ? (
          <View style={styles.playerLoading}>
            <ActivityIndicator color={palette.amber} />
          </View>
        ) : (
          <VideoPlayer posterIndex={room.posterIndex} fill={fullscreen} />
        )}
      </View>

      {/* Chat fills the rest of the screen */}
      {!fullscreen && (
        <View style={styles.chatWrap} onLayout={(e) => setChatTop(e.nativeEvent.layout.y)}>
          <ChatView
            bottomInset={insets.bottom}
            nowPlaying={room.title}
            onChangeContent={changeContent}
            keyboardOffset={chatTop}
            roomId={backendRoomId}
            myId={myId}
            participants={participants}
            ready={!session.loading}
          />
        </View>
      )}

      {/* Fullscreen exit (works for any player) */}
      {fullscreen && (
        <View style={[styles.fsExit, { top: insets.top + spacing.sm, left: insets.left + spacing.lg }]}>
          <IconButton icon="close" size={40} variant="glass" accessibilityLabel="Tam ekranı kapat" onPress={toggleFullscreen} />
        </View>
      )}

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
                  <Text style={[typography.footnote, styles.usersSub]}>{count} katılımcı</Text>
                </View>
                <IconButton icon="close" size={32} iconSize={16} variant="solid" accessibilityLabel="Kapat" onPress={closeUsers} />
              </View>
              <UsersPanel
                participants={participants}
                bottomInset={insets.bottom}
                isHost={isHost}
                myId={myId}
                onKick={kickParticipant}
                onInvite={() => { closeUsers(); setTimeout(() => setInviteOpen(true), 260); }}
              />
            </View>
          </Animated.View>
        </View>
      )}

      <BottomSheet visible={inviteOpen} onClose={() => setInviteOpen(false)} title="Arkadaş Davet Et" height={0.7}>
        <InviteFriendsSheet roomName={room.title} roomId={backendRoomId} />
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
  chatWrap: { flex: 1 },
  playerWrap: { width: '100%' },
  playerLoading: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: palette.black,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playerFull: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 50,
    backgroundColor: palette.black,
  },
  fsExit: { position: 'absolute', zIndex: 60 },
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

