import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Screen } from "@/components/ui/Screen";
import { colors, spacing } from "@/constants/theme";
import { aiApi } from "@/services/aiApi";

export const DietChatScreen = () => {
  const [message, setMessage] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);

  const send = async () => {
    if (!message.trim()) {
      return;
    }
    setLoading(true);
    try {
      const result = await aiApi.sendDietMessage({ message: message.trim() });
      setResponse(result.response);
      setMessage("");
    } catch {
      setResponse("Nu am putut obtine raspuns de la diet agent.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <View style={styles.container}>
        <Text style={styles.title}>Diet AI</Text>
        <Input label="Mesaj" value={message} onChangeText={setMessage} placeholder="Ex: meniu cu buget 40 RON" />
        <Button label="Trimite" onPress={send} loading={loading} />
        <Text style={styles.response}>{response || "Aici va aparea raspunsul AI."}</Text>
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
  response: {
    color: colors.mutedText,
  },
});
