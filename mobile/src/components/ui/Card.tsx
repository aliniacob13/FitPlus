import { ReactNode } from "react";
import { StyleSheet, Text, TouchableOpacity, View, ViewStyle } from "react-native";
import { colors, radius, shadows, spacing, typography } from "@/constants/theme";

type Variant = "default" | "elevated" | "accent" | "flat";

interface CardProps {
  children: ReactNode;
  variant?: Variant;
  padding?: "none" | "sm" | "md" | "lg";
  title?: string;
  onPress?: () => void;
  style?: ViewStyle;
}

export const Card = ({
  children,
  variant = "default",
  padding = "md",
  title,
  onPress,
  style,
}: CardProps) => {
  const Container = onPress ? TouchableOpacity : View;
  const containerProps = onPress ? { onPress, activeOpacity: 0.82 } : {};

  return (
    <Container
      {...containerProps}
      style={[
        styles.base,
        styles[`variant_${variant}`],
        padding !== "none" && styles[`padding_${padding}`],
        style,
      ]}
    >
      {title ? (
        <Text style={styles.title}>{title}</Text>
      ) : null}
      {children}
    </Container>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.card,
    overflow: "hidden",
    borderWidth: 1,
  },
  variant_default: {
    backgroundColor: colors.surfaceBase,
    borderColor: colors.lineColor,
  },
  variant_elevated: {
    backgroundColor: colors.surface2,
    borderColor: colors.lineColor,
    ...shadows.sm,
  },
  variant_accent: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primaryBase + "40",
  },
  variant_flat: {
    backgroundColor: colors.surface2,
    borderColor: "transparent",
  },

  padding_sm: { padding: spacing.sm },
  padding_md: { padding: spacing.md },
  padding_lg: { padding: spacing.lg },

  title: {
    ...typography.styles.h3,
    marginBottom: spacing.sm,
  },
});