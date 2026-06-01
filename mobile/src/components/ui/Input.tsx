import { useState, ReactNode } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { KeyboardTypeOptions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius, spacing, typography } from "@/constants/theme";

interface InputProps {
  label?: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  multiline?: boolean;
  editable?: boolean;
  trailing?: ReactNode;
  icon?: React.ComponentProps<typeof Ionicons>["name"];
  big?: boolean;
}

export const Input = ({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry = false,
  keyboardType = "default",
  autoCapitalize = "sentences",
  multiline = false,
  editable = true,
  trailing,
  icon,
  big = false,
}: InputProps) => {
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(secureTextEntry);

  return (
    <View style={styles.wrapper}>
      {label ? <Text style={styles.label}>{label.toUpperCase()}</Text> : null}
      <View style={[
        styles.field,
        big && styles.fieldBig,
        focused && styles.fieldFocused,
        !editable && styles.fieldDisabled,
      ]}>
        {icon ? (
          <Ionicons name={icon} size={big ? 18 : 16} color={colors.mutedColor} style={styles.icon} />
        ) : null}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.muted2}
          secureTextEntry={hidden}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          multiline={multiline}
          editable={editable}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={[styles.input, big && styles.inputBig, multiline && styles.inputMultiline]}
        />
        {secureTextEntry ? (
          <Pressable onPress={() => setHidden((h) => !h)} style={styles.trailing}>
            <Ionicons name={hidden ? "eye-outline" : "eye-off-outline"} size={16} color={colors.mutedColor} />
          </Pressable>
        ) : trailing ? (
          <View style={styles.trailing}>{trailing}</View>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: { gap: 6 },
  label: {
    ...typography.styles.eyebrow,
    fontSize: 9,
  },
  field: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surfaceBase,
    borderWidth: 1,
    borderColor: colors.lineColor,
    borderRadius: radius.input,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    gap: 10,
  },
  fieldBig: {
    paddingVertical: 14,
    paddingHorizontal: spacing.md,
  },
  fieldFocused: {
    borderColor: colors.primaryBase,
  },
  fieldDisabled: {
    opacity: 0.5,
  },
  icon: {},
  input: {
    flex: 1,
    color: colors.ink,
    fontSize: 14,
    padding: 0,
  },
  inputBig: { fontSize: 15 },
  inputMultiline: { minHeight: 72, textAlignVertical: "top" },
  trailing: { marginLeft: spacing[1] },
});
