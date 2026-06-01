import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { Button } from "@/components/ui/Button";
import { ErrorState } from "@/components/ui/ErrorState";
import { Input } from "@/components/ui/Input";
import { colors, radius, spacing, typography } from "@/constants/theme";
import { useAuthStore } from "@/store/authStore";
import { AuthStackParamList } from "@/types/navigation";

type Props = NativeStackScreenProps<AuthStackParamList, "Login">;

export const LoginScreen = ({ navigation }: Props) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [keepLoggedIn, setKeepLoggedIn] = useState(true);

  const login = useAuthStore((s) => s.login);
  const isSubmitting = useAuthStore((s) => s.isSubmitting);
  const error = useAuthStore((s) => s.error);

  const isFormValid = useMemo(
    () => email.includes("@") && password.length >= 6,
    [email, password],
  );

  return (
    <View style={styles.root}>
      {/* Back */}
      <View style={styles.topBar}>
        <Pressable onPress={() => navigation.navigate("Welcome")} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color={colors.ink} />
        </Pressable>
        <Pressable onPress={() => navigation.navigate("Register")}>
          <Text style={styles.topAction}>Cont nou</Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Title */}
        <View style={styles.titleBlock}>
          <Text style={styles.eyebrow}>SIGN IN</Text>
          <View style={styles.titleRow}>
            <Text style={styles.titleSerif}>Bine ai </Text>
            <Text style={[styles.titleSerif, styles.titleAccent]}>revenit.</Text>
          </View>
          <Text style={styles.sub}>Continuă streak-ul de azi.</Text>
        </View>

        {/* Fields */}
        <View style={styles.fields}>
          <Input
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="andrei@fitplus.ro"
            autoCapitalize="none"
            keyboardType="email-address"
            icon="mail-outline"
            big
          />
          <Input
            label="Parolă"
            value={password}
            onChangeText={setPassword}
            placeholder="min. 8 caractere"
            secureTextEntry
            icon="lock-closed-outline"
            big
          />

          <View style={styles.row}>
            <Pressable style={styles.checkRow} onPress={() => setKeepLoggedIn((v) => !v)}>
              <View style={[styles.checkbox, keepLoggedIn && styles.checkboxOn]}>
                {keepLoggedIn && <Ionicons name="checkmark" size={12} color={colors.primaryInk} />}
              </View>
              <Text style={styles.checkLabel}>Ține-mă conectat</Text>
            </Pressable>
            <Text style={styles.forgotLink}>Ai uitat parola?</Text>
          </View>
        </View>

        {error ? <ErrorState message={error} /> : null}

        <Button
          label="Intră în cont"
          onPress={() => void login(email.trim(), password)}
          disabled={!isFormValid}
          loading={isSubmitting}
          size="lg"
          fullWidth
          icon={<Ionicons name="arrow-forward" size={16} color={colors.primaryInk} />}
        />

        {/* Divider */}
        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>SAU CONTINUĂ CU</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Social buttons */}
        <View style={styles.socialRow}>
          {[{ label: "Apple", glyph: "" }, { label: "Google", glyph: "G" }, { label: "Facebook", glyph: "f" }].map((s) => (
            <View key={s.label} style={styles.socialBtn}>
              <Text style={styles.socialGlyph}>{s.glyph}</Text>
              <Text style={styles.socialLabel}>{s.label}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bgBase,
    paddingTop: 48,
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.screen,
    paddingBottom: spacing.sm,
  },
  backBtn: { padding: 4 },
  topAction: { fontSize: 12, fontWeight: "500", color: colors.mutedColor },

  content: {
    paddingHorizontal: spacing.screen,
    paddingTop: spacing.md,
    paddingBottom: 40,
    gap: spacing.md,
  },
  titleBlock: { gap: 4, marginBottom: spacing.sm },
  eyebrow: { ...typography.styles.eyebrow },
  titleRow: { flexDirection: "row", flexWrap: "wrap", marginTop: 8 },
  titleSerif: {
    fontFamily: "InstrumentSerif_400Regular",
    fontSize: 36,
    letterSpacing: -0.72,
    lineHeight: 40,
    color: colors.ink,
  },
  titleAccent: {
    fontFamily: "InstrumentSerif_400Regular_Italic",
    color: colors.primaryBase,
  },
  sub: { fontSize: 13, color: colors.mutedColor, marginTop: 4 },

  fields: { gap: spacing.md },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: -spacing[2],
  },
  checkRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  checkbox: {
    width: 18, height: 18, borderRadius: 6,
    borderWidth: 1.5, borderColor: colors.lineColor,
    alignItems: "center", justifyContent: "center",
  },
  checkboxOn: {
    backgroundColor: colors.primaryBase,
    borderColor: colors.primaryBase,
  },
  checkLabel: { fontSize: 12, color: colors.mutedColor },
  forgotLink: { fontSize: 12, color: colors.primaryBase, fontWeight: "600" },

  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
    marginVertical: spacing[2],
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.lineSoft },
  dividerText: { ...typography.styles.eyebrow, fontSize: 9 },

  socialRow: { flexDirection: "row", gap: spacing.sm },
  socialBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    backgroundColor: colors.surfaceBase,
    borderWidth: 1,
    borderColor: colors.lineColor,
    borderRadius: radius.input,
  },
  socialGlyph: { fontSize: 15, fontWeight: "700", color: colors.ink, minWidth: 14, textAlign: "center" },
  socialLabel: { fontSize: 12, fontWeight: "500", color: colors.ink2 },
});