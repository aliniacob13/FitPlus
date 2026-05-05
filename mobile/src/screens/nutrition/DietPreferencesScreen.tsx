import { useEffect, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Screen } from "@/components/ui/Screen";
import { colors, radius, spacing, typography } from "@/constants/theme";
import { useAuthStore } from "@/store/authStore";
import { AppStackParamList } from "@/types/navigation";

type NavProp = NativeStackNavigationProp<AppStackParamList, "MainTabs">;

type DietPreferences = {
  restrictions: string[];
  allergies: string[];
  goals?: string;
};

const commonRestrictions = [
  "Vegetarian",
  "Vegan",
  "Gluten-Free",
  "Dairy-Free",
  "Low-Carb",
  "Keto",
  "Paleo",
  "Low-Sodium",
  "Low-Sugar",
  "Halal",
  "Kosher",
];

const commonAllergies = [
  "Lactoză",
  "Gluten",
  "Ouă",
  "Nuci",
  "Arahide",
  "Fructe de mare",
  "Soia",
  "Sesame",
  "Mustar",
  "Pește",
  "Crustacee",
  "Molluscs",
];

const commonGoals = [
  "Slăbit",
  "Masă musculară",
  "Mentenanță",
  "Energie crescută",
  "Sănătate digestivă",
  "Control diabet",
  "Sănătate cardiacă",
  "Performanță sportivă",
];

