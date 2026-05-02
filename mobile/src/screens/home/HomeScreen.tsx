import { useCallback, useEffect, useMemo, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { CompositeNavigationProp } from "@react-navigation/native";
import { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Screen } from "@/components/ui/Screen";
import { colors, spacing, typography } from "@/constants/theme";
import { nutritionApi } from "@/services/nutritionApi";
import { useAuthStore } from "@/store/authStore";
import { todayString, useFoodDiaryStore } from "@/store/foodDiaryStore";
import { useUserStore } from "@/store/userStore";
import { AppStackParamList, MainTabParamList } from "@/types/navigation";

type HomeNav = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, "Home">,
  NativeStackNavigationProp<AppStackParamList>
>;

const StatItem = ({ value, label }: { value: string; label: string }) => (
  <View style={styles.statItem}>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

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
  const remainingKcal = useMemo(() => {
    const target = dailyKcalTarget ?? 0;
    return Math.max(target - todayKcal, 0);
  }, [dailyKcalTarget, todayKcal]);

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

  return (
    <Screen>
      <View style={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Good morning,</Text>
            <Text style={styles.name}>{displayName} 👋</Text>
          </View>
          <TouchableOpacity style={styles.avatarBtn} onPress={() => void logout()}>
            <Text style={styles.avatarText}>{displayName[0]?.toUpperCase() ?? "A"}</Text>
          </TouchableOpacity>
        </View>

        <Card variant="accent" title="Today's Progress" padding="md">
          <View style={styles.statsRow}>
            <StatItem value="0" label="Workouts" />
            <View style={styles.statDivider} />
            <StatItem value="0" label="Minutes" />
            <View style={styles.statDivider} />
            <StatItem value="0" label="Kcal" />
          </View>
        </Card>

        <Card variant="elevated" title="Calories Today" padding="md">
          <View style={styles.calorieStatsRow}>
            <StatItem value={String(todayKcal)} label="Consumed" />
            <View style={styles.statDivider} />
            <StatItem value={hasCalorieTarget ? String(dailyKcalTarget ?? 0) : "—"} label="Target" />
            <View style={styles.statDivider} />
            <StatItem value={hasCalorieTarget ? String(remainingKcal) : "—"} label="Remaining" />
          </View>
        </Card>

        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <Button
          label="Set Calorie Target"
          onPress={() => navigation.navigate("CalorieTarget")}
          variant="outline"
          size="lg"
          fullWidth
        />
        <Button label="Start New Workout" onPress={() => navigation.navigate("Workout")} size="lg" fullWidth />
        <Button
          label="Food Diary"
          onPress={() => navigation.navigate("FoodDiary")}
          variant="outline"
          size="lg"
          fullWidth
        />
        <Button
          label="Update Fitness Profile"
          onPress={() => navigation.navigate("UpdateProfile")}
          variant="secondary"
          fullWidth
        />

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
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
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
});
