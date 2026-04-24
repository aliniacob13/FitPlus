import * as Location from "expo-location";
import { useEffect, useMemo, useRef, useState } from "react";
import { Image, Linking, Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import MapView, { Marker, Region } from "react-native-maps";

import { Button } from "@/components/ui/Button";
import { ErrorState } from "@/components/ui/ErrorState";
import { Input } from "@/components/ui/Input";
import { Screen } from "@/components/ui/Screen";
import { colors, spacing } from "@/constants/theme";
import { GeocodeResult, RealGymDetail, RealGymSummary, placesApi } from "@/services/placesApi";

const BUCHAREST = {
  latitude: 44.4268,
  longitude: 26.1025,
  latitudeDelta: 0.12,
  longitudeDelta: 0.12,
};
const CITY_RADIUS_M = 25_000;

export const MapScreen = () => {
  const mapRef = useRef<MapView | null>(null);
  const [region, setRegion] = useState<Region>(BUCHAREST);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [cityName, setCityName] = useState<string>("Bucuresti");
  const [manualLocation, setManualLocation] = useState("");
  const [nearbyGyms, setNearbyGyms] = useState<RealGymSummary[]>([]);
  const [selectedNearbyGymId, setSelectedNearbyGymId] = useState<string | null>(null);
  const [selectedGym, setSelectedGym] = useState<RealGymDetail | null>(null);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [loadingManualLocation, setLoadingManualLocation] = useState(false);
  const [loadingNearby, setLoadingNearby] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const nearestGyms = useMemo(() => nearbyGyms.slice(0, 5), [nearbyGyms]);

  const centerMap = (latitude: number, longitude: number) => {
    const nextRegion: Region = {
      latitude,
      longitude,
      latitudeDelta: 0.05,
      longitudeDelta: 0.05,
    };
    setRegion(nextRegion);
    mapRef.current?.animateToRegion(nextRegion, 500);
  };

  const loadLocation = async (): Promise<{ latitude: number; longitude: number } | null> => {
    setLoadingLocation(true);
    setError(null);
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== Location.PermissionStatus.GRANTED) {
        setError("Permisiunea de locatie a fost refuzata. Folosim zona default.");
        return null;
      }

      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const coords = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };
      setUserLocation(coords);
      centerMap(coords.latitude, coords.longitude);

      const geocode = await Location.reverseGeocodeAsync(coords);
      const city = geocode[0]?.city ?? geocode[0]?.subregion ?? geocode[0]?.region;
      if (city) {
        setCityName(city);
      }
      return coords;
    } catch {
      setError("Nu am putut determina locatia curenta.");
      return null;
    } finally {
      setLoadingLocation(false);
    }
  };

  const loadNearby = async (reference?: { latitude: number; longitude: number }) => {
    setLoadingNearby(true);
    setError(null);
    try {
      const refLat = reference?.latitude ?? userLocation?.latitude ?? region.latitude;
      const refLng = reference?.longitude ?? userLocation?.longitude ?? region.longitude;
      const gyms = await placesApi.searchNearbyGyms({
        latitude: refLat,
        longitude: refLng,
        radius_m: CITY_RADIUS_M,
      });
      setNearbyGyms(gyms);
      if (!gyms.length) {
        setError(`Nu am gasit sali in aria selectata pentru ${cityName}.`);
      }
    } catch {
      setError("Nu am putut incarca salile din apropiere.");
    } finally {
      setLoadingNearby(false);
    }
  };

  const openDetail = async (gym: RealGymSummary) => {
    setSelectedNearbyGymId(gym.place_id);
    centerMap(gym.latitude, gym.longitude);
    setLoadingDetail(true);
    setError(null);
    try {
      const detail = await placesApi.getGymDetail(gym.place_id);
      setSelectedGym(detail);
    } catch {
      setError("Nu am putut incarca detaliile salii.");
    } finally {
      setLoadingDetail(false);
    }
  };

  const recenterOnUser = () => {
    if (!userLocation) {
      setError("Locatia utilizatorului nu este disponibila inca.");
      return;
    }
    centerMap(userLocation.latitude, userLocation.longitude);
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
      if (geocoded.city) {
        setCityName(geocoded.city);
      } else {
        setCityName(geocoded.formatted_address);
      }
      centerMap(geocoded.latitude, geocoded.longitude);
      await loadNearby({ latitude: geocoded.latitude, longitude: geocoded.longitude });
    } catch {
      setError("Nu am putut geocoda locatia introdusa.");
    } finally {
      setLoadingManualLocation(false);
    }
  };

  const openWebsite = () => {
    if (!selectedGym?.website) {
      return;
    }
    void Linking.openURL(selectedGym.website);
  };

  const openDirections = (mode: "walking" | "driving" | "transit") => {
    if (!selectedGym) {
      return;
    }
    const origin = userLocation
      ? `${userLocation.latitude},${userLocation.longitude}`
      : `${region.latitude},${region.longitude}`;
    const destination = `${selectedGym.latitude},${selectedGym.longitude}`;
    const url = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&travelmode=${mode}`;
    void Linking.openURL(url);
  };

  useEffect(() => {
    let mounted = true;
    const bootstrapMap = async () => {
      const coords = await loadLocation();
      if (!mounted) {
        return;
      }
      await loadNearby(coords ?? undefined);
    };
    void bootstrapMap();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <Screen padded={false}>
      <View style={styles.topBar}>
        <Text style={styles.title}>Harta sali</Text>
        <Text style={styles.subtitle}>Zona curenta: {cityName}</Text>
        <Input
          label="Locatie manuala (oras/adresa)"
          value={manualLocation}
          onChangeText={setManualLocation}
          placeholder="Ex: Iasi, Romania"
        />
        <View style={styles.actions}>
          <Button label="Locatia mea" onPress={() => void loadLocation()} loading={loadingLocation} />
          <Button label="Foloseste locatia introdusa" onPress={() => void useManualLocation()} loading={loadingManualLocation} />
          <Button label="Recenter" onPress={recenterOnUser} />
          <Button label="Sali in zona hartii" onPress={() => void loadNearby()} loading={loadingNearby} />
        </View>
      </View>
      {error ? (
        <View style={styles.errorWrap}>
          <ErrorState message={error} />
        </View>
      ) : null}

      <MapView
        ref={mapRef}
        style={styles.map}
        region={region}
        onRegionChangeComplete={setRegion}
        showsUserLocation
        showsMyLocationButton
      >
        {userLocation ? (
          <Marker
            coordinate={{ latitude: userLocation.latitude, longitude: userLocation.longitude }}
            pinColor="#2563EB"
            title="Locatia ta"
            description="Acesta este punctul tau curent"
          />
        ) : null}
        {nearbyGyms.map((gym) => (
          <Marker
            key={gym.place_id}
            coordinate={{ latitude: gym.latitude, longitude: gym.longitude }}
            title={gym.name}
            description={gym.address ?? undefined}
            pinColor={selectedNearbyGymId === gym.place_id ? "#EF4444" : undefined}
            onPress={() => void openDetail(gym)}
          />
        ))}
      </MapView>

      <View style={styles.nearestPanel}>
        <Text style={styles.nearestTitle}>Cele mai apropiate sali</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {nearestGyms.map((gym) => (
            <Pressable key={gym.place_id} style={styles.nearestCard} onPress={() => void openDetail(gym)}>
              <Text style={styles.nearestName} numberOfLines={1}>
                {gym.name}
              </Text>
              <Text style={styles.nearestMeta}>
                {gym.distance_m ? `${(gym.distance_m / 1000).toFixed(2)} km` : "N/A"} {gym.rating ? `| ${gym.rating.toFixed(1)}★` : ""}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <Modal visible={Boolean(selectedGym)} transparent animationType="slide" onRequestClose={() => setSelectedGym(null)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <ScrollView contentContainerStyle={styles.modalContent}>
              {loadingDetail ? <Text style={styles.meta}>Se incarca...</Text> : null}
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
                  {selectedGym.address ? <Text style={styles.meta}>{selectedGym.address}</Text> : null}
                  <Text style={styles.meta}>Rating: {selectedGym.rating?.toFixed(1) ?? "N/A"}</Text>
                  <Text style={styles.meta}>Review-uri: {selectedGym.review_count ?? 0}</Text>
                  {selectedGym.website ? (
                    <Pressable onPress={openWebsite}>
                      <Text style={styles.website}>Website oficial</Text>
                    </Pressable>
                  ) : null}
                  <View style={styles.directionRow}>
                    <Button label="Cum ajung (pe jos)" onPress={() => openDirections("walking")} />
                    <Button label="Cum ajung (auto)" onPress={() => openDirections("driving")} />
                    <Button label="Cum ajung (transit)" onPress={() => openDirections("transit")} />
                  </View>
                  {selectedGym.opening_hours?.length ? (
                    <View style={styles.section}>
                      <Text style={styles.sectionTitle}>Program</Text>
                      {selectedGym.opening_hours.map((line) => (
                        <Text key={line} style={styles.meta}>
                          {line}
                        </Text>
                      ))}
                    </View>
                  ) : null}
                  <Text style={styles.hint}>
                    Echipamente si preturi detaliate pot varia pe Google Places; unde exista, le putem adauga in urmatorul pas.
                  </Text>
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
  subtitle: {
    color: colors.mutedText,
  },
  actions: {
    gap: spacing.sm,
  },
  errorWrap: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    backgroundColor: colors.background,
  },
  map: {
    flex: 1,
  },
  nearestPanel: {
    borderTopWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    padding: spacing.md,
    gap: spacing.sm,
  },
  nearestTitle: {
    color: colors.text,
    fontWeight: "700",
  },
  nearestCard: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    borderRadius: 999,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginRight: spacing.sm,
    minWidth: 180,
  },
  nearestName: {
    color: colors.text,
    fontWeight: "700",
  },
  nearestMeta: {
    color: colors.mutedText,
    marginTop: 2,
  },
  heroImage: {
    width: "100%",
    height: 170,
    borderRadius: 12,
    backgroundColor: colors.border,
  },
  website: {
    color: colors.primary,
    fontWeight: "700",
  },
  directionRow: {
    gap: spacing.sm,
  },
  section: {
    borderTopWidth: 1,
    borderColor: colors.border,
    paddingTop: spacing.sm,
    gap: spacing.xs,
  },
  sectionTitle: {
    color: colors.text,
    fontWeight: "700",
  },
  hint: {
    color: colors.mutedText,
    fontSize: 12,
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
  modalContent: {
    gap: spacing.sm,
    paddingBottom: spacing.lg,
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
});
