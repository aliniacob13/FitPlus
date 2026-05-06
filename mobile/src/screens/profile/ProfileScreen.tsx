import { useEffect, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";

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

type StatRowProps = { icon: React.ComponentProps<typeof Ionicons>["name"]; label: string; value: string };
const StatRow = ({ icon, label, value }: StatRowProps) => (
  <View style={styles.statRow}>
    <View style={styles.statRowLeft}>
      <Ionicons name={icon} size={15} color={colors.textPalette.secondary} />
      <Text style={styles.statLabel}>{label}</Text>
    </View>
    <Text style={styles.statValue}>{value}</Text>
  </View>
);

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
    if (!trimmed) return undefined;
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
    if (success) setSaveMessage("Profile saved successfully.");
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
    <Screen scrollable={false}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* ── Avatar hero ── */}
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
              <Ionicons name="trophy-outline" size={11} color={colors.accent.base} />
              <Text style={styles.levelBadgeText}>{profile.fitness_level}</Text>
            </View>
          ) : null}
        </View>

        {/* ── Body Stats ── */}
        <Card variant="default" title="Body Stats" padding="md">
          <StatRow icon="scale-outline" label="Age" value={profile?.age ? `${profile.age} yrs` : "—"} />
          <View style={styles.divider} />
          <StatRow icon="barbell-outline" label="Weight" value={profile?.weight_kg ? `${profile.weight_kg} kg` : "—"} />
          <View style={styles.divider} />
          <StatRow icon="resize-outline" label="Height" value={profile?.height_cm ? `${profile.height_cm} cm` : "—"} />
          {profile?.goals ? (
            <>
              <View style={styles.divider} />
              <StatRow icon="flag-outline" label="Goals" value={profile.goals} />
            </>
          ) : null}
        </Card>

        {/* ── Quick edit ── */}
        <Card variant="default" title="Edit Profile" padding="md">
          <View style={styles.fields}>
            <Input label="Name" value={name} onChangeText={setName} placeholder="E.g. Alex" autoCapitalize="words" />
            <Input label="Age" value={age} onChangeText={setAge} placeholder="E.g. 24" keyboardType="numeric" />
            <Input label="Weight (kg)" value={weightKg} onChangeText={setWeightKg} placeholder="E.g. 70.5" keyboardType="numeric" />
            <Input label="Height (cm)" value={heightCm} onChangeText={setHeightCm} placeholder="E.g. 175" keyboardType="numeric" />
            <Input label="Fitness level" value={fitnessLevel} onChangeText={setFitnessLevel} placeholder="beginner / intermediate / advanced" />
            <Input label="Goals" value={goals} onChangeText={setGoals} placeholder="E.g. fat loss, muscle gain" multiline />
          </View>
        </Card>

        {error ? <ErrorState message={error} /> : null}
        {saveMessage ? (
          <View style={styles.successBanner}>
            <Ionicons name="checkmark-circle-outline" size={16} color={colors.success} />
            <Text style={styles.successText}>{saveMessage}</Text>
          </View>
        ) : null}

        <Button label="Save Profile" onPress={() => void handleSave()} loading={saving} size="lg" fullWidth />
        <Button label="Refresh Profile" onPress={() => void fetchMe()} loading={loading} variant="outline" fullWidth />

        {/* ── Navigation ── */}
        <Text style={styles.sectionLabel}>More</Text>
        <Button label="Calorie Calculator" onPress={() => navigation.navigate("CalorieTarget")} variant="secondary" fullWidth />
        <Button label="Full Edit Screen" onPress={() => navigation.navigate("UpdateProfile")} variant="secondary" fullWidth />
        <Button label="My Favourite Gyms" onPress={() => navigation.navigate("FavoriteGyms")} variant="outline" fullWidth />

        <View style={styles.logoutSection}>
          <Button label="Log out" onPress={handleLogout} variant="danger" fullWidth />
        </View>
      </ScrollView>
    </Screen>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
    paddingBottom: spacing["2xl"],
  },
  // ── Avatar ──
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
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingVertical: spacing[1],
    paddingHorizontal: spacing[4],
    borderRadius: radius.chip,
    backgroundColor: colors.accent.muted,
    borderWidth: 1,
    borderColor: colors.accent.base + "40",
  },
  levelBadgeText: {
    color: colors.accent.text,
    fontSize: typography.size.xs,
    fontWeight: "700",
    letterSpacing: typography.tracking.widest,
    textTransform: "uppercase",
  },
  // ── Stat rows ──
  statRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing[3],
  },
  statRowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
  },
  statLabel: {
    ...typography.styles.bodySmall,
    color: colors.textPalette.secondary,
  },
  statValue: {
    fontSize: typography.size.base,
    fontWeight: "700",
    color: colors.textPalette.primary,
    maxWidth: "55%",
    textAlign: "right",
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderPalette.muted,
  },
  // ── Form ──
  fields: {
    gap: spacing[2],
  },
  // ── Success ──
  successBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
    padding: spacing[3],
    borderRadius: radius.md,
    backgroundColor: colors.success + "18",
    borderWidth: 1,
    borderColor: colors.success + "40",
  },
  successText: {
    color: colors.success,
    fontWeight: "600",
    fontSize: typography.size.sm,
  },
  // ── Sections ──
  sectionLabel: {
    ...typography.styles.label,
    marginTop: spacing[3],
    marginBottom: spacing[1],
    marginLeft: 2,
  },
  logoutSection: {
    marginTop: spacing[3],
  },
});
