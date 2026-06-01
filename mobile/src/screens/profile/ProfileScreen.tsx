import { useEffect, useState } from "react";
import {
  Alert,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import Svg, { Path, Defs, LinearGradient, Stop } from "react-native-svg";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ErrorState } from "@/components/ui/ErrorState";
import { Input } from "@/components/ui/Input";
import { Screen } from "@/components/ui/Screen";
import { colors, radius, spacing, typography } from "@/constants/theme";
import { useProfilePicture } from "@/hooks/useProfilePicture";
import { useAuthStore } from "@/store/authStore";
import { useUserStore } from "@/store/userStore";
import { AppStackParamList } from "@/types/navigation";

type NavProp = NativeStackNavigationProp<AppStackParamList, "MainTabs">;

// ── Weight sparkline ──────────────────────────────────────────────────────────

const WeightSparkline = ({ data = [80.7, 80.4, 80.1, 79.8, 79.4, 79.1, 78.8, 78.4] }: { data?: number[] }) => {
  const W = 220, H = 60;
  if (data.length < 2) return null;
  const max = Math.max(...data) + 0.3, min = Math.min(...data) - 0.3;
  const span = max - min;
  const step = W / (data.length - 1);
  const pts = data.map((v, i) => `${i * step},${H - ((v - min) / span) * H}`);
  const linePath = "M" + pts.join(" L");
  const fillPath = linePath + ` L${W},${H} L0,${H} Z`;
  return (
    <Svg width={W} height={H} style={{ marginTop: spacing[3] }}>
      <Defs>
        <LinearGradient id="wg" x1="0" x2="0" y1="0" y2="1">
          <Stop offset="0%" stopColor={colors.primaryBase} stopOpacity="0.2" />
          <Stop offset="100%" stopColor={colors.primaryBase} stopOpacity="0" />
        </LinearGradient>
      </Defs>
      <Path d={fillPath} fill="url(#wg)" />
      <Path d={linePath} fill="none" stroke={colors.primaryBase} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
};

// ── NavRow ────────────────────────────────────────────────────────────────────

type NavRowProps = {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  iconColor?: string;
  label: string;
  description?: string;
  badge?: string;
  onPress: () => void;
  danger?: boolean;
};

const NavRow = ({ icon, iconColor, label, description, badge, onPress, danger = false }: NavRowProps) => (
  <TouchableOpacity style={styles.navRow} onPress={onPress} activeOpacity={0.7}>
    <View style={[styles.navIcon, { backgroundColor: (danger ? colors.error : (iconColor ?? colors.primaryBase)) + "18" }]}>
      <Ionicons name={icon} size={16} color={danger ? colors.error : (iconColor ?? colors.primaryBase)} />
    </View>
    <View style={styles.navContent}>
      <Text style={[styles.navLabel, danger && { color: colors.error }]}>{label}</Text>
      {description && <Text style={styles.navDesc} numberOfLines={1}>{description}</Text>}
    </View>
    {badge && (
      <View style={styles.navBadge}>
        <Text style={styles.navBadgeText}>{badge}</Text>
      </View>
    )}
    <Ionicons name="chevron-forward" size={14} color={danger ? colors.error : colors.muted2} />
  </TouchableOpacity>
);

const NavDivider = () => <View style={styles.navDivider} />;

const SectionLabel = ({ title }: { title: string }) => (
  <Text style={styles.sectionLabel}>{title}</Text>
);

// ── Avatar ────────────────────────────────────────────────────────────────────

const ProfileAvatar = ({
  imageUri, initials, onPress, onLongPress,
}: { imageUri: string | null; initials: string; onPress: () => void; onLongPress: () => void }) => (
  <TouchableOpacity
    style={styles.avatarRing}
    onPress={onPress}
    onLongPress={onLongPress}
    activeOpacity={0.85}
    accessibilityLabel="Change profile photo"
  >
    {imageUri ? (
      <Image source={{ uri: imageUri }} style={styles.avatarImage} />
    ) : (
      <View style={styles.avatarPlaceholder}>
        <Text style={styles.avatarText}>{initials}</Text>
      </View>
    )}
    <View style={styles.cameraBadge}>
      <Ionicons name="camera" size={11} color={colors.primaryInk} />
    </View>
  </TouchableOpacity>
);

// ── ProfileScreen ─────────────────────────────────────────────────────────────

export const ProfileScreen = () => {
  const navigation = useNavigation<NavProp>();

  const profile = useUserStore((s) => s.profile);
  const loading = useUserStore((s) => s.loading);
  const saving = useUserStore((s) => s.saving);
  const error = useUserStore((s) => s.error);
  const fetchMe = useUserStore((s) => s.fetchMe);
  const updateProfile = useUserStore((s) => s.updateProfile);
  const dietPreferences = useUserStore((s) => s.dietPreferences);
  const logout = useAuthStore((s) => s.logout);

  const { imageUri, pickImage, removeImage } = useProfilePicture();

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

  const parseOptionalNumber = (v: string) => {
    const t = v.trim();
    if (!t) return undefined;
    const n = Number(t);
    return Number.isFinite(n) ? n : undefined;
  };

  const handleSave = async () => {
    setSaveMessage(null);
    const ok = await updateProfile({
      name: name.trim() || undefined,
      age: parseOptionalNumber(age),
      weight_kg: parseOptionalNumber(weightKg),
      height_cm: parseOptionalNumber(heightCm),
      fitness_level: fitnessLevel.trim() || undefined,
      goals: goals.trim() || undefined,
    });
    if (ok) setSaveMessage("Profile saved successfully.");
  };

  const handleLogout = () => {
    if (Platform.OS === "web") {
      if (window.confirm("Log out of FitPlus?")) void logout();
      return;
    }
    Alert.alert("Log out", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      { text: "Log out", style: "destructive", onPress: () => void logout() },
    ]);
  };

  const displayName = profile?.name || profile?.email?.split("@")[0] || "Athlete";
  const initials = displayName.split(" ").map((w: string) => w[0]).slice(0, 2).join("").toUpperCase();

  const dietCount = (dietPreferences?.restrictions?.length ?? 0) + (dietPreferences?.allergies?.length ?? 0);
  const dietBadge = dietCount > 0 ? `${dietCount} active` : undefined;
  const dietDesc = dietPreferences?.goals ?? (dietCount > 0 ? `${dietCount} restriction(s)` : "No preferences set");

  return (
    <Screen scrollable={false}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>

        {/* ── Hero section ── */}
        <View style={styles.hero}>
          <ProfileAvatar
            imageUri={imageUri}
            initials={initials}
            onPress={pickImage}
            onLongPress={imageUri ? removeImage : pickImage}
          />
          <Text style={styles.displayName}>{displayName}</Text>
          <Text style={styles.email}>{profile?.email ?? ""}</Text>
          <Text style={styles.photoHint}>
            {imageUri ? "Tap to change · Long press to remove" : "Tap to add a photo"}
          </Text>
          {profile?.fitness_level && (
            <View style={styles.levelBadge}>
              <Ionicons name="trophy-outline" size={11} color={colors.primaryBase} />
              <Text style={styles.levelText}>{profile.fitness_level}</Text>
            </View>
          )}
        </View>

        {/* ── Stats row ── */}
        <View style={styles.statsRow}>
          {[
            { label: "Weight", value: profile?.weight_kg ? `${profile.weight_kg}` : "—", unit: "kg" },
            { label: "Height", value: profile?.height_cm ? `${profile.height_cm}` : "—", unit: "cm" },
            { label: "Age",    value: profile?.age ? `${profile.age}` : "—", unit: "yrs" },
          ].map((s) => (
            <View key={s.label} style={styles.statBox}>
              <Text style={styles.statValue}>{s.value}</Text>
              <Text style={styles.statUnit}>{s.unit}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* ── Weight chart ── */}
        <Card variant="default" padding="md">
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" }}>
            <View style={{ gap: 2 }}>
              <Text style={styles.eyebrow}>greutate · 30 zile</Text>
              <View style={{ flexDirection: "row", alignItems: "baseline", gap: 8 }}>
                <Text style={styles.weightBig}>{profile?.weight_kg ?? "—"}</Text>
                <Text style={{ fontSize: 12, color: colors.good, fontWeight: "600" }}>↓ progres</Text>
              </View>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate("WeightTracker")} style={styles.chartLink}>
              <Text style={styles.chartLinkText}>See all</Text>
              <Ionicons name="arrow-forward" size={12} color={colors.primaryBase} />
            </TouchableOpacity>
          </View>
          <WeightSparkline />
        </Card>

        {/* ── Edit Profile ── */}
        <Card variant="default" padding="md">
          <Text style={styles.cardTitle}>Edit Profile</Text>
          <View style={styles.fields}>
            <Input label="Name" value={name} onChangeText={setName} placeholder="Your name" autoCapitalize="words" />
            <View style={styles.twoCol}>
              <View style={{ flex: 1 }}>
                <Input label="Age" value={age} onChangeText={setAge} placeholder="24" keyboardType="numeric" />
              </View>
              <View style={{ flex: 1 }}>
                <Input label="Weight (kg)" value={weightKg} onChangeText={setWeightKg} placeholder="70.5" keyboardType="numeric" />
              </View>
            </View>
            <View style={styles.twoCol}>
              <View style={{ flex: 1 }}>
                <Input label="Height (cm)" value={heightCm} onChangeText={setHeightCm} placeholder="175" keyboardType="numeric" />
              </View>
              <View style={{ flex: 1 }}>
                <Input label="Fitness level" value={fitnessLevel} onChangeText={setFitnessLevel} placeholder="intermediate" />
              </View>
            </View>
            <Input label="Goals" value={goals} onChangeText={setGoals} placeholder="fat loss, muscle gain…" multiline />
          </View>
        </Card>

        {error ? <ErrorState message={error} /> : null}

        {saveMessage ? (
          <View style={styles.successBanner}>
            <Ionicons name="checkmark-circle-outline" size={16} color={colors.good} />
            <Text style={styles.successText}>{saveMessage}</Text>
          </View>
        ) : null}

        <View style={styles.saveRow}>
          <Button label="Save Profile" onPress={() => void handleSave()} loading={saving} size="lg" fullWidth />
          <Button label="Refresh" onPress={() => void fetchMe()} loading={loading} variant="outline" />
        </View>

        {/* ── Nutrition & Diet ── */}
        <SectionLabel title="Nutrition & Diet" />
        <Card variant="default" padding="sm">
          <NavRow icon="options-outline" iconColor={colors.primaryBase} label="Diet Preferences" description={dietDesc} badge={dietBadge} onPress={() => navigation.navigate("DietPreferences")} />
          <NavDivider />
          <NavRow icon="calculator-outline" iconColor={colors.info} label="Calorie Calculator" description="Calculate your TDEE & daily target" onPress={() => navigation.navigate("CalorieTarget")} />
          <NavDivider />
          <NavRow icon="restaurant-outline" iconColor={colors.good} label="Food Diary" description="Log and review your meals" onPress={() => navigation.navigate("FoodDiary")} />
        </Card>

        {/* ── Progress ── */}
        <SectionLabel title="Progress" />
        <Card variant="default" padding="sm">
          <NavRow icon="analytics-outline" iconColor={colors.primaryBase} label="Weight Tracker" description="Log and chart your weight over time" onPress={() => navigation.navigate("WeightTracker")} />
          <NavDivider />
          <NavRow icon="card-outline" iconColor={colors.warning} label="My Subscriptions" description="Active gym memberships" onPress={() => navigation.navigate("MySubscriptions")} />
        </Card>

        {/* ── AI Chat History ── */}
        <SectionLabel title="AI Chat History" />
        <Card variant="default" padding="sm">
          <NavRow icon="barbell-outline" iconColor={colors.primaryBase} label="Workout AI History" description="Browse workout conversations" onPress={() => navigation.navigate("ConversationHistory", { agentType: "workout" })} />
          <NavDivider />
          <NavRow icon="nutrition-outline" iconColor={colors.warning} label="Diet AI History" description="Browse diet conversations" onPress={() => navigation.navigate("ConversationHistory", { agentType: "diet" })} />
        </Card>

        {/* ── Account ── */}
        <SectionLabel title="Account" />
        <Card variant="default" padding="sm">
          <NavRow icon="person-outline" iconColor={colors.info} label="Edit Profile (Full)" description="Update all profile fields" onPress={() => navigation.navigate("UpdateProfile")} />
          <NavDivider />
          <NavRow icon="heart-outline" iconColor={colors.error} label="My Favourite Gyms" description="Saved gyms and locations" onPress={() => navigation.navigate("FavoriteGyms")} />
          <NavDivider />
          <NavRow icon="log-out-outline" label="Log out" onPress={handleLogout} danger />
        </Card>

        <View style={styles.versionRow}>
          <Text style={styles.versionText}>FitPlus v1.0</Text>
        </View>
      </ScrollView>
    </Screen>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────

const AVATAR = 88;

const styles = StyleSheet.create({
  container: { gap: spacing.sm, paddingBottom: spacing["2xl"] },

  // Hero
  hero: { alignItems: "center", paddingVertical: spacing.xl, gap: spacing[2] },
  avatarRing: {
    width: AVATAR, height: AVATAR, borderRadius: AVATAR / 2,
    borderWidth: 2, borderColor: colors.primaryBase,
    overflow: "visible", marginBottom: spacing[1],
    shadowColor: colors.primaryBase, shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35, shadowRadius: 10, elevation: 6,
  },
  avatarImage: { width: AVATAR - 4, height: AVATAR - 4, borderRadius: (AVATAR - 4) / 2 },
  avatarPlaceholder: {
    width: AVATAR - 4, height: AVATAR - 4, borderRadius: (AVATAR - 4) / 2,
    backgroundColor: colors.primarySoft, alignItems: "center", justifyContent: "center",
  },
  avatarText: { fontFamily: "InstrumentSerif_400Regular", fontSize: 26, color: colors.primaryBase },
  cameraBadge: {
    position: "absolute", bottom: 0, right: 0,
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: colors.primaryBase,
    alignItems: "center", justifyContent: "center",
    borderWidth: 2, borderColor: colors.bgBase,
  },
  displayName: { fontFamily: "InstrumentSerif_400Regular", fontSize: 24, letterSpacing: -0.48, color: colors.ink },
  email: { fontSize: 13, color: colors.mutedColor },
  photoHint: { fontSize: 11, color: colors.muted2, marginTop: 2 },
  levelBadge: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingVertical: 4, paddingHorizontal: spacing[4],
    borderRadius: radius.chip, backgroundColor: colors.primarySoft,
    borderWidth: 1, borderColor: colors.primaryBase + "40",
  },
  levelText: { color: colors.primaryBase, fontSize: 10, fontWeight: "700", letterSpacing: 1.5, textTransform: "uppercase" },

  // Stats row
  statsRow: {
    flexDirection: "row", gap: spacing.sm,
    backgroundColor: colors.surfaceBase,
    borderRadius: radius.card, borderWidth: 1, borderColor: colors.lineColor,
    paddingVertical: spacing.md,
  },
  statBox: { flex: 1, alignItems: "center", gap: 2 },
  statValue: { fontFamily: "InstrumentSerif_400Regular", fontSize: 22, letterSpacing: -0.44, color: colors.ink },
  statUnit: { ...typography.styles.eyebrow, fontSize: 9 },
  statLabel: { fontSize: 11, color: colors.mutedColor },

  // Weight card
  eyebrow: { ...typography.styles.eyebrow },
  weightBig: { fontFamily: "InstrumentSerif_400Regular", fontSize: 28, letterSpacing: -0.56, color: colors.ink },
  chartLink: { flexDirection: "row", alignItems: "center", gap: 4 },
  chartLinkText: { fontSize: 12, color: colors.primaryBase, fontWeight: "600" },

  // Edit form
  cardTitle: { ...typography.styles.h3, marginBottom: spacing.md },
  fields: { gap: spacing.sm },
  twoCol: { flexDirection: "row", gap: spacing.sm },
  saveRow: { flexDirection: "row", gap: spacing.sm },

  // Success
  successBanner: {
    flexDirection: "row", alignItems: "center", gap: spacing[2],
    padding: spacing[3], borderRadius: radius.md,
    backgroundColor: colors.good + "18", borderWidth: 1, borderColor: colors.good + "40",
  },
  successText: { color: colors.good, fontWeight: "600", fontSize: typography.size.sm },

  // Sections
  sectionLabel: { ...typography.styles.eyebrow, marginTop: spacing[3], marginBottom: spacing[1], marginLeft: 2 },

  // Nav rows
  navRow: {
    flexDirection: "row", alignItems: "center",
    paddingVertical: spacing[3], paddingHorizontal: spacing.md, gap: spacing[3],
  },
  navIcon: { width: 34, height: 34, borderRadius: radius.icon, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  navContent: { flex: 1, gap: 2 },
  navLabel: { fontSize: typography.size.base, fontWeight: "600", color: colors.ink },
  navDesc: { fontSize: typography.size.xs, color: colors.muted2 },
  navBadge: {
    paddingHorizontal: spacing[2], paddingVertical: 2,
    borderRadius: radius.chip, backgroundColor: colors.primarySoft, borderWidth: 1, borderColor: colors.primaryBase,
  },
  navBadgeText: { fontSize: typography.size.xs, fontWeight: "700", color: colors.primaryBase },
  navDivider: { height: 1, backgroundColor: colors.lineSoft, marginLeft: 34 + spacing.md + spacing[3] },

  versionRow: { alignItems: "center", marginTop: spacing.xl, marginBottom: spacing[3] },
  versionText: { fontSize: 11, color: colors.muted2, letterSpacing: 0.5 },
});
