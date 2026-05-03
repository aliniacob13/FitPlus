import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
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
import type { LabelScanResult } from "@/services/nutritionApi";
import { nutritionApi } from "@/services/nutritionApi";
import { useFoodDiaryStore } from "@/store/foodDiaryStore";
import { AppStackParamList } from "@/types/navigation";
import { formatApiError } from "@/utils/apiErrors";

type NavProp = NativeStackNavigationProp<AppStackParamList, "LabelScan">;
type RoutePropType = RouteProp<AppStackParamList, "LabelScan">;

interface EditedValues {
  name: string;
  grams: string;
  kcal: string;
  protein_g: string;
  carbs_g: string;
  fat_g: string;
}

const toField = (v: number | null): string => (v != null ? String(Math.round(v)) : "");

const imagePickerOptions: ImagePicker.ImagePickerOptions = {
  mediaTypes: ImagePicker.MediaTypeOptions.Images,
  quality: 0.85,
  ...(Platform.OS === "ios"
    ? { preferredAssetRepresentationMode: ImagePicker.UIImagePickerPreferredAssetRepresentationMode.Compatible }
    : {}),
};

export const LabelScanScreen = () => {
  const navigation = useNavigation<NavProp>();
  const route = useRoute<RoutePropType>();
  const { date } = route.params;

  const saving = useFoodDiaryStore((s) => s.saving);
  const addEntry = useFoodDiaryStore((s) => s.addEntry);

  const [imageUri, setImageUri] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<LabelScanResult | null>(null);
  const [edited, setEdited] = useState<EditedValues>({
    name: "Scanned Food",
    grams: "100",
    kcal: "",
    protein_g: "",
    carbs_g: "",
    fat_g: "",
  });

  const set = (field: keyof EditedValues) => (v: string) =>
    setEdited((prev) => ({ ...prev, [field]: v }));

  const pickImage = async (useCamera: boolean) => {
    if (useCamera) {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission needed", "Camera access is required to scan labels.");
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
      setScanResult(null);
      await runScan(uri, asset.mimeType ?? undefined);
    }
  };

  const runScan = async (uri: string, mimeType?: string) => {
    setScanning(true);
    try {
      const { data } = await nutritionApi.scanLabel(uri, mimeType);
      setScanResult(data);
      setEdited({
        name: "Scanned Food",
        grams: data.serving_size_g != null ? String(data.serving_size_g) : "100",
        kcal: toField(data.kcal),
        protein_g: toField(data.protein_g),
        carbs_g: toField(data.carbs_g),
        fat_g: toField(data.fat_g),
      });
    } catch (err) {
      Alert.alert("Scan failed", formatApiError(err));
    } finally {
      setScanning(false);
    }
  };

  const handleAdd = async () => {
    const g = Number(edited.grams);
    if (!edited.name.trim() || !g || g <= 0) return;
    const success = await addEntry({
      date,
      name: edited.name.trim(),
      grams: g,
      kcal: Number(edited.kcal) || 0,
      protein_g: Number(edited.protein_g) || 0,
      carbs_g: Number(edited.carbs_g) || 0,
      fat_g: Number(edited.fat_g) || 0,
      source: "label_scan",
    });
    if (success) navigation.goBack();
  };

  const confidenceColor =
    scanResult == null
      ? colors.textPalette.muted
      : scanResult.confidence >= 0.75
      ? colors.accent.base
      : scanResult.confidence >= 0.5
      ? colors.warning
      : colors.error;

  const canAdd = edited.name.trim().length > 0 && Number(edited.grams) > 0;

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Scan Label</Text>
        <Text style={styles.dateLabel}>{date}</Text>

        {/* Pick image row */}
        <View style={styles.pickRow}>
          <TouchableOpacity
            style={styles.pickBtn}
            onPress={() => void pickImage(true)}
            disabled={scanning}
          >
            <Text style={styles.pickBtnText}>Take Photo</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.pickBtn}
            onPress={() => void pickImage(false)}
            disabled={scanning}
          >
            <Text style={styles.pickBtnText}>Choose from Library</Text>
          </TouchableOpacity>
        </View>

        {/* Preview */}
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.preview} resizeMode="contain" />
        ) : (
          <View style={styles.placeholder}>
            <Text style={styles.placeholderText}>No image selected — take a photo or choose from library</Text>
          </View>
        )}

        {scanning && (
          <View style={styles.scanningRow}>
            <ActivityIndicator color={colors.accent.base} />
            <Text style={styles.scanningText}>Reading label…</Text>
          </View>
        )}

        {/* Parsed results */}
        {scanResult != null && !scanning && (
          <Card variant="elevated" padding="md">
            <View style={styles.confidenceRow}>
              <Text style={styles.confidenceLabel}>Parse confidence</Text>
              <Text style={[styles.confidenceValue, { color: confidenceColor }]}>
                {Math.round(scanResult.confidence * 100)}%
              </Text>
            </View>

            {scanResult.confidence < 0.5 && (
              <Text style={styles.lowConfidenceHint}>
                Low confidence — fill in the missing values manually before adding.
              </Text>
            )}

            {scanResult.per_100g && (
              <Text style={styles.per100gHint}>
                Values detected per 100g — adjust serving size to match your portion.
              </Text>
            )}

            <Text style={styles.sectionLabel}>Review and edit before saving</Text>

            <Input
              label="Food name"
              value={edited.name}
              onChangeText={set("name")}
              autoCapitalize="words"
            />
            <Input
              label="Serving size (g)"
              value={edited.grams}
              onChangeText={set("grams")}
              keyboardType="numeric"
            />
            <Input
              label="Calories (kcal)"
              value={edited.kcal}
              onChangeText={set("kcal")}
              keyboardType="numeric"
              placeholder="—"
            />
            <Input
              label="Protein (g)"
              value={edited.protein_g}
              onChangeText={set("protein_g")}
              keyboardType="numeric"
              placeholder="—"
            />
            <Input
              label="Carbs (g)"
              value={edited.carbs_g}
              onChangeText={set("carbs_g")}
              keyboardType="numeric"
              placeholder="—"
            />
            <Input
              label="Fat (g)"
              value={edited.fat_g}
              onChangeText={set("fat_g")}
              keyboardType="numeric"
              placeholder="—"
            />

            <Button
              label="Add to Diary"
              onPress={() => void handleAdd()}
              loading={saving}
              disabled={!canAdd}
              fullWidth
            />
          </Card>
        )}

        <Text style={styles.disclaimer}>
          Estimates only — not medical advice. Always verify values from the original label.
        </Text>

        <Button label="Cancel" onPress={() => navigation.goBack()} variant="ghost" fullWidth />
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
    height: 220,
    borderRadius: radius.md,
    backgroundColor: colors.bg.elevated,
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
  scanningRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },
  scanningText: {
    ...typography.styles.bodySmall,
    color: colors.accent.base,
  },
  confidenceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  confidenceLabel: {
    ...typography.styles.label,
  },
  confidenceValue: {
    fontSize: typography.size.xl,
    fontWeight: "800",
  },
  lowConfidenceHint: {
    ...typography.styles.caption,
    color: colors.error,
    marginBottom: spacing.sm,
  },
  per100gHint: {
    ...typography.styles.caption,
    color: colors.warning,
    marginBottom: spacing.sm,
  },
  sectionLabel: {
    ...typography.styles.caption,
    marginBottom: spacing.xs,
  },
  disclaimer: {
    ...typography.styles.caption,
    textAlign: "center",
    color: colors.textPalette.muted,
    paddingHorizontal: spacing.md,
  },
});