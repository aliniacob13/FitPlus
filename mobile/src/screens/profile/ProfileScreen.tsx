import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { Button } from "@/components/ui/Button";
import { ErrorState } from "@/components/ui/ErrorState";
import { Input } from "@/components/ui/Input";
import { Screen } from "@/components/ui/Screen";
import { colors, spacing } from "@/constants/theme";
import { useAuthStore } from "@/store/authStore";
import { useUserStore } from "@/store/userStore";

export const ProfileScreen = () => {
  const profile = useUserStore((state) => state.profile);
  const loading = useUserStore((state) => state.loading);
  const saving = useUserStore((state) => state.saving);
  const error = useUserStore((state) => state.error);
  const fetchMe = useUserStore((state) => state.fetchMe);
  const updateProfile = useUserStore((state) => state.updateProfile);
  const logout = useAuthStore((state) => state.logout);

  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [heightCm, setHeightCm] = useState("");
  const [fitnessLevel, setFitnessLevel] = useState("");
  const [goals, setGoals] = useState("");
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  useEffect(() => {
    setName(profile?.name ?? "");
    setAge(profile?.age?.toString() ?? "");
    setWeightKg(profile?.weight_kg?.toString() ?? "");
    setHeightCm(profile?.height_cm?.toString() ?? "");
    setFitnessLevel(profile?.fitness_level ?? "");
    setGoals(profile?.goals ?? "");
  }, [profile]);

  const parseOptionalNumber = (value: string): number | undefined => {
    const trimmed = value.trim();
    if (!trimmed) {
      return undefined;
    }
    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : undefined;
  };

  const handleSave = async () => {
    setSaveMessage(null);
    const success = await updateProfile({
      name: name.trim() || undefined,
      age: parseOptionalNumber(age),
      weight_kg: parseOptionalNumber(weightKg),
      height_cm: parseOptionalNumber(heightCm),
      fitness_level: fitnessLevel.trim() || undefined,
      goals: goals.trim() || undefined,
    });
    if (success) {
      setSaveMessage("Profil salvat.");
    }
  };

  return (
    <Screen>
      <View style={styles.container}>
        <Text style={styles.title}>Profile</Text>
        <Text style={styles.value}>Email: {profile?.email ?? "N/A"}</Text>

        <Input label="Nume" value={name} onChangeText={setName} placeholder="Ex: Mirud" />
        <Input label="Varsta" value={age} onChangeText={setAge} placeholder="Ex: 25" />
        <Input label="Greutate (kg)" value={weightKg} onChangeText={setWeightKg} placeholder="Ex: 72.5" />
        <Input label="Inaltime (cm)" value={heightCm} onChangeText={setHeightCm} placeholder="Ex: 178" />
        <Input
          label="Fitness level"
          value={fitnessLevel}
          onChangeText={setFitnessLevel}
          placeholder="Ex: beginner / intermediate"
        />
        <Input label="Obiective" value={goals} onChangeText={setGoals} placeholder="Ex: Lose fat, build strength" />

        {error ? <ErrorState message={error} /> : null}
        {saveMessage ? <Text style={styles.success}>{saveMessage}</Text> : null}

        <Button label="Refresh profile" onPress={() => void fetchMe()} loading={loading} />
        <Button label="Save profile" onPress={() => void handleSave()} loading={saving} />
        <Button label="Logout" onPress={() => void logout()} />
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  title: {
    color: colors.text,
    fontSize: 24,
    fontWeight: "700",
  },
  value: {
    color: colors.mutedText,
  },
  success: {
    color: "#86EFAC",
  },
});
