import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors, typography, spacing } from '../../theme';
import Button from './Button';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ErrorStateProps {
  /** Short headline — defaults to "Something went wrong" */
  title?: string;
  /** Longer explanation — defaults to a generic network error message */
  message?: string;
  /** If provided, renders a retry button */
  onRetry?: () => void;
  /** Label for the retry button */
  retryLabel?: string;
  /** Override container style */
  style?: ViewStyle;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ErrorState({
  title      = 'Something went wrong',
  message    = 'We couldn\'t load this content. Check your connection and try again.',
  onRetry,
  retryLabel = 'Try again',
  style,
}: ErrorStateProps) {
  return (
    <View style={[styles.container, style]}>
      {/* Icon — simple "!" in a circle, no external dependency */}
      <View style={styles.iconCircle}>
        <Text style={styles.iconText}>!</Text>
      </View>

      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>

      {onRetry && (
        <Button
          label={retryLabel}
          onPress={onRetry}
          variant="outline"
          size="sm"
          style={styles.button}
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
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: `${colors.error}20`,
    borderWidth: 1.5,
    borderColor: `${colors.error}60`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  iconText: {
    color: colors.error,
    fontSize: 26,
    fontWeight: '700',
    lineHeight: 30,
  },
  title: {
    ...typography.styles.h3,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing[2],
  },
  message: {
    ...typography.styles.bodySmall,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.lg,
  },
  button: {
    minWidth: 140,
  },
});
