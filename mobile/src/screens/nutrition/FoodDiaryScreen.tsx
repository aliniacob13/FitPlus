import { useCallback, useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
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

const MacroBar = ({ label, value, color }: { label: string; value: number; color: string }) => (
  <View style={styles.macroItem}>
    <Text style={[styles.macroValue, { color }]}>{Math.round(value)}g</Text>
    <Text style={styles.macroLabel}>{label}</Text>
  </View>
);

const EntryRow = ({
  entry,
  pendingDelete,
  onRequestDelete,
  onConfirmDelete,
  onCancelDelete,
}: {
  entry: FoodLogEntry;
  pendingDelete: boolean;
  onRequestDelete: (id: number) => void;
  onConfirmDelete: (id: number) => void;
  onCancelDelete: () => void;
}) => {
  if (pendingDelete) {
    return (
      <View style={styles.confirmRow}>
        <Text style={styles.confirmText} numberOfLines={1}>
          Delete <Text style={styles.confirmName}>{entry.name}</Text>?
        </Text>
        <TouchableOpacity
          onPress={() => onConfirmDelete(entry.id)}
          style={styles.confirmYes}
        >
          <Text style={styles.confirmYesText}>Delete</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onCancelDelete} style={styles.confirmNo}>
          <Text style={styles.confirmNoText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
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
        onPress={() => onRequestDelete(entry.id)}
        style={styles.deleteBtn}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Ionicons name="trash-outline" size={18} color={colors.error} />
      </TouchableOpacity>
    </View>
  );
};

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

  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);

  useEffect(() => {
    void fetchDay(date);
  }, [date]);

  // Clear pending delete when date changes
  useEffect(() => {
    setPendingDeleteId(null);
  }, [date]);

  const navigateDate = useCallback(
    (delta: number) => {
      const next = addDays(date, delta);
      setDate(next);
    },
    [date, setDate],
  );

  const handleConfirmDelete = (id: number) => {
    setPendingDeleteId(null);
    void deleteEntry(id);
  };

  const safeKcalTarget = dailyKcalTarget ?? 0;
  const kcalProgress = safeKcalTarget > 0 ? Math.min(totals.kcal / safeKcalTarget, 1) : 0;
  const kcalPercent = Math.round(kcalProgress * 100);

  return (
    <Screen scrollable={false} title="Food Diary">
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

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

          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${kcalPercent}%` as `${number}%` }]} />
          </View>
          <Text style={styles.progressLabel}>{kcalPercent}% of target</Text>

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
          label="Scan Barcode"
          onPress={() => navigation.navigate("BarcodeScan", { date })}
          variant="ghost"
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
            <Ionicons name="restaurant-outline" size={48} color={colors.textPalette.muted} />
            <Text style={styles.emptyText}>No entries yet for this day.</Text>
            <Text style={styles.emptyHint}>Tap "+ Add Food" to log your first meal.</Text>
          </View>
        ) : (
          <Card variant="default" padding="none">
            {entries.map((entry, idx) => (
              <View key={entry.id}>
                <EntryRow
                  entry={entry}
                  pendingDelete={pendingDeleteId === entry.id}
                  onRequestDelete={(id) => setPendingDeleteId(id)}
                  onConfirmDelete={handleConfirmDelete}
                  onCancelDelete={() => setPendingDeleteId(null)}
                />
                {idx < entries.length - 1 && <View style={styles.divider} />}
              </View>
            ))}
          </Card>
        )}

        {error ? (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle-outline" size={16} color={colors.error} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
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
  dateNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.bg.elevated,
    borderRadius: radius.md,
    paddingVertical: spacing[2],
    paddingHorizontal: spacing.md,
  },
  dateArrow: { padding: spacing[2] },
  dateArrowText: {
    fontSize: typography.size["2xl"],
    color: colors.accent.base,
    fontWeight: "700",
    lineHeight: 28,
  },
  dateLabel: { ...typography.styles.h3 },
  disabled: { color: colors.textPalette.muted },
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
  kcalLabel: { ...typography.styles.label, marginTop: 2 },
  setupTitle: { ...typography.styles.h3, marginBottom: spacing[1] },
  setupHint: { ...typography.styles.bodySmall, marginBottom: spacing[3] },
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
  macroItem: { alignItems: "center" },
  macroValue: { fontSize: typography.size.lg, fontWeight: "800" },
  macroLabel: { ...typography.styles.label, marginTop: 2 },
  entryRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing[3],
    gap: spacing[3],
  },
  entryInfo: { flex: 1 },
  entryName: {
    fontSize: typography.size.base,
    fontWeight: "600",
    color: colors.textPalette.primary,
  },
  entrySub: { ...typography.styles.caption, marginTop: 2 },
  entryRight: { alignItems: "flex-end" },
  entryKcal: {
    fontSize: typography.size.base,
    fontWeight: "700",
    color: colors.textPalette.primary,
  },
  entryKcalUnit: { ...typography.styles.caption },
  deleteBtn: { padding: spacing[1] },
  // Inline delete confirmation row
  confirmRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing[3],
    gap: spacing[2],
    backgroundColor: colors.error + "12",
  },
  confirmText: {
    flex: 1,
    fontSize: typography.size.sm,
    color: colors.textPalette.secondary,
  },
  confirmName: {
    fontWeight: "700",
    color: colors.textPalette.primary,
  },
  confirmYes: {
    paddingVertical: spacing[1],
    paddingHorizontal: spacing[3],
    borderRadius: radius.sm,
    backgroundColor: colors.error,
  },
  confirmYesText: {
    fontSize: typography.size.sm,
    fontWeight: "700",
    color: colors.white,
  },
  confirmNo: {
    paddingVertical: spacing[1],
    paddingHorizontal: spacing[3],
    borderRadius: radius.sm,
    backgroundColor: colors.bg.overlay,
  },
  confirmNoText: {
    fontSize: typography.size.sm,
    fontWeight: "600",
    color: colors.textPalette.secondary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderPalette.muted,
    marginHorizontal: spacing.md,
  },
  empty: {
    alignItems: "center",
    paddingVertical: spacing["2xl"],
    gap: spacing[2],
  },
  emptyText: { ...typography.styles.h3, color: colors.textPalette.secondary },
  emptyHint: { ...typography.styles.bodySmall, textAlign: "center" },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
    padding: spacing[3],
    borderRadius: radius.md,
    backgroundColor: colors.error + "18",
    borderWidth: 1,
    borderColor: colors.error + "40",
  },
  errorText: {
    color: colors.error,
    fontWeight: "600",
    fontSize: typography.size.sm,
    flex: 1,
  },
});
