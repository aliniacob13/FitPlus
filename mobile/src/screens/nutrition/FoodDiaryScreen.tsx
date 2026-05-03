import { useCallback, useEffect } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Loader } from "@/components/ui/Loader";
import { Screen } from "@/components/ui/Screen";
import { colors, radius, spacing, typography } from "@/constants/theme";
import { useFoodDiaryStore, todayString } from "@/store/foodDiaryStore";
import type { FoodLogEntry } from "@/services/nutritionApi";
import { AppStackParamList } from "@/types/navigation";

type NavProp = NativeStackNavigationProp<AppStackParamList, "FoodDiary">;

const addDays = (dateStr: string, delta: number): string => {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + delta);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const formatDate = (dateStr: string): string => {
  const today = todayString();
  if (dateStr === today) return "Today";
  const yesterday = addDays(today, -1);
  if (dateStr === yesterday) return "Yesterday";
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
};

const MacroBar = ({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) => (
  <View style={styles.macroItem}>
    <Text style={[styles.macroValue, { color }]}>{Math.round(value)}g</Text>
    <Text style={styles.macroLabel}>{label}</Text>
  </View>
);

const EntryRow = ({
  entry,
  onDelete,
}: {
  entry: FoodLogEntry;
  onDelete: (id: number) => void;
}) => (
  <View style={styles.entryRow}>
    <View style={styles.entryInfo}>
      <Text style={styles.entryName} numberOfLines={1}>
        {entry.name}
      </Text>
      <Text style={styles.entrySub}>
        {entry.grams}g · P {Math.round(entry.protein_g)}g · C {Math.round(entry.carbs_g)}g · F{" "}
        {Math.round(entry.fat_g)}g
      </Text>
    </View>
    <View style={styles.entryRight}>
      <Text style={styles.entryKcal}>{Math.round(entry.kcal)}</Text>
      <Text style={styles.entryKcalUnit}>kcal</Text>
    </View>
    <TouchableOpacity
      onPress={() => onDelete(entry.id)}
      style={styles.deleteBtn}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
    >
      <Text style={styles.deleteBtnText}>✕</Text>
    </TouchableOpacity>
  </View>
);

export const FoodDiaryScreen = () => {
  const navigation = useNavigation<NavProp>();

  const date = useFoodDiaryStore((s) => s.date);
  const entries = useFoodDiaryStore((s) => s.entries);
  const totals = useFoodDiaryStore((s) => s.totals);
  const dailyKcalTarget = useFoodDiaryStore((s) => s.dailyKcalTarget);
  const hasCalorieTarget = useFoodDiaryStore((s) => s.hasCalorieTarget);
  const loading = useFoodDiaryStore((s) => s.loading);
  const error = useFoodDiaryStore((s) => s.error);
  const fetchDay = useFoodDiaryStore((s) => s.fetchDay);
  const setDate = useFoodDiaryStore((s) => s.setDate);
  const deleteEntry = useFoodDiaryStore((s) => s.deleteEntry);

  useEffect(() => {
    void fetchDay(date);
  }, [date]);

  const navigateDate = useCallback(
    (delta: number) => {
      const next = addDays(date, delta);
      setDate(next);
    },
    [date, setDate],
  );

  const handleDelete = (id: number) => {
    Alert.alert("Remove entry", "Delete this food entry?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => void deleteEntry(id) },
    ]);
  };

  const safeKcalTarget = dailyKcalTarget ?? 0;
  const kcalProgress = safeKcalTarget > 0 ? Math.min(totals.kcal / safeKcalTarget, 1) : 0;
  const kcalPercent = Math.round(kcalProgress * 100);

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <Text style={styles.title}>Food Diary</Text>

        {/* Date navigator */}
        <View style={styles.dateNav}>
          <TouchableOpacity onPress={() => navigateDate(-1)} style={styles.dateArrow}>
            <Text style={styles.dateArrowText}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.dateLabel}>{formatDate(date)}</Text>
          <TouchableOpacity
            onPress={() => navigateDate(1)}
            style={styles.dateArrow}
            disabled={date >= todayString()}
          >
            <Text style={[styles.dateArrowText, date >= todayString() && styles.disabled]}>›</Text>
          </TouchableOpacity>
        </View>

        {!hasCalorieTarget ? (
          <Card variant="accent" padding="md">
            <Text style={styles.setupTitle}>Set your calorie goal first</Text>
            <Text style={styles.setupHint}>
              To unlock your Food Diary target, calculate your daily calories and objective first.
            </Text>
            <Button
              label="Go to Calorie Calculator"
              onPress={() => navigation.navigate("CalorieTarget")}
              fullWidth
            />
          </Card>
        ) : null}

        {/* Calorie summary */}
        <Card variant="accent" padding="md">
          <View style={styles.kcalRow}>
            <View>
              <Text style={styles.kcalConsumed}>{Math.round(totals.kcal)}</Text>
              <Text style={styles.kcalLabel}>kcal consumed</Text>
            </View>
            <View style={styles.kcalDivider} />
            <View style={{ alignItems: "flex-end" }}>
              <Text style={styles.kcalTarget}>{safeKcalTarget}</Text>
              <Text style={styles.kcalLabel}>daily target</Text>
            </View>
          </View>

          {/* Progress bar */}
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${kcalPercent}%` as `${number}%` }]} />
          </View>
          <Text style={styles.progressLabel}>{kcalPercent}% of target</Text>

          {/* Macro summary */}
          <View style={styles.macroRow}>
            <MacroBar label="Protein" value={totals.protein_g} color={colors.info} />
            <MacroBar label="Carbs" value={totals.carbs_g} color={colors.warning} />
            <MacroBar label="Fat" value={totals.fat_g} color={colors.error} />
          </View>
        </Card>

        <Button
          label="+ Add Food"
          onPress={() => navigation.navigate("AddFood", { date })}
          disabled={!hasCalorieTarget}
          fullWidth
        />
        <Button
          label="Analyze Plate"
          onPress={() => navigation.navigate("PlateCoach", { date })}
          variant="ghost"
          fullWidth
        />

        {/* Entry list */}
        {loading ? (
          <Loader />
        ) : entries.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No entries yet for this day.</Text>
            <Text style={styles.emptyHint}>Tap "Add Food" to log your first meal.</Text>
          </View>
        ) : (
          <Card variant="default" padding="none">
            {entries.map((entry, idx) => (
              <View key={entry.id}>
                <EntryRow entry={entry} onDelete={handleDelete} />
                {idx < entries.length - 1 && <View style={styles.divider} />}
              </View>
            ))}
          </Card>
        )}

        {error ? <Text style={styles.error}>{error}</Text> : null}

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
  dateNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.bg.elevated,
    borderRadius: radius.md,
    paddingVertical: spacing[2],
    paddingHorizontal: spacing.md,
  },
  dateArrow: {
    padding: spacing[2],
  },
  dateArrowText: {
    fontSize: typography.size["2xl"],
    color: colors.accent.base,
    fontWeight: "700",
    lineHeight: 28,
  },
  dateLabel: {
    ...typography.styles.h3,
  },
  disabled: {
    color: colors.textPalette.muted,
  },
  kcalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing[3],
  },
  kcalConsumed: {
    fontSize: typography.size["3xl"],
    fontWeight: "800",
    color: colors.accent.base,
    letterSpacing: -1,
  },
  kcalTarget: {
    fontSize: typography.size.xl,
    fontWeight: "700",
    color: colors.textPalette.secondary,
  },
  kcalLabel: {
    ...typography.styles.label,
    marginTop: 2,
  },
  setupTitle: {
    ...typography.styles.h3,
    marginBottom: spacing[1],
  },
  setupHint: {
    ...typography.styles.bodySmall,
    marginBottom: spacing[3],
  },
  kcalDivider: {
    width: 1,
    height: 40,
    backgroundColor: colors.borderPalette.default,
  },
  progressTrack: {
    height: 6,
    backgroundColor: colors.bg.overlay,
    borderRadius: radius.chip,
    overflow: "hidden",
    marginBottom: spacing[1],
  },
  progressFill: {
    height: "100%",
    backgroundColor: colors.accent.base,
    borderRadius: radius.chip,
  },
  progressLabel: {
    ...typography.styles.caption,
    textAlign: "right",
    marginBottom: spacing[3],
  },
  macroRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingTop: spacing[2],
    borderTopWidth: 1,
    borderTopColor: `${colors.accent.base}30`,
  },
  macroItem: {
    alignItems: "center",
  },
  macroValue: {
    fontSize: typography.size.lg,
    fontWeight: "800",
  },
  macroLabel: {
    ...typography.styles.label,
    marginTop: 2,
  },
  entryRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing[3],
    gap: spacing[3],
  },
  entryInfo: {
    flex: 1,
  },
  entryName: {
    fontSize: typography.size.base,
    fontWeight: "600",
    color: colors.textPalette.primary,
  },
  entrySub: {
    ...typography.styles.caption,
    marginTop: 2,
  },
  entryRight: {
    alignItems: "flex-end",
  },
  entryKcal: {
    fontSize: typography.size.base,
    fontWeight: "700",
    color: colors.textPalette.primary,
  },
  entryKcalUnit: {
    ...typography.styles.caption,
  },
  deleteBtn: {
    padding: spacing[1],
  },
  deleteBtnText: {
    fontSize: typography.size.sm,
    color: colors.textPalette.muted,
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderPalette.muted,
    marginHorizontal: spacing.md,
  },
  empty: {
    alignItems: "center",
    paddingVertical: spacing["2xl"],
  },
  emptyText: {
    ...typography.styles.bodySmall,
    marginBottom: spacing[1],
  },
  emptyHint: {
    ...typography.styles.caption,
  },
  error: {
    color: colors.error,
    fontWeight: "600",
    textAlign: "center",
  },
});
