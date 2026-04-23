import * as Location from "expo-location";
import { useEffect, useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import MapView, { Marker } from "react-native-maps";

import { Button } from "@/components/ui/Button";
import { ErrorState } from "@/components/ui/ErrorState";
import { Screen } from "@/components/ui/Screen";
import { colors, spacing } from "@/constants/theme";
import { GymDetail, NearbyGym, gymApi } from "@/services/gymApi";

const BUCHAREST = {
  latitude: 44.4268,
  longitude: 26.1025,
  latitudeDelta: 0.12,
  longitudeDelta: 0.12,
};

export const MapScreen = () => {
  const [region, setRegion] = useState(BUCHAREST);
  const [nearbyGyms, setNearbyGyms] = useState<NearbyGym[]>([]);
  const [selectedGym, setSelectedGym] = useState<GymDetail | null>(null);
  const [loadingNearby, setLoadingNearby] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadLocation = async () => {
      try {
        const permission = await Location.requestForegroundPermissionsAsync();
        if (permission.status !== Location.PermissionStatus.GRANTED) {
          return;
        }
        const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        setRegion({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          latitudeDelta: 0.08,
          longitudeDelta: 0.08,
        });
      } catch {
        // Keep fallback region.
      }
    };
    void loadLocation();
  }, []);

  const loadNearby = async () => {
    setLoadingNearby(true);
    setError(null);
    try {
      const gyms = await gymApi.getNearby({
        latitude: region.latitude,
        longitude: region.longitude,
        radius_m: 8000,
      });
      setNearbyGyms(gyms);
    } catch {
      setError("Nu am putut incarca salile din apropiere.");
    } finally {
      setLoadingNearby(false);
    }
  };

  const openDetail = async (gymId: number) => {
    setLoadingDetail(true);
    setError(null);
    try {
      const detail = await gymApi.getById(gymId);
      setSelectedGym(detail);
    } catch {
      setError("Nu am putut incarca detaliile salii.");
    } finally {
      setLoadingDetail(false);
    }
  };

  return (
    <Screen padded={false}>
      <View style={styles.topBar}>
        <Text style={styles.title}>Map</Text>
        <Button label="Incarca sali nearby" onPress={() => void loadNearby()} loading={loadingNearby} />
      </View>
      {error ? (
        <View style={styles.errorWrap}>
          <ErrorState message={error} />
        </View>
      ) : null}

      <MapView style={styles.map} region={region} onRegionChangeComplete={setRegion} showsUserLocation>
        {nearbyGyms.map((gym) => (
          <Marker
            key={gym.id}
            coordinate={{ latitude: gym.latitude, longitude: gym.longitude }}
            title={gym.name}
            description={gym.address ?? undefined}
            onPress={() => void openDetail(gym.id)}
          />
        ))}
      </MapView>

      <Modal visible={Boolean(selectedGym)} transparent animationType="slide" onRequestClose={() => setSelectedGym(null)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            {loadingDetail ? <Text style={styles.meta}>Se incarca...</Text> : null}
            {selectedGym ? (
              <>
                <View style={styles.row}>
                  <Text style={styles.modalTitle}>{selectedGym.name}</Text>
                  <Pressable onPress={() => setSelectedGym(null)}>
                    <Text style={styles.close}>Inchide</Text>
                  </Pressable>
                </View>
                {selectedGym.address ? <Text style={styles.meta}>{selectedGym.address}</Text> : null}
                {selectedGym.description ? <Text style={styles.meta}>{selectedGym.description}</Text> : null}
                <Text style={styles.meta}>Rating: {selectedGym.rating?.toFixed(1) ?? "N/A"}</Text>
                <Text style={styles.meta}>Review-uri: {selectedGym.review_count}</Text>
                <ScrollView style={styles.jsonBlock}>
                  <Text style={styles.jsonText}>{JSON.stringify(selectedGym.pricing_plans, null, 2)}</Text>
                </ScrollView>
              </>
            ) : null}
          </View>
        </View>
      </Modal>
    </Screen>
  );
};

const styles = StyleSheet.create({
  topBar: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
    backgroundColor: colors.background,
  },
  title: {
    color: colors.text,
    fontSize: 24,
    fontWeight: "700",
  },
  errorWrap: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    backgroundColor: colors.background,
  },
  map: {
    flex: 1,
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalCard: {
    backgroundColor: colors.card,
    padding: spacing.md,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    gap: spacing.sm,
    maxHeight: "70%",
  },
  modalTitle: {
    color: colors.text,
    fontWeight: "700",
    fontSize: 18,
    flex: 1,
  },
  close: {
    color: colors.primary,
    fontWeight: "700",
  },
  meta: {
    color: colors.mutedText,
  },
  row: {
    flexDirection: "row",
    gap: spacing.sm,
    alignItems: "center",
  },
  jsonBlock: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: spacing.sm,
    maxHeight: 180,
  },
  jsonText: {
    color: colors.mutedText,
    fontFamily: "monospace",
    fontSize: 12,
  },
});
