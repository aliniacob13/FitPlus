import { useState, useMemo, useEffect } from "react";
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Screen } from "@/components/ui/Screen";
import { colors, radius, spacing, typography } from "@/constants/theme";
import { LineChart } from "react-native-chart-kit";
import { AppStackParamList } from "@/types/navigation";
import { useAuthStore } from "@/store/authStore";

type NavProp = NativeStackNavigationProp<AppStackParamList, "MainTabs">;

type WeightEntry = {
  date: string;
  weight: number;
};

export const WeightTrackerScreen = () => {
  const navigation = useNavigation<NavProp>();
  const { accessToken } = useAuthStore();
  const [weightEntries, setWeightEntries] = useState<WeightEntry[]>([]);
  const [newWeight, setNewWeight] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchWeightLogs();
  }, []);

  const fetchWeightLogs = async () => {
    if (!accessToken) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const API_BASE_URL = "http://172.20.10.4:8000/api/v1";
      const response = await fetch(`${API_BASE_URL}/users/me/weight-log`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const transformedData = data.map((item: any) => ({
        date: item.logged_at.split('T')[0], // Get date part only
        weight: item.weight_kg,
      }));
      
      setWeightEntries(transformedData);
    } catch (err) {
      setError("Nu am putut încărca înregistrările de greutate. Încercați din nou.");
      console.error("Error fetching weight logs:", err);
    } finally {
      setLoading(false);
    }
  };

  const screenWidth = Dimensions.get("window").width - 40;

  const chartData = useMemo(() => {
    const sortedEntries = [...weightEntries].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    return {
      labels: sortedEntries.map(entry => {
        const date = new Date(entry.date);
        return `${date.getMonth() + 1}/${date.getDate()}`;
      }),
      datasets: [
        {
          data: sortedEntries.map(entry => entry.weight),
          color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
          strokeWidth: 2,
        },
      ],
    };
  }, [weightEntries]);

  const chartConfig = {
    backgroundColor: colors.bg.elevated,
    backgroundGradientFrom: colors.bg.elevated,
    backgroundGradientTo: colors.bg.elevated,
    decimalPlaces: 1,
    color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
    style: {
      borderRadius: radius.md,
    },
    propsForDots: {
      r: "4",
      strokeWidth: "2",
      stroke: colors.accent.base,
    },
  };

  const handleAddWeight = async () => {
    const weight = parseFloat(newWeight);
    if (!weight || weight <= 0 || weight > 300) {
      Alert.alert("Eroare", "Introducți o greutate validă (între 0.1 și 300 kg)");
      return;
    }

    if (!accessToken) {
      Alert.alert("Eroare", "Nu sunteți autentificat");
      return;
    }

    setSaving(true);
    
    try {
      const API_BASE_URL = "http://172.20.10.4:8000/api/v1";
      const response = await fetch(`${API_BASE_URL}/users/me/weight-log`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ weight_kg: weight }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Refresh the weight logs after adding new entry
      await fetchWeightLogs();
      setNewWeight("");
      setShowAddForm(false);
      
      Alert.alert("Succes", "Greutatea a fost înregistrată!");
    } catch (error) {
      console.error('Error adding weight:', error);
      Alert.alert("Eroare", "Nu am putut salva greutatea. Încercați din nou.");
    } finally {
      setSaving(false);
    }
  };

  const weightStats = useMemo(() => {
    if (weightEntries.length === 0) return null;
    
    const weights = weightEntries.map(entry => entry.weight);
    const current = weights[weights.length - 1];
    const start = weights[0];
    const change = current - start;
    const min = Math.min(...weights);
    const max = Math.max(...weights);
    const avg = weights.reduce((sum, w) => sum + w, 0) / weights.length;

    return { current, start, change, min, max, avg };
  }, [weightEntries]);

  return (
    <Screen scrollable={false}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Progres Greutate</Text>

        {loading && (
          <Card variant="default" padding="md">
            <Text style={styles.loadingText}>Se încarcă datele...</Text>
          </Card>
        )}

        {error && (
          <Card variant="default" padding="md">
            <Text style={styles.errorText}>{error}</Text>
            <Button
              label="Reîncearcă"
              onPress={fetchWeightLogs}
              variant="outline"
              fullWidth
            />
          </Card>
        )}

        {!loading && !error && weightStats && (
          <Card variant="default" padding="md">
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Actual</Text>
                <Text style={styles.statValue}>{weightStats.current.toFixed(1)} kg</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Schimbare</Text>
                <Text style={[
                  styles.statValue,
                  weightStats.change >= 0 ? styles.positive : styles.negative
                ]}>
                  {weightStats.change >= 0 ? "+" : ""}{weightStats.change.toFixed(1)} kg
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Medie</Text>
                <Text style={styles.statValue}>{weightStats.avg.toFixed(1)} kg</Text>
              </View>
            </View>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Min</Text>
                <Text style={styles.statValue}>{weightStats.min.toFixed(1)} kg</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Max</Text>
                <Text style={styles.statValue}>{weightStats.max.toFixed(1)} kg</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Înregistrări</Text>
                <Text style={styles.statValue}>{weightEntries.length}</Text>
              </View>
            </View>
          </Card>
        )}

        <Card variant="default" padding="md">
          <Text style={styles.chartTitle}>Evoluția Greutății</Text>
          {weightEntries.length > 0 ? (
            <LineChart
              data={chartData}
              width={screenWidth}
              height={220}
              chartConfig={chartConfig}
              bezier
              style={styles.chart}
            />
          ) : (
            <View style={styles.emptyChartContainer}>
              <Text style={styles.emptyChartText}>Nu există date încă</Text>
              <Text style={styles.emptyChartSubtext}>Adaugă prima înregistrare de greutate pentru a vedea graficul</Text>
            </View>
          )}
        </Card>

        {!showAddForm ? (
          <Button
            label="Adaugă Greutate"
            onPress={() => setShowAddForm(true)}
            variant="outline"
            fullWidth
          />
        ) : (
          <Card variant="elevated" padding="md">
            <Input
              label="Greutate (kg)"
              value={newWeight}
              onChangeText={setNewWeight}
              placeholder="Ex: 72.5"
              keyboardType="numeric"
            />
            <View style={styles.buttonRow}>
              <Button
                label="Salvează"
                onPress={handleAddWeight}
                loading={saving}
              />
              <Button
                label="Anulează"
                onPress={() => {
                  setShowAddForm(false);
                  setNewWeight("");
                }}
                variant="ghost"
              />
            </View>
          </Card>
        )}

        <Card variant="default" title="Istoric Înregistrări" padding="md">
          {weightEntries
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 10)
            .map((entry, index) => (
              <View key={`${entry.date}-${index}`}>
                <View style={styles.historyRow}>
                  <Text style={styles.historyDate}>
                    {new Date(entry.date).toLocaleDateString("ro-RO", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </Text>
                  <Text style={styles.historyWeight}>{entry.weight.toFixed(1)} kg</Text>
                </View>
                {index < Math.min(9, weightEntries.length - 1) && (
                  <View style={styles.divider} />
                )}
              </View>
            ))}
        </Card>

        <Button
          label="Înapoi la Profil"
          onPress={() => navigation.goBack()}
          variant="ghost"
          fullWidth
        />
      </ScrollView>
    </Screen>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
    paddingBottom: spacing["2xl"],
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    color: colors.textPalette.primary,
    marginTop: spacing[3],
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: spacing[2],
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  statLabel: {
    ...typography.styles.caption,
    color: colors.textPalette.secondary,
    marginBottom: spacing[1],
  },
  statValue: {
    fontSize: typography.size.lg,
    fontWeight: "700",
    color: colors.textPalette.primary,
  },
  positive: {
    color: colors.success,
  },
  negative: {
    color: colors.error,
  },
  chartTitle: {
    ...typography.styles.h3,
    textAlign: "center",
    marginBottom: spacing.md,
  },
  chart: {
    marginVertical: spacing[2],
    borderRadius: radius.md,
  },
  buttonRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  buttonFlex: {
    flex: 1,
  },
  historyRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing[3],
  },
  historyDate: {
    ...typography.styles.bodySmall,
    color: colors.textPalette.secondary,
    flex: 1,
  },
  historyWeight: {
    fontSize: typography.size.base,
    fontWeight: "700",
    color: colors.textPalette.primary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderPalette.muted,
  },
  loadingText: {
    textAlign: "center",
    color: colors.textPalette.secondary,
    marginBottom: spacing.md,
  },
  errorText: {
    color: colors.error,
    textAlign: "center",
    marginBottom: spacing.md,
  },
  emptyChartContainer: {
    height: 220,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyChartText: {
    fontSize: typography.size.lg,
    fontWeight: "600",
    color: colors.textPalette.secondary,
    textAlign: "center",
    marginBottom: spacing.sm,
  },
  emptyChartSubtext: {
    fontSize: typography.size.sm,
    color: colors.textPalette.muted,
    textAlign: "center",
  },
});
