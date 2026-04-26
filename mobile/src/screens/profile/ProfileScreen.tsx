import { useEffect, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ErrorState } from "@/components/ui/ErrorState";
import { Input } from "@/components/ui/Input";
import { Screen } from "@/components/ui/Screen";
import { colors, radius, spacing, typography } from "@/constants/theme";
import { useAuthStore } from "@/store/authStore";
import { useUserStore } from "@/store/userStore";
import { AppStackParamList } from "@/types/navigation";

type NavProp = NativeStackNavigationProp<AppStackParamList, "MainTabs">;

export const ProfileScreen = () => {
  const navigation = useNavigation<NavProp>();
  const profile = useUserStore((state) => state.profile);
  const loading = useUserStore((state) => state.loading);
  const saving = useUserStore((state) => state.saving);
  const error = useUserStore((state) => state.error);
  const fetchMe = useUserStore((state) => state.fetchMe);
  const updateProfile = useUserStore((state) => state.updateProfile);
  const logout = useAuthStore((state) => state.logout);

  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [heightCm, setHeightCm] = useState("");
  const [fitnessLevel, setFitnessLevel] = useState("");
  const [goals, setGoals] = useState("");
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  useEffect(() => {
    setName(profile?.name ?? "");
    setAge(profile?.age?.toString() ?? "");
    setWeightKg(profile?.weight_kg?.toString() ?? "");
    setHeightCm(profile?.height_cm?.toString() ?? "");
    setFitnessLevel(profile?.fitness_level ?? "");
    setGoals(profile?.goals ?? "");
  }, [profile]);

  const parseOptionalNumber = (value: string): number | undefined => {
    const trimmed = value.trim();
    if (!trimmed) {
      return undefined;
    }
    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : undefined;
  };

  const handleSave = async () => {
    setSaveMessage(null);
    const success = await updateProfile({
      name: name.trim() || undefined,
      age: parseOptionalNumber(age),
      weight_kg: parseOptionalNumber(weightKg),
      height_cm: parseOptionalNumber(heightCm),
      fitness_level: fitnessLevel.trim() || undefined,
      goals: goals.trim() || undefined,
    });
    if (success) {
      setSaveMessage("Profil salvat.");
    }
  };

  const handleLogout = () => {
    Alert.alert("Log out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Log out", style: "destructive", onPress: () => void logout() },
    ]);
  };

  const displayName = profile?.name || profile?.email?.split("@")[0] || "Athlete";
  const initials = displayName
    .split(" ")
    .map((word) => word[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.avatarSection}>
          <View style={styles.avatarRing}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
          </View>
          <Text style={styles.displayName}>{displayName}</Text>
          <Text style={styles.email}>{profile?.email ?? "N/A"}</Text>
          {profile?.fitness_level ? (
            <View style={styles.levelBadge}>
              <Text style={styles.levelBadgeText}>{profile.fitness_level}</Text>
            </View>
          ) : null}
        </View>

        <Card variant="default" title="Body Stats" padding="md">
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Age</Text>
            <Text style={styles.statValue}>{profile?.age ? `${profile.age} yrs` : "—"}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Weight</Text>
            <Text style={styles.statValue}>{profile?.weight_kg ? `${profile.weight_kg} kg` : "—"}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Height</Text>
            <Text style={styles.statValue}>{profile?.height_cm ? `${profile.height_cm} cm` : "—"}</Text>
          </View>
        </Card>

        <Card variant="default" title="Quick edit" padding="md">
          <Input label="Nume" value={name} onChangeText={setName} placeholder="Ex: Miruna" autoCapitalize="words" />
          <Input label="Varsta" value={age} onChangeText={setAge} placeholder="Ex: 24" keyboardType="numeric" />
          <Input label="Greutate (kg)" value={weightKg} onChangeText={setWeightKg} placeholder="Ex: 60.5" keyboardType="numeric" />
          <Input label="Inaltime (cm)" value={heightCm} onChangeText={setHeightCm} placeholder="Ex: 168" keyboardType="numeric" />
          <Input label="Nivel fitness" value={fitnessLevel} onChangeText={setFitnessLevel} placeholder="beginner / intermediate" />
          <Input label="Obiective" value={goals} onChangeText={setGoals} placeholder="Ex: slabire, tonifiere" multiline />
        </Card>

        {error ? <ErrorState message={error} /> : null}
        {saveMessage ? <Text style={styles.success}>{saveMessage}</Text> : null}

        <Button label="Refresh profile" onPress={() => void fetchMe()} loading={loading} variant="outline" fullWidth />
        <Button label="Save profile" onPress={() => void handleSave()} loading={saving} fullWidth />
        <Button label="Open full edit screen" onPress={() => navigation.navigate("UpdateProfile")} variant="secondary" fullWidth />
        <Button label="Logout" onPress={handleLogout} variant="danger" fullWidth />
      </ScrollView>
    </Screen>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
    paddingBottom: spacing["2xl"],
  },
  success: {
    color: colors.success,
    fontWeight: "700",
  },
  avatarSection: {
    alignItems: "center",
    paddingVertical: spacing.xl,
  },
  avatarRing: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 2,
    borderColor: colors.accent.base,
    padding: 3,
    marginBottom: spacing[3],
    shadowColor: colors.accent.base,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  avatar: {
    flex: 1,
    borderRadius: 48,
    backgroundColor: colors.accent.muted,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: typography.size["2xl"],
    fontWeight: "800",
    color: colors.accent.base,
    letterSpacing: 1,
  },
  displayName: {
    ...typography.styles.h2,
    marginBottom: spacing[1],
  },
  email: {
    ...typography.styles.bodySmall,
    color: colors.textPalette.secondary,
    marginBottom: spacing[2],
  },
  levelBadge: {
    paddingVertical: spacing[1],
    paddingHorizontal: spacing[4],
    borderRadius: radius.chip,
    backgroundColor: colors.accent.muted,
    borderWidth: 1,
    borderColor: `${colors.accent.base}40`,
  },
  levelBadgeText: {
    color: colors.accent.text,
    fontSize: typography.size.xs,
    fontWeight: "700",
    letterSpacing: typography.tracking.widest,
    textTransform: "uppercase",
  },
  statRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing[3],
  },
  statLabel: {
    ...typography.styles.bodySmall,
    color: colors.textPalette.secondary,
  },
  statValue: {
    fontSize: typography.size.base,
    fontWeight: "700",
    color: colors.textPalette.primary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderPalette.muted,
  },
});
