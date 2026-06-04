import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { BarChart } from "react-native-chart-kit";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Loader } from "@/components/ui/Loader";
import { Screen } from "@/components/ui/Screen";
import { colors, radius, spacing, typography } from "@/constants/theme";
import {
  EXERCISE_MET,
  ExerciseLogEntry,
  ExerciseType,
  exerciseApi,
} from "@/services/exerciseApi";
import { useUserStore } from "@/store/userStore";
import { AppStackParamList } from "@/types/navigation";
import { formatApiError } from "@/utils/apiErrors";

type NavProp = NativeStackNavigationProp<AppStackParamList, "ExerciseLog">;

// ── Exercise metadata ─────────────────────────────────────────────────────────

interface ExerciseMeta {
  label: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
  color: string;
}

const EXERCISES: Record<ExerciseType, ExerciseMeta> = {
  running:         { label: "Running",     icon: "flash-outline",          color: "#FF5252" },
  walking:         { label: "Walking",     icon: "walk-outline",           color: "#4CAF50" },
  cycling:         { label: "Cycling",     icon: "bicycle-outline",        color: "#2196F3" },
  swimming:        { label: "Swimming",    icon: "water-outline",          color: "#00BCD4" },
  jump_rope:       { label: "Jump Rope",   icon: "infinite-outline",       color: "#FF9800" },
  yoga:            { label: "Yoga",        icon: "body-outline",           color: "#9C27B0" },
  weight_training: { label: "Weights",     icon: "barbell-outline",        color: "#795548" },
  hiit:            { label: "HIIT",        icon: "flame-outline",          color: "#F44336" },
  dancing:         { label: "Dancing",     icon: "musical-notes-outline",  color: "#E91E63" },
  hiking:          { label: "Hiking",      icon: "trail-sign-outline",     color: "#607D8B" },
  rowing:          { label: "Rowing",      icon: "boat-outline",           color: "#009688" },
  elliptical:      { label: "Elliptical",  icon: "sync-outline",           color: "#FF5722" },
};

const EXERCISE_TYPES = Object.keys(EXERCISES) as ExerciseType[];
const QUICK_DURATIONS = [15, 30, 45, 60, 90];
const DEFAULT_WEIGHT_KG = 75;

// ── Helpers ───────────────────────────────────────────────────────────────────

const todayStr = (): string => new Date().toISOString().slice(0, 10);

const formatDate = (iso: string): string => {
  const d = new Date(iso);
  const today = todayStr();
  const dayStr = d.toISOString().slice(0, 10);
  if (dayStr === today) return "Today";
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  if (dayStr === yesterday.toISOString().slice(0, 10)) return "Yesterday";
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short" });
};

const formatDuration = (minutes: number): string => {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
};

const getLast7DayLabels = (): string[] => {
  const labels: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    labels.push(["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"][d.getDay()]!);
  }
  return labels;
};

const getLast7DayKcal = (entries: ExerciseLogEntry[]): number[] => {
  const result: number[] = Array(7).fill(0);
  const now = new Date();
  for (const entry of entries) {
    const d = new Date(entry.logged_at);
    const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
    if (diffDays >= 0 && diffDays < 7) {
      result[6 - diffDays] = (result[6 - diffDays] ?? 0) + entry.kcal_burned;
    }
  }
  return result;
};

// ── Main screen ───────────────────────────────────────────────────────────────

