import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";

import { colors, radius, shadows, spacing, typography } from "@/constants/theme";
import { useUserStore } from "@/store/userStore";
import { AppStackParamList } from "@/types/navigation";

type Nav = NativeStackNavigationProp<AppStackParamList, "DietPreferences">;

// ── Option definitions ────────────────────────────────────────────────────────

const RESTRICTION_OPTIONS: { key: string; label: string; emoji: string }[] = [
  { key: "gluten-free", label: "Gluten-free", emoji: "🌾" },
  { key: "vegan", label: "Vegan", emoji: "🌱" },
  { key: "vegetarian", label: "Vegetarian", emoji: "🥦" },
  { key: "lactose-free", label: "Lactose-free", emoji: "🥛" },
  { key: "keto", label: "Ketogenic", emoji: "🥑" },
  { key: "paleo", label: "Paleo", emoji: "🍖" },
  { key: "diabetic-friendly", label: "Diabetic-friendly", emoji: "💊" },
  { key: "low-sodium", label: "Low-sodium", emoji: "🧂" },
  { key: "halal", label: "Halal", emoji: "☪️" },
  { key: "kosher", label: "Kosher", emoji: "✡️" },
];

const ALLERGY_OPTIONS: { key: string; label: string; emoji: string }[] = [
  { key: "nuts", label: "Tree nuts", emoji: "🥜" },
  { key: "peanuts", label: "Peanuts", emoji: "🥜" },
  { key: "shellfish", label: "Shellfish", emoji: "🦞" },
  { key: "fish", label: "Fish", emoji: "🐟" },
  { key: "eggs", label: "Eggs", emoji: "🥚" },
  { key: "soy", label: "Soy", emoji: "🫘" },
  { key: "wheat", label: "Wheat", emoji: "🌾" },
  { key: "dairy", label: "Dairy", emoji: "🧀" },
  { key: "sesame", label: "Sesame", emoji: "🌰" },
];

// ── CheckChip ─────────────────────────────────────────────────────────────────

type CheckChipProps = {
  label: string;
  emoji: string;
  selected: boolean;
  onToggle: () => void;
};

const CheckChip = ({ label, emoji, selected, onToggle }: CheckChipProps) => (
  <TouchableOpacity
    style={[styles.chip, selected && styles.chipSelected]}
    onPress={onToggle}
    activeOpacity={0.75}
  >
    <Text style={styles.chipEmoji}>{emoji}</Text>
    <Text style={[styles.chipLabel, selected && styles.chipLabelSelected]}>
      {label}
    </Text>
    {selected && (
      <Ionicons name="checkmark-circle" size={14} color={colors.accent.base} />
    )}
  </TouchableOpacity>
);

// ── SectionHeader ─────────────────────────────────────────────────────────────

