import { useEffect, useState } from "react";
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";

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

type NavProp = NativeStackNavigationProp<AppStackParamList>;

// ── Sub-components ────────────────────────────────────────────────────────────

type StatRowProps = {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  label: string;
  value: string;
};

const StatRow = ({ icon, label, value }: StatRowProps) => (
  <View style={styles.statRow}>
    <View style={styles.statRowLeft}>
      <Ionicons name={icon} size={15} color={colors.textPalette.secondary} />
      <Text style={styles.statLabel}>{label}</Text>
    </View>
    <Text style={styles.statValue}>{value}</Text>
  </View>
);

type NavRowProps = {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  iconColor?: string;
  label: string;
  description?: string;
  badge?: string;
  onPress: () => void;
  danger?: boolean;
};

const NavRow = ({
  icon,
  iconColor,
  label,
  description,
  badge,
  onPress,
  danger = false,
}: NavRowProps) => (
  <TouchableOpacity style={styles.navRow} onPress={onPress} activeOpacity={0.7}>
    <View
      style={[
        styles.navRowIcon,
        {
          backgroundColor: danger
            ? colors.error + "20"
            : (iconColor ?? colors.accent.base) + "20",
        },
      ]}
    >
      <Ionicons
        name={icon}
        size={16}
        color={danger ? colors.error : (iconColor ?? colors.accent.base)}
      />
    </View>
    <View style={styles.navRowContent}>
      <Text style={[styles.navRowLabel, danger && styles.navRowLabelDanger]}>
        {label}
      </Text>
      {description && (
        <Text style={styles.navRowDesc} numberOfLines={1}>
          {description}
        </Text>
      )}
    </View>
    {badge && (
      <View style={styles.navRowBadge}>
        <Text style={styles.navRowBadgeText}>{badge}</Text>
      </View>
    )}
    <Ionicons
      name="chevron-forward"
      size={16}
      color={danger ? colors.error : colors.textPalette.muted}
    />
  </TouchableOpacity>
);

const NavRowDivider = () => <View style={styles.navRowDivider} />;
const SectionTitle = ({ title }: { title: string }) => (
  <Text style={styles.sectionLabel}>{title}</Text>
);

// ── Avatar with photo ─────────────────────────────────────────────────────────

type AvatarProps = {
  imageUri: string | null;
  initials: string;
  onPress: () => void;
  onLongPress: () => void;
};

