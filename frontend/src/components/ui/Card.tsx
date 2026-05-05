import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { colors, typography, spacing, radius, shadows } from '../../theme';

// ─── Types ────────────────────────────────────────────────────────────────────

type Variant = 'default' | 'elevated' | 'accent' | 'flat';

interface CardProps {
  children: React.ReactNode;
  /** Visual style of the card */
  variant?: Variant;
  /** If provided, the whole card becomes a pressable */
  onPress?: () => void;
  /** Card title rendered in a header row above children */
  title?: string;
  /** Subtitle rendered next to / below the title */
  subtitle?: string;
  /** Right-side element in the header row (e.g. a badge or icon button) */
  headerRight?: React.ReactNode;
  /** Override container style */
  style?: ViewStyle;
  /** Override title style */
  titleStyle?: TextStyle;
  /** Padding preset — 'none' for custom content that bleeds edge-to-edge */
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

// ─── Variant definitions ──────────────────────────────────────────────────────

const variantStyles: Record<Variant, ViewStyle> = {
  default: {
    backgroundColor: colors.bg.surface,
    borderWidth: 1,
    borderColor: colors.border.default,
    ...shadows.sm,
  },
  elevated: {
    backgroundColor: colors.bg.elevated,
    borderWidth: 1,
    borderColor: colors.border.muted,
    ...shadows.md,
  },
  accent: {
    backgroundColor: colors.bg.surface,
    borderWidth: 1.5,
    borderColor: colors.accent.base,
    ...shadows.accent,
  },
  flat: {
    backgroundColor: colors.bg.surface,
    borderWidth: 0,
  },
};

const paddingMap = {
  none: 0,
  sm:   spacing.md,   // 16
  md:   spacing.lg,   // 24
  lg:   spacing['2xl'], // 32
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function Card({
  children,
  variant  = 'default',
  onPress,
  title,
  subtitle,
  headerRight,
  style,
  titleStyle,
  padding  = 'md',
}: CardProps) {
  const hasHeader = title || subtitle || headerRight;
  const pad       = paddingMap[padding];

  const content = (
    <>
      {hasHeader && (
        <View style={[styles.header, pad > 0 && { paddingHorizontal: pad, paddingTop: pad }]}>
          <View style={styles.headerText}>
            {title && (
              <Text style={[styles.title, titleStyle]} numberOfLines={1}>
                {title}
              </Text>
            )}
            {subtitle && (
              <Text style={styles.subtitle} numberOfLines={2}>
                {subtitle}
              </Text>
            )}
          </View>
          {headerRight && <View style={styles.headerRight}>{headerRight}</View>}
        </View>
      )}

      <View style={pad > 0 && { padding: pad, paddingTop: hasHeader ? spacing[3] : pad }}>
        {children}
      </View>
    </>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.8}
        style={[styles.base, variantStyles[variant], style]}
      >
        {content}
      </TouchableOpacity>
    );
  }

  return (
    <View style={[styles.base, variantStyles[variant], style]}>
      {content}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.card,
    overflow: 'hidden',
    marginBottom: spacing[4],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  headerText: {
    flex: 1,
    marginRight: spacing[3],
  },
  headerRight: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  title: {
    ...typography.styles.h3,
    marginBottom: 2,
  },
  subtitle: {
    ...typography.styles.bodySmall,
  },
});