export const DietPreferencesScreen = () => {
  const navigation = useNavigation<NavProp>();
  const { accessToken } = useAuthStore();
  
  const [preferences, setPreferences] = useState<DietPreferences>({
    restrictions: [],
    allergies: [],
    goals: "",
  });
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customRestriction, setCustomRestriction] = useState("");
  const [customAllergy, setCustomAllergy] = useState("");

  // API base URL
  const API_BASE_URL = "http://172.20.10.4:8000/api/v1";

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    if (!accessToken) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/users/me/diet-preferences`, {
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setPreferences({
        restrictions: data.restrictions || [],
        allergies: data.allergies || [],
        goals: data.goals || "",
      });
    } catch (err) {
      setError("Nu am putut încărca preferințele. Încercați din nou.");
      console.error("Error fetching diet preferences:", err);
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async () => {
    if (!accessToken) return;
    
    setSaving(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/users/me/diet-preferences`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(preferences),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setPreferences({
        restrictions: data.restrictions || [],
        allergies: data.allergies || [],
        goals: data.goals || "",
      });
      
      Alert.alert("Succes", "Preferințele au fost salvate!");
    } catch (err) {
      setError("Nu am putut salva preferințele. Încercați din nou.");
      console.error("Error saving diet preferences:", err);
    } finally {
      setSaving(false);
    }
  };

  const toggleRestriction = (restriction: string) => {
    setPreferences(prev => ({
      ...prev,
      restrictions: prev.restrictions.includes(restriction)
        ? prev.restrictions.filter(r => r !== restriction)
        : [...prev.restrictions, restriction],
    }));
  };

  const toggleAllergy = (allergy: string) => {
    setPreferences(prev => ({
      ...prev,
      allergies: prev.allergies.includes(allergy)
        ? prev.allergies.filter(a => a !== allergy)
        : [...prev.allergies, allergy],
    }));
  };

  const addCustomRestriction = () => {
    if (customRestriction.trim() && !preferences.restrictions.includes(customRestriction.trim())) {
      setPreferences(prev => ({
        ...prev,
        restrictions: [...prev.restrictions, customRestriction.trim()],
      }));
      setCustomRestriction("");
    }
  };

  const addCustomAllergy = () => {
    if (customAllergy.trim() && !preferences.allergies.includes(customAllergy.trim())) {
      setPreferences(prev => ({
        ...prev,
        allergies: [...prev.allergies, customAllergy.trim()],
      }));
      setCustomAllergy("");
    }
  };

  const removeRestriction = (restriction: string) => {
    setPreferences(prev => ({
      ...prev,
      restrictions: prev.restrictions.filter(r => r !== restriction),
    }));
  };

  const removeAllergy = (allergy: string) => {
    setPreferences(prev => ({
      ...prev,
      allergies: prev.allergies.filter(a => a !== allergy),
    }));
  };

  return (
    <Screen scrollable={false}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Preferințe Dietetice</Text>

        {error && (
          <Card variant="default" padding="md">
            <Text style={styles.errorText}>{error}</Text>
            <Button
              label="Reîncearcă"
              onPress={fetchPreferences}
              variant="outline"
              fullWidth
            />
          </Card>
        )}

        <Card variant="default" title="Restricții Alimentare" padding="md">
          <Text style={styles.sectionDescription}>
            Selectați restricțiile alimentare pe care le aveți.
          </Text>
          
          <View style={styles.tagsContainer}>
            {commonRestrictions.map((restriction) => (
              <TouchableOpacity
                key={restriction}
                style={[
                  styles.tag,
                  preferences.restrictions.includes(restriction) && styles.tagSelected,
                ]}
                onPress={() => toggleRestriction(restriction)}
              >
                <Text style={[
                  styles.tagText,
                  preferences.restrictions.includes(restriction) && styles.tagTextSelected,
                ]}>
                  {restriction}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.customInputRow}>
            <Input
              label="Adaugă restricție personalizată"
              value={customRestriction}
              onChangeText={setCustomRestriction}
              placeholder="Ex: Fără procesate"
            />
            <TouchableOpacity
              style={styles.addButton}
              onPress={addCustomRestriction}
              disabled={!customRestriction.trim()}
            >
              <Text style={styles.addButtonText}>+</Text>
            </TouchableOpacity>
          </View>

          {preferences.restrictions.length > 0 && (
            <View style={styles.selectedContainer}>
              <Text style={styles.selectedTitle}>Selectate:</Text>
              <View style={styles.selectedTags}>
                {preferences.restrictions.map((restriction) => (
                  <TouchableOpacity
                    key={restriction}
                    style={styles.selectedTag}
                    onPress={() => removeRestriction(restriction)}
                  >
                    <Text style={styles.selectedTagText}>{restriction}</Text>
                    <Text style={styles.removeTagText}>×</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </Card>

        <Card variant="default" title="Alergii" padding="md">
          <Text style={styles.sectionDescription}>
            Selectați alergiile alimentare pe care le aveți.
          </Text>
          
          <View style={styles.tagsContainer}>
            {commonAllergies.map((allergy) => (
              <TouchableOpacity
                key={allergy}
                style={[
                  styles.tag,
                  preferences.allergies.includes(allergy) && styles.tagSelected,
                ]}
                onPress={() => toggleAllergy(allergy)}
              >
                <Text style={[
                  styles.tagText,
                  preferences.allergies.includes(allergy) && styles.tagTextSelected,
                ]}>
                  {allergy}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.customInputRow}>
            <Input
              label="Adaugă alergie personalizată"
              value={customAllergy}
              onChangeText={setCustomAllergy}
              placeholder="Ex: Citrice"
            />
            <TouchableOpacity
              style={styles.addButton}
              onPress={addCustomAllergy}
              disabled={!customAllergy.trim()}
            >
              <Text style={styles.addButtonText}>+</Text>
            </TouchableOpacity>
          </View>

          {preferences.allergies.length > 0 && (
            <View style={styles.selectedContainer}>
              <Text style={styles.selectedTitle}>Selectate:</Text>
              <View style={styles.selectedTags}>
                {preferences.allergies.map((allergy) => (
                  <TouchableOpacity
                    key={allergy}
                    style={styles.selectedTag}
                    onPress={() => removeAllergy(allergy)}
                  >
                    <Text style={styles.selectedTagText}>{allergy}</Text>
                    <Text style={styles.removeTagText}>×</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </Card>

        <Card variant="default" title="Obiective" padding="md">
          <Text style={styles.sectionDescription}>
            Selectați obiectivul principal al dietei dumneavoastră.
          </Text>
          
          <View style={styles.tagsContainer}>
            {commonGoals.map((goal) => (
              <TouchableOpacity
                key={goal}
                style={[
                  styles.tag,
                  preferences.goals === goal && styles.tagSelected,
                ]}
                onPress={() => setPreferences(prev => ({ ...prev, goals: goal }))}
              >
                <Text style={[
                  styles.tagText,
                  preferences.goals === goal && styles.tagTextSelected,
                ]}>
                  {goal}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Input
            label="Sau introduceți un obiectiv personalizat"
            value={preferences.goals || ""}
            onChangeText={(text) => setPreferences(prev => ({ ...prev, goals: text }))}
            placeholder="Ex: Sănătate generală"
          />
        </Card>

        <Button
          label="Salvează Preferințele"
          onPress={savePreferences}
          loading={saving}
          disabled={loading}
          fullWidth
        />

        <Button
          label="Înapoi la Nutriție"
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
  errorText: {
    color: colors.error,
    textAlign: "center",
    marginBottom: spacing.md,
  },
  sectionDescription: {
    ...typography.styles.bodySmall,
    color: colors.textPalette.secondary,
    marginBottom: spacing.md,
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  tag: {
    backgroundColor: colors.bg.elevated,
    borderWidth: 1,
    borderColor: colors.borderPalette.default,
    borderRadius: radius.chip,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
  },
  tagSelected: {
    backgroundColor: colors.accent.muted,
    borderColor: colors.accent.base,
  },
  tagText: {
    fontSize: typography.size.sm,
    color: colors.textPalette.secondary,
    fontWeight: "500",
  },
  tagTextSelected: {
    color: colors.accent.base,
    fontWeight: "600",
  },
  customInputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  customInput: {
    flex: 1,
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.accent.base,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing[2],
  },
  addButtonText: {
    color: colors.textPalette.inverse,
    fontSize: 20,
    fontWeight: "700",
  },
  selectedContainer: {
    marginTop: spacing.md,
  },
  selectedTitle: {
    ...typography.styles.label,
    marginBottom: spacing[2],
  },
  selectedTags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  selectedTag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.accent.muted,
    borderWidth: 1,
    borderColor: colors.accent.base,
    borderRadius: radius.chip,
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
  },
  selectedTagText: {
    fontSize: typography.size.sm,
    color: colors.accent.base,
    fontWeight: "600",
  },
  removeTagText: {
    fontSize: 16,
    color: colors.accent.base,
    fontWeight: "700",
    marginLeft: spacing[1],
  },
});
