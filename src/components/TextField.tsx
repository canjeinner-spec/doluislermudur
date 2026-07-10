import React, { useState } from 'react';
import { StyleProp, StyleSheet, Text, TextInput, TextInputProps, View, ViewStyle } from 'react-native';

import { palette, radius, spacing, typography } from '@/theme';
import { Icon, IconName } from './icons';

type Props = {
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  icon?: IconName;
  multiline?: boolean;
  maxLength?: number;
  autoFocus?: boolean;
  style?: StyleProp<ViewStyle>;
  trailing?: React.ReactNode;
  accessibilityLabel?: string;
  returnKeyType?: 'done' | 'send' | 'next';
  onSubmitEditing?: () => void;
  editable?: boolean;
  secureTextEntry?: boolean;
  keyboardType?: TextInputProps['keyboardType'];
  autoCapitalize?: TextInputProps['autoCapitalize'];
  /** Fixed, non-editable text shown before the input (e.g. "@"). */
  prefix?: string;
};

/** Rounded field with a focus ring that warms to the accent color. */
export function TextField({
  value,
  onChangeText,
  placeholder,
  icon,
  multiline = false,
  maxLength,
  autoFocus,
  style,
  trailing,
  accessibilityLabel,
  returnKeyType,
  onSubmitEditing,
  editable = true,
  secureTextEntry,
  keyboardType,
  autoCapitalize,
  prefix,
}: Props) {
  const [focused, setFocused] = useState(false);

  const onFocus = () => setFocused(true);
  const onBlur = () => setFocused(false);

  return (
    <View
      style={[
        styles.wrap,
        multiline && styles.multiline,
        focused && styles.focused,
        !editable && styles.disabled,
        style,
      ]}
    >
      {icon && (
        <Icon
          name={icon}
          size={18}
          color={focused ? palette.amber : palette.textTertiary}
        />
      )}
      {prefix != null && <Text style={[typography.body, styles.prefix]}>{prefix}</Text>}
      <TextInput
        style={[styles.input, typography.body, multiline && styles.inputMultiline]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={palette.textTertiary}
        multiline={multiline}
        maxLength={maxLength}
        autoFocus={autoFocus}
        editable={editable}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        onFocus={onFocus}
        onBlur={onBlur}
        selectionColor={palette.amber}
        cursorColor={palette.amber}
        keyboardAppearance="dark"
        returnKeyType={returnKeyType}
        onSubmitEditing={onSubmitEditing}
        accessibilityLabel={accessibilityLabel ?? placeholder}
      />
      {maxLength != null && focused && (
        <Text style={styles.counter}>{maxLength - value.length}</Text>
      )}
      {trailing}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 52,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    backgroundColor: palette.surfaceSecondary,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.glassBorder,
  },
  multiline: {
    alignItems: 'flex-start',
    paddingVertical: spacing.md,
    minHeight: 84,
  },
  focused: {
    borderColor: 'rgba(200,127,76,0.55)',
    backgroundColor: palette.surfaceElevated,
  },
  disabled: { opacity: 0.6 },
  input: {
    flex: 1,
    color: palette.textPrimary,
    paddingVertical: 0,
  },
  prefix: {
    color: palette.textSecondary,
    marginRight: -4,
  },
  inputMultiline: {
    minHeight: 58,
    textAlignVertical: 'top',
  },
  counter: {
    ...typography.caption2,
    color: palette.textTertiary,
  },
});
