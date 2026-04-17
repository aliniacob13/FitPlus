import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { Button } from "@/components/ui/Button";
import { ErrorState } from "@/components/ui/ErrorState";
import { Input } from "@/components/ui/Input";
import { Screen } from "@/components/ui/Screen";
import { colors, spacing } from "@/constants/theme";
import { useAuthStore } from "@/store/authStore";
import { AuthStackParamList } from "@/types/navigation";

type Props = NativeStackScreenProps<AuthStackParamList, "Register">;

export const RegisterScreen = ({ navigation }: Props) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const register = useAuthStore((state) => state.register);
  const isSubmitting = useAuthStore((state) => state.isSubmitting);
  const error = useAuthStore((state) => state.error);

  const isFormValid = useMemo(
    () => email.includes("@") && password.length >= 6 && confirmPassword === password,
    [email, password, confirmPassword],
  );

  const handleRegister = async () => {
    await register(email.trim(), password);
  };

  return (
    <Screen>
      <View style={styles.wrapper}>
        <Text style={styles.title}>Cont nou</Text>
        <Text style={styles.subtitle}>Creeaza un cont FitPlus.</Text>

        <Input label="Email" value={email} onChangeText={setEmail} placeholder="name@example.com" />
        <Input label="Parola" value={password} onChangeText={setPassword} secureTextEntry placeholder="******" />
        <Input
          label="Confirma parola"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
          placeholder="******"
        />

        {error ? <ErrorState message={error} /> : null}

        <Button label="Creeaza cont" onPress={handleRegister} disabled={!isFormValid} loading={isSubmitting} />
        <Button label="Inapoi la Login" onPress={() => navigation.navigate("Login")} disabled={isSubmitting} />
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    gap: spacing.md,
    marginTop: spacing.xl,
  },
  title: {
    fontSize: 28,
    color: colors.text,
    fontWeight: "700",
  },
  subtitle: {
    color: colors.mutedText,
    marginBottom: spacing.md,
  },
});
