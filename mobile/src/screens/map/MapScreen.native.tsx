import * as Location from "expo-location";
import { useEffect, useMemo, useRef, useState } from "react";
import { Animated, Image, Linking, Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import MapView, { Marker, Region } from "react-native-maps";

import { Button } from "@/components/ui/Button";
import { ErrorState } from "@/components/ui/ErrorState";
import { GymReviewForm } from "@/components/gym/GymReviewForm";
import { GymReviewList } from "@/components/gym/GymReviewList";
import { Input } from "@/components/ui/Input";
import { Screen } from "@/components/ui/Screen";
import { colors, radius, spacing } from "@/constants/theme";
import { GymDetailExtended, gymApi } from "@/services/gymApi";
import { GeocodeResult, RealGymDetail, RealGymSummary, placesApi } from "@/services/placesApi";
import { useGymStore } from "@/store/gymStore";

const BUCHAREST = {
  latitude: 44.4268,
  longitude: 26.1025,
  latitudeDelta: 0.12,
  longitudeDelta: 0.12,
};
const CITY_RADIUS_M = 25_000;
const RATING_OPTIONS = [0, 1, 2, 3, 4, 5] as const;

export const MapScreen = () => {
  const mapRef = useRef<MapView | null>(null);
  const heartScale = useRef(new Animated.Value(1)).current;

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

  // Filter state
  const [minRating, setMinRating] = useState(0);
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [favoritePlaceIds, setFavoritePlaceIds] = useState<Set<string>>(new Set());

  // DB gym linking for reviews + DB favorites
  const [linkedDbGym, setLinkedDbGym] = useState<GymDetailExtended | null>(null);
  const [loadingDbGym, setLoadingDbGym] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);

  const favoriteDbIds = useGymStore((s) => s.favoriteGymIds);
  const toggleDbFavorite = useGymStore((s) => s.toggleFavorite);
  const initFavoriteState = useGymStore((s) => s.initFavoriteState);

  // ── Derived / filtered data ───────────────────────────────────────────────

  const filteredNearbyGyms = useMemo(
    () =>
      nearbyGyms.filter((gym) => {
        if (minRating > 0 && (gym.rating ?? 0) < minRating) return false;
        if (onlyFavorites && !favoritePlaceIds.has(gym.place_id)) return false;
        return true;
      }),
    [nearbyGyms, minRating, onlyFavorites, favoritePlaceIds],
  );

  const nearestGyms = useMemo(() => filteredNearbyGyms.slice(0, 5), [filteredNearbyGyms]);

  const isGymFavorited = useMemo(() => {
    if (!selectedGym) return false;
    if (linkedDbGym !== null) return favoriteDbIds.has(linkedDbGym.id);
    return favoritePlaceIds.has(selectedGym.place_id);
  }, [selectedGym, linkedDbGym, favoriteDbIds, favoritePlaceIds]);

  // ── Map helpers ───────────────────────────────────────────────────────────

  const centerMap = (latitude: number, longitude: number) => {
    const nextRegion: Region = { latitude, longitude, latitudeDelta: 0.05, longitudeDelta: 0.05 };
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
      const coords = { latitude: position.coords.latitude, longitude: position.coords.longitude };
      setUserLocation(coords);
      centerMap(coords.latitude, coords.longitude);
      const geocode = await Location.reverseGeocodeAsync(coords);
      const city = geocode[0]?.city ?? geocode[0]?.subregion ?? geocode[0]?.region;
      if (city) setCityName(city);
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
      const gyms = await placesApi.searchNearbyGyms({ latitude: refLat, longitude: refLng, radius_m: CITY_RADIUS_M });
      setNearbyGyms(gyms);
      if (!gyms.length) setError(`Nu am gasit sali in aria selectata pentru ${cityName}.`);
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
    if (!userLocation) { setError("Locatia utilizatorului nu este disponibila inca."); return; }
    centerMap(userLocation.latitude, userLocation.longitude);
  };

  const useManualLocation = async () => {
    const query = manualLocation.trim();
    if (!query) { setError("Introdu un oras sau o adresa."); return; }
    setLoadingManualLocation(true);
    setError(null);
    try {
      const geocoded: GeocodeResult = await placesApi.geocode(query);
      if (geocoded.city) setCityName(geocoded.city);
      else setCityName(geocoded.formatted_address);
      centerMap(geocoded.latitude, geocoded.longitude);
      await loadNearby({ latitude: geocoded.latitude, longitude: geocoded.longitude });
    } catch {
      setError("Nu am putut geocoda locatia introdusa.");
    } finally {
      setLoadingManualLocation(false);
    }
  };

  const openWebsite = () => {
    if (!selectedGym?.website) return;
    void Linking.openURL(selectedGym.website);
  };

  const openDirections = (mode: "walking" | "driving" | "transit") => {
    if (!selectedGym) return;
    const origin = userLocation
      ? `${userLocation.latitude},${userLocation.longitude}`
      : `${region.latitude},${region.longitude}`;
    const destination = `${selectedGym.latitude},${selectedGym.longitude}`;
    void Linking.openURL(
      `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&travelmode=${mode}`,
    );
  };

  // ── DB gym lookup (for reviews + DB favorites) ────────────────────────────

  useEffect(() => {
    if (!selectedGym) {
      setLinkedDbGym(null);
      setShowReviewForm(false);
      return;
    }
    let cancelled = false;
    setLoadingDbGym(true);
    setLinkedDbGym(null);
    setShowReviewForm(false);

    const lookup = async () => {
      try {
        const dbGyms = await gymApi.getNearby({
          latitude: selectedGym.latitude,
          longitude: selectedGym.longitude,
          radius_m: 300,
        });
        if (cancelled) return;

        const selectedName = selectedGym.name.toLowerCase();
        const firstWord = (s: string) => s.split(/\s+/)[0];
        const match = dbGyms.find((g) => {
          const dbName = g.name.toLowerCase();
          return selectedName.includes(firstWord(dbName)) || dbName.includes(firstWord(selectedName));
        });

        if (match) {
          const detail = await gymApi.getDetailExtended(match.id);
          if (!cancelled) {
            setLinkedDbGym(detail);
            initFavoriteState(match.id, detail.is_favorited);
          }
        }
      } catch {
        // No DB match — graceful no-op
      } finally {
        if (!cancelled) setLoadingDbGym(false);
      }
    };

    void lookup();
    return () => { cancelled = true; };
  }, [selectedGym]);

  // ── Heart / favorite helpers ──────────────────────────────────────────────

  const animateHeart = () => {
    Animated.sequence([
      Animated.timing(heartScale, { toValue: 1.45, duration: 100, useNativeDriver: true }),
      Animated.timing(heartScale, { toValue: 1.0, duration: 150, useNativeDriver: true }),
    ]).start();
  };

  const handleHeartToggle = () => {
    if (!selectedGym) return;
    animateHeart();

    // Update local set so the map filter works immediately
    setFavoritePlaceIds((prev) => {
      const next = new Set(prev);
      prev.has(selectedGym.place_id) ? next.delete(selectedGym.place_id) : next.add(selectedGym.place_id);
      return next;
    });

    // Also sync with the DB favorites store when we have a linked gym
    if (linkedDbGym !== null) {
      void toggleDbFavorite(linkedDbGym.id);
    }
  };

  const refreshLinkedDbGym = () => {
    if (!linkedDbGym) return;
    gymApi
      .getDetailExtended(linkedDbGym.id)
      .then((detail) => setLinkedDbGym(detail))
      .catch(() => {});
  };

  // ── Bootstrap ─────────────────────────────────────────────────────────────

  useEffect(() => {
    let mounted = true;
    const bootstrapMap = async () => {
      const coords = await loadLocation();
      if (!mounted) return;
      await loadNearby(coords ?? undefined);
    };
    void bootstrapMap();
    return () => { mounted = false; };
  }, []);

  // ── Render ────────────────────────────────────────────────────────────────

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

        {/* ── Filter row ── */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={styles.filterRow}>
          <Text style={styles.filterLabel}>Min ★:</Text>
          {RATING_OPTIONS.map((n) => (
            <Pressable
              key={n}
              onPress={() => setMinRating(n)}
              style={[styles.chip, minRating === n && styles.chipActive]}
            >
              <Text style={[styles.chipText, minRating === n && styles.chipTextActive]}>
                {n === 0 ? "Any" : `${n}★`}
              </Text>
            </Pressable>
          ))}
          <Pressable
            onPress={() => setOnlyFavorites((v) => !v)}
            style={[styles.chip, styles.chipFav, onlyFavorites && styles.chipActive]}
          >
            <Text style={[styles.chipText, onlyFavorites && styles.chipTextActive]}>
              {onlyFavorites ? "♥ Favs only" : "♡ Favs only"}
            </Text>
          </Pressable>
        </ScrollView>
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
            coordinate={userLocation}
            pinColor="#2563EB"
            title="Locatia ta"
            description="Acesta este punctul tau curent"
          />
        ) : null}
        {filteredNearbyGyms.map((gym) => (
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
              <Text style={styles.nearestName} numberOfLines={1}>{gym.name}</Text>
              <Text style={styles.nearestMeta}>
                {gym.distance_m ? `${(gym.distance_m / 1000).toFixed(2)} km` : "N/A"}{" "}
                {gym.rating ? `| ${gym.rating.toFixed(1)}★` : ""}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* ── Gym detail modal ── */}
      <Modal visible={Boolean(selectedGym)} transparent animationType="slide" onRequestClose={() => setSelectedGym(null)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <ScrollView contentContainerStyle={styles.modalContent}>
              {loadingDetail ? <Text style={styles.meta}>Se incarca...</Text> : null}
              {selectedGym ? (
                <>
                  {/* Header row: title + heart + close */}
                  <View style={styles.row}>
                    <Text style={styles.modalTitle}>{selectedGym.name}</Text>
                    <Animated.View style={{ transform: [{ scale: heartScale }] }}>
                      <Pressable onPress={handleHeartToggle} style={styles.heartBtn} hitSlop={8}>
                        <Text style={[styles.heartText, isGymFavorited && styles.heartTextActive]}>
                          {isGymFavorited ? "♥" : "♡"}
                        </Text>
                      </Pressable>
                    </Animated.View>
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
                        <Text key={line} style={styles.meta}>{line}</Text>
                      ))}
                    </View>
                  ) : null}

                  {/* ── Reviews section (linked DB gym) ── */}
                  {loadingDbGym ? (
                    <Text style={styles.meta}>Se incarca recenzii...</Text>
                  ) : linkedDbGym ? (
                    <View style={styles.section}>
                      <Text style={styles.sectionTitle}>Recenzii</Text>
                      <GymReviewList
                        reviews={linkedDbGym.reviews}
                        averageRating={linkedDbGym.average_rating}
                      />
                      {showReviewForm ? (
                        <GymReviewForm
                          gymId={linkedDbGym.id}
                          onSuccess={() => {
                            setShowReviewForm(false);
                            refreshLinkedDbGym();
                          }}
                        />
                      ) : (
                        <Pressable onPress={() => setShowReviewForm(true)} style={styles.addReviewBtn}>
                          <Text style={styles.addReviewLabel}>+ Adauga recenzie</Text>
                        </Pressable>
                      )}
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
  filterScroll: {
    flexGrow: 0,
  },
  filterRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingVertical: spacing[1],
  },
  filterLabel: {
    color: colors.mutedText,
    fontSize: 13,
    marginRight: spacing.xs,
  },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.chip,
    paddingVertical: 4,
    paddingHorizontal: spacing.sm,
  },
  chipFav: {
    marginLeft: spacing.xs,
  },
  chipActive: {
    borderColor: colors.accent.base,
    backgroundColor: colors.accent.muted,
  },
  chipText: {
    color: colors.mutedText,
    fontSize: 13,
  },
  chipTextActive: {
    color: colors.accent.base,
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
    gap: spacing.sm,
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
    maxHeight: "75%",
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
  heartBtn: {
    padding: spacing[1],
  },
  heartText: {
    fontSize: 24,
    color: colors.border,
  },
  heartTextActive: {
    color: "#EF4444",
  },
  meta: {
    color: colors.mutedText,
  },
  row: {
    flexDirection: "row",
    gap: spacing.sm,
    alignItems: "center",
  },
  addReviewBtn: {
    borderWidth: 1,
    borderColor: colors.accent.base,
    borderRadius: radius.button,
    paddingVertical: spacing.sm,
    alignItems: "center",
  },
  addReviewLabel: {
    color: colors.accent.base,
    fontWeight: "700",
    fontSize: 14,
  },
});
