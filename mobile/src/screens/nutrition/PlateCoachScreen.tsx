import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Screen } from "@/components/ui/Screen";
import { colors, radius, spacing, typography } from "@/constants/theme";
import type {
  ClarificationAnswer,
  PlateAnalysisResponse,
  PlateItem,
} from "@/services/nutritionApi";
import { nutritionApi } from "@/services/nutritionApi";
import { useFoodDiaryStore } from "@/store/foodDiaryStore";
import { AppStackParamList } from "@/types/navigation";
import { formatApiError } from "@/utils/apiErrors";

type NavProp = NativeStackNavigationProp<AppStackParamList, "PlateCoach">;
type RoutePropType = RouteProp<AppStackParamList, "PlateCoach">;

interface EditableItem extends PlateItem {
  selected: boolean;
  editedName: string;
  editedGrams: string;
}

const confidenceColor = (c: number): string => {
  if (c >= 0.75) return colors.accent.base;
  if (c >= 0.5) return colors.warning;
  return colors.error;
};

const pct = (c: number) => `${Math.round(c * 100)}%`;

const imagePickerOptions: ImagePicker.ImagePickerOptions = {
  mediaTypes: ImagePicker.MediaTypeOptions.Images,
  quality: 0.85,
  ...(Platform.OS === "ios"
    ? { preferredAssetRepresentationMode: ImagePicker.UIImagePickerPreferredAssetRepresentationMode.Compatible }
    : {}),
};

