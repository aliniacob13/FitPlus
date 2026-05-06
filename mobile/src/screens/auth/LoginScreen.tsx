import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useMemo, useState } from "react";
import { StyleSheet, Text, View, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { Button } from "@/components/ui/Button";
import { ErrorState } from "@/components/ui/ErrorState";
import { Input } from "@/components/ui/Input";
import { Screen } from "@/components/ui/Screen";
import { colors, radius, spacing, typography } from "@/constants/theme";
import { useAuthStore } from "@/store/authStore";
import { AuthStackParamList } from "@/types/navigation";

type Props = NativeStackScreenProps<AuthStackParamList, "Login">;

export const LoginScreen = ({ navigation }: Props) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const login = useAuthStore((state) => state.login);
  const isSubmitting = useAuthStore((state) => state.isSubmitting);
  const error = useAuthStore((state) => state.error);

  const isFormValid = useMemo(() => email.includes("@") && password.length >= 6, [email, password]);

  const handleLogin = async () => {
    await login(email.trim(), password);
  };

  return (
    <Screen>
      <View style={styles.wrapper}>
        {/* ── Brand hero ── */}
        <View style={styles.heroSection}>
          <View style={styles.logoMark}>
            <Ionicons name="flash" size={30} color={colors.bg.base} />
          </View>
          <Text style={styles.appName}>FitPlus</Text>
          <Text style={styles.tagline}>Your AI-Powered Fitness Companion</Text>

          <View style={styles.pillsRow}>
            <View style={styles.pill}>
              <Ionicons name="barbell-outline" size={12} color={colors.accent.base} />
              <Text style={styles.pillText}>Workouts</Text>
            </View>
            <View style={styles.pill}>
              <Ionicons name="nutrition-outline" size={12} color={colors.accent.base} />
              <Text style={styles.pillText}>Nutrition</Text>
            </View>
            <View style={styles.pill}>
              <Ionicons name="map-outline" size={12} color={colors.accent.base} />
              <Text style={styles.pillText}>Gyms</Text>
            </View>
          </View>
        </View>

        {/* ── Form ── */}
        <View style={styles.formSection}>
          <Text style={styles.formTitle}>Welcome back</Text>
          <Text style={styles.formSubtitle}>Sign in to continue your journey</Text>

          <View style={styles.fields}>
            <Input
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="name@example.com"
              autoCapitalize="none"
              keyboardType="email-address"
            />
            <Input
              label="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholder="••••••••"
            />
          </View>

          {error ? <ErrorState message={error} /> : null}

          <Button
            label="Sign In"
            onPress={handleLogin}
            disabled={!isFormValid}
            loading={isSubmitting}
            size="lg"
            fullWidth
          />

          <Pressable
            onPress={() => navigation.navigate("Register")}
            disabled={isSubmitting}
            style={styles.registerLink}
          >
            <Text style={styles.registerLinkText}>
              {"Don't have an account? "}
              <Text style={styles.registerLinkAccent}>Create one</Text>
            </Text>
          </Pressable>
        </View>
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    gap: spacing.xl,
    paddingTop: spacing[4],
  },
  heroSection: {
    alignItems: "center",
    paddingVertical: spacing.xl,
    gap: spacing[3],
  },
  logoMark: {
    width: 68,
    height: 68,
    borderRadius: radius.lg,
    backgroundColor: colors.accent.base,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing[1],
    shadowColor: colors.accent.base,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 12,
  },
  appName: {
    fontSize: typography.size["3xl"],
    fontWeight: "900",
    color: colors.textPalette.primary,
    letterSpacing: -1,
  },
  tagline: {
    fontSize: typography.size.sm,
    color: colors.textPalette.secondary,
    letterSpacing: 0.3,
  },
  pillsRow: {
    flexDirection: "row",
    gap: spacing[2],
    marginTop: spacing[1],
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingVertical: 5,
    paddingHorizontal: spacing[3],
    borderRadius: radius.chip,
    backgroundColor: colors.accent.muted,
    borderWidth: 1,
    borderColor: colors.accent.base + "30",
  },
  pillText: {
    fontSize: typography.size.xs,
    color: colors.accent.base,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
  formSection: {
    gap: spacing.sm,
  },
  formTitle: {
    fontSize: typography.size.xl,
    fontWeight: "800",
    color: colors.textPalette.primary,
    letterSpacing: -0.5,
  },
  formSubtitle: {
    fontSize: typography.size.sm,
    color: colors.textPalette.secondary,
    marginBottom: spacing[2],
  },
  fields: {
    gap: spacing[2],
    marginBottom: spacing[2],
  },
  registerLink: {
    alignItems: "center",
    paddingVertical: spacing[3],
  },
  registerLinkText: {
    fontSize: typography.size.sm,
    color: colors.textPalette.secondary,
  },
  registerLinkAccent: {
    color: colors.accent.base,
    fontWeight: "700",
  },
});
