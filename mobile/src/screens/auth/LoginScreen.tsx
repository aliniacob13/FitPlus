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

type Props = NativeStackScreenProps<AuthStackParamList, "Login">;

export const LoginScreen = ({ navigation }: Props) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const login = useAuthStore((state) => state.login);
  const isSubmitting = useAuthStore((state) => state.isSubmitting);
  const error = useAuthStore((state) => state.error);

  const isFormValid = useMemo(() => email.includes("@") && password.length >= 6, [email, password]);

  const handleLogin = async () => {
    await login(email.trim(), password);
  };

  return (
    <Screen>
      <View style={styles.wrapper}>
        <Text style={styles.title}>FitPlus</Text>
        <Text style={styles.subtitle}>Autentificare</Text>

        <Input label="Email" value={email} onChangeText={setEmail} placeholder="name@example.com" />
        <Input label="Parola" value={password} onChangeText={setPassword} secureTextEntry placeholder="******" />

        {error ? <ErrorState message={error} /> : null}

        <Button label="Login" onPress={handleLogin} disabled={!isFormValid} loading={isSubmitting} />
        <Button label="Mergi la Register" onPress={() => navigation.navigate("Register")} disabled={isSubmitting} />
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
    fontSize: 30,
    color: colors.text,
    fontWeight: "700",
  },
  subtitle: {
    color: colors.mutedText,
    marginBottom: spacing.md,
  },
});
