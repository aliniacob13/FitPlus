import { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Screen } from "@/components/ui/Screen";
import { colors, radius, spacing, typography } from "@/constants/theme";
import type { BarcodeScanResult } from "@/services/nutritionApi";
import { nutritionApi } from "@/services/nutritionApi";
import { useFoodDiaryStore } from "@/store/foodDiaryStore";
import { AppStackParamList } from "@/types/navigation";
import { formatApiError } from "@/utils/apiErrors";

type NavProp = NativeStackNavigationProp<AppStackParamList, "BarcodeScan">;
type RoutePropType = RouteProp<AppStackParamList, "BarcodeScan">;

interface EditedValues {
  name: string;
  grams: string;
  kcal: string;
  protein_g: string;
  carbs_g: string;
  fat_g: string;
}

const toField = (v: number | null | undefined): string =>
  v != null ? String(Math.round(v)) : "";

export const BarcodeScanScreen = () => {
  const navigation = useNavigation<NavProp>();
  const route = useRoute<RoutePropType>();
  const { date } = route.params;

  const saving = useFoodDiaryStore((s) => s.saving);
  const addEntry = useFoodDiaryStore((s) => s.addEntry);

  const [permission, requestPermission] = useCameraPermissions();
  // useRef for the scan guard — synchronous update prevents onBarcodeScanned
  // from firing multiple requests before the async setState propagates.
  const scannedRef = useRef(false);
  const [scanned, setScanned] = useState(false);
  const [lookingUp, setLookingUp] = useState(false);
  const [scanResult, setScanResult] = useState<BarcodeScanResult | null>(null);
  const [edited, setEdited] = useState<EditedValues>({
    name: "",
    grams: "100",
    kcal: "",
    protein_g: "",
    carbs_g: "",
    fat_g: "",
  });

  const set = (field: keyof EditedValues) => (v: string) =>
    setEdited((prev) => ({ ...prev, [field]: v }));

  const handleBarcodeScanned = useCallback(
    async ({ data }: { data: string }) => {
      // Ref check is synchronous — prevents duplicate requests when
      // onBarcodeScanned fires multiple times before setState propagates.
      if (scannedRef.current) return;
      scannedRef.current = true;
      setScanned(true);
      setLookingUp(true);
      try {
        const { data: result } = await nutritionApi.scanBarcode(data);
        setScanResult(result);
        setEdited({
          name: result.product_name ?? "",
          grams: "100",
          kcal: toField(result.kcal),
          protein_g: toField(result.protein_g),
          carbs_g: toField(result.carbs_g),
          fat_g: toField(result.fat_g),
        });
      } catch (err) {
        Alert.alert("Lookup failed", formatApiError(err));
        scannedRef.current = false;
        setScanned(false);
      } finally {
        setLookingUp(false);
      }
    },
    [],
  );

  const handleScanAgain = () => {
    scannedRef.current = false;
    setScanResult(null);
    setScanned(false);
    setEdited({ name: "", grams: "100", kcal: "", protein_g: "", carbs_g: "", fat_g: "" });
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
      source: "barcode",
    });
    if (success) navigation.goBack();
  };

  const canAdd = edited.name.trim().length > 0 && Number(edited.grams) > 0;

  // Waiting for permission response
  if (!permission) {
    return (
      <Screen title="Scan Barcode">
        <View style={styles.center}>
          <ActivityIndicator color={colors.accent.base} />
        </View>
      </Screen>
    );
  }

  // Permission denied
  if (!permission.granted) {
    return (
      <Screen title="Scan Barcode">
        <View style={styles.center}>
          <Ionicons name="barcode-outline" size={64} color={colors.textPalette.muted} />
          <Text style={styles.permissionText}>
            Camera access is needed to scan barcodes.
          </Text>
          <Button label="Grant Permission" onPress={() => void requestPermission()} fullWidth />
          <Button label="Cancel" onPress={() => navigation.goBack()} variant="ghost" fullWidth />
        </View>
      </Screen>
    );
  }

  // Live camera view — shown until a barcode is detected
  if (!scanned && !scanResult) {
    return (
      <View style={styles.fullscreen}>
        <StatusBar style="light" />
        <CameraView
          style={StyleSheet.absoluteFillObject}
          facing="back"
          barcodeScannerSettings={{
            barcodeTypes: ["ean13", "ean8", "upc_a", "upc_e"],
          }}
          onBarcodeScanned={handleBarcodeScanned}
        />
        <View style={styles.cameraOverlay}>
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons name="close" size={26} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.cameraTitle}>Scan Barcode</Text>
          <View style={styles.viewfinder} />
          <Text style={styles.cameraHint}>
            Point the camera at the barcode on the packaging
          </Text>
        </View>
      </View>
    );
  }

  // Result view — shown after lookup completes
  return (
    <Screen title="Barcode Result" scrollable={false}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.dateLabel}>{date}</Text>

        {lookingUp && (
          <View style={styles.lookupRow}>
            <ActivityIndicator color={colors.accent.base} />
            <Text style={styles.lookupText}>Looking up product…</Text>
          </View>
        )}

        {scanResult != null && !lookingUp && (
          <Card variant="elevated" padding="md">
            {scanResult.found ? (
              <View style={styles.statusRow}>
                <Ionicons name="checkmark-circle" size={18} color={colors.accent.base} />
                <Text style={[styles.statusText, { color: colors.accent.base }]}>
                  Product found
                </Text>
              </View>
            ) : (
              <View style={styles.statusRow}>
                <Ionicons name="alert-circle-outline" size={18} color={colors.warning} />
                <Text style={[styles.statusText, { color: colors.warning }]}>
                  Product not in database — fill in manually.
                </Text>
              </View>
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

            {scanResult.found && (
              <Text style={styles.per100gNote}>
                Values are per 100g — adjust serving size to match your portion.
              </Text>
            )}

            <Button
              label="Add to Diary"
              onPress={() => void handleAdd()}
              loading={saving}
              disabled={!canAdd}
              fullWidth
            />
          </Card>
        )}

        <Button label="Scan Again" onPress={handleScanAgain} variant="ghost" fullWidth />
        <Button label="Cancel" onPress={() => navigation.goBack()} variant="ghost" fullWidth />
      </ScrollView>
    </Screen>
  );
};

