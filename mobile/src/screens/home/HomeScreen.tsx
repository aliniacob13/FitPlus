import { useCallback, useEffect, useMemo, useState } from "react";
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { CompositeNavigationProp } from "@react-navigation/native";
import { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Screen } from "@/components/ui/Screen";
import { colors, radius, spacing, typography } from "@/constants/theme";
import { aiApi, Conversation } from "@/services/aiApi";
import { nutritionApi } from "@/services/nutritionApi";
import { todayString, useFoodDiaryStore } from "@/store/foodDiaryStore";
import { useUserStore } from "@/store/userStore";
import { AppStackParamList, MainTabParamList } from "@/types/navigation";

type HomeNav = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, "Home">,
  NativeStackNavigationProp<AppStackParamList>
>;

type IoniconName = React.ComponentProps<typeof Ionicons>["name"];

// ── Subcomponents ─────────────────────────────────────────────────────────────

const StatItem = ({ value, label }: { value: string; label: string }) => (
  <View style={styles.statItem}>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const getGreeting = (): string => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

// ── Quick actions ─────────────────────────────────────────────────────────────

type QuickAction =
  | {
      label: string;
      icon: IoniconName;
      description: string;
      variant: "primary" | "outline" | "secondary";
      type: "tab";
      tab: keyof MainTabParamList;
    }
  | {
      label: string;
      icon: IoniconName;
      description: string;
      variant: "primary" | "outline" | "secondary";
      type: "stack";
      screen: keyof AppStackParamList;
    };

const QUICK_ACTIONS: QuickAction[] = [
  {
    label: "AI Workout Coach",
    icon: "barbell-outline",
    tab: "Workout",
    type: "tab",
    variant: "primary",
    description: "Get a personalised plan",
  },
  {
    label: "AI Diet Coach",
    icon: "nutrition-outline",
    tab: "Diet",
    type: "tab",
    variant: "outline",
    description: "Meal & macro advice",
  },
  {
    label: "Food Diary",
    icon: "restaurant-outline",
    screen: "FoodDiary",
    type: "stack",
    variant: "outline",
    description: "Log today's meals",
  },
  {
    label: "Diet Preferences",
    icon: "options-outline",
    screen: "DietPreferences",
    type: "stack",
    variant: "outline",
    description: "Allergies & restrictions",
  },
  {
    label: "Set Calorie Target",
    icon: "calculator-outline",
    screen: "CalorieTarget",
    type: "stack",
    variant: "secondary",
    description: "Calculate your TDEE",
  },
  {
    label: "Update Fitness Profile",
    icon: "person-outline",
    screen: "UpdateProfile",
    type: "stack",
    variant: "secondary",
    description: "Weight, height, goals",
  },
];

// ── HomeScreen ─────────────────────────────────────────────────────────────────

export const HomeScreen = () => {
  const navigation = useNavigation<HomeNav>();
  const profile = useUserStore((state) => state.profile);
  const dailyKcalTarget = useFoodDiaryStore((state) => state.dailyKcalTarget);
  const hasCalorieTarget = useFoodDiaryStore((state) => state.hasCalorieTarget);
  const diaryDate = useFoodDiaryStore((state) => state.date);
  const diaryKcal = useFoodDiaryStore((state) => state.totals.kcal);

  const [todayKcal, setTodayKcal] = useState(0);
  const [conversations, setConversations] = useState<Conversation[]>([]);

  const displayName =
    profile?.name || profile?.email?.split("@")[0] || "Athlete";
  const initials = displayName[0]?.toUpperCase() ?? "A";

  const remainingKcal = useMemo(() => {
    const target = dailyKcalTarget ?? 0;
    return Math.max(target - todayKcal, 0);
  }, [dailyKcalTarget, todayKcal]);

  const calorieProgress = useMemo(() => {
    if (!hasCalorieTarget || !dailyKcalTarget || dailyKcalTarget === 0) return 0;
    return Math.min(todayKcal / dailyKcalTarget, 1);
  }, [hasCalorieTarget, dailyKcalTarget, todayKcal]);

  // Derived stats from conversations
  const workoutConvs = useMemo(
    () => conversations.filter((c) => c.agent_type === "workout"),
    [conversations],
  );
  const dietConvs = useMemo(
    () => conversations.filter((c) => c.agent_type === "diet"),
    [conversations],
  );
  const lastConv = useMemo(
    () =>
      [...conversations].sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      )[0] ?? null,
    [conversations],
  );

  // ── Data loading ────────────────────────────────────────────────────────────

  useFocusEffect(
    useCallback(() => {
      const load = async () => {
        try {
          // Calories
          const { data } = await nutritionApi.getFoodLog(todayString());
          setTodayKcal(Math.round(data.totals.kcal));
        } catch {
          setTodayKcal(0);
        }
        try {
          // Conversations for real stats
          const convs = await aiApi.getConversations();
          setConversations(convs);
        } catch {
          // keep previous
        }
      };
      void load();
    }, []),
  );

  // Keep calories in sync with food diary store
  useEffect(() => {
    if (diaryDate === todayString()) {
      setTodayKcal(Math.round(diaryKcal));
    }
  }, [diaryDate, diaryKcal]);

  // ── Navigation helpers ──────────────────────────────────────────────────────

  const navigateTo = (action: QuickAction) => {
    if (action.type === "tab") {
      navigation.navigate(action.tab);
    } else {
      navigation.navigate(action.screen as any);
    }
  };

  const greeting = getGreeting();

  return (
    <Screen>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{greeting},</Text>
            <Text style={styles.name}>{displayName} 👋</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go to profile"
            onPress={() => navigation.navigate("Profile")}
            style={({ pressed }) => [
              styles.avatarBtn,
              pressed && styles.avatarBtnPressed,
              Platform.OS === "web" && styles.avatarBtnWeb,
            ]}
          >
            <Text style={styles.avatarText}>{initials}</Text>
          </Pressable>
        </View>

        {/* ── Ultima activitate (Last Activity) ── */}
        <Card variant="accent" title="AI Activity" padding="md">
          <View style={styles.statsRow}>
            <StatItem value={String(conversations.length)} label="Total Chats" />
            <View style={styles.statDivider} />
            <StatItem value={String(workoutConvs.length)} label="Workouts" />
            <View style={styles.statDivider} />
            <StatItem value={String(dietConvs.length)} label="Diet" />
          </View>

          {lastConv ? (
            <Pressable
              style={styles.lastActivityRow}
              onPress={() =>
                navigation.navigate("ConversationHistory", {
                  agentType: lastConv.agent_type === "workout" ? "workout" : "diet",
                })
              }
              accessibilityRole="button"
            >
              <View style={styles.lastActivityIcon}>
                <Ionicons
                  name={
                    lastConv.agent_type === "workout"
                      ? "barbell-outline"
                      : "nutrition-outline"
                  }
                  size={14}
                  color={colors.accent.base}
                />
              </View>
              <View style={styles.lastActivityText}>
                <Text style={styles.lastActivityLabel}>Ultima activitate</Text>
                <Text style={styles.lastActivityTitle} numberOfLines={1}>
                  {lastConv.title}
                </Text>
              </View>
              <Text style={styles.lastActivityTime}>
                {timeAgo(lastConv.created_at)}
              </Text>
              <Ionicons
                name="chevron-forward"
                size={14}
                color={colors.textPalette.muted}
              />
            </Pressable>
          ) : (
            <View style={styles.activityHint}>
              <Ionicons
                name="information-circle-outline"
                size={13}
                color={colors.textPalette.muted}
              />
              <Text style={styles.activityHintText}>
                Start a chat to track your AI activity
              </Text>
            </View>
          )}
        </Card>

        {/* Calorie card */}
        <Card variant="elevated" title="Calories Today" padding="md">
          <View style={styles.calorieStatsRow}>
            <StatItem value={String(todayKcal)} label="Consumed" />
            <View style={styles.statDivider} />
            <StatItem
              value={hasCalorieTarget ? String(dailyKcalTarget ?? 0) : "—"}
              label="Target"
            />
            <View style={styles.statDivider} />
            <StatItem
              value={hasCalorieTarget ? String(remainingKcal) : "—"}
              label="Remaining"
            />
          </View>

          {hasCalorieTarget && (
            <View style={styles.progressBarWrapper}>
              <View style={styles.progressBarTrack}>
                <View
                  style={[
                    styles.progressBarFill,
                    {
                      width: `${Math.round(calorieProgress * 100)}%` as any,
                      backgroundColor:
                        calorieProgress >= 1 ? colors.error : colors.accent.base,
                    },
                  ]}
                />
              </View>
              <Text style={styles.progressBarLabel}>
                {Math.round(calorieProgress * 100)}% of daily goal
              </Text>
            </View>
          )}
        </Card>

        {/* Body stats */}
        <Text style={styles.sectionTitle}>Your Stats</Text>
        <View style={styles.infoRow}>
          <Card variant="elevated" style={styles.infoCard} padding="md">
            <Text style={styles.infoEmoji}>⚖️</Text>
            <Text style={styles.infoValue}>{profile?.weight_kg ?? "—"}</Text>
            <Text style={styles.infoLabel}>kg</Text>
          </Card>
          <Card variant="elevated" style={styles.infoCard} padding="md">
            <Text style={styles.infoEmoji}>📏</Text>
            <Text style={styles.infoValue}>{profile?.height_cm ?? "—"}</Text>
            <Text style={styles.infoLabel}>cm</Text>
          </Card>
          <Card variant="elevated" style={styles.infoCard} padding="md">
            <Text style={styles.infoEmoji}>🎯</Text>
            <Text style={styles.infoValue} numberOfLines={1}>
              {profile?.fitness_level ?? "—"}
            </Text>
            <Text style={styles.infoLabel}>level</Text>
          </Card>
        </View>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActionsGrid}>
          {QUICK_ACTIONS.map((action) => (
            <Pressable
              key={action.label}
              onPress={() => navigateTo(action)}
              style={({ pressed }) => [
                styles.actionCard,
                action.variant === "primary" && styles.actionCardPrimary,
                pressed && styles.actionCardPressed,
              ]}
            >
              <View
                style={[
                  styles.actionIconWrap,
                  action.variant === "primary" && styles.actionIconWrapPrimary,
                ]}
              >
                <Ionicons
                  name={action.icon}
                  size={20}
                  color={
                    action.variant === "primary"
                      ? colors.bg.base
                      : colors.accent.base
                  }
                />
              </View>
              <Text
                style={[
                  styles.actionLabel,
                  action.variant === "primary" && styles.actionLabelPrimary,
                ]}
              >
                {action.label}
              </Text>
              <Text
                style={[
                  styles.actionDesc,
                  action.variant === "primary" && styles.actionDescPrimary,
                ]}
              >
                {action.description}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
    </Screen>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { gap: spacing.sm },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.xl,
    marginTop: spacing[3],
  },
  greeting: {
    ...typography.styles.bodySmall,
    color: colors.textPalette.secondary,
    marginBottom: 2,
  },
  name: { ...typography.styles.h2 },
  avatarBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.accent.muted,
    borderWidth: 1.5,
    borderColor: colors.accent.base,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarBtnPressed: { opacity: 0.85 },
  avatarBtnWeb: { cursor: "pointer" as const },
  avatarText: {
    color: colors.accent.base,
    fontSize: typography.size.md,
    fontWeight: "700",
  },

  statsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingVertical: spacing[2],
  },
  calorieStatsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingVertical: spacing[1],
  },
  statItem: { alignItems: "center", flex: 1 },
  statValue: {
    fontSize: typography.size["3xl"],
    fontWeight: "800",
    color: colors.accent.base,
    letterSpacing: -1,
  },
  statLabel: { ...typography.styles.label, marginTop: spacing[1] },
  statDivider: {
    width: 1,
    height: 36,
    backgroundColor: colors.borderPalette.default,
  },

  // Last activity
  lastActivityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
    marginTop: spacing[3],
    paddingTop: spacing[3],
    borderTopWidth: 1,
    borderTopColor: colors.borderPalette.muted,
  },
  lastActivityIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.accent.muted,
    borderWidth: 1,
    borderColor: colors.accent.base,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  lastActivityText: { flex: 1, gap: 2 },
  lastActivityLabel: {
    fontSize: typography.size.xs,
    color: colors.textPalette.muted,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    fontWeight: "600",
  },
  lastActivityTitle: {
    fontSize: typography.size.sm,
    fontWeight: "600",
    color: colors.textPalette.primary,
  },
  lastActivityTime: {
    fontSize: typography.size.xs,
    color: colors.textPalette.muted,
    flexShrink: 0,
  },

  activityHint: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: spacing[2],
    paddingTop: spacing[2],
    borderTopWidth: 1,
    borderTopColor: colors.borderPalette.muted,
  },
  activityHintText: {
    fontSize: typography.size.xs,
    color: colors.textPalette.muted,
  },

  progressBarWrapper: {
    marginTop: spacing[3],
    paddingTop: spacing[3],
    borderTopWidth: 1,
    borderTopColor: colors.borderPalette.muted,
    gap: spacing[1],
  },
  progressBarTrack: {
    height: 6,
    borderRadius: radius.chip,
    backgroundColor: colors.bg.overlay,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: radius.chip,
  },
  progressBarLabel: {
    fontSize: typography.size.xs,
    color: colors.textPalette.muted,
    textAlign: "right",
  },

  sectionTitle: {
    ...typography.styles.h3,
    marginTop: spacing[2],
    marginBottom: spacing[3],
  },
  infoRow: {
    flexDirection: "row",
    gap: spacing[3],
    marginBottom: spacing[2],
  },
  infoCard: { flex: 1, marginBottom: 0, alignItems: "center" },
  infoEmoji: { fontSize: 22, marginBottom: spacing[1] },
  infoValue: {
    fontSize: typography.size.lg,
    fontWeight: "700",
    color: colors.textPalette.primary,
  },
  infoLabel: { ...typography.styles.caption, marginTop: 2 },

  quickActionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing[3],
    marginBottom: spacing.xl,
  },
  actionCard: {
    width: "47%",
    backgroundColor: colors.bg.elevated,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.borderPalette.default,
    padding: spacing.md,
    gap: spacing[1],
  },
  actionCardPrimary: {
    backgroundColor: colors.accent.base,
    borderColor: colors.accent.base,
    shadowColor: colors.accent.base,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
  actionCardPressed: {
    transform: [{ scale: 0.97 }],
    opacity: 0.9,
  },
  actionIconWrap: {
    width: 38,
    height: 38,
    borderRadius: radius.sm,
    backgroundColor: colors.accent.muted,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing[1],
  },
  actionIconWrapPrimary: { backgroundColor: colors.bg.base + "25" },
  actionLabel: {
    fontSize: typography.size.sm,
    fontWeight: "700",
    color: colors.textPalette.primary,
    lineHeight: 18,
  },
  actionLabelPrimary: { color: colors.bg.base },
  actionDesc: {
    fontSize: typography.size.xs,
    color: colors.textPalette.muted,
  },
  actionDescPrimary: { color: colors.bg.base + "99" },
});
