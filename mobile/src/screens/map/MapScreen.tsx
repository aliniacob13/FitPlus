import * as Location from "expo-location";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Image,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE, Region } from "react-native-maps";

import { Button } from "@/components/ui/Button";
import { ErrorState } from "@/components/ui/ErrorState";
import { Screen } from "@/components/ui/Screen";
import { colors, spacing } from "@/constants/theme";
import { gymApi, GymDetail, NearbyGym } from "@/services/gymApi";

const BUCHAREST_FALLBACK: Region = {
  latitude: 44.4268,
  longitude: 26.1025,
  latitudeDelta: 0.12,
  longitudeDelta: 0.12,
};

const formatDistanceKm = (distanceM: number) => `${(distanceM / 1000).toFixed(2)} km`;

type MapPoint = {
  name: string;
  latitude: number;
  longitude: number;
};

const openExternalMaps = (gym: MapPoint) => {
  const query = encodeURIComponent(`${gym.name} ${gym.latitude},${gym.longitude}`);
  void Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${query}`);
};

export const MapScreen = () => {
  const isWeb = Platform.OS === "web";

  const [permissionStatus, setPermissionStatus] = useState<Location.PermissionStatus | null>(null);
  const [userCoords, setUserCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [region, setRegion] = useState<Region>(BUCHAREST_FALLBACK);

  const [nearbyGyms, setNearbyGyms] = useState<NearbyGym[]>([]);
  const [loadingNearby, setLoadingNearby] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedGymId, setSelectedGymId] = useState<number | null>(null);
  const [gymDetail, setGymDetail] = useState<GymDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  const requestLocation = useCallback(async () => {
    setError(null);
    const permission = await Location.requestForegroundPermissionsAsync();
    setPermissionStatus(permission.status);

    if (permission.status !== Location.PermissionStatus.GRANTED) {
      setError("Permisiunea de locatie a fost refuzata. Folosim o zona default in Bucuresti.");
      setUserCoords(null);
      setRegion(BUCHAREST_FALLBACK);
      return;
    }

    const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    const coords = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
    };
    setUserCoords(coords);
    setRegion({
      latitude: coords.latitude,
      longitude: coords.longitude,
      latitudeDelta: 0.08,
      longitudeDelta: 0.08,
    });
  }, []);

  useEffect(() => {
    void requestLocation();
  }, [requestLocation]);

  const referenceCoords = useMemo(() => userCoords ?? { latitude: region.latitude, longitude: region.longitude }, [region.latitude, region.longitude, userCoords]);

  const loadNearby = async () => {
    setLoadingNearby(true);
    setError(null);
    try {
      const gyms = await gymApi.getNearby({
        latitude: referenceCoords.latitude,
        longitude: referenceCoords.longitude,
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
    setSelectedGymId(gymId);
    setDetailError(null);
    setDetailLoading(true);
    try {
      const detail = await gymApi.getById(gymId);
      setGymDetail(detail);
    } catch {
      setGymDetail(null);
      setDetailError("Nu am putut incarca detaliile salii.");
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetail = () => {
    setSelectedGymId(null);
    setGymDetail(null);
    setDetailError(null);
    setDetailLoading(false);
  };

  const renderWebList = () => (
    <ScrollView style={styles.webList} contentContainerStyle={styles.webListContent}>
      <Text style={styles.subtitle}>Lista sali (web)</Text>
      <Text style={styles.muted}>
        Pe web, `react-native-maps` necesita configurare suplimentara (chei Google Maps). Pentru demo rapid,
        afisam lista + link catre Google Maps.
      </Text>

      {nearbyGyms.map((gym) => (
        <Pressable key={gym.id} style={styles.card} onPress={() => void openDetail(gym.id)}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>{gym.name}</Text>
            <Text style={styles.cardMeta}>{formatDistanceKm(gym.distance_m)}</Text>
          </View>
          {gym.address ? <Text style={styles.cardText}>{gym.address}</Text> : null}
          <Text style={styles.cardLink}>Detalii</Text>
        </Pressable>
      ))}
    </ScrollView>
  );

  const renderNativeMap = () => (
    <MapView
      style={styles.map}
      provider={PROVIDER_GOOGLE}
      region={region}
      onRegionChangeComplete={setRegion}
      showsUserLocation
      showsMyLocationButton
    >
      {nearbyGyms.map((gym) => (
        <Marker
          key={gym.id}
          coordinate={{ latitude: gym.latitude, longitude: gym.longitude }}
          title={gym.name}
          description={gym.address ?? undefined}
          onCalloutPress={() => void openDetail(gym.id)}
          onPress={() => void openDetail(gym.id)}
        />
      ))}
    </MapView>
  );

  return (
    <Screen padded={false}>
      <View style={styles.topBar}>
        <View style={styles.topBarText}>
          <Text style={styles.title}>Harta sali</Text>
          <Text style={styles.muted}>
            {permissionStatus ? `Locatie: ${permissionStatus}` : "Locatie: ..."}
          </Text>
        </View>
        <View style={styles.topActions}>
          <Button label="GPS" onPress={() => void requestLocation()} />
          <Button label="Nearby" onPress={() => void loadNearby()} loading={loadingNearby} />
        </View>
      </View>

      {error ? (
        <View style={styles.banner}>
          <ErrorState message={error} />
        </View>
      ) : null}

      <View style={styles.body}>
        {isWeb ? (
          <View style={styles.splitWeb}>
            {renderWebList()}
          </View>
        ) : (
          <View style={styles.mapWrap}>{renderNativeMap()}</View>
        )}

        {!isWeb ? (
          <View style={styles.bottomPanel}>
            <Text style={styles.subtitle}>Rezultate: {nearbyGyms.length}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {nearbyGyms.map((gym) => (
                <Pressable key={gym.id} style={styles.chip} onPress={() => void openDetail(gym.id)}>
                  <Text style={styles.chipTitle}>{gym.name}</Text>
                  <Text style={styles.chipMeta}>{formatDistanceKm(gym.distance_m)}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        ) : null}
      </View>

      <Modal visible={selectedGymId !== null} animationType="slide" transparent onRequestClose={closeDetail}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{gymDetail?.name ?? "Detalii sală"}</Text>
              <Pressable onPress={closeDetail} hitSlop={12}>
                <Text style={styles.modalClose}>Inchide</Text>
              </Pressable>
            </View>

            {detailLoading ? <Text style={styles.muted}>Se incarca...</Text> : null}
            {detailError ? <ErrorState message={detailError} /> : null}

            {gymDetail ? (
              <ScrollView contentContainerStyle={styles.modalContent}>
                {gymDetail.image_url ? (
                  <Image source={{ uri: gymDetail.image_url }} style={styles.modalImage} resizeMode="cover" />
                ) : null}

                {gymDetail.rating !== null ? (
                  <Text style={styles.modalLine}>
                    Rating: {gymDetail.rating.toFixed(1)} ({gymDetail.review_count} review-uri)
                  </Text>
                ) : (
                  <Text style={styles.modalLine}>Rating: N/A</Text>
                )}

                {gymDetail.address ? <Text style={styles.modalLine}>{gymDetail.address}</Text> : null}
                {gymDetail.phone ? <Text style={styles.modalLine}>Tel: {gymDetail.phone}</Text> : null}
                {gymDetail.website ? (
                  <Text style={styles.modalLink} onPress={() => void Linking.openURL(gymDetail.website ?? "")}>
                    Website
                  </Text>
                ) : null}

                {gymDetail.description ? <Text style={styles.modalDescription}>{gymDetail.description}</Text> : null}

                <Button label="Deschide in Google Maps" onPress={() => openExternalMaps(gymDetail)} />

                <Text style={styles.sectionTitle}>Program</Text>
                <Text style={styles.mono}>{JSON.stringify(gymDetail.opening_hours, null, 2)}</Text>

                <Text style={styles.sectionTitle}>Echipament</Text>
                <Text style={styles.mono}>{JSON.stringify(gymDetail.equipment, null, 2)}</Text>

                <Text style={styles.sectionTitle}>Abonamente</Text>
                <Text style={styles.mono}>{JSON.stringify(gymDetail.pricing_plans, null, 2)}</Text>
              </ScrollView>
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
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.sm,
  },
  topBarText: {
    gap: spacing.xs,
  },
  topActions: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  title: {
    color: colors.text,
    fontSize: 22,
    fontWeight: "700",
  },
  subtitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "600",
  },
  muted: {
    color: colors.mutedText,
  },
  banner: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  body: {
    flex: 1,
  },
  mapWrap: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  splitWeb: {
    flex: 1,
  },
  webList: {
    flex: 1,
    backgroundColor: colors.background,
  },
  webListContent: {
    padding: spacing.md,
    gap: spacing.sm,
    paddingBottom: spacing.xl,
  },
  card: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: spacing.md,
    gap: spacing.xs,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  cardTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "700",
    flex: 1,
  },
  cardMeta: {
    color: colors.mutedText,
  },
  cardText: {
    color: colors.mutedText,
  },
  cardLink: {
    color: colors.primary,
    fontWeight: "600",
  },
  bottomPanel: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
    padding: spacing.md,
    gap: spacing.sm,
  },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    borderRadius: 999,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginRight: spacing.sm,
    minWidth: 160,
  },
  chipTitle: {
    color: colors.text,
    fontWeight: "700",
  },
  chipMeta: {
    color: colors.mutedText,
    marginTop: 2,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    padding: spacing.md,
    maxHeight: "85%",
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },
  modalTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "800",
    flex: 1,
    paddingRight: spacing.sm,
  },
  modalClose: {
    color: colors.primary,
    fontWeight: "700",
  },
  modalContent: {
    gap: spacing.sm,
    paddingBottom: spacing.lg,
  },
  modalImage: {
    width: "100%",
    height: 180,
    borderRadius: 14,
    backgroundColor: colors.border,
  },
  modalLine: {
    color: colors.text,
  },
  modalLink: {
    color: colors.primary,
    fontWeight: "700",
  },
  modalDescription: {
    color: colors.mutedText,
    lineHeight: 20,
  },
  sectionTitle: {
    marginTop: spacing.sm,
    color: colors.text,
    fontWeight: "800",
  },
  mono: {
    color: colors.mutedText,
    fontFamily: Platform.select({ ios: "Menlo", android: "monospace", default: "monospace" }),
    fontSize: 12,
  },
});
