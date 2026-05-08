import * as Location from 'expo-location';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert, Animated, Image, Linking, Modal, Pressable,
  ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';

import { GymReviewForm } from '@/components/gym/GymReviewForm';
import { GymReviewList } from '@/components/gym/GymReviewList';
import { useTheme } from '@/context/ThemeContext';
import { FpIcon } from '@/components/ui/FpIcon';
import { GymDetailExtended, gymApi } from '@/services/gymApi';
import { GeocodeResult, RealGymDetail, RealGymSummary, placesApi } from '@/services/placesApi';
import { useGymStore } from '@/store/gymStore';

const SERIF = 'Georgia';
const MONO  = 'monospace';

const BUCHAREST  = { latitude: 44.4268, longitude: 26.1025 };
const CITY_RADIUS_M = 25_000;
const RATING_OPTIONS = [0, 3.0, 3.5, 4.0, 4.5] as const;

const openMaps = (gym: { name: string; latitude: number; longitude: number }) => {
  const q = encodeURIComponent(`${gym.name} ${gym.latitude},${gym.longitude}`);
  void Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${q}`);
};

const MapEmbed = ({ uri }: { uri: string }) =>
  React.createElement('iframe', {
    src: uri,
    style: { border: 'none', width: '100%', height: '100%' },
    loading: 'lazy',
    referrerPolicy: 'no-referrer-when-downgrade',
  });

export const MapScreen = () => {
  const { t } = useTheme();
  const heartScale = useRef(new Animated.Value(1)).current;

  const [coords,              setCoords]              = useState(BUCHAREST);
  const [cityName,            setCityName]            = useState('Bucharest, RO');
  const [manualLocation,      setManualLocation]      = useState('');
  const [nearbyGyms,          setNearbyGyms]          = useState<RealGymSummary[]>([]);
  const [selectedGym,         setSelectedGym]         = useState<RealGymDetail | null>(null);
  const [loadingManual,       setLoadingManual]       = useState(false);
  const [loading,             setLoading]             = useState(false);
  const [error,               setError]               = useState<string | null>(null);
  const [minRating,           setMinRating]           = useState(0);
  const [onlyFavorites,       setOnlyFavorites]       = useState(false);
  const [favoritePlaceIds,    setFavoritePlaceIds]    = useState<Set<string>>(new Set());
  const [linkedDbGym,         setLinkedDbGym]         = useState<GymDetailExtended | null>(null);
  const [loadingDbGym,        setLoadingDbGym]        = useState(false);
  const [showReviewForm,      setShowReviewForm]      = useState(false);
  const [activeFilter,        setActiveFilter]        = useState('Aproape');

  const favoriteDbIds    = useGymStore((s) => s.favoriteGymIds);
  const toggleDbFavorite = useGymStore((s) => s.toggleFavorite);
  const initFavoriteState= useGymStore((s) => s.initFavoriteState);

  const filteredGyms = useMemo(() => nearbyGyms.filter((gym) => {
    if (minRating > 0 && (gym.rating == null || gym.rating < minRating)) return false;
    if (onlyFavorites && !favoritePlaceIds.has(gym.place_id)) return false;
    return true;
  }), [nearbyGyms, minRating, onlyFavorites, favoritePlaceIds]);

  const isGymFavorited = useMemo(() => {
    if (!selectedGym) return false;
    if (linkedDbGym !== null) return favoriteDbIds.has(linkedDbGym.id);
    return favoritePlaceIds.has(selectedGym.place_id);
  }, [selectedGym, linkedDbGym, favoriteDbIds, favoritePlaceIds]);

  // Location bootstrap
  useEffect(() => {
    void (async () => {
      try {
        const perm = await Location.requestForegroundPermissionsAsync();
        if (perm.status !== Location.PermissionStatus.GRANTED) return;
        const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        const next = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
        setCoords(next);
        const geo = await Location.reverseGeocodeAsync(next);
        const city = geo[0]?.city ?? geo[0]?.subregion ?? geo[0]?.region;
        if (city) setCityName(city + ', RO');
      } catch {}
    })();
  }, []);

  // DB gym resolve
  useEffect(() => {
    if (!selectedGym) { setLinkedDbGym(null); setShowReviewForm(false); return; }
    let cancelled = false;
    setLoadingDbGym(true);
    setLinkedDbGym(null);
    setShowReviewForm(false);
    gymApi.resolvePlaceToDbGym(selectedGym.place_id, {
      name: selectedGym.name, address: selectedGym.address,
      latitude: selectedGym.latitude, longitude: selectedGym.longitude,
      rating: selectedGym.rating, image_url: selectedGym.photo_urls?.[0] ?? null,
    }).then((d) => { if (!cancelled) { setLinkedDbGym(d); initFavoriteState(d.id, d.is_favorited); } })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoadingDbGym(false); });
    return () => { cancelled = true; };
  }, [selectedGym]);

  const loadNearby = async (ref?: { latitude: number; longitude: number }) => {
    setLoading(true); setError(null);
    try {
      const c = ref ?? coords;
      const gyms = await placesApi.searchNearbyGyms({ latitude: c.latitude, longitude: c.longitude, radius_m: CITY_RADIUS_M });
      setNearbyGyms(gyms);
    } catch { setError('Nu am putut încărca sălile din zonă.'); }
    finally { setLoading(false); }
  };

  const loadGymDetail = async (placeId: string) => {
    try { setSelectedGym(await placesApi.getGymDetail(placeId)); }
    catch { setError('Nu am putut încărca detaliile sălii.'); }
  };

  const useManualLocation = async () => {
    const q = manualLocation.trim();
    if (!q) { setError('Introdu un oraș sau o adresă.'); return; }
    setLoadingManual(true); setError(null);
    try {
      const geo: GeocodeResult = await placesApi.geocode(q);
      const next = { latitude: geo.latitude, longitude: geo.longitude };
      setCoords(next);
      setCityName((geo.city ?? geo.formatted_address) + ', RO');
      await loadNearby(next);
    } catch { setError('Nu am putut geocoda locația introdusă.'); }
    finally { setLoadingManual(false); }
  };

  const openDirections = (mode: 'walking' | 'driving' | 'transit') => {
    if (!selectedGym) return;
    const origin = `${coords.latitude},${coords.longitude}`;
    const dest   = `${selectedGym.latitude},${selectedGym.longitude}`;
    void Linking.openURL(`https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(dest)}&travelmode=${mode}`);
  };

  const animateHeart = () => {
    Animated.sequence([
      Animated.timing(heartScale, { toValue: 1.45, duration: 100, useNativeDriver: true }),
      Animated.timing(heartScale, { toValue: 1.0,  duration: 150, useNativeDriver: true }),
    ]).start();
  };

  const handleHeartToggle = async () => {
    if (!selectedGym) return;
    animateHeart();
    setFavoritePlaceIds((prev) => {
      const n = new Set(prev);
      prev.has(selectedGym.place_id) ? n.delete(selectedGym.place_id) : n.add(selectedGym.place_id);
      return n;
    });
    if (linkedDbGym !== null) {
      const ok = await toggleDbFavorite(linkedDbGym.id);
      if (!ok) {
        Alert.alert('Eroare', 'Nu s-a putut actualiza favoritul.');
        setFavoritePlaceIds((prev) => {
          const n = new Set(prev);
          prev.has(selectedGym.place_id) ? n.add(selectedGym.place_id) : n.delete(selectedGym.place_id);
          return n;
        });
      }
    }
  };

  const refreshLinkedDbGym = () => {
    if (!linkedDbGym) return;
    gymApi.getDetailExtended(linkedDbGym.id).then((d) => setLinkedDbGym(d)).catch(() => {});
  };

  const FILTERS = ['Aproape', '24/7', 'Piscină', 'Yoga', 'CrossFit', 'Sauna'];

  const mapUri = `https://www.google.com/maps?q=${coords.latitude},${coords.longitude}&z=13&output=embed`;

  return (
    <View style={[s.root, { backgroundColor: t.bg }]}>
      {/* Left gym list panel */}
      <View style={[s.listPanel, { borderRightColor: t.lineSoft }]}>
        <View style={s.listHeader}>
          <Text style={[s.eyebrow, { color: t.muted, fontFamily: MONO }]}>SĂLI APROAPE DE TINE</Text>
          <Text style={[s.cityTitle, { fontFamily: SERIF, color: t.ink }]}>{cityName}</Text>
        </View>

        {/* Search */}
        <View style={[s.searchBox, { backgroundColor: t.surface, borderColor: t.line }]}>
          <FpIcon name="search" size={14} color={t.muted}/>
          <TextInput
            value={manualLocation}
            onChangeText={setManualLocation}
            onSubmitEditing={() => void useManualLocation()}
            placeholder="Caută o sală sau zonă…"
            placeholderTextColor={t.muted2}
            style={[s.searchInput, { color: t.ink }]}
          />
          {loadingManual && <Text style={[s.eyebrow, { color: t.muted, fontFamily: MONO, fontSize: 9 }]}>…</Text>}
        </View>

        {/* Filters */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexShrink: 0 }}>
          <View style={{ flexDirection: 'row', gap: 6, paddingBottom: 4 }}>
            {FILTERS.map((f) => {
              const on = activeFilter === f;
              return (
                <TouchableOpacity key={f} onPress={() => setActiveFilter(f)} activeOpacity={0.7}
                  style={[s.filterChip, {
                    backgroundColor: on ? t.ink : t.surface2,
                    borderColor: on ? 'transparent' : t.line,
                  }]}>
                  <Text style={[{ fontSize: 11, fontWeight: '500', color: on ? t.bg : t.muted }]}>{f}</Text>
                </TouchableOpacity>
              );
            })}
            <TouchableOpacity onPress={() => { setOnlyFavorites(!onlyFavorites); setActiveFilter('Favorite'); }} activeOpacity={0.7}
              style={[s.filterChip, {
                backgroundColor: onlyFavorites ? t.ink : t.surface2,
                borderColor: onlyFavorites ? 'transparent' : t.line,
              }]}>
              <Text style={[{ fontSize: 11, fontWeight: '500', color: onlyFavorites ? t.bg : t.muted }]}>
                {onlyFavorites ? '♥ Favs' : '♡ Favs'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Load button if empty */}
        {filteredGyms.length === 0 && (
          <TouchableOpacity onPress={() => void loadNearby()} activeOpacity={0.85}
            style={[s.loadBtn, { backgroundColor: t.primary }]}>
            <FpIcon name="pin" size={14} color={t.primaryInk}/>
            <Text style={[{ fontSize: 13, fontWeight: '600', color: t.primaryInk }]}>
              {loading ? 'Se încarcă…' : 'Încarcă săli din zonă'}
            </Text>
          </TouchableOpacity>
        )}

        {error ? (
          <View style={[s.errorBanner, { backgroundColor: t.bad + '18', borderColor: t.bad + '40' }]}>
            <Text style={[{ fontSize: 12, color: t.bad }]}>{error}</Text>
          </View>
        ) : null}

        {/* Gym cards */}
        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
          <View style={{ gap: 12 }}>
            {filteredGyms.map((gym) => (
              <TouchableOpacity key={gym.place_id} onPress={() => void loadGymDetail(gym.place_id)}
                activeOpacity={0.8}
                style={[s.gymCard, { borderColor: selectedGym?.place_id === gym.place_id ? t.primary + '60' : t.line }]}>
                <View style={[s.gymCardImg, { backgroundColor: t.surface2 }]}>
                  <FpIcon name="dumbbell" size={20} color={t.muted2}/>
                </View>
                <View style={{ flex: 1, paddingVertical: 14, paddingHorizontal: 16 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Text style={[s.gymName, { color: t.ink }]} numberOfLines={1}>{gym.name}</Text>
                    <FpIcon name="heart" size={14} color={t.muted}/>
                  </View>
                  {gym.address ? <Text style={[{ fontSize: 11, color: t.muted, marginTop: 2 }]} numberOfLines={1}>{gym.address}</Text> : null}
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8 }}>
                    {gym.rating != null && (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <FpIcon name="star" size={12} color={t.accent}/>
                        <Text style={[{ fontFamily: MONO, fontSize: 11, color: t.ink }]}>{gym.rating.toFixed(1)}</Text>
                      </View>
                    )}
                    {gym.distance_m != null && (
                      <Text style={[{ fontFamily: MONO, fontSize: 11, color: t.muted }]}>
                        {(gym.distance_m / 1000).toFixed(1)} km
                      </Text>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Right map panel */}
      <View style={[s.mapPanel, { backgroundColor: t.bgDeep }]}>
        {/* Google Maps iframe */}
        <View style={[s.mapFrame]}>
          <MapEmbed uri={mapUri}/>
        </View>

        {/* Map controls */}
        <View style={{ position: 'absolute', top: 18, right: 18, gap: 8 }}>
          {[
            { icon: 'plus' as const, onPress: () => {} },
            { icon: 'close' as const, onPress: () => {} },
            { icon: 'pin' as const, onPress: () => void loadNearby() },
          ].map((btn, i) => (
            <TouchableOpacity key={i} onPress={btn.onPress} activeOpacity={0.7}
              style={[s.mapCtrl, { backgroundColor: t.surface, borderColor: t.line }]}>
              <FpIcon name={btn.icon} size={16} color={t.ink}/>
            </TouchableOpacity>
          ))}
        </View>

        {/* Selected gym card */}
        {selectedGym && (
          <View style={[s.gymDetailCard, { backgroundColor: t.surface, borderColor: t.line }]}>
            {selectedGym.photo_urls[0] ? (
              <Image source={{ uri: selectedGym.photo_urls[0] }} style={s.detailImg} resizeMode="cover"/>
            ) : (
              <View style={[s.detailImgPlaceholder, { backgroundColor: t.surface2 }]}>
                <FpIcon name="dumbbell" size={24} color={t.muted2}/>
              </View>
            )}
            <View style={{ flex: 1, gap: 4 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Text style={[s.detailName, { fontFamily: SERIF, color: t.ink }]} numberOfLines={1}>
                  {selectedGym.name}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  {selectedGym.rating != null && (
                    <>
                      <FpIcon name="star" size={12} color={t.accent}/>
                      <Text style={[{ fontFamily: MONO, fontSize: 11, color: t.ink }]}>{selectedGym.rating.toFixed(1)}</Text>
                    </>
                  )}
                </View>
              </View>
              {selectedGym.address && (
                <Text style={[{ fontSize: 11, color: t.muted }]} numberOfLines={1}>
                  {selectedGym.address}
                </Text>
              )}
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
                <TouchableOpacity onPress={() => openMaps(selectedGym)} activeOpacity={0.85}
                  style={[s.detailBtn, { backgroundColor: t.primary }]}>
                  <Text style={[{ fontSize: 11, fontWeight: '600', color: t.primaryInk }]}>Detalii</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => openDirections('walking')} activeOpacity={0.7}
                  style={[s.detailBtnGhost, { borderColor: t.line }]}>
                  <Text style={[{ fontSize: 11, fontWeight: '500', color: t.ink }]}>Direcții</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setShowReviewForm(true)}
                  disabled={!linkedDbGym}
                  activeOpacity={0.7}
                  style={[s.detailBtnGhost, { borderColor: linkedDbGym ? t.accent : t.line, opacity: linkedDbGym ? 1 : 0.4 }]}
                >
                  <Text style={[{ fontSize: 11, fontWeight: '500', color: linkedDbGym ? t.accent : t.muted }]}>Recenzii</Text>
                </TouchableOpacity>
                <Animated.View style={{ transform: [{ scale: heartScale }] }}>
                  <TouchableOpacity onPress={() => void handleHeartToggle()} activeOpacity={0.7}
                    style={[s.detailBtnGhost, { borderColor: t.line }]}>
                    <Text style={[{ fontSize: 14, color: isGymFavorited ? '#EF4444' : t.muted }]}>
                      {isGymFavorited ? '♥' : '♡'}
                    </Text>
                  </TouchableOpacity>
                </Animated.View>
                <TouchableOpacity onPress={() => setSelectedGym(null)} activeOpacity={0.7}>
                  <FpIcon name="close" size={16} color={t.muted}/>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* Reviews modal */}
        {selectedGym && linkedDbGym && (
          <Modal visible={Boolean(linkedDbGym && showReviewForm)} transparent animationType="fade" onRequestClose={() => setShowReviewForm(false)}>
            <View style={s.modalBackdrop}>
              <View style={[s.modalCard, { backgroundColor: t.surface, borderColor: t.line }]}>
                <ScrollView contentContainerStyle={{ gap: 12, paddingBottom: 20 }} showsVerticalScrollIndicator={false}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={[s.detailName, { fontFamily: SERIF, color: t.ink }]}>Recenzii</Text>
                    <TouchableOpacity onPress={() => setShowReviewForm(false)}>
                      <FpIcon name="close" size={18} color={t.ink}/>
                    </TouchableOpacity>
                  </View>
                  <GymReviewList reviews={linkedDbGym.reviews} averageRating={linkedDbGym.average_rating}/>
                  <GymReviewForm gymId={linkedDbGym.id} onSuccess={() => { setShowReviewForm(false); refreshLinkedDbGym(); }}/>
                </ScrollView>
              </View>
            </View>
          </Modal>
        )}
      </View>
    </View>
  );
};

const s = StyleSheet.create({
  root: { flex: 1, flexDirection: 'row' },
  listPanel: { width: 420, borderRightWidth: 1, paddingTop: 24, paddingHorizontal: 22, paddingBottom: 20, gap: 14, flexDirection: 'column' },
  listHeader: { gap: 6 },
  eyebrow: { fontSize: 10, letterSpacing: 1.8, textTransform: 'uppercase', fontWeight: '500' },
  cityTitle: { fontSize: 30, letterSpacing: -0.6, lineHeight: 34 },
  searchBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: 999, borderWidth: 1,
  },
  searchInput: { flex: 1, fontSize: 13, outlineWidth: 0 } as any,
  filterChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, borderWidth: 1 },
  loadBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, borderRadius: 16 },
  errorBanner: { borderWidth: 1, borderRadius: 12, padding: 12 },
  gymCard: {
    borderRadius: 18, borderWidth: 1, overflow: 'hidden' as any,
    flexDirection: 'row',
  },
  gymCardImg: { width: 100, height: 108, alignItems: 'center', justifyContent: 'center' },
  gymName: { fontSize: 14, fontWeight: '600', flex: 1 },
  mapPanel: { flex: 1, position: 'relative' as any },
  mapFrame: { position: 'absolute' as any, top: 0, left: 0, right: 0, bottom: 0 },
  mapCtrl: { width: 38, height: 38, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  gymDetailCard: {
    position: 'absolute' as any, bottom: 18, left: 18, right: 18,
    borderRadius: 22, borderWidth: 1, padding: 16,
    flexDirection: 'row', gap: 16, alignItems: 'flex-start',
  },
  detailImg: { width: 80, height: 80, borderRadius: 14 },
  detailImgPlaceholder: { width: 80, height: 80, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  detailName: { fontSize: 18, letterSpacing: -0.3, flex: 1 },
  detailBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999 },
  detailBtnGhost: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, borderWidth: 1 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  modalCard: {
    width: '90%' as any, maxWidth: 640, borderRadius: 22, borderWidth: 1, padding: 24, maxHeight: '80%' as any,
  },
});
