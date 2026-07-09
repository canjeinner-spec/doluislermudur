import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import {
  GradientButton,
  Icon,
  IconButton,
  NavBar,
  PressableScale,
  ScreenBackground,
  SectionHeader,
} from '@/components';
import { palette, radius, spacing, typography } from '@/theme';
import type { RootStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'CreateRoom'>;

/**
 * Minimal room creation: the user only chooses privacy. The room's name comes
 * from the content they start on the provider, and capacity is fixed — so there
 * are no text fields or steppers to slow the flow down.
 */
export function CreateRoomScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [isPublic, setIsPublic] = useState(true);

  const onContinue = () => {
    navigation.navigate('PlatformSelect', { draft: { isPublic } });
  };

  return (
    <ScreenBackground glow="top">
      <NavBar
        compact
        title="Oda Oluştur"
        left={
          <IconButton
            icon="chevron-left"
            accessibilityLabel="Kapat"
            variant="solid"
            onPress={() => navigation.goBack()}
          />
        }
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 120 }]}
      >
        <View style={styles.hero}>
          <View style={styles.heroIcon}>
            <Icon name="film" size={30} color={palette.amberBright} />
          </View>
          <Text style={[typography.title2, styles.heroTitle]}>Birlikte izleyin</Text>
          <Text style={[typography.subhead, styles.heroSub]}>
            Odanın gizliliğini seç. İçeriği bir sonraki adımda platformdan başlatınca oda otomatik
            olarak açılır.
          </Text>
        </View>

        <SectionHeader title="Gizlilik" style={styles.sectionSpacing} />
        <View style={styles.group}>
          <PrivacyRow
            icon="globe"
            title="Herkese Açık"
            subtitle="Herkes bu odayı bulabilir ve katılabilir"
            selected={isPublic}
            onPress={() => setIsPublic(true)}
          />
          <PrivacyRow
            icon="lock"
            title="Özel"
            subtitle="Yalnızca davet ettiğin kişiler katılabilir"
            selected={!isPublic}
            onPress={() => setIsPublic(false)}
          />
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
        <GradientButton label="Platform Seç" icon="chevron-right" onPress={onContinue} />
      </View>
    </ScreenBackground>
  );
}

function PrivacyRow({
  icon,
  title,
  subtitle,
  selected,
  onPress,
}: {
  icon: 'globe' | 'lock';
  title: string;
  subtitle: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <PressableScale onPress={onPress} activeScale={0.99} activeOpacity={0.8} accessibilityLabel={title}>
      <View style={[styles.privacy, selected && styles.privacySelected]}>
        <View style={[styles.privacyIcon, selected && styles.privacyIconActive]}>
          <Icon name={icon} size={20} color={selected ? palette.amberBright : palette.textSecondary} />
        </View>
        <View style={styles.privacyText}>
          <Text style={[typography.bodyEmphasized, styles.privacyTitle]}>{title}</Text>
          <Text style={[typography.footnote, styles.privacySub]}>{subtitle}</Text>
        </View>
        <View style={[styles.radio, selected && styles.radioSelected]}>
          {selected && <View style={styles.radioDot} />}
        </View>
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  hero: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xl,
  },
  heroIcon: {
    width: 68,
    height: 68,
    borderRadius: radius.xl,
    backgroundColor: palette.accentTintSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.glassBorder,
  },
  heroTitle: {
    color: palette.textPrimary,
  },
  heroSub: {
    color: palette.textSecondary,
    textAlign: 'center',
    paddingHorizontal: spacing.md,
  },
  sectionSpacing: {
    marginTop: spacing.sm,
  },
  group: {
    gap: spacing.sm,
  },
  privacy: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.md,
    backgroundColor: palette.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.glassBorder,
  },
  privacySelected: {
    borderColor: 'rgba(200,127,76,0.5)',
    backgroundColor: palette.accentTintSoft,
  },
  privacyIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.sm,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  privacyIconActive: {
    backgroundColor: palette.accentTintMed,
  },
  privacyText: {
    flex: 1,
    gap: 2,
  },
  privacyTitle: {
    color: palette.textPrimary,
  },
  privacySub: {
    color: palette.textSecondary,
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: palette.textQuaternary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    borderColor: palette.copper,
  },
  radioDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: palette.copper,
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    backgroundColor: 'rgba(9,9,9,0.6)',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: palette.separator,
  },
});
