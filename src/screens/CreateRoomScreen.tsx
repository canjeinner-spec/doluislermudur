import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
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
  TextField,
} from '@/components';
import { palette, radius, spacing, typography } from '@/theme';
import type { RootStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'CreateRoom'>;

const CAPACITIES = [4, 6, 8, 10, 12, 20];

export function CreateRoomScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [capacity, setCapacity] = useState(10);

  const canContinue = name.trim().length >= 2;

  const onContinue = () => {
    if (!canContinue) return;
    navigation.navigate('PlatformSelect', {
      draft: {
        name: name.trim(),
        description: description.trim(),
        isPublic,
        maxParticipants: capacity,
      },
    });
  };

  return (
    <ScreenBackground glow="top">
      <NavBar
        compact
        title="Yeni Oda Oluştur"
        left={
          <IconButton
            icon="chevron-left"
            accessibilityLabel="Kapat"
            variant="solid"
            onPress={() => navigation.goBack()}
          />
        }
      />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={8}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 120 }]}
        >
          <SectionHeader title="Oda Bilgileri" />
          <View style={styles.group}>
            <TextField
              value={name}
              onChangeText={setName}
              placeholder="Oda adı"
              icon="film"
              maxLength={40}
              autoFocus
            />
            <TextField
              value={description}
              onChangeText={setDescription}
              placeholder="Açıklama (isteğe bağlı)"
              multiline
              maxLength={120}
            />
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
              subtitle="Yalnızca davet edilenler katılabilir"
              selected={!isPublic}
              onPress={() => setIsPublic(false)}
            />
          </View>

          <SectionHeader title="Katılımcı Sınırı" style={styles.sectionSpacing} />
          <View style={styles.capacityRow}>
            {CAPACITIES.map((c) => {
              const active = c === capacity;
              return (
                <PressableScale
                  key={c}
                  onPress={() => setCapacity(c)}
                  activeScale={0.92}
                  accessibilityLabel={`${c} kişi`}
                  style={styles.capacityChipWrap}
                >
                  <View style={[styles.capacityChip, active && styles.capacityChipActive]}>
                    <Text
                      style={[
                        typography.bodyEmphasized,
                        { color: active ? palette.white : palette.textSecondary },
                      ]}
                    >
                      {c}
                    </Text>
                  </View>
                </PressableScale>
              );
            })}
          </View>
          <Text style={[typography.footnote, styles.hint]}>
            En fazla {capacity} kişi aynı anda birlikte izleyebilir.
          </Text>
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
          <GradientButton label="Devam Et" icon="chevron-right" disabled={!canContinue} onPress={onContinue} />
        </View>
      </KeyboardAvoidingView>
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
          <Icon name={icon} size={19} color={selected ? palette.amberBright : palette.textSecondary} />
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
  flex: { flex: 1 },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  group: {
    gap: spacing.sm,
  },
  sectionSpacing: {
    marginTop: spacing.xl,
  },
  privacy: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
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
    width: 40,
    height: 40,
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
  capacityRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  capacityChipWrap: {
    flexGrow: 1,
    flexBasis: '14%',
  },
  capacityChip: {
    height: 52,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.glassBorder,
  },
  capacityChipActive: {
    backgroundColor: palette.copper,
    borderColor: palette.copper,
  },
  hint: {
    color: palette.textTertiary,
    marginTop: spacing.md,
    paddingHorizontal: spacing.xs,
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
