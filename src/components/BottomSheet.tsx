import React, { useEffect } from 'react';
import { Dimensions, Platform, StyleSheet, Text, View } from 'react-native';
import { BlurView } from 'expo-blur';
import Animated, {
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { palette, radius, spacing, typography } from '@/theme';
import { IconButton } from './IconButton';

const { height: SCREEN_H } = Dimensions.get('window');

type Props = {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  /** Fraction of screen height the sheet occupies (0..1). */
  height?: number;
};

/**
 * A draggable bottom sheet with a blurred scrim and rounded top, matching the
 * feel of native iOS sheets for the sidebar's secondary destinations.
 */
export function BottomSheet({ visible, onClose, title, children, height = 0.62 }: Props) {
  const insets = useSafeAreaInsets();
  const sheetHeight = Math.round(SCREEN_H * height) + insets.bottom;
  const translateY = useSharedValue(sheetHeight);
  const progress = useSharedValue(0);
  const [mounted, setMounted] = React.useState(visible);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      translateY.value = withTiming(0, { duration: 320 });
      progress.value = withTiming(1, { duration: 320 });
    } else if (mounted) {
      translateY.value = withTiming(sheetHeight, { duration: 260 });
      progress.value = withTiming(0, { duration: 260 }, (finished) => {
        if (finished) runOnJS(setMounted)(false);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const pan = Gesture.Pan()
    .onUpdate((e) => {
      translateY.value = Math.max(0, e.translationY);
    })
    .onEnd((e) => {
      if (e.translationY > sheetHeight * 0.3 || e.velocityY > 900) {
        translateY.value = withTiming(sheetHeight, { duration: 220 });
        progress.value = withTiming(0, { duration: 220 }, (f) => {
          if (f) runOnJS(onClose)();
        });
      } else {
        translateY.value = withTiming(0, { duration: 200 });
      }
    });

  const scrimStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 1], [0, 1], Extrapolation.CLAMP),
  }));
  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  if (!mounted) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <Animated.View style={[StyleSheet.absoluteFill, scrimStyle]}>
        <BlurView intensity={Platform.OS === 'ios' ? 22 : 40} tint="dark" style={StyleSheet.absoluteFill} />
        <View style={styles.scrimTint} />
      </Animated.View>
      <Animated.View
        // Tap scrim to dismiss
        style={StyleSheet.absoluteFill}
        onTouchEnd={onClose}
        pointerEvents="auto"
      />
      <Animated.View
        style={[
          styles.sheet,
          { height: sheetHeight, paddingBottom: insets.bottom + spacing.lg },
          sheetStyle,
        ]}
      >
        <GestureDetector gesture={pan}>
          <View style={styles.grabberArea}>
            <View style={styles.grabber} />
            <View style={styles.header}>
              <Text style={[typography.title3, styles.title]}>{title}</Text>
              <IconButton
                icon="close"
                size={30}
                iconSize={16}
                variant="solid"
                accessibilityLabel="Kapat"
                onPress={onClose}
              />
            </View>
          </View>
        </GestureDetector>
        <View style={styles.content}>{children}</View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  scrimTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: palette.surface,
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.separatorStrong,
    overflow: 'hidden',
  },
  grabberArea: {
    paddingTop: spacing.sm,
  },
  grabber: {
    alignSelf: 'center',
    width: 38,
    height: 5,
    borderRadius: 3,
    backgroundColor: palette.textQuaternary,
    marginBottom: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.md,
  },
  title: {
    color: palette.textPrimary,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.xl,
  },
});
