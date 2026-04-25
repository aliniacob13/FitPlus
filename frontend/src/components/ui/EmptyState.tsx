import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors, typography, spacing, radius } from '../../theme';
import Button from './Button';

// ─── Types ────────────────────────────────────────────────────────────────────

interface EmptyStateProps {
  /** Large emoji or short symbol used as the illustration */
  icon?: string;
  /** Main headline */
  title: string;
  /** Supporting description */
  message?: string;
  /** Primary CTA label — renders a button when provided */
  actionLabel?: string;
  onAction?: () => void;
  /** Secondary CTA label */
  secondaryLabel?: string;
  onSecondary?: () => void;
  /** Override container style */
  style?: ViewStyle;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function EmptyState({
  icon          = '✦',
  title,
  message,
  actionLabel,
  onAction,
  secondaryLabel,
  onSecondary,
  style,
}: EmptyStateProps) {
  return (
    <View style={[styles.container, style]}>
      {/* Decorative icon blob */}
      <View style={styles.iconBlob}>
        <Text style={styles.icon}>{icon}</Text>
      </View>

      <Text style={styles.title}>{title}</Text>

      {message && (
        <Text style={styles.message}>{message}</Text>
      )}

      {actionLabel && onAction && (
        <Button
          label={actionLabel}
          onPress={onAction}
          variant="primary"
          size="md"
          style={styles.primaryBtn}
        />
      )}

      {secondaryLabel && onSecondary && (
        <Button
          label={secondaryLabel}
          onPress={onSecondary}
          variant="ghost"
          size="sm"
        />
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing['2xl'],
    paddingVertical: spacing['3xl'],
  },
  iconBlob: {
    width: 80,
    height: 80,
    borderRadius: radius.xl,
    backgroundColor: colors.accent.muted,
    borderWidth: 1,
    borderColor: `${colors.accent.base}30`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
    // subtle rotation for visual interest
    transform: [{ rotate: '6deg' }],
  },
  icon: {
    fontSize: 36,
    // counter-rotate so emoji stays upright
    transform: [{ rotate: '-6deg' }],
  },
  title: {
    ...typography.styles.h2,
    textAlign: 'center',
    marginBottom: spacing[2],
  },
  message: {
    ...typography.styles.bodySmall,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: spacing.xl,
    maxWidth: 280,
  },
  primaryBtn: {
    minWidth: 180,
    marginBottom: spacing[3],
  },
});