const SectionHeader = ({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) => (
  <View style={styles.sectionHeader}>
    <Text style={styles.sectionTitle}>{title}</Text>
    <Text style={styles.sectionSubtitle}>{subtitle}</Text>
  </View>
);

// ── DietPreferencesScreen ─────────────────────────────────────────────────────

export const DietPreferencesScreen = () => {
  const navigation = useNavigation<Nav>();
  const fetchDietPreferences = useUserStore((s) => s.fetchDietPreferences);
  const updateDietPreferences = useUserStore((s) => s.updateDietPreferences);
  const dietPreferences = useUserStore((s) => s.dietPreferences);
  const dietLoading = useUserStore((s) => s.dietLoading);
  const dietSaving = useUserStore((s) => s.dietSaving);

  const [restrictions, setRestrictions] = useState<string[]>([]);
  const [allergies, setAllergies] = useState<string[]>([]);
  const [goals, setGoals] = useState("");

  // ── Load existing preferences ──────────────────────────────────────────────

  useEffect(() => {
    void fetchDietPreferences();
  }, [fetchDietPreferences]);

  useEffect(() => {
    if (dietPreferences) {
      setRestrictions(dietPreferences.restrictions ?? []);
      setAllergies(dietPreferences.allergies ?? []);
      setGoals(dietPreferences.goals ?? "");
    }
  }, [dietPreferences]);

  // ── Toggles ───────────────────────────────────────────────────────────────

  const toggleRestriction = useCallback((key: string) => {
    setRestrictions((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
  }, []);

  const toggleAllergy = useCallback((key: string) => {
    setAllergies((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
  }, []);

  // ── Save ──────────────────────────────────────────────────────────────────

  const handleSave = async () => {
    const ok = await updateDietPreferences({
      restrictions,
      allergies,
      goals: goals.trim() || null,
    });

    if (ok) {
      Alert.alert(
        "Saved ✓",
        "Your diet preferences have been updated. The AI will now take these into account.",
        [{ text: "OK", onPress: () => navigation.goBack() }],
      );
    } else {
      Alert.alert(
        "Error",
        "Could not save preferences. Please try again.",
      );
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          activeOpacity={0.7}
        >
          <Ionicons
            name="chevron-back"
            size={22}
            color={colors.textPalette.primary}
          />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Diet Preferences</Text>
          <Text style={styles.headerSub}>
            Personalise your nutrition AI coach
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.saveBtn, dietSaving && styles.saveBtnDisabled]}
          onPress={() => void handleSave()}
          disabled={dietSaving}
          activeOpacity={0.85}
        >
          {dietSaving ? (
            <ActivityIndicator size="small" color={colors.textPalette.inverse} />
          ) : (
            <Text style={styles.saveBtnText}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      {dietLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.accent.base} size="large" />
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── Dietary Restrictions ── */}
          <SectionHeader
            title="Dietary Restrictions"
            subtitle="Select all that apply to your diet"
          />
          <View style={styles.chipsGrid}>
            {RESTRICTION_OPTIONS.map((opt) => (
              <CheckChip
                key={opt.key}
                label={opt.label}
                emoji={opt.emoji}
                selected={restrictions.includes(opt.key)}
                onToggle={() => toggleRestriction(opt.key)}
              />
            ))}
          </View>

          {/* ── Allergies ── */}
          <SectionHeader
            title="Allergies & Intolerances"
            subtitle="The AI will avoid ingredients you're allergic to"
          />
          <View style={styles.chipsGrid}>
            {ALLERGY_OPTIONS.map((opt) => (
              <CheckChip
                key={opt.key}
                label={opt.label}
                emoji={opt.emoji}
                selected={allergies.includes(opt.key)}
                onToggle={() => toggleAllergy(opt.key)}
              />
            ))}
          </View>

          {/* ── Nutritional Goals ── */}
          <SectionHeader
            title="Nutritional Goals"
            subtitle="Describe what you want to achieve (optional)"
          />
          <View style={styles.goalInputWrapper}>
            <TextInput
              style={styles.goalInput}
              value={goals}
              onChangeText={setGoals}
              placeholder="e.g. Lose 5 kg in 3 months, build lean muscle, improve energy levels…"
              placeholderTextColor={colors.textPalette.muted}
              multiline
              maxLength={500}
              textAlignVertical="top"
            />
            <Text style={styles.goalCounter}>{goals.length}/500</Text>
          </View>

          {/* Summary */}
          {(restrictions.length > 0 || allergies.length > 0) && (
            <View style={styles.summaryCard}>
              <Ionicons
                name="information-circle-outline"
                size={16}
                color={colors.accent.base}
              />
              <Text style={styles.summaryText}>
                {restrictions.length > 0 &&
                  `Restrictions: ${restrictions.join(", ")}. `}
                {allergies.length > 0 &&
                  `Allergies: ${allergies.join(", ")}.`}
              </Text>
            </View>
          )}

          {/* Save button (bottom) */}
          <TouchableOpacity
            style={[styles.saveBtnLarge, dietSaving && styles.saveBtnDisabled]}
            onPress={() => void handleSave()}
            disabled={dietSaving}
            activeOpacity={0.85}
          >
            {dietSaving ? (
              <ActivityIndicator
                size="small"
                color={colors.textPalette.inverse}
              />
            ) : (
              <>
                <Ionicons
                  name="checkmark-circle-outline"
                  size={18}
                  color={colors.textPalette.inverse}
                />
                <Text style={styles.saveBtnLargeText}>Save Preferences</Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg.base },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing[4],
    borderBottomWidth: 1,
    borderColor: colors.borderPalette.default,
    backgroundColor: colors.bg.surface,
    ...shadows.sm,
    gap: spacing[3],
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.bg.elevated,
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: { flex: 1 },
  headerTitle: {
    fontSize: typography.size.md,
    fontWeight: "700",
    color: colors.textPalette.primary,
  },
  headerSub: {
    fontSize: typography.size.xs,
    color: colors.textPalette.muted,
    marginTop: 2,
  },
  saveBtn: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderRadius: radius.button,
    backgroundColor: colors.accent.base,
    minWidth: 56,
    alignItems: "center",
  },
  saveBtnDisabled: { opacity: 0.5 },
  saveBtnText: {
    fontSize: typography.size.sm,
    fontWeight: "700",
    color: colors.textPalette.inverse,
  },

  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  scroll: { flex: 1 },
  scrollContent: {
    padding: spacing.md,
    gap: spacing.md,
    paddingBottom: spacing["3xl"],
  },

  sectionHeader: { gap: spacing[1], marginTop: spacing[3] },
  sectionTitle: {
    fontSize: typography.size.md,
    fontWeight: "700",
    color: colors.textPalette.primary,
  },
  sectionSubtitle: {
    fontSize: typography.size.sm,
    color: colors.textPalette.muted,
  },

  chipsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing[2],
    marginTop: spacing[2],
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[1],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: radius.chip,
    borderWidth: 1.5,
    borderColor: colors.borderPalette.default,
    backgroundColor: colors.bg.elevated,
  },
  chipSelected: {
    borderColor: colors.accent.base,
    backgroundColor: colors.accent.muted,
  },
  chipEmoji: { fontSize: 14 },
  chipLabel: {
    fontSize: typography.size.sm,
    color: colors.textPalette.secondary,
    fontWeight: "500",
  },
  chipLabelSelected: {
    color: colors.accent.base,
    fontWeight: "700",
  },

  goalInputWrapper: {
    marginTop: spacing[2],
    backgroundColor: colors.bg.elevated,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderPalette.default,
    padding: spacing.md,
    gap: spacing[2],
  },
  goalInput: {
    minHeight: 100,
    fontSize: typography.size.base,
    color: colors.textPalette.primary,
    lineHeight: 22,
  },
  goalCounter: {
    fontSize: typography.size.xs,
    color: colors.textPalette.muted,
    textAlign: "right",
  },

  summaryCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing[2],
    backgroundColor: colors.accent.muted,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.accent.base,
    padding: spacing.md,
    marginTop: spacing[3],
  },
  summaryText: {
    flex: 1,
    fontSize: typography.size.sm,
    color: colors.textPalette.primary,
    lineHeight: 20,
  },

  saveBtnLarge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing[2],
    marginTop: spacing.lg,
    paddingVertical: spacing[4],
    borderRadius: radius.button,
    backgroundColor: colors.accent.base,
    ...shadows.accent,
  },
  saveBtnLargeText: {
    fontSize: typography.size.base,
    fontWeight: "700",
    color: colors.textPalette.inverse,
  },
});

