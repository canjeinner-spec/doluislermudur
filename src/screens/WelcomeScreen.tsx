import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { GlassSurface, Icon, PressableScale, ScreenBackground, Wordmark } from '@/components';
import { accentGradient, palette, radius, spacing, typography } from '@/theme';
import type { RootStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Welcome'>;

/**
 * First-launch dedication. A short, personal note from the maker before the
 * onboarding CTA — shown once, then we move on to "Başlayalım".
 */
export function WelcomeScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <ScreenBackground glow="top">
      <StatusBar style="light" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + spacing.xxl, paddingBottom: insets.bottom + spacing.xl },
        ]}
      >
        <Animated.View entering={FadeInDown.duration(500)} style={styles.header}>
          <View style={styles.emblem}>
            <Icon name="sparkle" size={26} color={palette.amber} filled />
          </View>
          <Wordmark size={30} />
          <Text style={[typography.subhead, styles.kicker]}>Bir teşekkür</Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(500).delay(120)}>
          <GlassSurface borderRadius={radius.xxl} intensity={26} style={styles.card}>
            <Text style={[typography.body, styles.para]}>
              Bu uygulamayı, sevdiklerinden uzakta olan herkes için yaptım.
            </Text>
            <Text style={[typography.body, styles.para]}>
              Benim de bir sevgilim var ama aramızda kilometreler var. Uzun mesafenin ne demek
              olduğunu, o özlemi iyi biliyorum. Onunla daha güzel vakit geçirmek, arkadaşlarımla
              aynı odadaymışız gibi hissetmek istedim. ASTERA biraz da bu yüzden var.
            </Text>
            <Text style={[typography.body, styles.para]}>
              Nerede olursan ol; birlikte izleyin, gülün, o anı paylaşın. Aradaki mesafe bir
              anlığına da olsa kaybolsun.
            </Text>
            <Text style={[typography.body, styles.para]}>
              İndirdiğin için teşekkürler. Umarım seni de sevdiklerine biraz yaklaştırır.
            </Text>

            <View style={styles.sign}>
              <Text style={[typography.bodyEmphasized, styles.signName]}>— Arda</Text>
              <Text style={[typography.footnote, styles.handle]}>Instagram · @ardaowskix</Text>
            </View>
          </GlassSurface>
        </Animated.View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.lg }]}>
        <PressableScale onPress={() => navigation.replace('Onboarding')} activeScale={0.97} accessibilityLabel="Devam et">
          <LinearGradient colors={accentGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.cta}>
            <Text style={[typography.headline, styles.ctaText]}>Devam et</Text>
          </LinearGradient>
        </PressableScale>
      </View>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: spacing.lg, gap: spacing.xl },
  header: { alignItems: 'center', gap: spacing.sm },
  emblem: {
    width: 60,
    height: 60,
    borderRadius: radius.xl,
    backgroundColor: palette.accentTintSoft,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.glassBorder,
    marginBottom: spacing.xs,
  },
  kicker: { color: palette.amber, letterSpacing: 0.3 },
  card: { padding: spacing.xl, gap: spacing.md },
  para: { color: palette.textSecondary, lineHeight: 23 },
  sign: { marginTop: spacing.sm, gap: 2 },
  signName: { color: palette.textPrimary },
  handle: { color: palette.textTertiary },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  cta: { height: 56, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center' },
  ctaText: { color: palette.white, fontWeight: '700', letterSpacing: 0.2 },
});
