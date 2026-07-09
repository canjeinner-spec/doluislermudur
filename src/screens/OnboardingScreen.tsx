import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { PressableScale } from '@/components';
import { palette, radius, spacing, typography } from '@/theme';
import { storage, StorageKeys } from '@/storage/storage';
import type { RootStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Onboarding'>;

const IMG_RATIO = 853 / 1844; // width / height of the artwork
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
 * First-run onboarding. The artwork (photo + ASTERA logo + tagline + subtitle)
 * is shown whole — pinned to full width and the top, so nothing is cropped —
 * and the two real buttons drop into the empty black space the art leaves at
 * the bottom.
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

      {/* Full width, pinned to the top, natural aspect ratio → the whole
          composition is visible and its black lower third meets the black
          background seamlessly. */}
      <Image source={require('../../assets/onboarding.png')} style={styles.art} resizeMode="cover" />

      {/* Gentle fade into pure black at the very bottom so the buttons always
          sit on a clean field regardless of device height. */}
      <LinearGradient
        colors={['rgba(9,9,9,0)', palette.background]}
        locations={[0, 1]}
        style={styles.bottomFade}
        pointerEvents="none"
      />

      <Animated.View
        entering={FadeIn.duration(500).delay(150)}
        style={[styles.footer, { paddingBottom: insets.bottom + spacing.xl }]}
      >
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
  art: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    aspectRatio: IMG_RATIO,
  },
  bottomFade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '20%',
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  primaryBtn: {
    height: 58,
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
    height: 54,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.16)',
  },
  secondaryText: { color: palette.white, fontWeight: '600' },
});
