import React, { useCallback } from 'react';
import { GestureResponderEvent, StyleProp, ViewStyle } from 'react-native';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withSpring,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

import { springs } from '@/theme';

type Props = {
  children: React.ReactNode;
  onPress?: () => void;
  onLongPress?: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  /** How far the element scales down on press. */
  activeScale?: number;
  /** Dim opacity on press. */
  activeOpacity?: number;
  hitSlop?: number;
  accessibilityLabel?: string;
  accessibilityRole?: 'button' | 'link' | 'tab' | 'switch';
};

/**
 * A press target that scales + dims with a native, spring-settled feel. Built on
 * Gesture Handler so it stays responsive inside scroll views and honours the
 * platform's interactive rhythm rather than Android's ripple.
 */
export function PressableScale({
  children,
  onPress,
  onLongPress,
  disabled = false,
  style,
  activeScale = 0.96,
  activeOpacity = 0.85,
  hitSlop = 6,
  accessibilityLabel,
  accessibilityRole = 'button',
}: Props) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const press = useCallback(() => {
    if (!disabled) onPress?.();
  }, [disabled, onPress]);

  const long = useCallback(() => {
    if (!disabled) onLongPress?.();
  }, [disabled, onLongPress]);

  const tap = Gesture.Tap()
    .enabled(!disabled)
    .maxDuration(100000)
    .hitSlop(hitSlop)
    .onBegin(() => {
      scale.value = withTiming(activeScale, { duration: 90 });
      opacity.value = withTiming(activeOpacity, { duration: 90 });
    })
    .onFinalize(() => {
      scale.value = withSpring(1, springs.snappy);
      opacity.value = withTiming(1, { duration: 140 });
    })
    .onEnd((_e, success) => {
      // Gesture callbacks run as worklets on the UI thread; hop back to JS.
      if (success) runOnJS(press)();
    });

  const longPress = Gesture.LongPress()
    .enabled(!disabled && !!onLongPress)
    .minDuration(380)
    .onStart(() => {
      runOnJS(long)();
    });

  const gesture = Gesture.Exclusive(longPress, tap);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: disabled ? 0.5 : opacity.value,
  }));

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View
        style={[style, animatedStyle]}
        accessible
        accessibilityRole={accessibilityRole}
        accessibilityLabel={accessibilityLabel}
        accessibilityState={{ disabled }}
      >
        {children}
      </Animated.View>
    </GestureDetector>
  );
}

export type { GestureResponderEvent };
