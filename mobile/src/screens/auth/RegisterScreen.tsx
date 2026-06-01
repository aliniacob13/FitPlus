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

type Props = NativeStackScreenProps<AuthStackParamList, "Register">;

const passwordStrength = (pw: string): number => {
  if (!pw) return 0;
  if (pw.length < 8) return 1;
  const hasNum = /\d/.test(pw);
  const hasSym = /[^a-zA-Z0-9]/.test(pw);
  if (pw.length >= 12 && hasNum && hasSym) return 4;
  if (hasNum) return 3;
  return 2;
};

const strengthColor = (level: number) => {
  if (level <= 1) return colors.error;
  if (level === 2) return colors.warning;
  return colors.good;
};

export const RegisterScreen = ({ navigation }: Props) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [agreed, setAgreed] = useState(false);

  const register = useAuthStore((s) => s.register);
  const isSubmitting = useAuthStore((s) => s.isSubmitting);
  const error = useAuthStore((s) => s.error);

  const pwLevel = useMemo(() => passwordStrength(password), [password]);
  const isFormValid = useMemo(
    () => name.trim().length > 1 && email.includes("@") && pwLevel >= 2 && agreed,
    [name, email, pwLevel, agreed],
  );

  return (
    <View style={styles.root}>
      <View style={styles.topBar}>
        <Pressable onPress={() => navigation.navigate("Welcome")} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color={colors.ink} />
        </Pressable>
        <Pressable onPress={() => navigation.navigate("Login")}>
          <Text style={styles.topAction}>Sign in</Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Progress dots */}
        <View style={styles.dots}>
          {[0, 1, 2, 3].map((i) => (
            <View key={i} style={[styles.dot, i === 0 && styles.dotActive]} />
          ))}
        </View>

        <View style={styles.titleBlock}>
          <Text style={styles.eyebrow}>CREATE ACCOUNT · 1 / 4</Text>
          <View style={styles.titleRow}>
            <Text style={styles.titleSerif}>Hai să-ți facem un </Text>
            <Text style={[styles.titleSerif, styles.titleAccent]}>cont.</Text>
          </View>
          <Text style={styles.sub}>Vom folosi datele ca să-ți personalizăm planul.</Text>
        </View>

        <View style={styles.fields}>
          <Input
            label="Nume complet"
            value={name}
            onChangeText={setName}
            placeholder="ex. Andrei Mocanu"
            autoCapitalize="words"
            icon="person-outline"
            big
          />
          <Input
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="email@exemplu.ro"
            autoCapitalize="none"
            keyboardType="email-address"
            icon="mail-outline"
            big
          />
          <View style={styles.pwWrapper}>
            <Input
              label="Parolă"
              value={password}
              onChangeText={setPassword}
              placeholder="min. 8 caractere"
              secureTextEntry
              icon="lock-closed-outline"
              big
            />
            {/* Strength meter */}
            {password.length > 0 && (
              <View style={styles.strengthRow}>
                {[1, 2, 3, 4].map((i) => (
                  <View
                    key={i}
                    style={[
                      styles.strengthSeg,
                      i <= pwLevel ? { backgroundColor: strengthColor(pwLevel) } : undefined,
                    ]}
                  />
                ))}
              </View>
            )}
          </View>

          <Pressable style={styles.checkRow} onPress={() => setAgreed((v) => !v)}>
            <View style={[styles.checkbox, agreed && styles.checkboxOn]}>
              {agreed && <Ionicons name="checkmark" size={12} color={colors.primaryInk} />}
            </View>
            <Text style={styles.checkLabel}>
              Sunt de acord cu{" "}
              <Text style={styles.checkLink}>Termenii</Text>
              {" "}și{" "}
              <Text style={styles.checkLink}>Politica de confidențialitate</Text>.
            </Text>
          </Pressable>
        </View>

        {error ? <ErrorState message={error} /> : null}

        <Button
          label="Continuă"
          onPress={() => void register(email.trim(), password)}
          disabled={!isFormValid}
          loading={isSubmitting}
          size="lg"
          fullWidth
          icon={<Ionicons name="arrow-forward" size={16} color={colors.primaryInk} />}
        />

        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>SAU</Text>
          <View style={styles.dividerLine} />
        </View>

        <View style={styles.socialRow}>
          {[{ label: "Apple", glyph: "" }, { label: "Google", glyph: "G" }, { label: "Facebook", glyph: "f" }].map((s) => (
            <View key={s.label} style={styles.socialBtn}>
              <Text style={styles.socialGlyph}>{s.glyph}</Text>
              <Text style={styles.socialLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.legal}>
          Continuând accepți{" "}
          <Text style={styles.legalLink}>Termenii</Text>
          {" "}și{" "}
          <Text style={styles.legalLink}>Politica de confidențialitate</Text>.
        </Text>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bgBase, paddingTop: 48 },
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
    paddingTop: spacing.sm,
    paddingBottom: 40,
    gap: spacing.md,
  },
  dots: { flexDirection: "row", gap: 6 },
  dot: {
    flex: 1,
    height: 4,
    borderRadius: 999,
    backgroundColor: colors.lineColor,
  },
  dotActive: { backgroundColor: colors.primaryBase },

  titleBlock: { gap: 4 },
  eyebrow: { ...typography.styles.eyebrow },
  titleRow: { flexDirection: "row", flexWrap: "wrap", marginTop: 8 },
  titleSerif: {
    fontFamily: "InstrumentSerif_400Regular",
    fontSize: 34,
    letterSpacing: -0.68,
    lineHeight: 38,
    color: colors.ink,
  },
  titleAccent: {
    fontFamily: "InstrumentSerif_400Regular_Italic",
    color: colors.primaryBase,
  },
  sub: { fontSize: 13, color: colors.mutedColor, marginTop: 4 },

  fields: { gap: spacing.md },
  pwWrapper: { gap: 8 },
  strengthRow: { flexDirection: "row", gap: 4 },
  strengthSeg: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.lineColor,
  },

  checkRow: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  checkbox: {
    width: 18, height: 18, borderRadius: 6,
    borderWidth: 1.5, borderColor: colors.lineColor,
    alignItems: "center", justifyContent: "center",
    marginTop: 1, flexShrink: 0,
  },
  checkboxOn: { backgroundColor: colors.primaryBase, borderColor: colors.primaryBase },
  checkLabel: { fontSize: 12, color: colors.mutedColor, lineHeight: 18, flex: 1 },
  checkLink: { color: colors.primaryBase, textDecorationLine: "underline" },

  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.lineSoft },
  dividerText: { ...typography.styles.eyebrow, fontSize: 9 },

  socialRow: { flexDirection: "row", gap: spacing.sm },
  socialBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, paddingVertical: 12,
    backgroundColor: colors.surfaceBase,
    borderWidth: 1, borderColor: colors.lineColor, borderRadius: radius.input,
  },
  socialGlyph: { fontSize: 15, fontWeight: "700", color: colors.ink, minWidth: 14, textAlign: "center" },
  socialLabel: { fontSize: 12, fontWeight: "500", color: colors.ink2 },

  legal: { fontSize: 11, color: colors.mutedColor, textAlign: "center", lineHeight: 17 },
  legalLink: { textDecorationLine: "underline" },
});