export const PlateCoachScreen = () => {
  const navigation = useNavigation<NavProp>();
  const route = useRoute<RoutePropType>();
  const { date } = route.params;

  const saving = useFoodDiaryStore((s) => s.saving);
  const addEntry = useFoodDiaryStore((s) => s.addEntry);

  const [imageUri, setImageUri] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<PlateAnalysisResponse | null>(null);
  const [items, setItems] = useState<EditableItem[]>([]);
  const [clarifyAnswers, setClarifyAnswers] = useState<Record<number, string>>({});
  const [clarifying, setClarifying] = useState(false);

  const pickImage = async (useCamera: boolean) => {
    if (useCamera) {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission needed", "Camera access is required.");
        return;
      }
    } else {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission needed", "Photo library access is required.");
        return;
      }
    }

    const result = useCamera
      ? await ImagePicker.launchCameraAsync(imagePickerOptions)
      : await ImagePicker.launchImageLibraryAsync(imagePickerOptions);

    if (!result.canceled && result.assets.length > 0) {
      const asset = result.assets[0];
      const uri = asset.uri;
      setImageUri(uri);
      setAnalysis(null);
      setItems([]);
      setClarifyAnswers({});
      await runAnalysis(uri, undefined, asset.mimeType ?? undefined);
    }
  };

  const runAnalysis = async (uri: string, existingConvId?: number, mimeType?: string) => {
    setAnalyzing(true);
    try {
      const { data } = await nutritionApi.analyzePlate(uri, existingConvId, mimeType);
      applyAnalysis(data);
    } catch (err) {
      Alert.alert("Analysis failed", formatApiError(err));
    } finally {
      setAnalyzing(false);
    }
  };

  const applyAnalysis = (data: PlateAnalysisResponse) => {
    setAnalysis(data);
    setItems(
      data.items.map((it) => ({
        ...it,
        protein_g_estimate: it.protein_g_estimate ?? 0,
        carbs_g_estimate: it.carbs_g_estimate ?? 0,
        fat_g_estimate: it.fat_g_estimate ?? 0,
        selected: true,
        editedName: it.food_name_estimate,
        editedGrams: String(Math.round(it.grams_estimate)),
      }))
    );
    setClarifyAnswers({});
  };

  const handleClarify = async () => {
    if (!analysis) return;
    const answers: ClarificationAnswer[] = analysis.needs_clarification
      .filter((q) => (clarifyAnswers[q.index] ?? "").trim().length > 0)
      .map((q) => ({ index: q.index, answer: clarifyAnswers[q.index].trim() }));

    if (answers.length === 0) {
      Alert.alert("No answers", "Please fill in at least one clarification before submitting.");
      return;
    }

    setClarifying(true);
    try {
      const { data } = await nutritionApi.clarifyPlate({
        conversation_id: analysis.conversation_id,
        answers,
      });
      applyAnalysis(data);
    } catch (err) {
      Alert.alert("Clarification failed", formatApiError(err));
    } finally {
      setClarifying(false);
    }
  };

  const updateItem = (index: number, field: "editedName" | "editedGrams", value: string) => {
    setItems((prev) =>
      prev.map((it) => (it.index === index ? { ...it, [field]: value } : it))
    );
  };

  const toggleItem = (index: number) => {
    setItems((prev) =>
      prev.map((it) => (it.index === index ? { ...it, selected: !it.selected } : it))
    );
  };

  const handleAddSelected = async () => {
    const selected = items.filter((it) => it.selected);
    if (selected.length === 0) {
      Alert.alert("Nothing selected", "Select at least one item to add.");
      return;
    }

    let allOk = true;
    for (const it of selected) {
      const g = Number(it.editedGrams);
      if (!it.editedName.trim() || !g || g <= 0) continue;
      const baseG = it.grams_estimate > 0 ? it.grams_estimate : g;
      const ratio = g / baseG;
      const ok = await addEntry({
        date,
        name: it.editedName.trim(),
        grams: g,
        kcal: Math.round(it.kcal_estimate * ratio),
        protein_g: Math.round((it.protein_g_estimate ?? 0) * ratio * 10) / 10,
        carbs_g: Math.round((it.carbs_g_estimate ?? 0) * ratio * 10) / 10,
        fat_g: Math.round((it.fat_g_estimate ?? 0) * ratio * 10) / 10,
        source: "plate",
      });
      if (!ok) allOk = false;
    }

    if (allOk) {
      navigation.goBack();
    } else {
      const detail = useFoodDiaryStore.getState().error ?? "Some items could not be saved.";
      Alert.alert("Partial save", detail);
    }
  };

  const selectedCount = items.filter((it) => it.selected).length;
  const hasClarifications = (analysis?.needs_clarification.length ?? 0) > 0;

  const plateMacroPreview = useMemo(() => {
    let kcal = 0;
    let p = 0;
    let c = 0;
    let f = 0;
    for (const it of items) {
      const g = Number(it.editedGrams);
      if (!g || g <= 0) continue;
      const baseG = it.grams_estimate > 0 ? it.grams_estimate : g;
      const ratio = g / baseG;
      kcal += it.kcal_estimate * ratio;
      p += (it.protein_g_estimate ?? 0) * ratio;
      c += (it.carbs_g_estimate ?? 0) * ratio;
      f += (it.fat_g_estimate ?? 0) * ratio;
    }
    return { kcal, p, c, f };
  }, [items]);

  return (
    <Screen scrollable={false}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Plate Coach</Text>
        <Text style={styles.dateLabel}>{date}</Text>

        {/* Image picker */}
        <View style={styles.pickRow}>
          <TouchableOpacity
            style={styles.pickBtn}
            onPress={() => void pickImage(true)}
            disabled={analyzing}
          >
            <Text style={styles.pickBtnText}>Take Photo</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.pickBtn}
            onPress={() => void pickImage(false)}
            disabled={analyzing}
          >
            <Text style={styles.pickBtnText}>Choose from Library</Text>
          </TouchableOpacity>
        </View>

        {/* Preview */}
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.preview} resizeMode="cover" />
        ) : (
          <View style={styles.placeholder}>
            <Text style={styles.placeholderText}>
              Take or upload a photo of your plate — the AI will estimate each food item.
            </Text>
          </View>
        )}

        {analyzing && (
          <View style={styles.loadingRow}>
            <ActivityIndicator color={colors.accent.base} />
            <Text style={styles.loadingText}>Analysing plate…</Text>
          </View>
        )}

        {/* Results */}
        {analysis != null && !analyzing && (
          <>
            {/* Summary card */}
            <Card variant="elevated" padding="md">
              <Text style={styles.sectionTitle}>Analysis</Text>
              <Text style={styles.totalKcal}>
                ~{Math.round(analysis.total_kcal_estimate)} kcal total
              </Text>
              <Text style={styles.macroTotals}>
                Macros (preview for edited grams): P {Math.round(plateMacroPreview.p)}g · C{" "}
                {Math.round(plateMacroPreview.c)}g · F {Math.round(plateMacroPreview.f)}g
              </Text>
              {analysis.assumptions.length > 0 && (
                <Text style={styles.assumptions}>{analysis.assumptions}</Text>
              )}
            </Card>

            {/* Item list */}
            <Text style={styles.sectionTitle}>Detected items — edit before adding</Text>
            {items.map((it) => (
              <ItemCard
                key={it.index}
                item={it}
                onToggle={toggleItem}
                onNameChange={(v) => updateItem(it.index, "editedName", v)}
                onGramsChange={(v) => updateItem(it.index, "editedGrams", v)}
              />
            ))}

            {/* Clarification questions */}
            {hasClarifications && (
              <Card variant="default" padding="md">
                <Text style={styles.clarifyTitle}>Clarification needed</Text>
                <Text style={styles.clarifyHint}>
                  The AI is unsure about some items. Answer below to improve estimates.
                </Text>
                {analysis.needs_clarification.map((q) => (
                  <View key={q.index} style={styles.clarifyQuestion}>
                    <Text style={styles.clarifyQuestionText}>
                      Item {q.index}: {q.question}
                    </Text>
                    <TextInput
                      style={styles.clarifyInput}
                      value={clarifyAnswers[q.index] ?? ""}
                      onChangeText={(v) =>
                        setClarifyAnswers((prev) => ({ ...prev, [q.index]: v }))
                      }
                      placeholder="Your answer…"
                      placeholderTextColor={colors.textPalette.muted}
                    />
                  </View>
                ))}
                <Button
                  label="Submit Clarifications"
                  onPress={() => void handleClarify()}
                  loading={clarifying}
                  fullWidth
                />
              </Card>
            )}

            {/* Add to diary */}
            <Button
              label={
                selectedCount > 0
                  ? `Add ${selectedCount} Item${selectedCount !== 1 ? "s" : ""} to Diary`
                  : "Add to Diary"
              }
              onPress={() => void handleAddSelected()}
              loading={saving}
              disabled={selectedCount === 0}
              fullWidth
            />
          </>
        )}

        <Text style={styles.disclaimer}>{analysis?.disclaimer ?? "Estimates only — not medical advice."}</Text>

        <Button label="Cancel" onPress={() => navigation.goBack()} variant="ghost" fullWidth />
      </ScrollView>
    </Screen>
  );
};

