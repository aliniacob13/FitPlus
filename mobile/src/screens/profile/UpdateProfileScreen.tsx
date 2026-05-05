import { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Screen } from "@/components/ui/Screen";
import { colors, spacing } from "@/constants/theme";
import { useUserStore } from "@/store/userStore";
import { AppStackParamList } from "@/types/navigation";

type NavProp = NativeStackNavigationProp<AppStackParamList, "UpdateProfile">;

export const UpdateProfileScreen = () => {
  const navigation = useNavigation<NavProp>();
  const profile = useUserStore((state) => state.profile);
  const saving = useUserStore((state) => state.saving);
  const updateProfile = useUserStore((state) => state.updateProfile);

  const [name, setName] = useState(profile?.name ?? "");
  const [age, setAge] = useState(profile?.age?.toString() ?? "");
  const [weightKg, setWeightKg] = useState(profile?.weight_kg?.toString() ?? "");
  const [heightCm, setHeightCm] = useState(profile?.height_cm?.toString() ?? "");
  const [fitnessLevel, setFitnessLevel] = useState(profile?.fitness_level ?? "");
  const [goals, setGoals] = useState(profile?.goals ?? "");
  const [error, setError] = useState<string | null>(null);

  const parseOptionalNumber = (value: string): number | undefined => {
    const trimmed = value.trim();
    if (!trimmed) {
      return undefined;
    }
    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : undefined;
  };

  const handleSave = async () => {
    setError(null);
    const success = await updateProfile({
      name: name.trim() || undefined,
      age: parseOptionalNumber(age),
      weight_kg: parseOptionalNumber(weightKg),
      height_cm: parseOptionalNumber(heightCm),
      fitness_level: fitnessLevel.trim() || undefined,
      goals: goals.trim() || undefined,
    });

    if (success) {
      navigation.goBack();
      return;
    }

    setError("Nu am putut salva modificarile.");
  };

  return (
    <Screen scrollable={false}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Edit profile</Text>
        <Text style={styles.subtitle}>Actualizeaza datele tale pentru recomandari mai bune.</Text>

        <Input label="Nume" value={name} onChangeText={setName} placeholder="Ex: Miruna" autoCapitalize="words" />
        <Input label="Varsta" value={age} onChangeText={setAge} placeholder="Ex: 24" keyboardType="numeric" />
        <Input
          label="Greutate (kg)"
          value={weightKg}
          onChangeText={setWeightKg}
          placeholder="Ex: 60.5"
          keyboardType="numeric"
        />
        <Input
          label="Inaltime (cm)"
          value={heightCm}
          onChangeText={setHeightCm}
          placeholder="Ex: 168"
          keyboardType="numeric"
        />
        <Input
          label="Nivel fitness"
          value={fitnessLevel}
          onChangeText={setFitnessLevel}
          placeholder="beginner / intermediate / advanced"
        />
        <Input
          label="Obiective"
          value={goals}
          onChangeText={setGoals}
          placeholder="Ex: slabire, tonifiere, masa musculara"
          autoCapitalize="sentences"
          multiline
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <View style={styles.actions}>
          <Button label="Salveaza" onPress={() => void handleSave()} loading={saving} />
          <Button label="Inapoi" onPress={() => navigation.goBack()} />
        </View>
      </ScrollView>
    </Screen>
  );
};

const styles = StyleSheet.create({
  content: {
    gap: spacing.md,
    paddingBottom: spacing.xl,
  },
  title: {
    color: colors.text,
    fontSize: 26,
    fontWeight: "700",
  },
  subtitle: {
    color: colors.mutedText,
  },
  actions: {
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  error: {
    color: "#FCA5A5",
    fontWeight: "600",
  },
});
