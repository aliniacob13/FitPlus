import * as Location from "expo-location";
import { useEffect, useState } from "react";
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { Button } from "@/components/ui/Button";
import { ErrorState } from "@/components/ui/ErrorState";
import { Screen } from "@/components/ui/Screen";
import { colors, spacing } from "@/constants/theme";
import { GymDetail, NearbyGym, gymApi } from "@/services/gymApi";

const BUCHAREST = { latitude: 44.4268, longitude: 26.1025 };

const openMaps = (gym: { name: string; latitude: number; longitude: number }) => {
  const query = encodeURIComponent(`${gym.name} ${gym.latitude},${gym.longitude}`);
  void Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${query}`);
};

export const MapScreen = () => {
  const [coords, setCoords] = useState(BUCHAREST);
  const [nearbyGyms, setNearbyGyms] = useState<NearbyGym[]>([]);
  const [selectedGym, setSelectedGym] = useState<GymDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadLocation = async () => {
      try {
        const permission = await Location.requestForegroundPermissionsAsync();
        if (permission.status !== Location.PermissionStatus.GRANTED) {
          return;
        }
        const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        setCoords({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      } catch {
        // Keep Bucharest fallback.
      }
    };
    void loadLocation();
  }, []);

  const loadNearby = async () => {
    setLoading(true);
    setError(null);
    try {
      const gyms = await gymApi.getNearby({
        latitude: coords.latitude,
        longitude: coords.longitude,
        radius_m: 8000,
      });
      setNearbyGyms(gyms);
    } catch {
      setError("Nu am putut incarca salile din apropiere.");
    } finally {
      setLoading(false);
    }
  };

  const loadGymDetail = async (gymId: number) => {
    try {
      const detail = await gymApi.getById(gymId);
      setSelectedGym(detail);
    } catch {
      setError("Nu am putut incarca detaliile salii.");
    }
  };

  return (
    <Screen>
      <View style={styles.container}>
        <Text style={styles.title}>Map (Web)</Text>
        <Text style={styles.description}>
          Pe web afisam lista salilor + detalii. Harta nativa este disponibila pe Android/iOS.
        </Text>
        <Button label="Incarca sali nearby" onPress={loadNearby} loading={loading} />
        {error ? <ErrorState message={error} /> : null}

        <ScrollView contentContainerStyle={styles.list}>
          {nearbyGyms.map((gym) => (
            <Pressable key={gym.id} style={styles.card} onPress={() => void loadGymDetail(gym.id)}>
              <Text style={styles.cardTitle}>{gym.name}</Text>
              <Text style={styles.meta}>
                {(gym.distance_m / 1000).toFixed(2)} km {gym.rating ? `| ${gym.rating.toFixed(1)}★` : ""}
              </Text>
              {gym.address ? <Text style={styles.address}>{gym.address}</Text> : null}
            </Pressable>
          ))}
        </ScrollView>

        {selectedGym ? (
          <View style={styles.detail}>
            <Text style={styles.cardTitle}>{selectedGym.name}</Text>
            {selectedGym.description ? <Text style={styles.address}>{selectedGym.description}</Text> : null}
            <Button label="Deschide in Google Maps" onPress={() => openMaps(selectedGym)} />
          </View>
        ) : null}
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
    flex: 1,
  },
  title: {
    color: colors.text,
    fontSize: 24,
    fontWeight: "700",
  },
  description: {
    color: colors.mutedText,
  },
  list: {
    gap: spacing.sm,
    paddingBottom: spacing.lg,
  },
  card: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: spacing.md,
    gap: spacing.xs,
  },
  cardTitle: {
    color: colors.text,
    fontWeight: "700",
  },
  meta: {
    color: colors.mutedText,
  },
  address: {
    color: colors.mutedText,
  },
  detail: {
    borderTopWidth: 1,
    borderColor: colors.border,
    paddingTop: spacing.sm,
    gap: spacing.sm,
  },
});
