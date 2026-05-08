import * as Location from "expo-location";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Dimensions,
  Image,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Marker, Region } from "react-native-maps";

import { ErrorState } from "@/components/ui/ErrorState";
import { GymReviewForm } from "@/components/gym/GymReviewForm";
import { GymReviewList } from "@/components/gym/GymReviewList";
import { Screen } from "@/components/ui/Screen";
import { useTheme } from "@/context/ThemeContext";
import { FpIcon } from "@/components/ui/FpIcon";
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
const RATING_OPTIONS = [0, 3.0, 3.5, 4.0, 4.5] as const;

export const MapScreen = () => {
  const { t } = useTheme();
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
  const favoritesApi = useGymStore((s) => s.favorites);
  const fetchFavorites = useGymStore((s) => s.fetchFavorites);
  const toggleDbFavorite = useGymStore((s) => s.toggleFavorite);
  const initFavoriteState = useGymStore((s) => s.initFavoriteState);

  useEffect(() => {
    void fetchFavorites();
  }, [fetchFavorites]);

  const favoritedPlaceIdsFromApi = useMemo(() => {
    const next = new Set<string>();
    for (const f of favoritesApi) {
      if (f.place_id) next.add(f.place_id);
    }
    return next;
  }, [favoritesApi]);

  const isListGymFavorited = useCallback(
    (placeId: string) => favoritePlaceIds.has(placeId) || favoritedPlaceIdsFromApi.has(placeId),
    [favoritePlaceIds, favoritedPlaceIdsFromApi],
  );

  // ── Derived / filtered data ───────────────────────────────────────────────

  const filteredNearbyGyms = useMemo(
    () =>
      nearbyGyms.filter((gym) => {
        if (minRating > 0) {
          if (gym.rating == null) return false;
          if (gym.rating < minRating) return false;
        }
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
        if (cancelled) return;

        const detail = await gymApi.resolvePlaceToDbGym(selectedGym.place_id, {
          name: selectedGym.name,
          address: selectedGym.address,
          latitude: selectedGym.latitude,
          longitude: selectedGym.longitude,
          rating: selectedGym.rating,
          image_url: selectedGym.photo_urls?.[0] ?? null,
        });
        if (!cancelled) {
          setLinkedDbGym(detail);
          initFavoriteState(detail.id, detail.is_favorited);
        }
      } catch {
        // graceful no-op — section will show unavailable message
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

  const handleHeartToggle = async () => {
    if (!selectedGym) return;
    animateHeart();

    setFavoritePlaceIds((prev) => {
      const next = new Set(prev);
      prev.has(selectedGym.place_id) ? next.delete(selectedGym.place_id) : next.add(selectedGym.place_id);
      return next;
    });

    if (linkedDbGym !== null) {
      const success = await toggleDbFavorite(linkedDbGym.id);
      if (!success) {
        Alert.alert("Eroare", "Nu s-a putut actualiza favoritul. Incearca din nou.");
        setFavoritePlaceIds((prev) => {
          const next = new Set(prev);
          prev.has(selectedGym.place_id) ? next.add(selectedGym.place_id) : next.delete(selectedGym.place_id);
          return next;
        });
      }
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
    <Screen padded={false} scrollable={false}>
      <View style={{ flex: 1, backgroundColor: t.bg, minHeight: 0 }}>
        <View
          style={{
            paddingHorizontal: 14,
            paddingTop: 10,
            paddingBottom: 10,
            gap: 10,
            borderBottomWidth: StyleSheet.hairlineWidth,
            borderBottomColor: t.lineSoft,
            backgroundColor: t.surface,
          }}
        >
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={{ fontSize: 10, letterSpacing: 1.6, fontWeight: "600", color: t.muted }}>HARTĂ</Text>
              <Text
                style={{
                  fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
                  fontSize: 22,
                  fontWeight: "700",
                  color: t.ink,
                }}
              >
                Săli fitness
              </Text>
              <Text style={{ fontSize: 12, color: t.muted }} numberOfLines={1}>
                Zonă: {cityName}
              </Text>
            </View>
          </View>

          <TextInput
            value={manualLocation}
            onChangeText={setManualLocation}
            placeholder="Oraș sau adresă…"
            placeholderTextColor={t.muted2}
            onSubmitEditing={() => void useManualLocation()}
            style={{
              borderWidth: 1,
              borderColor: t.line,
              borderRadius: 14,
              paddingHorizontal: 14,
              paddingVertical: 11,
              fontSize: 14,
              color: t.ink,
              backgroundColor: t.surface2,
            }}
          />

          <ScrollView
            horizontal
            nestedScrollEnabled
            showsHorizontalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 2 }}
          >
            {[
              {
                key: "me",
                label: "Locația mea",
                onPress: async () => {
                  const c = await loadLocation();
                  if (c) await loadNearby(c);
                },
                loading: loadingLocation,
              },
              { key: "go", label: "Folosește adresa", onPress: () => void useManualLocation(), loading: loadingManualLocation },
              { key: "re", label: "Recentrează", onPress: recenterOnUser },
              { key: "gz", label: "Încarcă săli", onPress: () => void loadNearby(), loading: loadingNearby },
            ].map((btn) => (
              <TouchableOpacity
                key={btn.key}
                onPress={btn.onPress}
                disabled={Boolean(btn.loading)}
                activeOpacity={0.85}
                style={{
                  flexShrink: 0,
                  paddingHorizontal: 14,
                  paddingVertical: 9,
                  borderRadius: 999,
                  borderWidth: 1,
                  borderColor: t.line,
                  backgroundColor: t.surface2,
                  opacity: btn.loading ? 0.65 : 1,
                }}
              >
                <Text style={{ fontSize: 12, fontWeight: "600", color: t.ink }}>
                  {btn.loading ? "…" : btn.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <ScrollView
            horizontal
            nestedScrollEnabled
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
              paddingVertical: 4,
              flexGrow: 0,
            }}
          >
            <Text style={{ fontSize: 12, color: t.muted, flexShrink: 0 }}>Rating:</Text>
            {RATING_OPTIONS.map((n) => {
              const active = minRating === n && !onlyFavorites;
              return (
                <TouchableOpacity
                  key={String(n)}
                  onPress={() => setMinRating(n)}
                  activeOpacity={0.8}
                  style={{
                    flexShrink: 0,
                    alignSelf: "center",
                    paddingHorizontal: 14,
                    paddingVertical: 8,
                    borderRadius: 999,
                    borderWidth: 1,
                    borderColor: active ? "transparent" : t.line,
                    backgroundColor: active ? t.ink : t.surface2,
                  }}
                >
                  <Text style={{ fontSize: 12, fontWeight: "600", color: active ? t.bg : t.muted }}>
                    {n === 0 ? "Toate" : `≥ ${n.toFixed(1)}★`}
                  </Text>
                </TouchableOpacity>
              );
            })}
            <TouchableOpacity
              onPress={() => setOnlyFavorites((v) => !v)}
              activeOpacity={0.8}
              style={{
                flexShrink: 0,
                alignSelf: "center",
                paddingHorizontal: 14,
                paddingVertical: 8,
                borderRadius: 999,
                borderWidth: 1,
                borderColor: onlyFavorites ? "transparent" : t.line,
                backgroundColor: onlyFavorites ? t.ink : t.surface2,
              }}
            >
              <Text style={{ fontSize: 12, fontWeight: "600", color: onlyFavorites ? t.bg : t.muted }}>
                {onlyFavorites ? "♥ Favorite" : "♡ Favorite"}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

      {error ? (
        <View style={{ paddingHorizontal: 14, paddingVertical: 8, backgroundColor: t.bg }}>
          <ErrorState message={error} />
        </View>
      ) : null}

      <MapView
        ref={mapRef}
        style={{ flex: 1, minHeight: 200 }}
        region={region}
        onRegionChangeComplete={setRegion}
        showsUserLocation
        showsMyLocationButton={false}
        scrollEnabled
        zoomEnabled
        pitchEnabled={false}
        rotateEnabled={false}
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

      <View
        style={{
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: t.lineSoft,
          backgroundColor: t.surface,
          paddingHorizontal: 14,
          paddingVertical: 12,
          gap: 8,
        }}
      >
        <Text style={{ fontSize: 13, fontWeight: "700", color: t.ink }}>Cele mai apropiate săli</Text>
        <ScrollView
          horizontal
          nestedScrollEnabled
          keyboardShouldPersistTaps="handled"
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ alignItems: "center", gap: 10, paddingRight: 8 }}
        >
          {nearestGyms.map((gym) => (
            <TouchableOpacity
              key={gym.place_id}
              activeOpacity={0.85}
              onPress={() => void openDetail(gym)}
              style={{
                flexShrink: 0,
                borderWidth: 1,
                borderColor: t.line,
                backgroundColor: t.surface2,
                borderRadius: 16,
                paddingVertical: 10,
                paddingHorizontal: 14,
                maxWidth: 220,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
                <Text style={{ fontWeight: "700", color: t.ink, flex: 1 }} numberOfLines={1}>
                  {gym.name}
                </Text>
                <Text
                  style={{
                    fontSize: 14,
                    color: isListGymFavorited(gym.place_id) ? "#EF4444" : t.muted2,
                  }}
                >
                  {isListGymFavorited(gym.place_id) ? "♥" : "♡"}
                </Text>
              </View>
              <Text style={{ fontSize: 12, color: t.muted, marginTop: 4 }}>
                {gym.distance_m ? `${(gym.distance_m / 1000).toFixed(2)} km` : "—"}
                {gym.rating ? ` · ${gym.rating.toFixed(1)}★` : ""}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* ── Gym detail modal ── */}
      <Modal visible={Boolean(selectedGym)} transparent animationType="slide" onRequestClose={() => setSelectedGym(null)}>
        <View style={modalStyles.backdrop}>
          <View style={[modalStyles.sheet, { backgroundColor: t.surface, borderColor: t.line, maxHeight: Dimensions.get("window").height * 0.88 }]}>
            <ScrollView
              nestedScrollEnabled
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator
              contentContainerStyle={{ gap: 12, paddingBottom: 36 }}
            >
              {loadingDetail ? <Text style={{ color: t.muted }}>Se încarcă...</Text> : null}
              {selectedGym ? (
                <>
                  <View style={{ flexDirection: "row", gap: 10, alignItems: "center" }}>
                    <Text style={{ color: t.ink, fontWeight: "700", fontSize: 18, flex: 1 }}>{selectedGym.name}</Text>
                    <Animated.View style={{ transform: [{ scale: heartScale }] }}>
                      <Pressable onPress={() => void handleHeartToggle()} hitSlop={8}>
                        <Text style={{ fontSize: 24, color: isGymFavorited ? "#EF4444" : t.muted2 }}>
                          {isGymFavorited ? "♥" : "♡"}
                        </Text>
                      </Pressable>
                    </Animated.View>
                    <Pressable onPress={() => setSelectedGym(null)}>
                      <Text style={{ color: t.primary, fontWeight: "700" }}>Închide</Text>
                    </Pressable>
                  </View>

                  {selectedGym.photo_urls?.[0] ? (
                    <Image
                      source={{ uri: selectedGym.photo_urls[0] }}
                      style={{ width: "100%", height: 180, borderRadius: 14, backgroundColor: t.lineSoft }}
                      resizeMode="cover"
                    />
                  ) : null}
                  {selectedGym.address ? <Text style={{ color: t.muted }}>{selectedGym.address}</Text> : null}
                  <Text style={{ color: t.muted }}>Rating: {selectedGym.rating?.toFixed(1) ?? "N/A"}</Text>
                  <Text style={{ color: t.muted }}>Recenzii Google: {selectedGym.review_count ?? 0}</Text>
                  {selectedGym.website ? (
                    <Pressable onPress={openWebsite}>
                      <Text style={{ color: t.primary, fontWeight: "700" }}>Website oficial</Text>
                    </Pressable>
                  ) : null}

                  <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                    {[
                      { m: "walking" as const, label: "Pe jos" },
                      { m: "driving" as const, label: "Auto" },
                      { m: "transit" as const, label: "Transit" },
                    ].map(({ m, label }) => (
                      <TouchableOpacity
                        key={m}
                        onPress={() => openDirections(m)}
                        activeOpacity={0.85}
                        style={{
                          flexShrink: 0,
                          paddingHorizontal: 14,
                          paddingVertical: 10,
                          borderRadius: 12,
                          backgroundColor: t.primary,
                        }}
                      >
                        <Text style={{ color: t.primaryInk, fontWeight: "700", fontSize: 13 }}>{label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {selectedGym.opening_hours?.length ? (
                    <View style={{ borderTopWidth: 1, borderTopColor: t.lineSoft, paddingTop: 12, gap: 6 }}>
                      <Text style={{ fontWeight: "700", color: t.ink }}>Program</Text>
                      {selectedGym.opening_hours.map((line) => (
                        <Text key={line} style={{ color: t.muted, fontSize: 13 }}>
                          {line}
                        </Text>
                      ))}
                    </View>
                  ) : null}

                  {loadingDbGym ? (
                    <Text style={{ color: t.muted }}>Se încarcă recenziile...</Text>
                  ) : !linkedDbGym ? (
                    <Text style={{ color: t.muted }}>
                      Recenziile și favoritele nu sunt disponibile pentru această sală.
                    </Text>
                  ) : (
                    <View style={{ borderTopWidth: 1, borderTopColor: t.lineSoft, paddingTop: 12, gap: 10 }}>
                      <Text style={{ fontWeight: "700", color: t.ink }}>Recenzii</Text>
                      <GymReviewList reviews={linkedDbGym.reviews} averageRating={linkedDbGym.average_rating} />
                      {showReviewForm ? (
                        <GymReviewForm
                          gymId={linkedDbGym.id}
                          onSuccess={() => {
                            setShowReviewForm(false);
                            refreshLinkedDbGym();
                          }}
                        />
                      ) : (
                        <TouchableOpacity
                          onPress={() => setShowReviewForm(true)}
                          activeOpacity={0.85}
                          style={{
                            borderWidth: 1,
                            borderColor: t.primary,
                            borderRadius: 12,
                            paddingVertical: 12,
                            alignItems: "center",
                          }}
                        >
                          <Text style={{ color: t.primary, fontWeight: "700" }}>+ Adaugă recenzie</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  )}

                  <Text style={{ color: t.muted, fontSize: 12 }}>
                    Detaliile pot diferi față de Google Places; verifică la fața locului.
                  </Text>
                </>
              ) : null}
            </ScrollView>
          </View>
        </View>
      </Modal>
      </View>
    </Screen>
  );
};

const modalStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  sheet: {
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
    width: "100%",
  },
});