const styles = StyleSheet.create({
  fullscreen: {
    flex: 1,
    backgroundColor: "#000",
  },
  cameraOverlay: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
  },
  closeBtn: {
    position: "absolute",
    top: 56,
    right: spacing.lg,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
  },
  cameraTitle: {
    position: "absolute",
    top: 64,
    fontSize: typography.size.lg,
    fontWeight: "700",
    color: "#fff",
  },
  viewfinder: {
    width: 270,
    height: 130,
    borderWidth: 2,
    borderColor: colors.accent.base,
    borderRadius: radius.md,
  },
  cameraHint: {
    marginTop: spacing.lg,
    fontSize: typography.size.sm,
    color: "rgba(255,255,255,0.85)",
    textAlign: "center",
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  permissionText: {
    ...typography.styles.bodySmall,
    textAlign: "center",
    color: colors.textPalette.secondary,
  },
  content: {
    gap: spacing.md,
    paddingBottom: spacing["2xl"],
  },
  dateLabel: {
    ...typography.styles.bodySmall,
    marginTop: -spacing.sm,
  },
  lookupRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingVertical: spacing.lg,
  },
  lookupText: {
    ...typography.styles.bodySmall,
    color: colors.accent.base,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  statusText: {
    ...typography.styles.label,
    flex: 1,
  },
  sectionLabel: {
    ...typography.styles.caption,
    marginBottom: spacing.xs,
  },
  per100gNote: {
    ...typography.styles.caption,
    color: colors.warning,
    marginBottom: spacing.sm,
  },
});
