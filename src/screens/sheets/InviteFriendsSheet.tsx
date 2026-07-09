import React, { useState } from 'react';
import { ScrollView, Share, StyleSheet, Text, View } from 'react-native';

import { FRIENDS } from '@/data';
import { Avatar, GradientButton, Icon, PressableScale, TextField } from '@/components';
import { palette, radius, spacing, typography } from '@/theme';

/**
 * Friends list whose sole purpose is sending room invitations — no messaging.
 * Each row toggles between "Davet Et" and an invited confirmation.
 */
export function InviteFriendsSheet({ roomName }: { roomName?: string }) {
  const [invited, setInvited] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState('');

  const toggle = (id: string) => {
    setInvited((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const shareLink = () => {
    Share.share({
      message: `${roomName ? `"${roomName}" odasına katıl! ` : ''}ASTERA'da birlikte izleyelim: https://astera.app/join/8F3K2Q`,
    }).catch(() => {});
  };

  const filtered = FRIENDS.filter(
    (f) =>
      f.name.toLowerCase().includes(query.toLowerCase()) ||
      f.handle.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <View style={styles.root}>
      <TextField
        value={query}
        onChangeText={setQuery}
        placeholder="Arkadaş ara"
        icon="search"
        style={styles.search}
      />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.list}>
        {filtered.map((f) => {
          const isInvited = invited.has(f.id);
          return (
            <View key={f.id} style={styles.row}>
              <Avatar name={f.name} tint={f.tint} size={40} online={f.online} />
              <View style={styles.text}>
                <Text style={[typography.subheadEmphasized, styles.name]}>{f.name}</Text>
                <Text style={[typography.caption1, styles.handle]}>
                  {f.online ? 'Çevrimiçi' : 'Çevrimdışı'} · {f.handle}
                </Text>
              </View>
              <PressableScale
                onPress={() => toggle(f.id)}
                activeScale={0.94}
                accessibilityLabel={isInvited ? `${f.name} davet edildi` : `${f.name} davet et`}
              >
                <View style={[styles.invite, isInvited && styles.invited]}>
                  <Icon
                    name={isInvited ? 'check' : 'person-add'}
                    size={15}
                    color={isInvited ? palette.online : palette.amberBright}
                    strokeWidth={2.2}
                  />
                  <Text
                    style={[
                      typography.footnoteEmphasized,
                      { color: isInvited ? palette.online : palette.amberBright },
                    ]}
                  >
                    {isInvited ? 'Davet edildi' : 'Davet et'}
                  </Text>
                </View>
              </PressableScale>
            </View>
          );
        })}
      </ScrollView>
      <GradientButton label="Davet Linki Paylaş" icon="share" onPress={shareLink} style={styles.cta} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  search: {
    marginBottom: spacing.md,
  },
  list: {
    paddingBottom: spacing.md,
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
  name: {
    color: palette.textPrimary,
  },
  handle: {
    color: palette.textTertiary,
  },
  invite: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: spacing.md,
    height: 34,
    borderRadius: radius.pill,
    backgroundColor: palette.accentTintSoft,
  },
  invited: {
    backgroundColor: 'rgba(78,208,138,0.14)',
  },
  cta: {
    marginTop: spacing.sm,
  },
});
