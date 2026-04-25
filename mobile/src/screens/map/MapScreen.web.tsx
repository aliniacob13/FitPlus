import * as Location from "expo-location";
import React, { useEffect, useMemo, useState } from "react";
import { Image, Linking, Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { Button } from "@/components/ui/Button";
import { ErrorState } from "@/components/ui/ErrorState";
import { Input } from "@/components/ui/Input";
import { Screen } from "@/components/ui/Screen";
import { colors, spacing } from "@/constants/theme";
import { GeocodeResult, RealGymDetail, RealGymSummary, placesApi } from "@/services/placesApi";

const BUCHAREST = { latitude: 44.4268, longitude: 26.1025 };
const CITY_RADIUS_M = 25_000;

const openMaps = (gym: { name: string; latitude: number; longitude: number }) => {
  const query = encodeURIComponent(`${gym.name} ${gym.latitude},${gym.longitude}`);
  void Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${query}`);
};

const MapEmbed = ({ uri }: { uri: string }) =>
  React.createElement("iframe", {
    src: uri,
    style: {
      border: "none",
      width: "100%",
      height: "100%",
      borderRadius: 8,
    },
    loading: "lazy",
    referrerPolicy: "no-referrer-when-downgrade",
  });

export const MapScreen = () => {
  const [coords, setCoords] = useState(BUCHAREST);
  const [cityName, setCityName] = useState("Bucuresti");
  const [manualLocation, setManualLocation] = useState("");
  const [nearbyGyms, setNearbyGyms] = useState<RealGymSummary[]>([]);
  const [selectedGym, setSelectedGym] = useState<RealGymDetail | null>(null);
  const [loadingManualLocation, setLoadingManualLocation] = useState(false);
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
        const nextCoords = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
        setCoords(nextCoords);
        const geocode = await Location.reverseGeocodeAsync(nextCoords);
        const city = geocode[0]?.city ?? geocode[0]?.subregion ?? geocode[0]?.region;
        if (city) {
          setCityName(city);
        }
      } catch {
        // Keep Bucharest fallback.
      }
    };
    void loadLocation();
  }, []);

  const loadNearby = async (reference?: { latitude: number; longitude: number }) => {
    setLoading(true);
    setError(null);
    try {
      const refCoords = reference ?? coords;
      const gyms = await placesApi.searchNearbyGyms({
        latitude: refCoords.latitude,
        longitude: refCoords.longitude,
        radius_m: CITY_RADIUS_M,
      });
      setNearbyGyms(gyms);
    } catch {
      setError("Nu am putut incarca salile reale din zona. Verifica GOOGLE_MAPS_API_KEY.");
    } finally {
      setLoading(false);
    }
  };

  const nearestGyms = useMemo(() => nearbyGyms.slice(0, 5), [nearbyGyms]);

  const loadGymDetail = async (placeId: string) => {
    try {
      const detail = await placesApi.getGymDetail(placeId);
      setSelectedGym(detail);
    } catch {
      setError("Nu am putut incarca detaliile salii.");
    }
  };

  const useManualLocation = async () => {
    const query = manualLocation.trim();
    if (!query) {
      setError("Introdu un oras sau o adresa.");
      return;
    }
    setLoadingManualLocation(true);
    setError(null);
    try {
      const geocoded: GeocodeResult = await placesApi.geocode(query);
      const nextCoords = { latitude: geocoded.latitude, longitude: geocoded.longitude };
      setCoords(nextCoords);
      setCityName(geocoded.city ?? geocoded.formatted_address);
      await loadNearby(nextCoords);
    } catch {
      setError("Nu am putut geocoda locatia introdusa.");
    } finally {
      setLoadingManualLocation(false);
    }
  };

  const openDirections = (mode: "walking" | "driving" | "transit") => {
    if (!selectedGym) {
      return;
    }
    const origin = `${coords.latitude},${coords.longitude}`;
    const destination = `${selectedGym.latitude},${selectedGym.longitude}`;
    const url = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&travelmode=${mode}`;
    void Linking.openURL(url);
  };

  return (
    <Screen padded={false}>
      <ScrollView style={styles.page} contentContainerStyle={styles.pageContent}>
        <View style={styles.container}>
        <Text style={styles.title}>Map (Web)</Text>
        <Text style={styles.description}>
          Cauta sali reale din orasul curent sau muta manual locatia.
        </Text>
        <Text style={styles.city}>Zona curenta: {cityName}</Text>
        <Input
          label="Locatie manuala (oras/adresa)"
          value={manualLocation}
          onChangeText={setManualLocation}
          placeholder="Ex: Iasi, Romania"
        />
        <Button label="Foloseste locatia introdusa" onPress={() => void useManualLocation()} loading={loadingManualLocation} />
        <Button label="Incarca sali reale din zona" onPress={() => void loadNearby()} loading={loading} />
        {error ? <ErrorState message={error} /> : null}

        <View style={styles.mapCard}>
          <Text style={styles.mapTitle}>Harta interactiva (Web)</Text>
          <View style={styles.mapFrame}>
            <MapEmbed uri={`https://www.google.com/maps?q=${coords.latitude},${coords.longitude}&z=12&output=embed`} />
          </View>
        </View>

        <View style={styles.nearest}>
          <Text style={styles.nearestTitle}>Cele mai apropiate sali</Text>
          {nearestGyms.map((gym) => (
            <Pressable
              key={`nearest-${gym.place_id}`}
              style={styles.nearestCard}
              onPress={() => void loadGymDetail(gym.place_id)}
            >
              <Text style={styles.cardTitle}>{gym.name}</Text>
              <Text style={styles.meta}>
                {gym.distance_m ? `${(gym.distance_m / 1000).toFixed(2)} km` : "N/A"} {gym.rating ? `| ${gym.rating.toFixed(1)}★` : ""}
              </Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.list}>
          {nearbyGyms.map((gym) => (
            <Pressable key={gym.place_id} style={styles.card} onPress={() => void loadGymDetail(gym.place_id)}>
              <Text style={styles.cardTitle}>{gym.name}</Text>
              <Text style={styles.meta}>
                {gym.distance_m ? `${(gym.distance_m / 1000).toFixed(2)} km` : "N/A"} {gym.rating ? `| ${gym.rating.toFixed(1)}★` : ""}
              </Text>
              {gym.address ? <Text style={styles.address}>{gym.address}</Text> : null}
            </Pressable>
          ))}
        </View>
      </View>
      </ScrollView>

      <Modal visible={Boolean(selectedGym)} transparent animationType="slide" onRequestClose={() => setSelectedGym(null)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <ScrollView contentContainerStyle={styles.modalContent}>
              {selectedGym ? (
                <>
                  <View style={styles.row}>
                    <Text style={styles.modalTitle}>{selectedGym.name}</Text>
                    <Pressable onPress={() => setSelectedGym(null)}>
                      <Text style={styles.close}>Inchide</Text>
                    </Pressable>
                  </View>
                  {selectedGym.photo_urls[0] ? (
                    <Image source={{ uri: selectedGym.photo_urls[0] }} style={styles.heroImage} resizeMode="cover" />
                  ) : null}
                  {selectedGym.address ? <Text style={styles.address}>{selectedGym.address}</Text> : null}
                  <Text style={styles.meta}>Rating: {selectedGym.rating?.toFixed(1) ?? "N/A"}</Text>
                  <Text style={styles.meta}>Review-uri: {selectedGym.review_count ?? 0}</Text>
                  {selectedGym.website ? (
                    <Button label="Website oficial" onPress={() => void Linking.openURL(selectedGym.website ?? "")} />
                  ) : null}
                  <Button label="Google Maps (destinatie)" onPress={() => openMaps(selectedGym)} />
                  <Button label="Cum ajung (pe jos)" onPress={() => openDirections("walking")} />
                  <Button label="Cum ajung (auto)" onPress={() => openDirections("driving")} />
                  <Button label="Cum ajung (transit)" onPress={() => openDirections("transit")} />
                  {selectedGym.opening_hours?.length ? (
                    <View style={styles.hours}>
                      <Text style={styles.hoursTitle}>Program</Text>
                      {selectedGym.opening_hours.map((line) => (
                        <Text key={line} style={styles.address}>
                          {line}
                        </Text>
                      ))}
                    </View>
                  ) : null}
                </>
              ) : null}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </Screen>
  );
};

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: colors.background,
  },
  pageContent: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  container: {
    gap: spacing.md,
  },
  title: {
    color: colors.text,
    fontSize: 24,
    fontWeight: "700",
  },
  description: {
    color: colors.mutedText,
  },
  city: {
    color: colors.text,
    fontWeight: "600",
  },
  nearest: {
    gap: spacing.sm,
  },
  nearestTitle: {
    color: colors.text,
    fontWeight: "700",
  },
  nearestCard: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: spacing.sm,
    gap: spacing.xs,
  },
  list: {
    gap: spacing.sm,
  },
  mapCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm,
    gap: spacing.sm,
  },
  mapTitle: {
    color: colors.text,
    fontWeight: "700",
  },
  mapFrame: {
    height: 280,
    borderRadius: 8,
    overflow: "hidden",
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
  heroImage: {
    width: "100%",
    height: 180,
    borderRadius: 12,
    backgroundColor: colors.border,
  },
  hours: {
    gap: spacing.xs,
  },
  hoursTitle: {
    color: colors.text,
    fontWeight: "700",
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  modalCard: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: spacing.md,
    maxHeight: "80%",
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalContent: {
    gap: spacing.sm,
    paddingBottom: spacing.lg,
  },
  row: {
    flexDirection: "row",
    gap: spacing.sm,
    alignItems: "center",
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
});
