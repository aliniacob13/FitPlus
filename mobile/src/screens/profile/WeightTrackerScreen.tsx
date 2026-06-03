import { useState, useMemo, useEffect, useCallback } from "react";
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { LineChart } from "react-native-chart-kit";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Loader } from "@/components/ui/Loader";
import { Screen } from "@/components/ui/Screen";
import { colors, radius, spacing, typography } from "@/constants/theme";
import { userApi, WeightLogEntry } from "@/services/userApi";
import { useUserStore } from "@/store/userStore";
import { AppStackParamList } from "@/types/navigation";

type NavProp = NativeStackNavigationProp<AppStackParamList, "WeightTracker">;

const formatDate = (isoString: string): string => {
  const d = new Date(isoString);
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
};

const formatShortDate = (isoString: string): string => {
  const d = new Date(isoString);
  return `${d.getMonth() + 1}/${d.getDate()}`;
};

export const WeightTrackerScreen = () => {
  const navigation = useNavigation<NavProp>();
  const fetchMe = useUserStore((state) => state.fetchMe);
  const [entries, setEntries] = useState<WeightLogEntry[]>([]);
  const [newWeight, setNewWeight] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);

  const screenWidth = Dimensions.get("window").width - 40;

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const data = await userApi.getWeightLog();
      setEntries(data);
    } catch {
      setFetchError("Could not load weight logs. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchLogs();
  }, [fetchLogs]);

  const sortedEntries = useMemo(
    () => [...entries].sort((a, b) => new Date(a.logged_at).getTime() - new Date(b.logged_at).getTime()),
    [entries],
  );

  const chartData = useMemo(() => ({
    labels: sortedEntries.map((e) => formatShortDate(e.logged_at)),
    datasets: [
      {
        data: sortedEntries.length > 0 ? sortedEntries.map((e) => e.weight_kg) : [0],
        color: (opacity = 1) => `rgba(197, 241, 53, ${opacity})`,
        strokeWidth: 2,
      },
    ],
  }), [sortedEntries]);

  const chartConfig = {
    backgroundColor: colors.bg.elevated,
    backgroundGradientFrom: colors.bg.elevated,
    backgroundGradientTo: colors.bg.elevated,
    decimalPlaces: 1,
    color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(154, 154, 154, ${opacity})`,
    style: { borderRadius: radius.md },
    propsForDots: { r: "4", strokeWidth: "2", stroke: colors.accent.base },
  };

  const stats = useMemo(() => {
    if (sortedEntries.length === 0) return null;
    const weights = sortedEntries.map((e) => e.weight_kg);
    const current = weights[weights.length - 1]!;
    const change = current - weights[0]!;
    const min = Math.min(...weights);
    const max = Math.max(...weights);
    const avg = weights.reduce((s, w) => s + w, 0) / weights.length;
    return { current, change, min, max, avg, count: weights.length };
  }, [sortedEntries]);

  const handleAdd = async () => {
    const weight = parseFloat(newWeight);
    if (!weight || weight <= 0 || weight > 300) {
      setAddError("Please enter a valid weight between 0.1 and 300 kg.");
      return;
    }
    setSaving(true);
    setAddError(null);
    try {
      await userApi.addWeightLog({ weight_kg: weight });
      await fetchLogs();
      void fetchMe();
      setNewWeight("");
      setShowAddForm(false);
    } catch {
      setAddError("Could not save weight. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDelete = async (entry: WeightLogEntry) => {
    setPendingDeleteId(null);
    setDeleteError(null);
    // Optimistic: remove from local state immediately
    const prev = entries;
    setEntries((current) => current.filter((e) => e.id !== entry.id));
    try {
      await userApi.deleteWeightLog(entry.id);
    } catch {
      // Rollback on failure
      setEntries(prev);
      setDeleteError("Could not delete entry. Please try again.");
    }
  };

  return (
    <Screen scrollable={false} title="Weight Tracker">
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>

        {loading ? (
          <Loader />
        ) : fetchError ? (
          <Card variant="default" padding="md">
            <Text style={styles.errorText}>{fetchError}</Text>
            <Button label="Retry" onPress={fetchLogs} variant="outline" fullWidth />
          </Card>
        ) : null}

        {deleteError ? (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle-outline" size={15} color={colors.error} />
            <Text style={styles.errorBannerText}>{deleteError}</Text>
            <TouchableOpacity onPress={() => setDeleteError(null)}>
              <Ionicons name="close" size={15} color={colors.error} />
            </TouchableOpacity>
          </View>
        ) : null}

        {/* Stats */}
        {stats && (
          <Card variant="default" padding="md">
            <View style={styles.statsGrid}>
              <StatBox label="Current" value={`${stats.current.toFixed(1)} kg`} />
              <StatBox
                label="Change"
                value={`${stats.change >= 0 ? "+" : ""}${stats.change.toFixed(1)} kg`}
                valueColor={stats.change === 0 ? undefined : stats.change < 0 ? colors.success : colors.error}
              />
              <StatBox label="Avg" value={`${stats.avg.toFixed(1)} kg`} />
            </View>
            <View style={[styles.statsGrid, { marginTop: spacing[2] }]}>
              <StatBox label="Min" value={`${stats.min.toFixed(1)} kg`} />
              <StatBox label="Max" value={`${stats.max.toFixed(1)} kg`} />
              <StatBox label="Entries" value={String(stats.count)} />
            </View>
          </Card>
        )}

        {/* Chart */}
        <Card variant="default" padding="md">
          <Text style={styles.chartTitle}>Weight Progress</Text>
          {sortedEntries.length >= 2 ? (
            <LineChart
              data={chartData}
              width={screenWidth}
              height={200}
              chartConfig={chartConfig}
              bezier
              style={styles.chart}
              withHorizontalLines
              withVerticalLines={false}
            />
          ) : (
            <View style={styles.emptyChart}>
              <Ionicons name="analytics-outline" size={40} color={colors.textPalette.muted} />
              <Text style={styles.emptyChartText}>
                {sortedEntries.length === 0
                  ? "No data yet"
                  : "Log at least 2 entries to see the chart"}
              </Text>
            </View>
          )}
        </Card>

        {/* Add form */}
        {!showAddForm ? (
          <Button
            label="+ Log Weight"
            onPress={() => { setShowAddForm(true); setAddError(null); }}
            variant="outline"
            fullWidth
          />
        ) : (
          <Card variant="elevated" padding="md">
            <Text style={styles.formTitle}>Log today's weight</Text>
            <Input
              label="Weight (kg)"
              value={newWeight}
              onChangeText={(v) => { setNewWeight(v); setAddError(null); }}
              placeholder="e.g. 72.5"
              keyboardType="numeric"
            />
            {addError ? (
              <Text style={styles.inlineError}>{addError}</Text>
            ) : null}
            <View style={styles.btnRow}>
              <Button label="Save" onPress={handleAdd} loading={saving} />
              <Button
                label="Cancel"
                onPress={() => { setShowAddForm(false); setNewWeight(""); setAddError(null); }}
                variant="ghost"
              />
            </View>
          </Card>
        )}

        {/* History list */}
        {!loading && entries.length > 0 && (
          <Card variant="default" title="History" padding="none">
            {[...entries]
              .sort((a, b) => new Date(b.logged_at).getTime() - new Date(a.logged_at).getTime())
              .slice(0, 20)
              .map((entry, idx, arr) => (
                <View key={entry.id}>
                  {pendingDeleteId === entry.id ? (
                    <View style={styles.confirmRow}>
                      <Text style={styles.confirmText}>
                        Delete <Text style={styles.confirmBold}>{entry.weight_kg.toFixed(1)} kg</Text>?
                      </Text>
                      <TouchableOpacity
                        onPress={() => void handleConfirmDelete(entry)}
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
                      <View style={styles.historyLeft}>
                        <Ionicons name="scale-outline" size={14} color={colors.textPalette.muted} />
                        <Text style={styles.historyDate}>{formatDate(entry.logged_at)}</Text>
                      </View>
                      <Text style={styles.historyWeight}>{entry.weight_kg.toFixed(1)} kg</Text>
                      <TouchableOpacity
                        onPress={() => setPendingDeleteId(entry.id)}
                        style={styles.deleteBtn}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      >
                        <Ionicons name="trash-outline" size={16} color={colors.error} />
                      </TouchableOpacity>
                    </View>
                  )}
                  {idx < arr.length - 1 && <View style={styles.divider} />}
                </View>
              ))}
          </Card>
        )}

        {!loading && entries.length === 0 && !fetchError && (
          <View style={styles.emptyState}>
            <Ionicons name="scale-outline" size={48} color={colors.textPalette.muted} />
            <Text style={styles.emptyTitle}>No entries yet</Text>
            <Text style={styles.emptyHint}>Tap "+ Log Weight" to record your first measurement.</Text>
          </View>
        )}

        <Button label="Back to Profile" onPress={() => navigation.goBack()} variant="ghost" fullWidth />
      </ScrollView>
    </Screen>
  );
};

const StatBox = ({
  label,
  value,
  valueColor,
}: {
  label: string;
  value: string;
  valueColor?: string;
}) => (
  <View style={statBoxStyles.box}>
    <Text style={[statBoxStyles.value, valueColor ? { color: valueColor } : undefined]}>{value}</Text>
    <Text style={statBoxStyles.label}>{label}</Text>
  </View>
);

const statBoxStyles = StyleSheet.create({
  box: { flex: 1, alignItems: "center" },
  value: { fontSize: typography.size.lg, fontWeight: "700", color: colors.textPalette.primary },
  label: { ...typography.styles.caption, marginTop: 2 },
});

const styles = StyleSheet.create({
  container: { gap: spacing.md, paddingBottom: spacing["2xl"] },
  title: {
    fontSize: 26,
    fontWeight: "700",
    color: colors.textPalette.primary,
    marginTop: spacing[3],
  },
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
  errorBannerText: { flex: 1, color: colors.error, fontWeight: "600", fontSize: typography.size.sm },
  inlineError: { color: colors.error, fontSize: typography.size.sm, marginTop: spacing[1] },
  statsGrid: { flexDirection: "row", justifyContent: "space-between" },
  chartTitle: { ...typography.styles.h3, textAlign: "center", marginBottom: spacing.md },
  chart: { marginVertical: spacing[2], borderRadius: radius.md },
  emptyChart: {
    height: 180,
    justifyContent: "center",
    alignItems: "center",
    gap: spacing[3],
  },
  emptyChartText: { ...typography.styles.bodySmall, textAlign: "center" },
  formTitle: { ...typography.styles.h3, marginBottom: spacing.md },
  btnRow: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.md },
  historyRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing[3],
    gap: spacing[3],
  },
  historyLeft: { flex: 1, flexDirection: "row", alignItems: "center", gap: spacing[2] },
  historyDate: { ...typography.styles.bodySmall, color: colors.textPalette.secondary },
  historyWeight: {
    fontSize: typography.size.base,
    fontWeight: "700",
    color: colors.textPalette.primary,
    marginRight: spacing[2],
  },
  deleteBtn: { padding: spacing[1] },
  // Inline confirmation
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
  divider: { height: 1, backgroundColor: colors.borderPalette.muted, marginHorizontal: spacing.md },
  emptyState: { alignItems: "center", paddingVertical: spacing["2xl"], gap: spacing[3] },
  emptyTitle: { ...typography.styles.h3, color: colors.textPalette.secondary },
  emptyHint: { ...typography.styles.bodySmall, textAlign: "center" },
});
