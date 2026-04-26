import { ReactNode } from "react";
import { StyleSheet, Text, TouchableOpacity, View, ViewStyle } from "react-native";

import { colors, radius, shadows, spacing, typography } from "@/constants/theme";

type Variant = "default" | "elevated" | "accent" | "flat";
type Padding = "none" | "sm" | "md" | "lg";

type CardProps = {
  children: ReactNode;
  variant?: Variant;
  onPress?: () => void;
  title?: string;
  subtitle?: string;
  style?: ViewStyle;
  padding?: Padding;
};

const variantStyles: Record<Variant, ViewStyle> = {
  default: {
    backgroundColor: colors.bg.surface,
    borderWidth: 1,
    borderColor: colors.borderPalette.default,
    ...shadows.sm,
  },
  elevated: {
    backgroundColor: colors.bg.elevated,
    borderWidth: 1,
    borderColor: colors.borderPalette.muted,
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

const paddingMap: Record<Padding, number> = {
  none: 0,
  sm: spacing.md,
  md: spacing.lg,
  lg: spacing["2xl"],
};

export const Card = ({ children, variant = "default", onPress, title, subtitle, style, padding = "md" }: CardProps) => {
  const pad = paddingMap[padding];
  const hasHeader = Boolean(title || subtitle);
  const content = (
    <>
      {hasHeader ? (
        <View style={[styles.header, pad > 0 ? { paddingHorizontal: pad, paddingTop: pad } : undefined]}>
          <View style={styles.headerText}>
            {title ? <Text style={styles.title}>{title}</Text> : null}
            {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
          </View>
        </View>
      ) : null}
      <View style={pad > 0 ? { padding: pad, paddingTop: hasHeader ? spacing[3] : pad } : undefined}>{children}</View>
    </>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={[styles.base, variantStyles[variant], style]}>
        {content}
      </TouchableOpacity>
    );
  }

  return <View style={[styles.base, variantStyles[variant], style]}>{content}</View>;
};

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.card,
    overflow: "hidden",
    marginBottom: spacing[4],
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  headerText: {
    flex: 1,
    marginRight: spacing[3],
  },
  title: {
    ...typography.styles.h3,
    marginBottom: 2,
  },
  subtitle: {
    ...typography.styles.bodySmall,
  },
});
