import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { palette, radius, spacing, typography } from '@/theme';

type Props = { children: React.ReactNode };
type State = { error: Error | null; info: string | null };

/**
 * Catches render/runtime errors from the tree below and shows the message +
 * component stack on-device instead of a blank crash. Invaluable for
 * diagnosing issues over a tunnel where native logs aren't reachable.
 */
export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null, info: null };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error };
  }

  componentDidCatch(error: Error, info: { componentStack?: string }) {
    // Also surface to Metro.
    // eslint-disable-next-line no-console
    console.error('ASTERA ErrorBoundary caught:', error, info.componentStack);
    this.setState({ info: info.componentStack ?? null });
  }

  render() {
    const { error, info } = this.state;
    if (!error) return this.props.children;
    return (
      <ScrollView style={styles.root} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Bir hata oluştu</Text>
        <View style={styles.card}>
          <Text style={styles.name}>{error.name}</Text>
          <Text style={styles.message}>{error.message}</Text>
        </View>
        {info ? (
          <View style={styles.card}>
            <Text style={styles.label}>Component stack</Text>
            <Text style={styles.stack}>{info.trim()}</Text>
          </View>
        ) : null}
        {error.stack ? (
          <View style={styles.card}>
            <Text style={styles.label}>Stack</Text>
            <Text style={styles.stack}>{error.stack}</Text>
          </View>
        ) : null}
      </ScrollView>
    );
  }
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.background },
  content: { padding: spacing.xl, paddingTop: 80, gap: spacing.lg },
  title: { ...typography.title2, color: palette.danger },
  card: {
    backgroundColor: palette.surfaceSecondary,
    borderRadius: radius.md,
    padding: spacing.lg,
    gap: spacing.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.glassBorder,
  },
  name: { ...typography.headline, color: palette.amber },
  message: { ...typography.body, color: palette.textPrimary },
  label: { ...typography.footnoteEmphasized, color: palette.textTertiary },
  stack: { ...typography.caption1, color: palette.textSecondary, fontFamily: undefined },
});
