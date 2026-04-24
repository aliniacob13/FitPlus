import { ActivityIndicator, Pressable, StyleSheet, Text } from "react-native";

import { colors, spacing } from "@/constants/theme";

type ButtonProps = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
};

export const Button = ({ label, onPress, disabled = false, loading = false }: ButtonProps) => {
  const isDisabled = disabled || loading;
  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [styles.button, isDisabled && styles.disabled, pressed && styles.pressed]}
    >
      {loading ? <ActivityIndicator color={colors.white} /> : <Text style={styles.label}>{label}</Text>}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
  },
  label: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "600",
  },
  disabled: {
    opacity: 0.6,
  },
  pressed: {
    transform: [{ scale: 0.99 }],
  },
});