const ProfileAvatar = ({
  imageUri,
  initials,
  onPress,
  onLongPress,
}: AvatarProps) => (
  <TouchableOpacity
    style={styles.avatarRing}
    onPress={onPress}
    onLongPress={onLongPress}
    activeOpacity={0.85}
    accessibilityLabel="Change profile photo"
    accessibilityHint="Tap to change, long press to remove"
  >
    {imageUri ? (
      <Image source={{ uri: imageUri }} style={styles.avatarImage} />
    ) : (
      <View style={styles.avatarPlaceholder}>
        <Text style={styles.avatarText}>{initials}</Text>
      </View>
    )}

    {/* Camera badge overlay */}
    <View style={styles.cameraBadge}>
      <Ionicons name="camera" size={12} color={colors.textPalette.inverse} />
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
      {
        text: "Log out",
        style: "destructive",
        onPress: () => void logout(),
      },
    ]);
  };

  const displayName =
    profile?.name || profile?.email?.split("@")[0] || "Athlete";
  const initials = displayName
    .split(" ")
    .map((w: string) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const dietRestrictionsCount =
    (dietPreferences?.restrictions?.length ?? 0) +
    (dietPreferences?.allergies?.length ?? 0);
  const dietBadge =
    dietRestrictionsCount > 0 ? `${dietRestrictionsCount} active` : undefined;
  const dietDesc =
    dietPreferences?.goals ??
    (dietRestrictionsCount > 0
      ? `${dietRestrictionsCount} restriction(s) set`
      : "No preferences set yet");

  return (
    <Screen scrollable={false}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Avatar hero ── */}
        <View style={styles.avatarSection}>
          <ProfileAvatar
            imageUri={imageUri}
            initials={initials}
            onPress={pickImage}
            onLongPress={imageUri ? removeImage : pickImage}
          />

          <Text style={styles.displayName}>{displayName}</Text>
          <Text style={styles.email}>{profile?.email ?? "N/A"}</Text>

          {/* Tap hint */}
          <TouchableOpacity onPress={pickImage} activeOpacity={0.7}>
            <Text style={styles.photoHint}>
              {imageUri ? "Tap photo to change · Long press to remove" : "Tap to add a profile photo"}
            </Text>
          </TouchableOpacity>

          {profile?.fitness_level ? (
            <View style={styles.levelBadge}>
              <Ionicons
                name="trophy-outline"
                size={11}
                color={colors.accent.base}
              />
              <Text style={styles.levelBadgeText}>{profile.fitness_level}</Text>
            </View>
          ) : null}
        </View>

        {/* ── Body Stats ── */}
        <Card variant="default" title="Body Stats" padding="md">
          <StatRow
            icon="scale-outline"
            label="Age"
            value={profile?.age ? `${profile.age} yrs` : "—"}
          />
          <View style={styles.divider} />
          <StatRow
            icon="barbell-outline"
            label="Weight"
            value={profile?.weight_kg ? `${profile.weight_kg} kg` : "—"}
          />
          <View style={styles.divider} />
          <StatRow
            icon="resize-outline"
            label="Height"
            value={profile?.height_cm ? `${profile.height_cm} cm` : "—"}
          />
          {profile?.goals ? (
            <>
              <View style={styles.divider} />
              <StatRow
                icon="flag-outline"
                label="Goals"
                value={profile.goals}
              />
            </>
          ) : null}
        </Card>

        {/* ── Edit Profile ── */}
        <Card variant="default" title="Edit Profile" padding="md">
          <View style={styles.fields}>
            <Input
              label="Name"
              value={name}
              onChangeText={setName}
              placeholder="E.g. Alex"
              autoCapitalize="words"
            />
            <Input
              label="Age"
              value={age}
              onChangeText={setAge}
              placeholder="E.g. 24"
              keyboardType="numeric"
            />
            <Input
              label="Weight (kg)"
              value={weightKg}
              onChangeText={setWeightKg}
              placeholder="E.g. 70.5"
              keyboardType="numeric"
            />
            <Input
              label="Height (cm)"
              value={heightCm}
              onChangeText={setHeightCm}
              placeholder="E.g. 175"
              keyboardType="numeric"
            />
            <Input
              label="Fitness level"
              value={fitnessLevel}
              onChangeText={setFitnessLevel}
              placeholder="beginner / intermediate / advanced"
            />
            <Input
              label="Goals"
              value={goals}
              onChangeText={setGoals}
              placeholder="E.g. fat loss, muscle gain"
              multiline
            />
          </View>
        </Card>

        {error ? <ErrorState message={error} /> : null}
        {saveMessage ? (
          <View style={styles.successBanner}>
            <Ionicons
              name="checkmark-circle-outline"
              size={16}
              color={colors.success}
            />
            <Text style={styles.successText}>{saveMessage}</Text>
          </View>
        ) : null}

        <Button
          label="Save Profile"
          onPress={() => void handleSave()}
          loading={saving}
          size="lg"
          fullWidth
        />
        <Button
          label="Refresh Profile"
          onPress={() => void fetchMe()}
          loading={loading}
          variant="outline"
          fullWidth
        />

        {/* ── Nutrition & Diet ── */}
        <SectionTitle title="Nutrition & Diet" />
        <Card variant="default" padding="sm">
          <NavRow
            icon="options-outline"
            iconColor={colors.accent.base}
            label="Diet Preferences"
            description={dietDesc}
            badge={dietBadge}
            onPress={() => navigation.navigate("DietPreferences")}
          />
          <NavRowDivider />
          <NavRow
            icon="calculator-outline"
            iconColor={colors.info}
            label="Calorie Calculator"
            description="Calculate your TDEE & set a daily target"
            onPress={() => navigation.navigate("CalorieTarget")}
          />
          <NavRowDivider />
          <NavRow
            icon="restaurant-outline"
            iconColor={colors.success}
            label="Food Diary"
            description="Log and review your meals"
            onPress={() => navigation.navigate("FoodDiary")}
          />
        </Card>

        {/* ── AI Chat History ── */}
        <SectionTitle title="AI Chat History" />
        <Card variant="default" padding="sm">
          <NavRow
            icon="barbell-outline"
            iconColor={colors.accent.base}
            label="Workout AI History"
            description="Browse and continue workout conversations"
            onPress={() =>
              navigation.navigate("ConversationHistory", {
                agentType: "workout",
              })
            }
          />
          <NavRowDivider />
          <NavRow
            icon="nutrition-outline"
            iconColor={colors.warning}
            label="Diet AI History"
            description="Browse and continue diet conversations"
            onPress={() =>
              navigation.navigate("ConversationHistory", {
                agentType: "diet",
              })
            }
          />
        </Card>

        {/* ── Account ── */}
        <SectionTitle title="Account" />
        <Card variant="default" padding="sm">
          <NavRow
            icon="person-outline"
            iconColor={colors.info}
            label="Full Edit Screen"
            description="Update all profile fields"
            onPress={() => navigation.navigate("UpdateProfile")}
          />
          <NavRowDivider />
          <NavRow
            icon="card-outline"
            iconColor={colors.success}
            label="My subscriptions"
            description="Gym memberships via Stripe"
            onPress={() => navigation.navigate("MySubscriptions")}
          />
          <NavRowDivider />
          <NavRow
            icon="heart-outline"
            iconColor={colors.error}
            label="My Favourite Gyms"
            description="Saved gyms and locations"
            onPress={() => navigation.navigate("FavoriteGyms")}
          />
          <NavRowDivider />
          <NavRow
            icon="log-out-outline"
            label="Log out"
            onPress={handleLogout}
            danger
          />
        </Card>

        <View style={styles.versionBadge}>
          <Text style={styles.versionText}>FitPlus — Persoana 2 build</Text>
        </View>
      </ScrollView>
    </Screen>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────

const AVATAR_SIZE = 96;

const styles = StyleSheet.create({
  container: { gap: spacing.sm, paddingBottom: spacing["2xl"] },

  // Avatar
  avatarSection: {
    alignItems: "center",
    paddingVertical: spacing.xl,
    gap: spacing[2],
  },
  avatarRing: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    borderWidth: 2,
    borderColor: colors.accent.base,
    shadowColor: colors.accent.base,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
    marginBottom: spacing[1],
    // Needed so the camera badge isn't clipped
    overflow: "visible",
  },
  avatarImage: {
    width: AVATAR_SIZE - 4,
    height: AVATAR_SIZE - 4,
    borderRadius: (AVATAR_SIZE - 4) / 2,
  },
  avatarPlaceholder: {
    width: AVATAR_SIZE - 4,
    height: AVATAR_SIZE - 4,
    borderRadius: (AVATAR_SIZE - 4) / 2,
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
  cameraBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.accent.base,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: colors.bg.base,
  },

  displayName: { ...typography.styles.h2 },
  email: {
    ...typography.styles.bodySmall,
    color: colors.textPalette.secondary,
  },
  photoHint: {
    fontSize: typography.size.xs,
    color: colors.textPalette.muted,
    marginTop: 2,
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
    marginTop: spacing[1],
  },
  levelBadgeText: {
    color: colors.accent.text,
    fontSize: typography.size.xs,
    fontWeight: "700",
    letterSpacing: typography.tracking.widest,
    textTransform: "uppercase",
  },

  // Stats
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
  divider: { height: 1, backgroundColor: colors.borderPalette.muted },

  // Form
  fields: { gap: spacing[2] },

  // Success
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

  // Sections
  sectionLabel: {
    ...typography.styles.label,
    marginTop: spacing[3],
    marginBottom: spacing[1],
    marginLeft: 2,
  },

  // Nav rows
  navRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing[3],
    paddingHorizontal: spacing.md,
    gap: spacing[3],
  },
  navRowIcon: {
    width: 34,
    height: 34,
    borderRadius: radius.sm,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  navRowContent: { flex: 1, gap: 2 },
  navRowLabel: {
    fontSize: typography.size.base,
    fontWeight: "600",
    color: colors.textPalette.primary,
  },
  navRowLabelDanger: { color: colors.error },
  navRowDesc: {
    fontSize: typography.size.xs,
    color: colors.textPalette.muted,
  },
  navRowBadge: {
    paddingHorizontal: spacing[2],
    paddingVertical: 2,
    borderRadius: radius.chip,
    backgroundColor: colors.accent.muted,
    borderWidth: 1,
    borderColor: colors.accent.base,
  },
  navRowBadgeText: {
    fontSize: typography.size.xs,
    fontWeight: "700",
    color: colors.accent.base,
  },
  navRowDivider: {
    height: 1,
    backgroundColor: colors.borderPalette.muted,
    marginLeft: 34 + spacing.md + spacing[3],
  },

  versionBadge: {
    alignItems: "center",
    marginTop: spacing.xl,
    marginBottom: spacing[3],
  },
  versionText: {
    fontSize: typography.size.xs,
    color: colors.textPalette.muted,
    letterSpacing: 0.5,
  },
});
