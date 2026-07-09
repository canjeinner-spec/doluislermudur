import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { PressableScale } from '@/components';
import { palette, radius, spacing, typography } from '@/theme';
import { storage, StorageKeys } from '@/storage/storage';
import type { RootStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Onboarding'>;

// Warm peach→copper wash matching the "Başlayalım" button baked into the art.
const PRIMARY_GRADIENT = ['#EDBF95', '#D3925E', '#B06B3E'] as const;

function ArrowRight() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 12h15M13 6l6 6-6 6"
        stroke={palette.white}
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/**
 * First-run onboarding. The supplied artwork (logo, tagline, dots) is the
 * full-bleed background; we fade its lower edge into black and lay real,
 * functional buttons over the "Başlayalım" / "Giriş Yap" positions.
 */
export function OnboardingScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();

  const enter = () => {
    storage.setBool(StorageKeys.onboardingDone, true);
    navigation.replace('Home');
  };

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <Image source={require('../../assets/onboarding.png')} style={StyleSheet.absoluteFill} resizeMode="cover" />

      {/* Keep the baked logo / tagline / subtitle (all above ~76%) crisp, then
          go solid black below so the baked dots + buttons vanish and our real
          controls sit on a clean footer. Measured against the artwork layout. */}
      <LinearGradient
        colors={['rgba(9,9,9,0)', 'rgba(9,9,9,0)', palette.background, palette.background]}
        locations={[0, 0.76, 0.805, 1]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      <Animated.View
        entering={FadeInDown.duration(500).delay(120)}
        style={[styles.footer, { paddingBottom: insets.bottom + spacing.lg }]}
      >
        <View style={styles.dots}>
          <View style={[styles.dot, styles.dotActive]} />
          <View style={styles.dot} />
          <View style={styles.dot} />
        </View>

        <PressableScale onPress={enter} activeScale={0.97} accessibilityLabel="Başlayalım">
          <LinearGradient
            colors={PRIMARY_GRADIENT}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.primaryBtn}
          >
            <Text style={[typography.headline, styles.primaryText]}>Başlayalım</Text>
            <View style={styles.arrow}>
              <ArrowRight />
            </View>
          </LinearGradient>
        </PressableScale>

        <PressableScale onPress={enter} activeScale={0.97} accessibilityLabel="Giriş Yap">
          <View style={styles.secondaryBtn}>
            <Text style={[typography.headline, styles.secondaryText]}>Giriş Yap</Text>
          </View>
        </PressableScale>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.background },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.28)',
  },
  dotActive: {
    width: 20,
    backgroundColor: palette.amber,
  },
  primaryBtn: {
    height: 56,
    borderRadius: radius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  primaryText: { color: palette.white, fontWeight: '700', letterSpacing: 0.2 },
  arrow: { position: 'absolute', right: spacing.xl },
  secondaryBtn: {
    height: 52,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.16)',
  },
  secondaryText: { color: palette.white, fontWeight: '600' },
});
