import React, { useEffect, useRef, useState } from 'react';
import { LayoutChangeEvent, StyleSheet, Text, View } from 'react-native';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { LinearGradient } from 'expo-linear-gradient';

import { palette, posterGradients, radius, spacing, typography } from '@/theme';
import { Icon } from './icons';
import { PressableScale } from './PressableScale';

type Props = {
  posterIndex: number;
  /** Total runtime in seconds (used for the time labels). */
  duration?: number;
};

function fmt(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (n: number) => n.toString().padStart(2, '0');
  return h > 0 ? `${h}:${pad(m)}:${pad(sec)}` : `${m}:${pad(sec)}`;
}

/**
 * The embedded player surface. It stands in for the provider WebView video with
 * a real, interactive control set: play/pause, ±10s, a draggable timeline,
 * volume and fullscreen — all spring-animated and synced to a ticking clock.
 */
export function VideoPlayer({ posterIndex, duration = 10090 }: Props) {
  const [playing, setPlaying] = useState(true);
  const [muted, setMuted] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [position, setPosition] = useState(5784); // ~1:36:24 like the reference
  const [scrubbing, setScrubbing] = useState(false);
  const [trackWidth, setTrackWidth] = useState(0);
  const [controlsVisible, setControlsVisible] = useState(true);

  const progress = useSharedValue(position / duration);
  const controlsOpacity = useSharedValue(1);
  const trackW = useSharedValue(0);
  const knobScale = useSharedValue(1);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Advance the clock while playing.
  useEffect(() => {
    if (!playing || scrubbing) return;
    const id = setInterval(() => {
      setPosition((p) => Math.min(duration, p + 1));
    }, 1000);
    return () => clearInterval(id);
  }, [playing, scrubbing, duration]);

  // Keep the animated timeline in sync with the current position.
  useEffect(() => {
    progress.value = position / duration;
  }, [position, duration, progress]);

  const revealControls = () => {
    setControlsVisible(true);
    controlsOpacity.value = withTiming(1, { duration: 160 });
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => {
      controlsOpacity.value = withTiming(0, { duration: 400 }, (f) => {
        if (f) runOnJS(setControlsVisible)(false);
      });
    }, 3600);
  };

  useEffect(() => {
    revealControls();
    return () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const togglePlay = () => {
    setPlaying((p) => !p);
    revealControls();
  };

  const seekBy = (delta: number) => {
    setPosition((p) => Math.min(duration, Math.max(0, p + delta)));
    revealControls();
  };

  const onTrackLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    setTrackWidth(w);
    trackW.value = w;
  };

  const commitSeek = (ratio: number) => {
    const clamped = Math.min(1, Math.max(0, ratio));
    setPosition(clamped * duration);
  };

  const scrub = Gesture.Pan()
    .onBegin((e) => {
      knobScale.value = withTiming(1.35, { duration: 120 });
      runOnJS(setScrubbing)(true);
      if (trackWidth > 0) runOnJS(commitSeek)(e.x / trackWidth);
    })
    .onUpdate((e) => {
      if (trackWidth > 0) runOnJS(commitSeek)(e.x / trackWidth);
    })
    .onFinalize(() => {
      knobScale.value = withTiming(1, { duration: 160 });
      runOnJS(setScrubbing)(false);
      runOnJS(revealControls)();
    });

  // Pixel-based styles — animating numeric width / translateX avoids the native
  // crash that string-percentage layout props trigger on the New Architecture.
  const fillStyle = useAnimatedStyle(() => ({ width: progress.value * trackW.value }));
  const knobStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: progress.value * trackW.value },
      { scale: knobScale.value },
    ],
  }));
  const overlayStyle = useAnimatedStyle(() => ({ opacity: controlsOpacity.value }));

  return (
    <View style={[styles.container, fullscreen && styles.fullscreen]}>
      {/* Poster background drawn inline (no fixed 9999 sizing / giant SVG). */}
      <LinearGradient
        colors={posterGradients[posterIndex % posterGradients.length]}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.posterGlyph} pointerEvents="none">
        <Icon name="film" size={64} color="rgba(255,255,255,0.12)" />
      </View>
      <LinearGradient
        colors={['rgba(0,0,0,0.28)', 'rgba(0,0,0,0)', 'rgba(0,0,0,0.55)']}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      {/* Tap layer toggles the control overlay. */}
      <PressableScale
        onPress={() => (controlsVisible ? togglePlay() : revealControls())}
        activeScale={1}
        activeOpacity={1}
        style={StyleSheet.absoluteFill}
        accessibilityLabel={playing ? 'Duraklat' : 'Oynat'}
      >
        <View />
      </PressableScale>

      <Animated.View style={[styles.overlay, overlayStyle]} pointerEvents={controlsVisible ? 'auto' : 'none'}>
        {/* Top-right utilities */}
        <View style={styles.topRow}>
          <View style={styles.livePill}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>CANLI</Text>
          </View>
          <View style={styles.topRight}>
            <RoundControl
              icon="volume"
              color={muted ? palette.textTertiary : palette.white}
              label={muted ? 'Sesi aç' : 'Sesi kapat'}
              onPress={() => setMuted((m) => !m)}
            />
            <RoundControl
              icon="fullscreen"
              color={palette.white}
              label="Tam ekran"
              onPress={() => setFullscreen((f) => !f)}
            />
          </View>
        </View>

        {/* Center transport */}
        <View style={styles.center}>
          <TransportButton icon="backward" onPress={() => seekBy(-10)} label="10 saniye geri" small />
          <PressableScale onPress={togglePlay} activeScale={0.9} accessibilityLabel={playing ? 'Duraklat' : 'Oynat'}>
            <View style={styles.playBtn}>
              <Icon name={playing ? 'pause' : 'play'} size={30} color={palette.white} filled />
            </View>
          </PressableScale>
          <TransportButton icon="forward" onPress={() => seekBy(10)} label="10 saniye ileri" small />
        </View>

        {/* Timeline + secondary controls */}
        <View style={styles.bottom}>
          <View style={styles.timeRow}>
            <Text style={styles.time}>{fmt(position)}</Text>
            <View style={styles.secondary}>
              <TransportButton icon="shuffle" onPress={() => {}} label="Karıştır" tiny />
              <TransportButton icon="repeat" onPress={() => {}} label="Tekrarla" tiny />
            </View>
            <Text style={styles.time}>{fmt(duration)}</Text>
          </View>

          <GestureDetector gesture={scrub}>
            <View style={styles.trackHit}>
              <View style={styles.track} onLayout={onTrackLayout}>
                <Animated.View style={[styles.fill, fillStyle]} />
                <Animated.View style={[styles.knob, knobStyle]} />
              </View>
            </View>
          </GestureDetector>
        </View>
      </Animated.View>
    </View>
  );
}

