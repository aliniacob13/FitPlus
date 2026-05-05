import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
  View,
} from 'react-native';
import { colors, typography, spacing, radius, shadows } from '../../theme';

// ─── Types ────────────────────────────────────────────────────────────────────

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type Size    = 'sm' | 'md' | 'lg';

interface ButtonProps {
  /** Button label */
  label: string;
  onPress: () => void;
  variant?: Variant;
  size?: Size;
  /** Show spinner and disable interaction */
  loading?: boolean;
  /** Disable button */
  disabled?: boolean;
  /** Optional icon rendered to the left of the label */
  leftIcon?: React.ReactNode;
  /** Optional icon rendered to the right of the label */
  rightIcon?: React.ReactNode;
  /** Override container style */
  style?: ViewStyle;
  /** Override label style */
  labelStyle?: TextStyle;
  /** Stretch to fill parent width */
  fullWidth?: boolean;
}

// ─── Variant styles ───────────────────────────────────────────────────────────

const variantContainer: Record<Variant, ViewStyle> = {
  primary: {
    backgroundColor: colors.accent.base,
    ...shadows.accent,
  },
  secondary: {
    backgroundColor: colors.bg.elevated,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  outline: {
    backgroundColor: colors.transparent,
    borderWidth: 1.5,
    borderColor: colors.accent.base,
  },
  ghost: {
    backgroundColor: colors.transparent,
  },
  danger: {
    backgroundColor: '#ff5a5a22',
    borderWidth: 1,
    borderColor: colors.error,
  },
};

const variantLabel: Record<Variant, TextStyle> = {
  primary:   { color: colors.text.inverse },
  secondary: { color: colors.text.primary },
  outline:   { color: colors.accent.text },
  ghost:     { color: colors.accent.text },
  danger:    { color: colors.error },
};

const variantPressedBg: Record<Variant, string> = {
  primary:   colors.accent.dim,
  secondary: colors.bg.overlay,
  outline:   colors.accent.muted,
  ghost:     colors.bg.elevated,
  danger:    '#ff5a5a33',
};

// ─── Size styles ──────────────────────────────────────────────────────────────

const sizeContainer: Record<Size, ViewStyle> = {
  sm: { paddingVertical: spacing[2], paddingHorizontal: spacing[4],  borderRadius: radius.sm,     minHeight: 36 },
  md: { paddingVertical: spacing[3], paddingHorizontal: spacing[6],  borderRadius: radius.button, minHeight: 50 },
  lg: { paddingVertical: spacing[4], paddingHorizontal: spacing[8],  borderRadius: radius.button, minHeight: 58 },
};

const sizeLabel: Record<Size, TextStyle> = {
  sm: { fontSize: typography.size.sm, fontWeight: '600', letterSpacing: typography.tracking.wide },
  md: { fontSize: typography.size.base, fontWeight: '700', letterSpacing: typography.tracking.wide },
  lg: { fontSize: typography.size.md,   fontWeight: '700', letterSpacing: typography.tracking.wider },
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function Button({
  label,
  onPress,
  variant  = 'primary',
  size     = 'md',
  loading  = false,
  disabled = false,
  leftIcon,
  rightIcon,
  style,
  labelStyle,
  fullWidth = false,
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.75}
      style={[
        styles.base,
        variantContainer[variant],
        sizeContainer[size],
        fullWidth && styles.fullWidth,
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' ? colors.text.inverse : colors.accent.base}
        />
      ) : (
        <View style={styles.inner}>
          {leftIcon && <View style={styles.iconLeft}>{leftIcon}</View>}
          <Text
            style={[
              styles.label,
              variantLabel[variant],
              sizeLabel[size],
              isDisabled && styles.labelDisabled,
              labelStyle,
            ]}
            numberOfLines={1}
          >
            {label}
          </Text>
          {rightIcon && <View style={styles.iconRight}>{rightIcon}</View>}
        </View>
      )}
    </TouchableOpacity>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  fullWidth: {
    alignSelf: 'stretch',
  },
  disabled: {
    opacity: 0.4,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    textAlign: 'center',
  },
  labelDisabled: {
    opacity: 0.6,
  },
  iconLeft: {
    marginRight: spacing[2],
  },
  iconRight: {
    marginLeft: spacing[2],
  },
});
