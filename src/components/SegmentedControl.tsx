import React, { useEffect, useState } from 'react';
import { LayoutChangeEvent, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { palette, radius, springs, typography } from '@/theme';
import { PressableScale } from './PressableScale';

export type Segment = {
  key: string;
  label: string;
  badge?: number;
};

type Props = {
  segments: Segment[];
  value: string;
  onChange: (key: string) => void;
  style?: StyleProp<ViewStyle>;
};

/**
 * iOS-style segmented control with a spring-driven sliding thumb. The track is
 * a translucent glass fill; the active segment rides a raised chip.
 */
export function SegmentedControl({ segments, value, onChange, style }: Props) {
  const [trackWidth, setTrackWidth] = useState(0);
  const index = Math.max(0, segments.findIndex((s) => s.key === value));
  const padding = 3;
  const segWidth = trackWidth > 0 ? (trackWidth - padding * 2) / segments.length : 0;
  const x = useSharedValue(0);

  useEffect(() => {
    if (segWidth > 0) {
      x.value = withSpring(padding + index * segWidth, springs.snappy);
    }
  }, [index, segWidth, x]);

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: x.value }],
    width: segWidth,
  }));

  const onLayout = (e: LayoutChangeEvent) => setTrackWidth(e.nativeEvent.layout.width);

  return (
    <View style={[styles.track, style]} onLayout={onLayout}>
      {segWidth > 0 && <Animated.View style={[styles.thumb, thumbStyle]} />}
      {segments.map((seg) => {
        const active = seg.key === value;
        return (
          <PressableScale
            key={seg.key}
            onPress={() => onChange(seg.key)}
            activeScale={0.97}
            accessibilityRole="tab"
            accessibilityLabel={seg.label}
            style={styles.segment}
          >
            <View style={styles.segmentInner}>
              <Text
                style={[
                  typography.subheadEmphasized,
                  { color: active ? palette.textPrimary : palette.textSecondary },
                ]}
                allowFontScaling={false}
              >
                {seg.label}
              </Text>
              {seg.badge != null && seg.badge > 0 && (
                <View style={[styles.badge, active ? styles.badgeActive : null]}>
                  <Text style={styles.badgeText} allowFontScaling={false}>
                    {seg.badge}
                  </Text>
                </View>
              )}
            </View>
          </PressableScale>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    height: 40,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255,255,255,0.06)',
    padding: 3,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.glassBorder,
  },
  thumb: {
    position: 'absolute',
    top: 3,
    bottom: 3,
    left: 0,
    borderRadius: radius.md - 3,
    backgroundColor: palette.surfaceElevated,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.10)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 3,
  },
  segment: {
    flex: 1,
  },
  segmentInner: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  badge: {
    minWidth: 18,
    height: 18,
    paddingHorizontal: 5,
    borderRadius: 9,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeActive: {
    backgroundColor: palette.copper,
  },
  badgeText: {
    ...typography.caption2,
    color: palette.white,
    fontWeight: '700',
  },
});
