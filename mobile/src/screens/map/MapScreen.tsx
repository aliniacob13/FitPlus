import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { Button } from "@/components/ui/Button";
import { ErrorState } from "@/components/ui/ErrorState";
import { Screen } from "@/components/ui/Screen";
import { colors, spacing } from "@/constants/theme";
import { gymApi, NearbyGym } from "@/services/gymApi";

export const MapScreen = () => {
  const [nearbyGyms, setNearbyGyms] = useState<NearbyGym[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadNearby = async () => {
    setLoading(true);
    setError(null);
    try {
      const gyms = await gymApi.getNearby({
        latitude: 44.4268,
        longitude: 26.1025,
        radius_m: 5000,
      });
      setNearbyGyms(gyms);
    } catch {
      setError("Nu am putut incarca salile din apropiere.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <View style={styles.container}>
        <Text style={styles.title}>Map</Text>
        <Button label="Incarca sali nearby" onPress={loadNearby} loading={loading} />
        {error ? <ErrorState message={error} /> : null}
        <Text style={styles.text}>Rezultate: {nearbyGyms.length}</Text>
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
  text: {
    color: colors.mutedText,
  },
});
