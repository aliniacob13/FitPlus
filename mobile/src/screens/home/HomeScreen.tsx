import { useCallback, useEffect, useMemo, useState } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { CompositeNavigationProp } from "@react-navigation/native";
import { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Screen } from "@/components/ui/Screen";
import { colors, radius, spacing, typography } from "@/constants/theme";
import { nutritionApi } from "@/services/nutritionApi";
import { useAuthStore } from "@/store/authStore";
import { todayString, useFoodDiaryStore } from "@/store/foodDiaryStore";
import { useUserStore } from "@/store/userStore";
import { AppStackParamList, MainTabParamList } from "@/types/navigation";

type HomeNav = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, "Home">,
  NativeStackNavigationProp<AppStackParamList>
>;

type IoniconName = React.ComponentProps<typeof Ionicons>["name"];

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

type QuickAction = {
  label: string;
  icon: IoniconName;
  screen: keyof AppStackParamList;
  variant: "primary" | "outline" | "secondary";
  description: string;
};

const QUICK_ACTIONS: QuickAction[] = [
  {
    label: "AI Workout Coach",
    icon: "barbell-outline",
    screen: "Workout",
    variant: "primary",
    description: "Get a personalised plan",
  },
  {
    label: "Food Diary",
    icon: "restaurant-outline",
    screen: "FoodDiary",
    variant: "outline",
    description: "Log today's meals",
  },
  {
    label: "Set Calorie Target",
    icon: "calculator-outline",
    screen: "CalorieTarget",
    variant: "outline",
    description: "Calculate your TDEE",
  },
  {
    label: "Update Fitness Profile",
    icon: "person-outline",
    screen: "UpdateProfile",
    variant: "secondary",
    description: "Weight, height, goals",
  },
];

export const HomeScreen = () => {
  const navigation = useNavigation<HomeNav>();
  const profile = useUserStore((state) => state.profile);
  const logout = useAuthStore((state) => state.logout);
  const dailyKcalTarget = useFoodDiaryStore((state) => state.dailyKcalTarget);
  const hasCalorieTarget = useFoodDiaryStore((state) => state.hasCalorieTarget);
  const diaryDate = useFoodDiaryStore((state) => state.date);
  const diaryKcal = useFoodDiaryStore((state) => state.totals.kcal);
  const [todayKcal, setTodayKcal] = useState(0);

  const displayName = profile?.name || profile?.email?.split("@")[0] || "Athlete";
  const initials = displayName[0]?.toUpperCase() ?? "A";

  const remainingKcal = useMemo(() => {
    const target = dailyKcalTarget ?? 0;
    return Math.max(target - todayKcal, 0);
  }, [dailyKcalTarget, todayKcal]);

  const calorieProgress = useMemo(() => {
    if (!hasCalorieTarget || !dailyKcalTarget || dailyKcalTarget === 0) return 0;
    return Math.min(todayKcal / dailyKcalTarget, 1);
  }, [hasCalorieTarget, dailyKcalTarget, todayKcal]);

  useFocusEffect(
    useCallback(() => {
      const loadToday = async () => {
        try {
          const { data } = await nutritionApi.getFoodLog(todayString());
          setTodayKcal(Math.round(data.totals.kcal));
        } catch {
          setTodayKcal(0);
        }
      };
      void loadToday();
    }, []),
  );

  useEffect(() => {
    if (diaryDate === todayString()) {
      setTodayKcal(Math.round(diaryKcal));
    }
  }, [diaryDate, diaryKcal]);

  const greeting = getGreeting();

  return (
    <Screen>
      <View style={styles.container}>
        {/* ── Header ── */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{greeting},</Text>
            <Text style={styles.name}>{displayName} 👋</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Log out"
            onPress={() => void logout()}
            style={({ pressed }) => [
              styles.avatarBtn,
              pressed && styles.avatarBtnPressed,
              Platform.OS === "web" && styles.avatarBtnWeb,
            ]}
          >
            <Text style={styles.avatarText}>{initials}</Text>
          </Pressable>
        </View>

        {/* ── Workout progress placeholder ── */}
        <Card variant="accent" title="Today's Activity" padding="md">
          <View style={styles.statsRow}>
            <StatItem value="0" label="Workouts" />
            <View style={styles.statDivider} />
            <StatItem value="0" label="Minutes" />
            <View style={styles.statDivider} />
            <StatItem value="0" label="Kcal" />
          </View>
          <View style={styles.activityHint}>
            <Ionicons name="information-circle-outline" size={13} color={colors.textPalette.muted} />
            <Text style={styles.activityHintText}>Start a workout to track your activity</Text>
          </View>
        </Card>

        {/* ── Calorie card with progress bar ── */}
        <Card variant="elevated" title="Calories Today" padding="md">
          <View style={styles.calorieStatsRow}>
            <StatItem value={String(todayKcal)} label="Consumed" />
            <View style={styles.statDivider} />
            <StatItem value={hasCalorieTarget ? String(dailyKcalTarget ?? 0) : "—"} label="Target" />
            <View style={styles.statDivider} />
            <StatItem value={hasCalorieTarget ? String(remainingKcal) : "—"} label="Remaining" />
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

        {/* ── Body stats ── */}
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

        {/* ── Quick Actions ── */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActionsGrid}>
          {QUICK_ACTIONS.map((action) => (
            <Pressable
              key={action.label}
              onPress={() => navigation.navigate(action.screen as any)}
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
                  color={action.variant === "primary" ? colors.bg.base : colors.accent.base}
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

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  // ── Header ──
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
  name: {
    ...typography.styles.h2,
  },
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
  // ── Stats ──
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
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  statValue: {
    fontSize: typography.size["3xl"],
    fontWeight: "800",
    color: colors.accent.base,
    letterSpacing: -1,
  },
  statLabel: {
    ...typography.styles.label,
    marginTop: spacing[1],
  },
  statDivider: {
    width: 1,
    height: 36,
    backgroundColor: colors.borderPalette.default,
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
  // ── Progress bar ──
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
  // ── Body stats ──
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
  infoCard: {
    flex: 1,
    marginBottom: 0,
    alignItems: "center",
  },
  infoEmoji: {
    fontSize: 22,
    marginBottom: spacing[1],
  },
  infoValue: {
    fontSize: typography.size.lg,
    fontWeight: "700",
    color: colors.textPalette.primary,
  },
  infoLabel: {
    ...typography.styles.caption,
    marginTop: 2,
  },
  // ── Quick Actions grid ──
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
  actionIconWrapPrimary: {
    backgroundColor: colors.bg.base + "25",
  },
  actionLabel: {
    fontSize: typography.size.sm,
    fontWeight: "700",
    color: colors.textPalette.primary,
    lineHeight: 18,
  },
  actionLabelPrimary: {
    color: colors.bg.base,
  },
  actionDesc: {
    fontSize: typography.size.xs,
    color: colors.textPalette.muted,
  },
  actionDescPrimary: {
    color: colors.bg.base + "99",
  },
});
