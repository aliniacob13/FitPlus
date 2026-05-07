import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useMemo, useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { Button } from "@/components/ui/Button";
import { ErrorState } from "@/components/ui/ErrorState";
import { Input } from "@/components/ui/Input";
import { Screen } from "@/components/ui/Screen";
import { colors, radius, spacing, typography } from "@/constants/theme";
import { useAuthStore } from "@/store/authStore";
import { AuthStackParamList } from "@/types/navigation";

type Props = NativeStackScreenProps<AuthStackParamList, "Register">;

// ── PasswordInput ─────────────────────────────────────────────────────────────
// Componentă locală care imită stilul Input-ului existent + buton ochi

type PasswordInputProps = {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  visible: boolean;
  onToggleVisible: () => void;
};

const PasswordInput = ({
  label,
  value,
  onChangeText,
  placeholder,
  visible,
  onToggleVisible,
}: PasswordInputProps) => (
  <View style={pwStyles.wrapper}>
    <Text style={pwStyles.label}>{label}</Text>
    <View style={pwStyles.row}>
      <TextInput
        style={pwStyles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textPalette.muted}
        secureTextEntry={!visible}
        autoCapitalize="none"
        autoCorrect={false}
      />
      <TouchableOpacity
        style={pwStyles.eyeBtn}
        onPress={onToggleVisible}
        activeOpacity={0.7}
        accessibilityLabel={visible ? "Hide password" : "Show password"}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Ionicons
          name={visible ? "eye-off-outline" : "eye-outline"}
          size={20}
          color={colors.textPalette.muted}
        />
      </TouchableOpacity>
    </View>
  </View>
);

const pwStyles = StyleSheet.create({
  wrapper: { gap: 6 },
  label: {
    fontSize: typography.size.xs,
    fontWeight: "600",
    color: colors.textPalette.secondary,
    letterSpacing: typography.tracking.wide,
    textTransform: "uppercase",
    marginLeft: 2,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.bg.elevated,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderPalette.default,
    paddingHorizontal: spacing.md,
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: typography.size.base,
    color: colors.textPalette.primary,
  },
  eyeBtn: {
    paddingLeft: spacing[2],
    justifyContent: "center",
    alignItems: "center",
  },
});

// ── RegisterScreen ────────────────────────────────────────────────────────────

export const RegisterScreen = ({ navigation }: Props) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Eye toggle state
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const register = useAuthStore((state) => state.register);
  const isSubmitting = useAuthStore((state) => state.isSubmitting);
  const error = useAuthStore((state) => state.error);

  const isFormValid = useMemo(
    () =>
      email.includes("@") &&
      password.length >= 6 &&
      confirmPassword === password,
    [email, password, confirmPassword],
  );

  const passwordsMatch =
    confirmPassword.length === 0 || confirmPassword === password;

  const handleRegister = async () => {
    await register(email.trim(), password);
  };

  const features = [
    { icon: "barbell-outline" as const, label: "AI Workout Coach" },
    { icon: "nutrition-outline" as const, label: "Diet Assistant" },
    { icon: "camera-outline" as const, label: "Plate Analysis" },
    { icon: "map-outline" as const, label: "Gym Discovery" },
  ];

  return (
    <Screen>
      <View style={styles.wrapper}>
        {/* ── Header ── */}
        <View style={styles.header}>
          <Pressable
            onPress={() => navigation.navigate("Login")}
            style={styles.backBtn}
          >
            <Ionicons
              name="arrow-back"
              size={20}
              color={colors.textPalette.secondary}
            />
          </Pressable>
          <View style={styles.logoMark}>
            <Ionicons name="flash" size={18} color={colors.bg.base} />
          </View>
          <Text style={styles.appName}>FitPlus</Text>
        </View>

        {/* ── Title ── */}
        <View style={styles.titleSection}>
          <Text style={styles.title}>Start your journey</Text>
          <Text style={styles.subtitle}>
            Create your free account and unlock your potential
          </Text>
        </View>

        {/* ── Feature grid ── */}
        <View style={styles.featuresGrid}>
          {features.map((f) => (
            <View key={f.label} style={styles.featureItem}>
              <Ionicons name={f.icon} size={16} color={colors.accent.base} />
              <Text style={styles.featureLabel}>{f.label}</Text>
            </View>
          ))}
        </View>

        {/* ── Form ── */}
        <View style={styles.fields}>
          <Input
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="name@example.com"
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <PasswordInput
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="Min. 6 characters"
            visible={showPassword}
            onToggleVisible={() => setShowPassword((v) => !v)}
          />

          <View>
            <PasswordInput
              label="Confirm Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Repeat password"
              visible={showConfirmPassword}
              onToggleVisible={() => setShowConfirmPassword((v) => !v)}
            />
            {!passwordsMatch ? (
              <Text style={styles.fieldError}>Passwords do not match</Text>
            ) : null}
          </View>
        </View>

        {error ? <ErrorState message={error} /> : null}

        <Button
          label="Create Account"
          onPress={handleRegister}
          disabled={!isFormValid}
          loading={isSubmitting}
          size="lg"
          fullWidth
        />

        <Pressable
          onPress={() => navigation.navigate("Login")}
          disabled={isSubmitting}
          style={styles.loginLink}
        >
          <Text style={styles.loginLinkText}>
            {"Already have an account? "}
            <Text style={styles.loginLinkAccent}>Sign in</Text>
          </Text>
        </Pressable>

        <Text style={styles.terms}>
          By creating an account you agree to our Terms of Service and Privacy
          Policy.
        </Text>
      </View>
    </Screen>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    gap: spacing.sm,
    paddingTop: spacing[2],
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
    marginBottom: spacing[2],
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: radius.md,
    backgroundColor: colors.bg.elevated,
    borderWidth: 1,
    borderColor: colors.borderPalette.default,
    alignItems: "center",
    justifyContent: "center",
  },
  logoMark: {
    width: 38,
    height: 38,
    borderRadius: radius.md,
    backgroundColor: colors.accent.base,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.accent.base,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  appName: {
    fontSize: typography.size.lg,
    fontWeight: "900",
    color: colors.textPalette.primary,
    letterSpacing: -0.5,
  },
  titleSection: {
    gap: spacing[1],
    marginBottom: spacing[2],
  },
  title: {
    fontSize: typography.size["2xl"],
    fontWeight: "800",
    color: colors.textPalette.primary,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: typography.size.sm,
    color: colors.textPalette.secondary,
    lineHeight: 20,
  },
  featuresGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing[2],
    marginBottom: spacing[2],
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: spacing[3],
    borderRadius: radius.chip,
    backgroundColor: colors.accent.muted,
    borderWidth: 1,
    borderColor: colors.accent.base + "25",
  },
  featureLabel: {
    fontSize: typography.size.xs,
    color: colors.accent.base,
    fontWeight: "600",
  },
  fields: {
    gap: spacing[2],
  },
  fieldError: {
    fontSize: typography.size.xs,
    color: colors.error,
    marginTop: 4,
    marginLeft: 2,
  },
  loginLink: {
    alignItems: "center",
    paddingVertical: spacing[2],
  },
  loginLinkText: {
    fontSize: typography.size.sm,
    color: colors.textPalette.secondary,
  },
  loginLinkAccent: {
    color: colors.accent.base,
    fontWeight: "700",
  },
  terms: {
    fontSize: typography.size.xs,
    color: colors.textPalette.muted,
    textAlign: "center",
    lineHeight: 16,
    paddingBottom: spacing.xl,
  },
});