import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Screen } from "@/components/ui/Screen";
import { colors, radius, spacing, typography } from "@/constants/theme";
import type { FoodSearchResultItem } from "@/services/nutritionApi";
import { nutritionApi } from "@/services/nutritionApi";
import { useFoodDiaryStore } from "@/store/foodDiaryStore";
import { formatApiError } from "@/utils/apiErrors";
import { AppStackParamList } from "@/types/navigation";

type NavProp = NativeStackNavigationProp<AppStackParamList, "AddFood">;
type RoutePropType = RouteProp<AppStackParamList, "AddFood">;

const round2 = (n: number) => Math.round(n * 100) / 100;

const computeFromPer100g = (per100g: FoodSearchResultItem["per_100g"], grams: number) => ({
  kcal: round2((per100g.kcal * grams) / 100),
  protein_g: round2((per100g.protein_g * grams) / 100),
  carbs_g: round2((per100g.carbs_g * grams) / 100),
  fat_g: round2((per100g.fat_g * grams) / 100),
});

type Mode = "search" | "manual";

export const AddFoodScreen = () => {
  const navigation = useNavigation<NavProp>();
  const route = useRoute<RoutePropType>();
  const { date } = route.params;

  const saving = useFoodDiaryStore((s) => s.saving);
  const addEntry = useFoodDiaryStore((s) => s.addEntry);

  const [mode, setMode] = useState<Mode>("search");

  // — Search state
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<FoodSearchResultItem[]>([]);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [selected, setSelected] = useState<FoodSearchResultItem | null>(null);
  const [grams, setGrams] = useState("100");

  // — Manual state
  const [manualName, setManualName] = useState("");
  const [manualGrams, setManualGrams] = useState("");
  const [manualKcal, setManualKcal] = useState("");
  const [manualProtein, setManualProtein] = useState("");
  const [manualCarbs, setManualCarbs] = useState("");
  const [manualFat, setManualFat] = useState("");

  const handleSearch = async () => {
    if (!query.trim()) return;
    setSearching(true);
    setSearchError(null);
    setSelected(null);
    try {
      const { data } = await nutritionApi.searchFoods(query.trim());
      setResults(data);
      if (data.length === 0) setSearchError("No results found. Try a different term.");
    } catch (err) {
      setSearchError(formatApiError(err, "Search failed."));
    } finally {
      setSearching(false);
    }
  };

  const handleAddFromSearch = async () => {
    if (!selected) return;
    const g = Number(grams);
    if (!g || g <= 0) return;
    const macros = computeFromPer100g(selected.per_100g, g);
    const success = await addEntry({
      date,
      name: selected.name,
      grams: g,
      ...macros,
      source: "search",
      external_id: selected.external_id,
    });
    if (success) navigation.goBack();
  };

  const handleAddManual = async () => {
    const g = Number(manualGrams);
    if (!manualName.trim() || !g || g <= 0) return;
    const success = await addEntry({
      date,
      name: manualName.trim(),
      grams: g,
      kcal: Number(manualKcal) || 0,
      protein_g: Number(manualProtein) || 0,
      carbs_g: Number(manualCarbs) || 0,
      fat_g: Number(manualFat) || 0,
      source: "manual",
    });
    if (success) navigation.goBack();
  };

  const selectedGrams = Number(grams) || 0;
  const preview = selected ? computeFromPer100g(selected.per_100g, selectedGrams) : null;

  return (
    <Screen scrollable={false}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Add Food</Text>
        <Text style={styles.dateLabel}>{date}</Text>

        {/* Mode switcher */}
        <View style={styles.modeRow}>
          {(["search", "manual"] as Mode[]).map((m) => (
            <Pressable
              key={m}
              onPress={() => setMode(m)}
              style={[styles.modeChip, mode === m && styles.modeChipActive]}
            >
              <Text style={[styles.modeChipLabel, mode === m && styles.modeChipLabelActive]}>
                {m === "search" ? "Search Database" : "Manual Entry"}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Label scan shortcut */}
        <TouchableOpacity
          style={styles.scanShortcut}
          onPress={() => navigation.navigate("LabelScan", { date })}
        >
          <Text style={styles.scanShortcutText}>Scan Nutrition Label</Text>
        </TouchableOpacity>

        {mode === "search" ? (
          <>
            {/* Search bar */}
            <View style={styles.searchRow}>
              <TextInput
                style={styles.searchInput}
                value={query}
                onChangeText={setQuery}
                placeholder="e.g. chicken breast, apple..."
                placeholderTextColor={colors.textPalette.muted}
                returnKeyType="search"
                onSubmitEditing={() => void handleSearch()}
                autoCapitalize="none"
              />
              <TouchableOpacity
                style={styles.searchBtn}
                onPress={() => void handleSearch()}
                disabled={searching}
              >
                {searching ? (
                  <ActivityIndicator color={colors.textPalette.inverse} size="small" />
                ) : (
                  <Text style={styles.searchBtnText}>Search</Text>
                )}
              </TouchableOpacity>
            </View>

            {searchError ? <Text style={styles.hint}>{searchError}</Text> : null}

            {/* Results */}
            {results.length > 0 && !selected ? (
              <Card variant="default" padding="none">
                {results.slice(0, 15).map((item, idx) => (
                  <View key={item.external_id}>
                    <TouchableOpacity
                      style={styles.resultRow}
                      onPress={() => {
                        setSelected(item);
                        setGrams("100");
                      }}
                    >
                      <View style={styles.resultInfo}>
                        <Text style={styles.resultName} numberOfLines={2}>
                          {item.name}
                        </Text>
                        <Text style={styles.resultSub}>
                          per 100g · {Math.round(item.per_100g.kcal)} kcal · P{" "}
                          {Math.round(item.per_100g.protein_g)}g
                        </Text>
                      </View>
                      <Text style={styles.selectText}>Select</Text>
                    </TouchableOpacity>
                    {idx < results.length - 1 && <View style={styles.divider} />}
                  </View>
                ))}
              </Card>
            ) : null}

            {/* Selected food — grams input + preview */}
            {selected ? (
              <Card variant="elevated" padding="md">
                <View style={styles.selectedHeader}>
                  <Text style={styles.selectedName} numberOfLines={2}>
                    {selected.name}
                  </Text>
                  <TouchableOpacity onPress={() => setSelected(null)}>
                    <Text style={styles.changeText}>Change</Text>
                  </TouchableOpacity>
                </View>

                <Input
                  label="Serving size (g)"
                  value={grams}
                  onChangeText={setGrams}
                  placeholder="100"
                  keyboardType="numeric"
                />

                {preview && selectedGrams > 0 ? (
                  <View style={styles.previewRow}>
                    <PreviewChip label="Kcal" value={Math.round(preview.kcal)} color={colors.accent.base} />
                    <PreviewChip label="Protein" value={Math.round(preview.protein_g)} color={colors.info} unit="g" />
                    <PreviewChip label="Carbs" value={Math.round(preview.carbs_g)} color={colors.warning} unit="g" />
                    <PreviewChip label="Fat" value={Math.round(preview.fat_g)} color={colors.error} unit="g" />
                  </View>
                ) : null}

                <Button
                  label="Add to Diary"
                  onPress={() => void handleAddFromSearch()}
                  loading={saving}
                  disabled={!selectedGrams || selectedGrams <= 0}
                  fullWidth
                />
              </Card>
            ) : null}
          </>
        ) : (
          /* Manual entry form */
          <Card variant="elevated" padding="md">
            <Input label="Food name" value={manualName} onChangeText={setManualName} placeholder="e.g. Oatmeal" autoCapitalize="words" />
            <Input label="Grams" value={manualGrams} onChangeText={setManualGrams} placeholder="150" keyboardType="numeric" />
            <Input label="Calories (kcal)" value={manualKcal} onChangeText={setManualKcal} placeholder="0" keyboardType="numeric" />
            <Input label="Protein (g)" value={manualProtein} onChangeText={setManualProtein} placeholder="0" keyboardType="numeric" />
            <Input label="Carbs (g)" value={manualCarbs} onChangeText={setManualCarbs} placeholder="0" keyboardType="numeric" />
            <Input label="Fat (g)" value={manualFat} onChangeText={setManualFat} placeholder="0" keyboardType="numeric" />
            <Button
              label="Add to Diary"
              onPress={() => void handleAddManual()}
              loading={saving}
              disabled={!manualName.trim() || !manualGrams.trim()}
              fullWidth
            />
          </Card>
        )}

        <Button label="Cancel" onPress={() => navigation.goBack()} variant="ghost" fullWidth />
      </ScrollView>
    </Screen>
  );
};

const PreviewChip = ({
  label,
  value,
  color,
  unit = "",
}: {
  label: string;
  value: number;
  color: string;
  unit?: string;
}) => (
  <View style={styles.previewChip}>
    <Text style={[styles.previewValue, { color }]}>
      {value}
      {unit}
    </Text>
    <Text style={styles.previewLabel}>{label}</Text>
  </View>
);

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
  dateLabel: {
    ...typography.styles.bodySmall,
    marginTop: -spacing.sm,
  },
  modeRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  modeChip: {
    flex: 1,
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[3],
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderPalette.default,
    backgroundColor: colors.bg.elevated,
    alignItems: "center",
  },
  modeChipActive: {
    borderColor: colors.accent.base,
    backgroundColor: colors.accent.muted,
  },
  modeChipLabel: {
    fontSize: typography.size.sm,
    fontWeight: "600",
    color: colors.textPalette.secondary,
  },
  modeChipLabelActive: {
    color: colors.accent.base,
  },
  scanShortcut: {
    borderWidth: 1,
    borderColor: colors.accent.base,
    borderRadius: radius.md,
    paddingVertical: spacing[2],
    alignItems: "center",
    backgroundColor: colors.bg.elevated,
  },
  scanShortcutText: {
    color: colors.accent.base,
    fontWeight: "600",
    fontSize: typography.size.sm,
  },
  searchRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    height: 48,
    borderWidth: 1,
    borderColor: colors.borderPalette.default,
    backgroundColor: colors.bg.elevated,
    borderRadius: radius.md,
    color: colors.textPalette.primary,
    paddingHorizontal: spacing.md,
    fontSize: typography.size.base,
  },
  searchBtn: {
    height: 48,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.accent.base,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 80,
  },
  searchBtnText: {
    color: colors.textPalette.inverse,
    fontWeight: "700",
    fontSize: typography.size.sm,
  },
  hint: {
    ...typography.styles.caption,
    textAlign: "center",
  },
  resultRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing[3],
    gap: spacing[3],
  },
  resultInfo: {
    flex: 1,
  },
  resultName: {
    fontSize: typography.size.base,
    fontWeight: "600",
    color: colors.textPalette.primary,
  },
  resultSub: {
    ...typography.styles.caption,
    marginTop: 2,
  },
  selectText: {
    color: colors.accent.base,
    fontWeight: "700",
    fontSize: typography.size.sm,
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderPalette.muted,
    marginHorizontal: spacing.md,
  },
  selectedHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: spacing.md,
  },
  selectedName: {
    ...typography.styles.h3,
    flex: 1,
    marginRight: spacing[3],
  },
  changeText: {
    color: colors.accent.base,
    fontSize: typography.size.sm,
    fontWeight: "700",
  },
  previewRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: spacing.md,
    paddingVertical: spacing[3],
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.borderPalette.muted,
  },
  previewChip: {
    alignItems: "center",
    flex: 1,
  },
  previewValue: {
    fontSize: typography.size.lg,
    fontWeight: "800",
  },
  previewLabel: {
    ...typography.styles.label,
    marginTop: 2,
  },
});