const ItemCard = ({
  item,
  onToggle,
  onNameChange,
  onGramsChange,
}: {
  item: EditableItem;
  onToggle: (index: number) => void;
  onNameChange: (v: string) => void;
  onGramsChange: (v: string) => void;
}) => {
  const g = Number(item.editedGrams);
  const baseG = item.grams_estimate > 0 ? item.grams_estimate : g > 0 ? g : 1;
  const ratio = g > 0 ? g / baseG : 1;
  const previewKcal = Math.round(item.kcal_estimate * ratio);
  const previewP = Math.round((item.protein_g_estimate ?? 0) * ratio);
  const previewC = Math.round((item.carbs_g_estimate ?? 0) * ratio);
  const previewF = Math.round((item.fat_g_estimate ?? 0) * ratio);

  return (
    <Card variant={item.selected ? "elevated" : "default"} padding="md">
      <View style={styles.itemHeader}>
        <TouchableOpacity
          style={[styles.checkbox, item.selected && styles.checkboxSelected]}
          onPress={() => onToggle(item.index)}
        >
          {item.selected && <Text style={styles.checkmark}>✓</Text>}
        </TouchableOpacity>
        <View style={styles.confidenceBadge}>
          <Text style={[styles.confidenceText, { color: confidenceColor(item.confidence) }]}>
            {pct(item.confidence)}
          </Text>
        </View>
      </View>
      <Input
        label="Food item"
        value={item.editedName}
        onChangeText={onNameChange}
        autoCapitalize="sentences"
      />
      <View style={styles.gramsRow}>
        <View style={styles.gramsInput}>
          <Input
            label="Grams"
            value={item.editedGrams}
            onChangeText={onGramsChange}
            keyboardType="numeric"
          />
        </View>
        <View style={styles.kcalBadge}>
          <Text style={styles.kcalBadgeValue}>~{previewKcal} kcal</Text>
        </View>
      </View>
      <Text style={styles.macroLine}>
        P {previewP}g · C {previewC}g · F {previewF}g
      </Text>
    </Card>
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
  dateLabel: {
    ...typography.styles.bodySmall,
    marginTop: -spacing.sm,
  },
  pickRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  pickBtn: {
    flex: 1,
    height: 56,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.accent.base,
    backgroundColor: colors.bg.elevated,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.sm,
  },
  pickBtnText: {
    fontSize: typography.size.sm,
    fontWeight: "600",
    color: colors.accent.base,
    textAlign: "center",
  },
  preview: {
    width: "100%",
    height: 240,
    borderRadius: radius.md,
  },
  placeholder: {
    width: "100%",
    height: 120,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderPalette.muted,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
  },
  placeholderText: {
    ...typography.styles.caption,
    textAlign: "center",
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },
  loadingText: {
    ...typography.styles.bodySmall,
    color: colors.accent.base,
  },
  sectionTitle: {
    ...typography.styles.h3,
    marginBottom: spacing.xs,
  },
  totalKcal: {
    fontSize: typography.size["2xl"],
    fontWeight: "800",
    color: colors.accent.base,
  },
  macroTotals: {
    ...typography.styles.caption,
    marginTop: spacing.xs,
  },
  assumptions: {
    ...typography.styles.caption,
    marginTop: spacing.xs,
  },
  itemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.borderPalette.default,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxSelected: {
    borderColor: colors.accent.base,
    backgroundColor: colors.accent.base,
  },
  checkmark: {
    color: colors.textPalette.inverse,
    fontSize: 14,
    fontWeight: "700",
  },
  confidenceBadge: {
    paddingHorizontal: spacing[2],
    paddingVertical: 2,
    borderRadius: radius.sm,
    backgroundColor: colors.bg.base,
  },
  confidenceText: {
    fontSize: typography.size.sm,
    fontWeight: "700",
  },
  gramsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  gramsInput: {
    flex: 1,
  },
  kcalBadge: {
    paddingTop: spacing.lg,
  },
  kcalBadgeValue: {
    fontSize: typography.size.sm,
    fontWeight: "600",
    color: colors.textPalette.muted,
  },
  macroLine: {
    ...typography.styles.caption,
    marginTop: spacing.sm,
  },
  clarifyTitle: {
    ...typography.styles.h3,
    marginBottom: spacing.xs,
  },
  clarifyHint: {
    ...typography.styles.caption,
    marginBottom: spacing.md,
  },
  clarifyQuestion: {
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  clarifyQuestionText: {
    fontSize: typography.size.sm,
    fontWeight: "600",
    color: colors.textPalette.primary,
  },
  clarifyInput: {
    height: 44,
    borderWidth: 1,
    borderColor: colors.borderPalette.default,
    backgroundColor: colors.bg.elevated,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    color: colors.textPalette.primary,
    fontSize: typography.size.base,
  },
  disclaimer: {
    ...typography.styles.caption,
    textAlign: "center",
    color: colors.textPalette.muted,
    paddingHorizontal: spacing.md,
  },
});