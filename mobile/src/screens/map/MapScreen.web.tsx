import * as Location from "expo-location";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Alert, Animated, Image, Linking, Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

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

const BUCHAREST = { latitude: 44.4268, longitude: 26.1025 };
const CITY_RADIUS_M = 25_000;
const RATING_OPTIONS = [0, 3.0, 3.5, 4.0, 4.5] as const;

const openMaps = (gym: { name: string; latitude: number; longitude: number }) => {
  const query = encodeURIComponent(`${gym.name} ${gym.latitude},${gym.longitude}`);
  void Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${query}`);
};

const MapEmbed = ({ uri }: { uri: string }) =>
  React.createElement("iframe", {
    src: uri,
    style: { border: "none", width: "100%", height: "100%", borderRadius: 8 },
    loading: "lazy",
    referrerPolicy: "no-referrer-when-downgrade",
  });

export const MapScreen = () => {
  const heartScale = useRef(new Animated.Value(1)).current;

  const [coords, setCoords] = useState(BUCHAREST);
  const [cityName, setCityName] = useState("Bucuresti");
  const [manualLocation, setManualLocation] = useState("");
  const [nearbyGyms, setNearbyGyms] = useState<RealGymSummary[]>([]);
  const [selectedGym, setSelectedGym] = useState<RealGymDetail | null>(null);
  const [loadingManualLocation, setLoadingManualLocation] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [minRating, setMinRating] = useState(0);
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [favoritePlaceIds, setFavoritePlaceIds] = useState<Set<string>>(new Set());

  // DB gym linking (reviews + DB favorites)
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

  // ── Location bootstrap ────────────────────────────────────────────────────

  useEffect(() => {
    const loadLocation = async () => {
      try {
        const permission = await Location.requestForegroundPermissionsAsync();
        if (permission.status !== Location.PermissionStatus.GRANTED) return;
        const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        const nextCoords = { latitude: position.coords.latitude, longitude: position.coords.longitude };
        setCoords(nextCoords);
        const geocode = await Location.reverseGeocodeAsync(nextCoords);
        const city = geocode[0]?.city ?? geocode[0]?.subregion ?? geocode[0]?.region;
        if (city) setCityName(city);
      } catch {
        // Keep Bucharest fallback
      }
    };
    void loadLocation();
  }, []);

  // ── DB gym resolve (via place_id) ─────────────────────────────────────────

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

    gymApi
      .resolvePlaceToDbGym(selectedGym.place_id, {
        name: selectedGym.name,
        address: selectedGym.address,
        latitude: selectedGym.latitude,
        longitude: selectedGym.longitude,
        rating: selectedGym.rating,
        image_url: selectedGym.photo_urls?.[0] ?? null,
      })
      .then((detail) => {
        if (!cancelled) {
          setLinkedDbGym(detail);
          initFavoriteState(detail.id, detail.is_favorited);
        }
      })
      .catch(() => {
        // No DB match — graceful no-op
      })
      .finally(() => {
        if (!cancelled) setLoadingDbGym(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedGym]);

  // ── Gym list helpers ──────────────────────────────────────────────────────

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
    if (!query) { setError("Introdu un oras sau o adresa."); return; }
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
    if (!selectedGym) return;
    const origin = `${coords.latitude},${coords.longitude}`;
    const destination = `${selectedGym.latitude},${selectedGym.longitude}`;
    void Linking.openURL(
      `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&travelmode=${mode}`,
    );
  };

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
      .then((d) => setLinkedDbGym(d))
      .catch(() => {});
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <Screen padded={false}>
      <ScrollView style={styles.page} contentContainerStyle={styles.pageContent}>
        <View style={styles.container}>
          <Text style={styles.title}>Harta sali (Web)</Text>
          <Text style={styles.description}>Cauta sali reale din orasul curent sau muta manual locatia.</Text>
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

          {/* ── Filter row ── */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filterScroll}
            contentContainerStyle={styles.filterRow}
          >
            <Text style={styles.filterLabel}>Min ★:</Text>
            {RATING_OPTIONS.map((n) => (
              <Pressable
                key={n}
                onPress={() => setMinRating(n)}
                style={[styles.chip, minRating === n && styles.chipActive]}
              >
                <Text style={[styles.chipText, minRating === n && styles.chipTextActive]}>
                  {n === 0 ? "Any" : `${n}+`}
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

          <View style={styles.mapCard}>
            <Text style={styles.mapTitle}>Harta interactiva</Text>
            <View style={styles.mapFrame}>
              <MapEmbed uri={`https://www.google.com/maps?q=${coords.latitude},${coords.longitude}&z=12&output=embed`} />
            </View>
          </View>

          {nearestGyms.length > 0 ? (
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
                    {gym.distance_m ? `${(gym.distance_m / 1000).toFixed(2)} km` : "N/A"}{" "}
                    {gym.rating ? `| ${gym.rating.toFixed(1)}★` : ""}
                  </Text>
                </Pressable>
              ))}
            </View>
          ) : null}

          <View style={styles.list}>
            {filteredNearbyGyms.map((gym) => (
              <Pressable key={gym.place_id} style={styles.card} onPress={() => void loadGymDetail(gym.place_id)}>
                <Text style={styles.cardTitle}>{gym.name}</Text>
                <Text style={styles.meta}>
                  {gym.distance_m ? `${(gym.distance_m / 1000).toFixed(2)} km` : "N/A"}{" "}
                  {gym.rating ? `| ${gym.rating.toFixed(1)}★` : ""}
                </Text>
                {gym.address ? <Text style={styles.address}>{gym.address}</Text> : null}
              </Pressable>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* ── Gym detail modal ── */}
      <Modal visible={Boolean(selectedGym)} transparent animationType="slide" onRequestClose={() => setSelectedGym(null)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <ScrollView contentContainerStyle={styles.modalContent} showsVerticalScrollIndicator={false}>
              {selectedGym ? (
                <>
                  {/* Header: title + heart + close */}
                  <View style={styles.row}>
                    <Text style={styles.modalTitle}>{selectedGym.name}</Text>
                    <Animated.View style={{ transform: [{ scale: heartScale }] }}>
                      <Pressable onPress={() => void handleHeartToggle()} style={styles.heartBtn} hitSlop={8}>
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
                    <View style={styles.section}>
                      <Text style={styles.sectionTitle}>Program</Text>
                      {selectedGym.opening_hours.map((line) => (
                        <Text key={line} style={styles.address}>{line}</Text>
                      ))}
                    </View>
                  ) : null}

                  {/* ── Reviews section ── */}
                  {loadingDbGym ? (
                    <Text style={styles.meta}>Se incarca recenzii...</Text>
                  ) : !linkedDbGym ? (
                    <Text style={styles.meta}>Recenziile si favoritele nu sunt disponibile pentru aceasta sala.</Text>
                  ) : (
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
                  )}
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
    maxWidth: 860,
    marginHorizontal: "auto",
    width: "100%",
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
  filterScroll: {
    flexGrow: 0,
  },
  filterRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingVertical: 4,
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
    height: 320,
    borderRadius: 8,
    overflow: "hidden",
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
  heroImage: {
    width: "100%",
    height: 200,
    borderRadius: 12,
    backgroundColor: colors.border,
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
    maxHeight: "82%",
    borderWidth: 1,
    borderColor: colors.border,
    // Centered + capped width on desktop
    maxWidth: 720,
    marginHorizontal: "auto",
    width: "100%",
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
  heartBtn: {
    padding: 4,
  },
  heartText: {
    fontSize: 26,
    color: colors.border,
  },
  heartTextActive: {
    color: "#EF4444",
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
