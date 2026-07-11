import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { palette } from '@/theme';

/** The ASTERA wordmark. The 5th glyph (R) is mirrored to echo the brand mark. */
export function Wordmark({
  size = 23,
  color = palette.textPrimary,
}: {
  size?: number;
  color?: string;
}) {
  return (
    <View style={styles.row}>
      {['A', 'S', 'T', 'E', 'R', 'A'].map((c, i) => (
        <Text
          key={i}
          allowFontScaling={false}
          style={[
            styles.letter,
            { fontSize: size, color, marginHorizontal: size * 0.074 },
            i === 4 && styles.mirror,
          ]}
        >
          {c}
        </Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  letter: { fontWeight: '800' },
  mirror: { transform: [{ scaleX: -1 }] },
});
