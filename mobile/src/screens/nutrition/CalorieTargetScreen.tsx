import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Screen } from "@/components/ui/Screen";
import { colors, radius, spacing, typography } from "@/constants/theme";
import {
  type ActivityLevel,
  type Goal,
  type NutritionTargetResponse,
  type Sex,
  nutritionApi,
} from "@/services/nutritionApi";
import { useFoodDiaryStore } from "@/store/foodDiaryStore";
import { useUserStore } from "@/store/userStore";
import { AppStackParamList } from "@/types/navigation";
import { formatApiError } from "@/utils/apiErrors";

type NavProp = NativeStackNavigationProp<AppStackParamList, "CalorieTarget">;

const SEX_OPTIONS: { value: Sex; label: string }[] = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
];

const ACTIVITY_OPTIONS: { value: ActivityLevel; label: string; short: string }[] = [
  { value: "sedentary", label: "Sedentary", short: "Desk job, no exercise" },
  { value: "lightly_active", label: "Lightly Active", short: "1–3 days/week" },
  { value: "moderately_active", label: "Moderately Active", short: "3–5 days/week" },
  { value: "very_active", label: "Very Active", short: "6–7 days/week" },
  { value: "extra_active", label: "Extra Active", short: "Athlete / physical job" },
];

const GOAL_OPTIONS: { value: Goal; label: string }[] = [
  { value: "lose", label: "Lose Weight" },
  { value: "maintain", label: "Maintain" },
  { value: "gain", label: "Gain Weight" },
];

const SectionLabel = ({ text }: { text: string }) => (
  <Text style={styles.sectionLabel}>{text}</Text>
);

const ChipGroup = <T extends string>({
  options,
  selected,
  onSelect,
  wrap = false,
}: {
  options: { value: T; label: string; short?: string }[];
  selected: T | null;
  onSelect: (v: T) => void;
  wrap?: boolean;
}) => (
  <View style={[styles.chipRow, wrap && styles.chipWrap]}>
    {options.map((opt) => (
      <Pressable
        key={opt.value}
        onPress={() => onSelect(opt.value)}
        style={[styles.chip, selected === opt.value && styles.chipActive]}
      >
        <Text style={[styles.chipLabel, selected === opt.value && styles.chipLabelActive]}>
          {opt.label}
        </Text>
        {opt.short ? (
          <Text style={[styles.chipSub, selected === opt.value && styles.chipSubActive]}>
            {opt.short}
          </Text>
        ) : null}
      </Pressable>
    ))}
  </View>
);

const Divider = () => <View style={styles.divider} />;

const StatRow = ({
  label,
  value,
  unit,
}: {
  label: string;
  value: number;
  unit: string;
}) => (
  <View style={styles.statRow}>
    <Text style={styles.statLabel}>{label}</Text>
    <Text style={styles.statValue}>
      {value} {unit}
    </Text>
  </View>
);

