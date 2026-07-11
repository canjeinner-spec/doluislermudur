import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Icon } from '@/components/icons';
import { palette, radius, spacing, typography } from '@/theme';

/** The heartfelt letter shown in "Hakkında" — a thank-you to the person using
 *  ASTERA, kept as plain paragraphs so it reads like a note, not a marketing
 *  page. The one emphasized line is pulled out for a little breathing room. */
const LETTER: string[] = [
  'Bu uygulamayı, sevdiklerine uzakta olan herkes için yaptım.',
  'Ben de uzun mesafe ilişkisinin nasıl hissettirdiğini biliyorum. Sevdiğin insan kilometrelerce uzaktayken, bazen aynı filmi izlemek ya da birlikte birkaç saat geçirmek bile çok değerli oluyor.',
  'İster sevgilinle, ister arkadaşlarınla, ister ailenle… Nerede olursanız olun aynı odadaymış gibi bir araya gelin. Birlikte izleyin, sohbet edin, gülün ve anılar biriktirin.',
  'Eğer ASTERA, sevdiğin insanlarla arandaki mesafeyi olsa olsa birkaç saatliğine unutturabiliyorsa, amacına ulaşmış demektir.',
  'Burada olduğun için teşekkür ederim. Umarım bu uygulama seni, değer verdiğin insanlara biraz daha yakın hissettirir.',
];

/** App identity and a personal thank-you note. */
export function AboutSheet() {
  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <View style={styles.logo}>
          <Icon name="film" size={34} color={palette.amberBright} />
        </View>
        <Text style={[typography.title2, styles.brand]}>ASTERA</Text>
        <Text style={[typography.subhead, styles.tagline]}>Watch Together. Anywhere.</Text>
        <Text style={[typography.caption1, styles.version]}>Sürüm 1.0.0 (MVP)</Text>
      </View>

      <View style={styles.letter}>
        <Text style={[typography.caption1, styles.kicker]}>BİR TEŞEKKÜR</Text>

        <Text style={[typography.body, styles.para]}>{LETTER[0]}</Text>
        <Text style={[typography.body, styles.para]}>{LETTER[1]}</Text>

        <Text style={[typography.title3, styles.pull]}>ASTERA tam da bu yüzden doğdu.</Text>

        <Text style={[typography.body, styles.para]}>{LETTER[2]}</Text>
        <Text style={[typography.body, styles.para]}>{LETTER[3]}</Text>
        <Text style={[typography.body, styles.para]}>{LETTER[4]}</Text>
      </View>

      <View style={styles.signoff}>
        <Icon name="sparkle" size={14} color={palette.amber} />
        <Text style={[typography.footnote, styles.signoffText]}>Sevgiyle yapıldı</Text>
      </View>

      <Text style={[typography.caption1, styles.credit]}>© 2026 ASTERA</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: spacing.xl,
    alignItems: 'center',
  },
  hero: {
    alignItems: 'center',
    gap: 4,
    marginBottom: spacing.xl,
  },
  logo: {
    width: 76,
    height: 76,
    borderRadius: radius.xl,
    backgroundColor: palette.accentTintSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.glassBorder,
  },
  brand: {
    color: palette.textPrimary,
    letterSpacing: 3,
  },
  tagline: {
    color: palette.amber,
  },
  version: {
    color: palette.textTertiary,
    marginTop: 2,
  },
  letter: {
    alignSelf: 'stretch',
    gap: spacing.md,
  },
  kicker: {
    color: palette.amber,
    letterSpacing: 2,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  para: {
    color: palette.textSecondary,
    lineHeight: 23,
  },
  pull: {
    color: palette.textPrimary,
    textAlign: 'center',
    marginVertical: spacing.xs,
  },
  signoff: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: spacing.xl,
  },
  signoffText: {
    color: palette.textSecondary,
  },
  credit: {
    color: palette.textTertiary,
    marginTop: spacing.sm,
  },
});
