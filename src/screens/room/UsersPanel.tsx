import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Avatar, GradientButton, Icon } from '@/components';
import type { Participant } from '@/data';
import { palette, radius, spacing, typography } from '@/theme';

type Props = {
  participants: Participant[];
  bottomInset: number;
  onInvite: () => void;
};

const ROLE_LABEL: Record<Participant['role'], string> = {
  host: 'Sunucu',
  cohost: 'Yardımcı Sunucu',
  member: 'Üye',
};

/** Slide-over roster: host, co-hosts and members with watching/online state. */
export function UsersPanel({ participants, bottomInset, onInvite }: Props) {
  const host = participants.find((p) => p.role === 'host');
  const others = participants.filter((p) => p.role !== 'host');
  const onlineCount = participants.filter((p) => p.online).length;

  return (
    <View style={styles.root}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.summary}>
          <Text style={[typography.footnote, styles.summaryText]}>
            {participants.length} katılımcı · {onlineCount} çevrimiçi
          </Text>
        </View>

        {host && (
          <>
            <Text style={[typography.sectionHeader, styles.sectionLabel]}>Sunucu</Text>
            <UserRow participant={host} />
          </>
        )}

        <Text style={[typography.sectionHeader, styles.sectionLabel]}>Katılımcılar</Text>
        <View style={styles.group}>
          {others.map((p) => (
            <UserRow key={p.id} participant={p} />
          ))}
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: bottomInset + spacing.sm }]}>
        <GradientButton label="Katılımcı Davet Et" icon="person-add" onPress={onInvite} />
      </View>
    </View>
  );
}

function UserRow({ participant }: { participant: Participant }) {
  return (
    <View style={styles.row}>
      <Avatar name={participant.name} tint={participant.tint} size={40} online={participant.online} />
      <View style={styles.text}>
        <View style={styles.nameRow}>
          <Text style={[typography.subheadEmphasized, styles.name]} numberOfLines={1}>
            {participant.name}
          </Text>
          {participant.role !== 'member' && (
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
      <View style={[styles.status, participant.watching ? styles.watching : styles.idle]}>
        <Icon
          name={participant.watching ? 'eye' : 'pause'}
          size={12}
          color={participant.watching ? palette.online : palette.textTertiary}
          strokeWidth={2}
        />
        <Text
          style={[
            typography.caption2,
            { color: participant.watching ? palette.online : palette.textTertiary, fontWeight: '600' },
          ]}
        >
          {participant.watching ? 'İzliyor' : 'Beklemede'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
  },
  summary: {
    marginBottom: spacing.lg,
  },
  summaryText: {
    color: palette.textSecondary,
  },
  sectionLabel: {
    color: palette.textTertiary,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  group: {
    gap: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  text: {
    flex: 1,
    gap: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  name: {
    color: palette.textPrimary,
    flexShrink: 1,
  },
  role: {
    color: palette.textTertiary,
  },
  status: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    height: 24,
    borderRadius: 12,
  },
  watching: {
    backgroundColor: 'rgba(78,208,138,0.12)',
  },
  idle: {
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: palette.separator,
  },
});
