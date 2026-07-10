import React from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Avatar, GradientButton, Icon, PressableScale } from '@/components';
import type { Participant } from '@/data';
import { palette, radius, spacing, typography } from '@/theme';

type Props = {
  participants: Participant[];
  bottomInset: number;
  onInvite: () => void;
  /** Host-only kick controls appear when isHost is set. */
  isHost?: boolean;
  myId?: string | null;
  onKick?: (participant: Participant) => void;
};

const ROLE_LABEL: Record<Participant['role'], string> = {
  host: 'Sunucu',
  cohost: 'Yardımcı Sunucu',
  member: 'Üye',
};

/** Slide-over roster: host and members grouped into clean cards. */
export function UsersPanel({ participants, bottomInset, onInvite, isHost, myId, onKick }: Props) {
  const host = participants.find((p) => p.role === 'host');
  const others = participants.filter((p) => p.role !== 'host');

  const kick = (p: Participant) => {
    Alert.alert(`${p.name} odadan çıkarılsın mı?`, 'Tekrar davet etmediğin sürece bu odaya geri giremez.', [
      { text: 'Vazgeç', style: 'cancel' },
      { text: 'Çıkar', style: 'destructive', onPress: () => onKick?.(p) },
    ]);
  };

  return (
    <View style={styles.root}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {host && (
          <>
            <Text style={styles.section}>SUNUCU</Text>
            <View style={styles.card}>
              <UserRow participant={host} />
            </View>
          </>
        )}

        <Text style={styles.section}>KATILIMCILAR</Text>
        <View style={styles.card}>
          {others.map((p, i) => (
            <View key={p.id}>
              {i > 0 && <View style={styles.divider} />}
              <UserRow participant={p} canKick={!!isHost && p.id !== myId} onKick={() => kick(p)} />
            </View>
          ))}
          {others.length === 0 && (
            <Text style={styles.emptyMembers}>Henüz kimse yok — arkadaşlarını davet et.</Text>
          )}
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: bottomInset + spacing.sm }]}>
        <GradientButton label="Davet Et" icon="person-add" onPress={onInvite} />
      </View>
    </View>
  );
}

function UserRow({
  participant,
  canKick,
  onKick,
}: {
  participant: Participant;
  canKick?: boolean;
  onKick?: () => void;
}) {
  const isMember = participant.role === 'member';
  return (
    <View style={styles.row}>
      <Avatar name={participant.name} tint={participant.tint} size={40} online={participant.online} imageUrl={participant.avatarUrl} />
      <View style={styles.text}>
        <View style={styles.nameRow}>
          <Text style={[typography.subheadEmphasized, styles.name]} numberOfLines={1}>
            {participant.name}
          </Text>
          {!isMember && (
            <Icon
              name="crown"
              size={13}
              color={participant.role === 'host' ? palette.amber : palette.textTertiary}
              filled
            />
          )}
        </View>
        <Text style={[typography.caption1, styles.role]}>{ROLE_LABEL[participant.role]}</Text>
      </View>
      {canKick ? (
        <PressableScale onPress={onKick} activeScale={0.9} accessibilityLabel={`${participant.name} çıkar`}>
          <View style={styles.kickBtn}>
            <Icon name="close" size={16} color={palette.danger} strokeWidth={2.4} />
          </View>
        </PressableScale>
      ) : (
        <View style={[styles.status, participant.watching ? styles.watching : styles.idle]}>
          <Icon
            name={participant.watching ? 'eye' : 'pause'}
            size={11}
            color={participant.watching ? palette.online : palette.textTertiary}
            strokeWidth={2}
          />
          <Text
            style={[
              typography.caption2,
              { color: participant.watching ? palette.online : palette.textTertiary, fontWeight: '700' },
            ]}
          >
            {participant.watching ? 'İzliyor' : 'Beklemede'}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: spacing.lg, paddingTop: spacing.xs, paddingBottom: spacing.md },
  section: {
    ...typography.caption2,
    color: palette.textTertiary,
    fontWeight: '700',
    letterSpacing: 0.6,
    marginBottom: spacing.sm,
    marginTop: spacing.lg,
    marginLeft: spacing.xs,
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.glassBorder,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: palette.separator, marginLeft: 64 },
  text: { flex: 1, gap: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  name: { color: palette.textPrimary, flexShrink: 1 },
  role: { color: palette.textTertiary },
  status: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    height: 24,
    borderRadius: 12,
  },
  watching: { backgroundColor: 'rgba(78,208,138,0.13)' },
  idle: { backgroundColor: 'rgba(255,255,255,0.06)' },
  kickBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(229,72,77,0.14)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(229,72,77,0.3)',
  },
  emptyMembers: {
    ...typography.footnote,
    color: palette.textTertiary,
    textAlign: 'center',
    paddingVertical: spacing.lg,
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: palette.separator,
  },
});