export const ExerciseLogScreen = () => {
  const navigation = useNavigation<NavProp>();
  const profile = useUserStore((s) => s.profile);
  const weightKg = profile?.weight_kg ?? DEFAULT_WEIGHT_KG;

  const [entries, setEntries] = useState<ExerciseLogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);

  // Form state
  const [selectedType, setSelectedType] = useState<ExerciseType>("running");
  const [duration, setDuration] = useState("30");
  const [notes, setNotes] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const screenWidth = Dimensions.get("window").width - spacing.lg * 2 - spacing.md * 2;

  // ── Data ──────────────────────────────────────────────────────────────────

  const fetchLog = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const data = await exerciseApi.getLog();
      setEntries(data);
    } catch (err) {
      setFetchError(formatApiError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchLog();
  }, [fetchLog]);

  // ── Derived stats ─────────────────────────────────────────────────────────

  const todayKcal = useMemo(() => {
    const today = todayStr();
    return entries
      .filter((e) => new Date(e.logged_at).toISOString().slice(0, 10) === today)
      .reduce((sum, e) => sum + e.kcal_burned, 0);
  }, [entries]);

  const todaySessions = useMemo(() => {
    const today = todayStr();
    return entries.filter((e) => new Date(e.logged_at).toISOString().slice(0, 10) === today).length;
  }, [entries]);

  const weekKcal = useMemo(() => getLast7DayKcal(entries), [entries]);
  const weekLabels = useMemo(() => getLast7DayLabels(), []);

  const hasWeekData = weekKcal.some((v) => v > 0);

  // ── Live calorie preview ──────────────────────────────────────────────────

  const previewKcal = useMemo(() => {
    const mins = parseInt(duration, 10);
    if (!mins || mins <= 0) return null;
    const met = EXERCISE_MET[selectedType];
    return Math.round(met * weightKg * (mins / 60));
  }, [selectedType, duration, weightKg]);

  // ── Actions ───────────────────────────────────────────────────────────────

  const handleLog = async () => {
    const mins = parseInt(duration, 10);
    if (!mins || mins <= 0 || mins > 600) {
      setFormError("Enter a duration between 1 and 600 minutes.");
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      const entry = await exerciseApi.addEntry({
        exercise_type: selectedType,
        duration_minutes: mins,
        notes: notes.trim() || undefined,
      });
      setEntries((prev) => [entry, ...prev]);
      setDuration("30");
      setNotes("");
      setShowForm(false);
    } catch (err) {
      setFormError(formatApiError(err));
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDelete = async (id: number) => {
    setPendingDeleteId(null);
    setDeleteError(null);
    const prev = entries;
    setEntries((cur) => cur.filter((e) => e.id !== id));
    try {
      await exerciseApi.deleteEntry(id);
    } catch (err) {
      setEntries(prev);
      setDeleteError(formatApiError(err));
    }
  };

  // ── Chart config ─────────────────────────────────────────────────────────

  const barChartData = {
    labels: weekLabels,
    datasets: [{ data: weekKcal.map((v) => Math.round(v)) }],
  };

  const barChartConfig = {
    backgroundColor: colors.bg.elevated,
    backgroundGradientFrom: colors.bg.elevated,
    backgroundGradientTo: colors.bg.elevated,
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(197, 241, 53, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(154, 154, 154, ${opacity})`,
    barPercentage: 0.6,
    propsForLabels: { fontSize: 11 },
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <Screen scrollable={false} title="Exercise Log">
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {loading && <Loader />}

        {fetchError && (
          <Card variant="default" padding="md">
            <Text style={styles.errorText}>{fetchError}</Text>
            <Button label="Retry" onPress={fetchLog} variant="outline" fullWidth />
          </Card>
        )}

        {deleteError && (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle-outline" size={15} color={colors.error} />
            <Text style={styles.errorBannerText}>{deleteError}</Text>
            <TouchableOpacity onPress={() => setDeleteError(null)}>
              <Ionicons name="close" size={15} color={colors.error} />
            </TouchableOpacity>
          </View>
        )}

        {/* ── Today's summary ── */}
        <Card variant="accent" padding="md">
          <Text style={styles.summaryTitle}>Today's Activity</Text>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Ionicons name="flame" size={28} color={colors.accent.base} />
              <Text style={styles.summaryValue}>{Math.round(todayKcal)}</Text>
              <Text style={styles.summaryLabel}>kcal burned</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Ionicons name="checkmark-circle" size={28} color={colors.accent.base} />
              <Text style={styles.summaryValue}>{todaySessions}</Text>
              <Text style={styles.summaryLabel}>
                {todaySessions === 1 ? "session" : "sessions"}
              </Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Ionicons name="trophy-outline" size={28} color={colors.accent.base} />
              <Text style={styles.summaryValue}>
                {Math.round(entries.reduce((s, e) => s + e.kcal_burned, 0))}
              </Text>
              <Text style={styles.summaryLabel}>kcal total</Text>
            </View>
          </View>
        </Card>

        {/* ── Weekly chart ── */}
        <Card variant="default" padding="md">
          <Text style={styles.chartTitle}>Last 7 Days</Text>
          {hasWeekData ? (
            <BarChart
              data={barChartData}
              width={screenWidth}
              height={160}
              chartConfig={barChartConfig}
              style={styles.chart}
              showValuesOnTopOfBars={false}
              withInnerLines={false}
              yAxisLabel=""
              yAxisSuffix=""
            />
          ) : (
            <View style={styles.emptyChart}>
              <Ionicons name="bar-chart-outline" size={36} color={colors.textPalette.muted} />
              <Text style={styles.emptyChartText}>Log exercises to see your weekly activity</Text>
            </View>
          )}
        </Card>

        {/* ── Log new exercise ── */}
        {!showForm ? (
          <Button
            label="+ Log Exercise"
            onPress={() => { setShowForm(true); setFormError(null); }}
            fullWidth
          />
        ) : (
          <Card variant="elevated" padding="md">
            <Text style={styles.formTitle}>Log Exercise</Text>

            {/* Exercise type grid */}
            <View style={styles.typeGrid}>
              {EXERCISE_TYPES.map((type) => {
                const meta = EXERCISES[type];
                const isSelected = selectedType === type;
                return (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.typeCard,
                      isSelected && {
                        backgroundColor: meta.color + "25",
                        borderColor: meta.color,
                      },
                    ]}
                    onPress={() => setSelectedType(type)}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={meta.icon}
                      size={20}
                      color={isSelected ? meta.color : colors.textPalette.muted}
                    />
                    <Text
                      style={[
                        styles.typeLabel,
                        isSelected && { color: meta.color, fontWeight: "700" },
                      ]}
                      numberOfLines={1}
                    >
                      {meta.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Duration */}
            <Text style={styles.fieldLabel}>Duration (minutes)</Text>
            <View style={styles.durationRow}>
              <View style={styles.durationInput}>
                <Input
                  label=""
                  value={duration}
                  onChangeText={(v) => { setDuration(v); setFormError(null); }}
                  keyboardType="numeric"
                  placeholder="e.g. 45"
                />
              </View>
              <View style={styles.quickChips}>
                {QUICK_DURATIONS.map((min) => (
                  <TouchableOpacity
                    key={min}
                    style={[
                      styles.chip,
                      duration === String(min) && styles.chipActive,
                    ]}
                    onPress={() => { setDuration(String(min)); setFormError(null); }}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        duration === String(min) && styles.chipTextActive,
                      ]}
                    >
                      {min}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Calorie preview */}
            {previewKcal != null && (
              <View style={styles.previewRow}>
                <Ionicons name="flame" size={18} color={colors.accent.base} />
                <Text style={styles.previewText}>
                  ~<Text style={styles.previewKcal}>{previewKcal}</Text> kcal estimated
                </Text>
                <Text style={styles.previewSub}>
                  {`  (${EXERCISES[selectedType].label}, ${formatDuration(parseInt(duration, 10) || 0)}, ${weightKg} kg)`}
                </Text>
              </View>
            )}

            {/* Optional notes */}
            <Input
              label="Notes (optional)"
              value={notes}
              onChangeText={setNotes}
              placeholder="e.g. morning run, easy pace"
              autoCapitalize="sentences"
            />

            {formError && <Text style={styles.inlineError}>{formError}</Text>}

            <View style={styles.btnRow}>
              <Button label="Log Exercise" onPress={() => void handleLog()} loading={saving} />
              <Button
                label="Cancel"
                onPress={() => { setShowForm(false); setFormError(null); }}
                variant="ghost"
              />
            </View>
          </Card>
        )}

        {/* ── History ── */}
        {!loading && entries.length > 0 && (
          <Card variant="default" title="History" padding="none">
            {entries.slice(0, 30).map((entry, idx, arr) => {
              const meta = EXERCISES[entry.exercise_type as ExerciseType];
              return (
                <View key={entry.id}>
                  {pendingDeleteId === entry.id ? (
                    <View style={styles.confirmRow}>
                      <Text style={styles.confirmText} numberOfLines={1}>
                        Delete{" "}
                        <Text style={styles.confirmBold}>
                          {meta?.label ?? entry.exercise_type}
                        </Text>
                        ?
                      </Text>
                      <TouchableOpacity
                        onPress={() => void handleConfirmDelete(entry.id)}
                        style={styles.confirmYes}
                      >
                        <Text style={styles.confirmYesText}>Delete</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => setPendingDeleteId(null)}
                        style={styles.confirmNo}
                      >
                        <Text style={styles.confirmNoText}>Cancel</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <View style={styles.historyRow}>
                      <View
                        style={[
                          styles.historyIcon,
                          { backgroundColor: (meta?.color ?? "#888") + "20" },
                        ]}
                      >
                        <Ionicons
                          name={meta?.icon ?? "fitness-outline"}
                          size={16}
                          color={meta?.color ?? colors.textPalette.muted}
                        />
                      </View>
                      <View style={styles.historyInfo}>
                        <Text style={styles.historyName}>
                          {meta?.label ?? entry.exercise_type}
                        </Text>
                        <Text style={styles.historySub}>
                          {formatDuration(entry.duration_minutes)} · {formatDate(entry.logged_at)}
                          {entry.notes ? `  · ${entry.notes}` : ""}
                        </Text>
                      </View>
                      <View style={styles.historyRight}>
                        <Text style={styles.historyKcal}>
                          {Math.round(entry.kcal_burned)}
                        </Text>
                        <Text style={styles.historyKcalUnit}>kcal</Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => setPendingDeleteId(entry.id)}
                        style={styles.deleteBtn}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      >
                        <Ionicons name="trash-outline" size={15} color={colors.error} />
                      </TouchableOpacity>
                    </View>
                  )}
                  {idx < arr.length - 1 && <View style={styles.divider} />}
                </View>
              );
            })}
          </Card>
        )}

        {!loading && entries.length === 0 && !fetchError && (
          <View style={styles.emptyState}>
            <Ionicons name="fitness-outline" size={52} color={colors.textPalette.muted} />
            <Text style={styles.emptyTitle}>No exercises logged yet</Text>
            <Text style={styles.emptyHint}>
              Tap "+ Log Exercise" to record your first session.
            </Text>
          </View>
        )}

        <Button label="Back" onPress={() => navigation.goBack()} variant="ghost" fullWidth />
      </ScrollView>
    </Screen>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { gap: spacing.md, paddingBottom: spacing["2xl"] },

  // Error states
  errorText: { color: colors.error, textAlign: "center", marginBottom: spacing.md },
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
  errorBannerText: {
    flex: 1,
    color: colors.error,
    fontWeight: "600",
    fontSize: typography.size.sm,
  },

  // Summary card
  summaryTitle: {
    ...typography.styles.h3,
    marginBottom: spacing.md,
    textAlign: "center",
  },
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
  },
  summaryItem: { alignItems: "center", flex: 1, gap: 4 },
  summaryValue: {
    fontSize: typography.size.xl,
    fontWeight: "800",
    color: colors.textPalette.primary,
  },
  summaryLabel: { ...typography.styles.caption, textAlign: "center" },
  summaryDivider: {
    width: 1,
    height: 48,
    backgroundColor: colors.borderPalette.muted,
  },

  // Chart
  chartTitle: { ...typography.styles.h3, textAlign: "center", marginBottom: spacing.sm },
  chart: { borderRadius: radius.md, marginTop: spacing[2] },
  emptyChart: {
    height: 140,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing[3],
  },
  emptyChartText: { ...typography.styles.bodySmall, textAlign: "center" },

  // Form
  formTitle: { ...typography.styles.h3, marginBottom: spacing.md },
  typeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing[2],
    marginBottom: spacing.md,
  },
  typeCard: {
    width: "30.5%",
    alignItems: "center",
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[2],
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderPalette.muted,
    backgroundColor: colors.bg.elevated,
    gap: 4,
  },
  typeLabel: {
    fontSize: 10,
    color: colors.textPalette.muted,
    textAlign: "center",
  },
  fieldLabel: {
    ...typography.styles.label,
    marginBottom: spacing[2],
  },
  durationRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  durationInput: { flex: 1 },
  quickChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing[1],
    paddingTop: 4,
    flex: 1.6,
  },
  chip: {
    paddingVertical: spacing[1],
    paddingHorizontal: spacing[2],
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.borderPalette.muted,
    backgroundColor: colors.bg.elevated,
  },
  chipActive: {
    borderColor: colors.accent.base,
    backgroundColor: colors.accent.base + "20",
  },
  chipText: { fontSize: typography.size.sm, color: colors.textPalette.muted },
  chipTextActive: { color: colors.accent.base, fontWeight: "700" },
  previewRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
    paddingVertical: spacing[3],
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.accent.base + "12",
    marginBottom: spacing.sm,
    flexWrap: "wrap",
  },
  previewText: { fontSize: typography.size.base, color: colors.textPalette.primary },
  previewKcal: {
    fontSize: typography.size.xl,
    fontWeight: "800",
    color: colors.accent.base,
  },
  previewSub: { ...typography.styles.caption, flex: 1 },
  inlineError: {
    color: colors.error,
    fontSize: typography.size.sm,
    marginBottom: spacing.sm,
  },
  btnRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.md,
  },

  // History
  historyRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing[3],
    gap: spacing[3],
  },
  historyIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  historyInfo: { flex: 1, gap: 2 },
  historyName: {
    fontSize: typography.size.base,
    fontWeight: "600",
    color: colors.textPalette.primary,
  },
  historySub: { ...typography.styles.caption },
  historyRight: { alignItems: "flex-end", marginRight: spacing[2] },
  historyKcal: {
    fontSize: typography.size.lg,
    fontWeight: "800",
    color: colors.textPalette.primary,
  },
  historyKcalUnit: { ...typography.styles.caption },
  deleteBtn: { padding: spacing[1] },

  // Confirm row
  confirmRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing[3],
    gap: spacing[2],
    backgroundColor: colors.error + "12",
  },
  confirmText: { flex: 1, fontSize: typography.size.sm, color: colors.textPalette.secondary },
  confirmBold: { fontWeight: "700", color: colors.textPalette.primary },
  confirmYes: {
    paddingVertical: spacing[1],
    paddingHorizontal: spacing[3],
    borderRadius: radius.sm,
    backgroundColor: colors.error,
  },
  confirmYesText: { fontSize: typography.size.sm, fontWeight: "700", color: colors.white },
  confirmNo: {
    paddingVertical: spacing[1],
    paddingHorizontal: spacing[3],
    borderRadius: radius.sm,
    backgroundColor: colors.bg.overlay,
  },
  confirmNoText: { fontSize: typography.size.sm, fontWeight: "600", color: colors.textPalette.secondary },

  divider: {
    height: 1,
    backgroundColor: colors.borderPalette.muted,
    marginHorizontal: spacing.md,
  },

  // Empty state
  emptyState: { alignItems: "center", paddingVertical: spacing["2xl"], gap: spacing[3] },
  emptyTitle: { ...typography.styles.h3, color: colors.textPalette.secondary },
  emptyHint: { ...typography.styles.bodySmall, textAlign: "center" },
});
