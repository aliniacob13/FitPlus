import { ReactNode } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextStyle, View, ViewStyle } from "react-native";
import { colors, radius, typography } from "@/constants/theme";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "danger" | "accent";
type Size = "sm" | "md" | "lg";

interface ButtonProps {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  icon?: ReactNode;
}

const VARIANT_STYLE: Record<Variant, ViewStyle> = {
  primary:   { backgroundColor: colors.primaryBase },
  secondary: { backgroundColor: colors.surface2 },
  outline:   { backgroundColor: "transparent", borderWidth: 1, borderColor: colors.lineColor },
  ghost:     { backgroundColor: "transparent" },
  accent:    { backgroundColor: colors.accentBase },
  danger:    { backgroundColor: colors.error },
};

const LABEL_COLOR: Record<Variant, TextStyle> = {
  primary:   { color: colors.primaryInk },
  secondary: { color: colors.ink },
  outline:   { color: colors.ink },
  ghost:     { color: colors.ink },
  accent:    { color: colors.primaryInk },
  danger:    { color: "#fff" },
};

const SIZE_STYLE: Record<Size, ViewStyle> = {
  sm: { paddingVertical: 8,  paddingHorizontal: 14 },
  md: { paddingVertical: 12, paddingHorizontal: 18 },
  lg: { paddingVertical: 16, paddingHorizontal: 22 },
};

const LABEL_SIZE: Record<Size, TextStyle> = {
  sm: { fontSize: typography.size.sm },
  md: { fontSize: 14 },
  lg: { fontSize: 15 },
};

export const Button = ({
  label,
  onPress,
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  fullWidth = false,
  icon,
}: ButtonProps) => {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        VARIANT_STYLE[variant],
        SIZE_STYLE[size],
        fullWidth && styles.fullWidth,
        isDisabled && styles.disabled,
        pressed && !isDisabled && styles.pressed,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === "primary" || variant === "accent" ? colors.primaryInk : colors.primaryBase}
        />
      ) : (
        <View style={styles.content}>
          {icon}
          <Text style={[styles.label, LABEL_COLOR[variant], LABEL_SIZE[size]]}>
            {label}
          </Text>
        </View>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.button,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  content:  { flexDirection: "row", alignItems: "center", gap: 8 },
  fullWidth: { width: "100%" },
  pressed:   { opacity: 0.88 },
  disabled:  { opacity: 0.45 },
  label:     { fontWeight: "600", letterSpacing: 0.1 },
});