function RoundControl({
  icon,
  onPress,
  label,
  color,
}: {
  icon: 'volume' | 'fullscreen';
  onPress: () => void;
  label: string;
  color: string;
}) {
  return (
    <PressableScale onPress={onPress} activeScale={0.88} accessibilityLabel={label}>
      <View style={styles.roundControl}>
        <Icon name={icon} size={17} color={color} />
      </View>
    </PressableScale>
  );
}

function TransportButton({
  icon,
  onPress,
  label,
  small,
  tiny,
}: {
  icon: 'backward' | 'forward' | 'shuffle' | 'repeat';
  onPress: () => void;
  label: string;
  small?: boolean;
  tiny?: boolean;
}) {
  const size = tiny ? 30 : small ? 46 : 40;
  const iconSize = tiny ? 16 : small ? 22 : 20;
  return (
    <PressableScale onPress={onPress} activeScale={0.86} accessibilityLabel={label}>
      <View style={[styles.transport, { width: size, height: size }]}>
        <Icon name={icon} size={iconSize} color={palette.textPrimary} />
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  container: {
    aspectRatio: 16 / 9,
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: palette.black,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.glassBorder,
  },
  fullscreen: {
    aspectRatio: undefined,
    minHeight: 260,
  },
  posterGlyph: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roundControl: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
    padding: spacing.md,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  livePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: spacing.sm,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: palette.danger,
  },
  liveText: {
    ...typography.caption2,
    color: palette.white,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  topRight: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  center: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xxl,
  },
  playBtn: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  transport: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
  },
  bottom: {
    gap: spacing.xs,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  time: {
    ...typography.caption1,
    color: palette.white,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  secondary: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  trackHit: {
    paddingVertical: spacing.sm,
  },
  track: {
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.24)',
    justifyContent: 'center',
  },
  fill: {
    height: 4,
    borderRadius: 2,
    backgroundColor: palette.copper,
  },
  knob: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: palette.white,
    marginLeft: -7,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.4,
    shadowRadius: 3,
    elevation: 3,
  },
});