const MacroChip = ({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) => (
  <View style={styles.macroItem}>
    <Text style={[styles.macroValue, { color }]}>{value}g</Text>
    <Text style={styles.macroLabel}>{label}</Text>
  </View>
);

export const CalorieTargetScreen = () => {
  const navigation = useNavigation<NavProp>();
  const profile = useUserStore((state) => state.profile);
  const setDailyKcalTarget = useFoodDiaryStore((state) => state.setDailyKcalTarget);

  const [sex, setSex] = useState<Sex | null>(null);
  const [age, setAge] = useState(profile?.age?.toString() ?? "");
  const [weightKg, setWeightKg] = useState(profile?.weight_kg?.toString() ?? "");
  const [heightCm, setHeightCm] = useState(profile?.height_cm?.toString() ?? "");
  const [activityLevel, setActivityLevel] = useState<ActivityLevel | null>(null);
  const [goal, setGoal] = useState<Goal | null>(null);
  const [weeklyRate, setWeeklyRate] = useState("");
  const [result, setResult] = useState<NutritionTargetResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isFormValid =
    sex !== null &&
    age.trim() !== "" &&
    weightKg.trim() !== "" &&
    heightCm.trim() !== "" &&
    activityLevel !== null &&
    goal !== null;

  const handleCompute = async () => {
    if (!isFormValid || !sex || !activityLevel || !goal) return;
    setError(null);
    setLoading(true);
    try {
      const { data } = await nutritionApi.computeTargets({
        sex,
        age: Number(age),
        weight_kg: Number(weightKg),
        height_cm: Number(heightCm),
        activity_level: activityLevel,
        goal,
        weekly_rate_kg: weeklyRate.trim() ? Number(weeklyRate) : undefined,
      });
      setResult(data);
      setDailyKcalTarget(data.target_calories);
    } catch (err) {
      setError(formatApiError(err, "Could not compute targets."));
    } finally {
      setLoading(false);
    }
  };

  const showWeeklyRate = goal === "lose" || goal === "gain";

  return (
    <Screen scrollable={false}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Calorie Calculator</Text>
        <Text style={styles.subtitle}>
          Estimate your daily calorie target based on the Mifflin–St Jeor equation.
        </Text>

        <SectionLabel text="Sex" />
        <ChipGroup options={SEX_OPTIONS} selected={sex} onSelect={setSex} />

        <SectionLabel text="Body Stats" />
        <View style={styles.fieldRow}>
          <View style={styles.fieldFlex}>
            <Input label="Age" value={age} onChangeText={setAge} placeholder="24" keyboardType="numeric" />
          </View>
          <View style={styles.fieldFlex}>
            <Input
              label="Weight (kg)"
              value={weightKg}
              onChangeText={setWeightKg}
              placeholder="65"
              keyboardType="numeric"
            />
          </View>
          <View style={styles.fieldFlex}>
            <Input
              label="Height (cm)"
              value={heightCm}
              onChangeText={setHeightCm}
              placeholder="170"
              keyboardType="numeric"
            />
          </View>
        </View>

        <SectionLabel text="Activity Level" />
        <ChipGroup options={ACTIVITY_OPTIONS} selected={activityLevel} onSelect={setActivityLevel} wrap />

        <SectionLabel text="Goal" />
        <ChipGroup options={GOAL_OPTIONS} selected={goal} onSelect={setGoal} />

        {showWeeklyRate ? (
          <>
            <SectionLabel text="Weekly Rate (optional)" />
            <Text style={styles.hint}>
              {goal === "lose"
                ? "kg to lose per week — 0.25–0.75 is sustainable"
                : "kg to gain per week — 0.25–0.5 is sustainable"}
            </Text>
            <Input
              label=""
              value={weeklyRate}
              onChangeText={setWeeklyRate}
              placeholder="e.g. 0.5"
              keyboardType="numeric"
            />
          </>
        ) : null}

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Button
          label="Calculate"
          onPress={() => void handleCompute()}
          loading={loading}
          disabled={!isFormValid}
          fullWidth
        />

        {result ? (
          <>
            <SectionLabel text="Your Results" />

            <Card variant="elevated" padding="md">
              <StatRow label="BMR (Basal Metabolic Rate)" value={result.bmr} unit="kcal/day" />
              <Divider />
              <StatRow label="TDEE (with activity)" value={result.tdee} unit="kcal/day" />
            </Card>

            <Card variant="accent" padding="md">
              <Text style={styles.targetLabel}>DAILY TARGET</Text>
              <Text style={styles.targetValue}>{result.target_calories}</Text>
              <Text style={styles.targetUnit}>kcal / day</Text>
            </Card>

            <Card variant="default" title="Macros Suggestion" padding="md">
              <View style={styles.macroRow}>
                <MacroChip label="Protein" value={result.macros_suggestion.protein_g} color={colors.info} />
                <MacroChip label="Carbs" value={result.macros_suggestion.carbs_g} color={colors.warning} />
                <MacroChip label="Fat" value={result.macros_suggestion.fat_g} color={colors.error} />
              </View>
            </Card>

            <Text style={styles.disclaimer}>
              These are estimates only and not medical advice. Consult a healthcare professional
              before making significant dietary changes.
            </Text>
            <Button
              label="Continue to Food Diary"
              onPress={() => navigation.navigate("FoodDiary")}
              variant="outline"
              fullWidth
            />
          </>
        ) : null}

        <Button label="Back" onPress={() => navigation.goBack()} variant="ghost" fullWidth />
      </ScrollView>
    </Screen>
  );
};

const styles = StyleSheet.create({
  content: {
    gap: spacing.md,
    paddingBottom: spacing["2xl"],
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    color: colors.textPalette.primary,
    marginTop: spacing[3],
  },
  subtitle: {
    ...typography.styles.bodySmall,
  },
  sectionLabel: {
    ...typography.styles.label,
    marginTop: spacing.sm,
    marginBottom: spacing[1],
  },
  fieldRow: {
    flexDirection: "row",
    gap: spacing[3],
  },
  fieldFlex: {
    flex: 1,
  },
  chipRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  chipWrap: {
    flexWrap: "wrap",
  },
  chip: {
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[3],
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderPalette.default,
    backgroundColor: colors.bg.elevated,
    alignItems: "center",
  },
  chipActive: {
    borderColor: colors.accent.base,
    backgroundColor: colors.accent.muted,
  },
  chipLabel: {
    fontSize: typography.size.sm,
    fontWeight: "600",
    color: colors.textPalette.secondary,
  },
  chipLabelActive: {
    color: colors.accent.base,
  },
  chipSub: {
    fontSize: typography.size.xs,
    color: colors.textPalette.muted,
    marginTop: 2,
    textAlign: "center",
  },
  chipSubActive: {
    color: colors.accent.dim,
  },
  hint: {
    ...typography.styles.caption,
    marginTop: -spacing.sm,
  },
  error: {
    color: colors.error,
    fontWeight: "600",
  },
  statRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing[2],
  },
  statLabel: {
    ...typography.styles.bodySmall,
    flex: 1,
    marginRight: spacing[3],
  },
  statValue: {
    fontSize: typography.size.base,
    fontWeight: "700",
    color: colors.textPalette.primary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderPalette.muted,
    marginVertical: spacing[1],
  },
  targetLabel: {
    ...typography.styles.label,
    textAlign: "center",
    marginBottom: spacing[1],
  },
  targetValue: {
    fontSize: typography.size["3xl"],
    fontWeight: "800",
    color: colors.accent.base,
    textAlign: "center",
    letterSpacing: -1,
  },
  targetUnit: {
    ...typography.styles.bodySmall,
    textAlign: "center",
  },
  macroRow: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  macroItem: {
    alignItems: "center",
    flex: 1,
  },
  macroValue: {
    fontSize: typography.size.xl,
    fontWeight: "800",
  },
  macroLabel: {
    ...typography.styles.label,
    marginTop: spacing[1],
  },
  disclaimer: {
    ...typography.styles.caption,
    textAlign: "center",
    paddingHorizontal: spacing.md,
    lineHeight: 16,
  },
});
