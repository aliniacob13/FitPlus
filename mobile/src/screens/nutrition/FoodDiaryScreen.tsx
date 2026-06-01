import { useCallback, useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { Button } from "@/components/ui/Button";
import { Loader } from "@/components/ui/Loader";
import { ProgressRing } from "@/components/ui/ProgressRing";
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

// ── EntryRow with inline confirm ──────────────────────────────────────────────

const EntryRow = ({
  entry, pendingDelete, onRequestDelete, onConfirmDelete, onCancelDelete,
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
          Delete <Text style={styles.confirmBold}>{entry.name}</Text>?
        </Text>
        <TouchableOpacity onPress={() => onConfirmDelete(entry.id)} style={styles.confirmYes}>
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
        <Text style={styles.entryName} numberOfLines={1}>{entry.name}</Text>
        <Text style={styles.entrySub}>
          {entry.grams}g · P {Math.round(entry.protein_g)}g · C {Math.round(entry.carbs_g)}g · F {Math.round(entry.fat_g)}g
        </Text>
      </View>
      <View style={styles.entryRight}>
        <Text style={styles.entryKcal}>{Math.round(entry.kcal)}</Text>
        <Text style={styles.entryUnit}>kcal</Text>
      </View>
      <TouchableOpacity
        onPress={() => onRequestDelete(entry.id)}
        style={styles.deleteBtn}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Ionicons name="trash-outline" size={17} color={colors.error} />
      </TouchableOpacity>
    </View>
  );
};

// ── MacroBar ──────────────────────────────────────────────────────────────────

const MacroBar = ({ label, value, target, color }: { label: string; value: number; target: number; color: string }) => {
  const pct = Math.min(1, target > 0 ? value / target : 0);
  return (
    <View style={mbs.wrap}>
      <View style={mbs.header}>
        <Text style={mbs.label}>{label}</Text>
        <Text style={mbs.val}>{Math.round(value)}<Text style={mbs.target}>/{target}g</Text></Text>
      </View>
      <View style={mbs.track}>
        <View style={[mbs.fill, { width: `${Math.round(pct * 100)}%` as `${number}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
};

const mbs = StyleSheet.create({
  wrap: { gap: 5 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" },
  label: { fontSize: 10, color: colors.mutedColor, textTransform: "uppercase", letterSpacing: 0.8, fontWeight: "500" },
  val: { fontFamily: "JetBrainsMono_500Medium", fontSize: 11, color: colors.ink2 },
  target: { color: colors.mutedColor },
  track: { height: 5, backgroundColor: colors.lineColor, borderRadius: 999 },
  fill: { height: "100%", borderRadius: 999 },
});

// ── FoodDiaryScreen ───────────────────────────────────────────────────────────

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
    // fetchDay is a stable Zustand action
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  useEffect(() => { setPendingDeleteId(null); }, [date]);

  const navigateDate = useCallback(
    (delta: number) => setDate(addDays(date, delta)),
    [date, setDate],
  );

  const handleConfirmDelete = (id: number) => {
    setPendingDeleteId(null);
    void deleteEntry(id);
  };

  const safeTarget = dailyKcalTarget ?? 0;
  const kcalProgress = safeTarget > 0 ? Math.min(1, totals.kcal / safeTarget) : 0;
  const remaining = Math.max(0, safeTarget - Math.round(totals.kcal));

  return (
    <Screen scrollable={false}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Title + date nav */}
        <View style={styles.titleRow}>
          <View>
            <Text style={styles.eyebrow}>JURNAL ALIMENTAR</Text>
            <Text style={styles.title}>{formatDate(date)}</Text>
          </View>
          <View style={styles.dateNav}>
            <TouchableOpacity onPress={() => navigateDate(-1)} style={styles.dateBtn}>
              <Ionicons name="chevron-back" size={18} color={colors.primaryBase} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => navigateDate(1)}
              style={styles.dateBtn}
              disabled={date >= todayString()}
            >
              <Ionicons
                name="chevron-forward"
                size={18}
                color={date >= todayString() ? colors.muted2 : colors.primaryBase}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Calorie goal prompt */}
        {!hasCalorieTarget && (
          <View style={styles.setupCard}>
            <Ionicons name="calculator-outline" size={20} color={colors.primaryBase} />
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={styles.setupTitle}>Set your calorie goal first</Text>
              <Text style={styles.setupSub}>Calculate your TDEE to unlock macro tracking.</Text>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate("CalorieTarget")} style={styles.setupBtn}>
              <Text style={styles.setupBtnText}>Set up</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Hero summary ── */}
        <View style={styles.heroCard}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 20 }}>
            <ProgressRing
              size={120}
              stroke={10}
              value={kcalProgress}
              label={`${Math.round(kcalProgress * 100)}%`}
              sub="of goal"
              color={kcalProgress >= 1 ? colors.error : colors.accentBase}
            />
            <View style={{ flex: 1, gap: 10 }}>
              <View>
                <Text style={styles.kcalBig}>{Math.round(totals.kcal)}</Text>
                <Text style={styles.eyebrow}>consumed</Text>
              </View>
              <View style={styles.divider} />
              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <View style={{ gap: 2 }}>
                  <Text style={styles.ringMono}>{safeTarget}</Text>
                  <Text style={styles.eyebrow2}>goal</Text>
                </View>
                <View style={{ gap: 2, alignItems: "flex-end" }}>
                  <Text style={[styles.ringMono, { color: colors.good }]}>{remaining}</Text>
                  <Text style={styles.eyebrow2}>left</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Macro bars */}
          <View style={styles.macroGrid}>
            <MacroBar label="Protein" value={totals.protein_g} target={100} color={colors.macroProtein} />
            <MacroBar label="Carbs"   value={totals.carbs_g}   target={250} color={colors.macroCarbs} />
            <MacroBar label="Fat"     value={totals.fat_g}     target={67}  color={colors.macroFat} />
          </View>
        </View>

        {/* Action buttons */}
        <View style={styles.actionRow}>
          <Button
            label="+ Add Food"
            onPress={() => navigation.navigate("AddFood", { date })}
            disabled={!hasCalorieTarget}
            size="md"
            fullWidth
          />
          <Button
            label="Scan Plate"
            onPress={() => navigation.navigate("PlateCoach", { date })}
            variant="outline"
            size="md"
            icon={<Ionicons name="camera-outline" size={15} color={colors.ink} />}
          />
        </View>

        {/* Entry list */}
        {loading ? (
          <Loader />
        ) : entries.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="restaurant-outline" size={44} color={colors.muted2} />
            <Text style={styles.emptyTitle}>No entries yet</Text>
            <Text style={styles.emptyHint}>Tap "+ Add Food" to log your first meal.</Text>
          </View>
        ) : (
          <View style={styles.entriesCard}>
            {entries.map((entry, idx) => (
              <View key={entry.id}>
                <EntryRow
                  entry={entry}
                  pendingDelete={pendingDeleteId === entry.id}
                  onRequestDelete={(id) => setPendingDeleteId(id)}
                  onConfirmDelete={handleConfirmDelete}
                  onCancelDelete={() => setPendingDeleteId(null)}
                />
                {idx < entries.length - 1 && <View style={styles.dividerRow} />}
              </View>
            ))}
          </View>
        )}

        {error ? (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle-outline" size={15} color={colors.error} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <Button label="Back" onPress={() => navigation.goBack()} variant="ghost" fullWidth />
      </ScrollView>
    </Screen>
  );
};

const styles = StyleSheet.create({
  content: { gap: spacing.md, paddingBottom: spacing["2xl"] },

  titleRow: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end",
    marginTop: spacing[3],
  },
  eyebrow: { ...typography.styles.eyebrow, marginBottom: 4 },
  title: {
    fontFamily: "InstrumentSerif_400Regular",
    fontSize: 30, letterSpacing: -0.6, color: colors.ink,
  },
  dateNav: { flexDirection: "row", gap: 4 },
  dateBtn: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.lineColor,
    alignItems: "center", justifyContent: "center",
  },

  setupCard: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: colors.primarySoft, borderRadius: radius.card,
    borderWidth: 1, borderColor: colors.primaryBase + "40", padding: spacing.md,
  },
  setupTitle: { fontSize: 13, fontWeight: "600", color: colors.ink },
  setupSub:   { fontSize: 11, color: colors.mutedColor },
  setupBtn: {
    paddingVertical: 6, paddingHorizontal: 12,
    backgroundColor: colors.primaryBase, borderRadius: radius.button,
  },
  setupBtnText: { fontSize: 12, fontWeight: "700", color: colors.primaryInk },

  heroCard: {
    backgroundColor: colors.surfaceBase, borderRadius: radius.card,
    borderWidth: 1, borderColor: colors.lineColor, padding: spacing.md, gap: spacing.md,
  },
  kcalBig: {
    fontFamily: "InstrumentSerif_400Regular",
    fontSize: 36, letterSpacing: -0.72, lineHeight: 38, color: colors.ink,
  },
  eyebrow2: { ...typography.styles.eyebrow, fontSize: 9 },
  ringMono: { fontFamily: "JetBrainsMono_500Medium", fontSize: 13, color: colors.ink2 },
  divider: { height: 1, backgroundColor: colors.lineColor },

  macroGrid: {
    flexDirection: "row", gap: spacing.md,
    paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.lineSoft,
  },

  actionRow: { flexDirection: "row", gap: spacing.sm },

  entriesCard: {
    backgroundColor: colors.surfaceBase, borderRadius: radius.card,
    borderWidth: 1, borderColor: colors.lineColor, overflow: "hidden",
  },
  entryRow: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: spacing.md, paddingVertical: spacing[3], gap: spacing[3],
  },
  entryInfo: { flex: 1 },
  entryName: { fontSize: 14, fontWeight: "600", color: colors.ink },
  entrySub:  { ...typography.styles.caption, marginTop: 2 },
  entryRight: { alignItems: "flex-end" },
  entryKcal: { fontFamily: "JetBrainsMono_500Medium", fontSize: 13, color: colors.ink },
  entryUnit: { ...typography.styles.caption },
  deleteBtn: { padding: spacing[1] },

  confirmRow: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: spacing.md, paddingVertical: spacing[3], gap: spacing[2],
    backgroundColor: colors.error + "10",
  },
  confirmText: { flex: 1, fontSize: 12, color: colors.mutedColor },
  confirmBold: { fontWeight: "700", color: colors.ink },
  confirmYes: {
    paddingVertical: 5, paddingHorizontal: 12,
    borderRadius: radius.button, backgroundColor: colors.error,
  },
  confirmYesText: { fontSize: 12, fontWeight: "700", color: "#fff" },
  confirmNo: {
    paddingVertical: 5, paddingHorizontal: 12,
    borderRadius: radius.button, backgroundColor: colors.surface2,
  },
  confirmNoText: { fontSize: 12, fontWeight: "600", color: colors.mutedColor },

  dividerRow: { height: 1, backgroundColor: colors.lineSoft, marginHorizontal: spacing.md },

  empty: { alignItems: "center", paddingVertical: spacing["2xl"], gap: spacing[3] },
  emptyTitle: { fontFamily: "InstrumentSerif_400Regular", fontSize: 22, color: colors.mutedColor },
  emptyHint: { ...typography.styles.bodySmall, textAlign: "center" },

  errorBanner: {
    flexDirection: "row", alignItems: "center", gap: spacing[2],
    padding: spacing[3], borderRadius: radius.md,
    backgroundColor: colors.error + "15", borderWidth: 1, borderColor: colors.error + "40",
  },
  errorText: { flex: 1, color: colors.error, fontWeight: "600", fontSize: 13 },
});
