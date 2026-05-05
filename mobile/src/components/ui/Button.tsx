import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

import { colors, radius, shadows, spacing, typography } from "@/constants/theme";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

type ButtonProps = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
};

const variantStyles = {
  primary: {
    backgroundColor: colors.accent.base,
    ...shadows.accent,
  },
  secondary: {
    backgroundColor: colors.bg.elevated,
    borderWidth: 1,
    borderColor: colors.borderPalette.default,
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
    backgroundColor: "#ff5a5a22",
    borderWidth: 1,
    borderColor: colors.error,
  },
} as const;

const labelStyles = {
  primary: { color: colors.textPalette.inverse },
  secondary: { color: colors.text },
  outline: { color: colors.accent.text },
  ghost: { color: colors.accent.text },
  danger: { color: colors.error },
} as const;

const sizeStyles = {
  sm: { minHeight: 40, paddingHorizontal: spacing[4], borderRadius: radius.sm },
  md: { minHeight: 50, paddingHorizontal: spacing[6], borderRadius: radius.button },
  lg: { minHeight: 58, paddingHorizontal: spacing[8], borderRadius: radius.button },
} as const;

const sizeLabel = {
  sm: { fontSize: typography.size.sm },
  md: { fontSize: typography.size.base },
  lg: { fontSize: typography.size.md },
} as const;

export const Button = ({
  label,
  onPress,
  disabled = false,
  loading = false,
  variant = "primary",
  size = "md",
  fullWidth = false,
}: ButtonProps) => {
  const isDisabled = disabled || loading;
  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.button,
        variantStyles[variant],
        sizeStyles[size],
        fullWidth && styles.fullWidth,
        isDisabled && styles.disabled,
        pressed && styles.pressed,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variant === "primary" ? colors.textPalette.inverse : colors.accent.base} />
      ) : (
        <View style={styles.inner}>
          <Text style={[styles.label, labelStyles[variant], sizeLabel[size]]}>{label}</Text>
        </View>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  label: {
    fontWeight: "700",
    letterSpacing: typography.tracking.wide,
  },
  disabled: {
    opacity: 0.6,
  },
  fullWidth: {
    alignSelf: "stretch",
  },
  inner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  pressed: {
    transform: [{ scale: 0.99 }],
  },
});
