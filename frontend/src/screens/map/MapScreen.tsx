/**
 * MapScreen — Gym Discovery
 *
 * Deps (run once): npx expo install expo-location react-native-maps
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  FlatList,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { api } from '../../lib/api';
import { colors, radius, shadows, spacing, typography } from '../../theme';

// ─── Types ────────────────────────────────────────────────────────────────────

interface GymItem {
  id: number;
  place_id: string | null;
  name: string;
  address: string | null;
  phone: string | null;
  website: string | null;
  rating: number | null;
  image_url: string | null;
  review_count: number;
  latitude: number;
  longitude: number;
  distance_m: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const RADIUS_OPTIONS: { label: string; value: number }[] = [
  { label: '1 km',  value: 1000  },
  { label: '2 km',  value: 2000  },
  { label: '5 km',  value: 5000  },
  { label: '10 km', value: 10000 },
];

const DEFAULT_RADIUS = 5000;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDistance(m: number): string {
  if (m < 1000) return `${Math.round(m)} m`;
  return `${(m / 1000).toFixed(1)} km`;
}

function starRating(rating: number | null): string {
  if (!rating) return '—';
  const full  = Math.floor(rating);
  const half  = rating - full >= 0.5 ? 1 : 0;
  const empty = 5 - full - half;
  return '★'.repeat(full) + (half ? '½' : '') + '☆'.repeat(empty);
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function GymCard({ gym, onPress }: { gym: GymItem; onPress: () => void }) {
  return (
    <TouchableOpacity
      style={styles.gymCard}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {/* Color stripe */}
      <View style={styles.gymStripe} />

      <View style={styles.gymBody}>
        {/* Name + distance */}
        <View style={styles.gymRow}>
          <Text style={styles.gymName} numberOfLines={1}>{gym.name}</Text>
          <Text style={styles.gymDistance}>{formatDistance(gym.distance_m)}</Text>
        </View>

        {/* Address */}
        {gym.address && (
          <Text style={styles.gymAddress} numberOfLines={1}>{gym.address}</Text>
        )}

        {/* Rating row */}
        <View style={styles.gymMeta}>
          <Text style={styles.gymStars}>{starRating(gym.rating)}</Text>
          {gym.rating !== null && (
            <Text style={styles.gymRating}>{gym.rating.toFixed(1)}</Text>
          )}
          {gym.review_count > 0 && (
            <Text style={styles.gymReviewCount}>
              ({gym.review_count} review{gym.review_count !== 1 ? 's' : ''})
            </Text>
          )}
        </View>
      </View>

      {/* Arrow */}
      <Text style={styles.gymArrow}>›</Text>
    </TouchableOpacity>
  );
}

function RadiusChip({
  option,
  selected,
  onPress,
}: {
  option: (typeof RADIUS_OPTIONS)[0];
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.chip, selected && styles.chipSelected]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
        {option.label}
      </Text>
    </TouchableOpacity>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function MapScreen() {
  const navigation = useNavigation<any>();

  const [gyms,       setGyms]       = useState<GymItem[]>([]);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState<string | null>(null);
  const [radius_m,   setRadiusM]    = useState(DEFAULT_RADIUS);
  const [location,   setLocation]   = useState<{ lat: number; lng: number } | null>(null);
  const [locError,   setLocError]   = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const fadeAnim = useRef(new Animated.Value(0)).current;

  // ── Location ────────────────────────────────────────────────────────────────

  const requestLocation = useCallback(async () => {
    setLocError(null);
    try {
      // Dynamic import so the app doesn't crash if expo-location isn't installed yet
      const Location = await import('expo-location');
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocError('Location permission denied. Using Bucharest city centre.');
        setLocation({ lat: 44.4268, lng: 26.1025 });
        return;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
    } catch {
      // Fallback to Bucharest if expo-location not installed or fails
      setLocError('Could not get location. Showing gyms near Bucharest.');
      setLocation({ lat: 44.4268, lng: 26.1025 });
    }
  }, []);

  // ── Fetch gyms ──────────────────────────────────────────────────────────────

  const fetchGyms = useCallback(async (lat: number, lng: number, r: number) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get<GymItem[]>('/gyms/nearby', {
        params: { latitude: lat, longitude: lng, radius_m: r },
      });
      setGyms(data);
      // Fade in list
      Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } }; message?: string })
        ?.response?.data?.detail ?? 'Could not load gyms. Check your connection.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [fadeAnim]);

  // ── Effects ─────────────────────────────────────────────────────────────────

  useEffect(() => {
    requestLocation();
  }, [requestLocation]);

  useEffect(() => {
    if (location) {
      fadeAnim.setValue(0);
      fetchGyms(location.lat, location.lng, radius_m);
    }
  }, [location, radius_m, fetchGyms, fadeAnim]);

  // ── Derived data ─────────────────────────────────────────────────────────────

  const filtered = searchQuery.trim()
    ? gyms.filter((g) =>
        g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (g.address ?? '').toLowerCase().includes(searchQuery.toLowerCase())
      )
    : gyms;

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Discover Gyms</Text>
          {location && (
            <Text style={styles.subtitle}>
              {filtered.length} gym{filtered.length !== 1 ? 's' : ''} found nearby
            </Text>
          )}
        </View>
        <TouchableOpacity style={styles.locBtn} onPress={requestLocation} activeOpacity={0.7}>
          <Text style={styles.locBtnText}>📍</Text>
        </TouchableOpacity>
      </View>

      {/* Search bar */}
      <View style={styles.searchWrap}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name or address…"
          placeholderTextColor={colors.text.muted}
          value={searchQuery}
          onChangeText={setSearchQuery}
          returnKeyType="search"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Text style={styles.searchClear}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Radius chips */}
      <View style={styles.chipRow}>
        {RADIUS_OPTIONS.map((opt) => (
          <RadiusChip
            key={opt.value}
            option={opt}
            selected={radius_m === opt.value}
            onPress={() => setRadiusM(opt.value)}
          />
        ))}
      </View>

      {/* Location error banner */}
      {locError && (
        <View style={styles.banner}>
          <Text style={styles.bannerText}>⚠️  {locError}</Text>
        </View>
      )}

      {/* Content */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.accent.base} size="large" />
          <Text style={styles.loadingText}>Searching nearby gyms…</Text>
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.errorEmoji}>⚡</Text>
          <Text style={styles.errorTitle}>Something went wrong</Text>
          <Text style={styles.errorMsg}>{error}</Text>
          <TouchableOpacity
            style={styles.retryBtn}
            onPress={() => location && fetchGyms(location.lat, location.lng, radius_m)}
          >
            <Text style={styles.retryText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.errorEmoji}>🏟</Text>
          <Text style={styles.errorTitle}>No gyms found</Text>
          <Text style={styles.errorMsg}>
            {searchQuery ? 'No results match your search.' : `Try a larger radius.`}
          </Text>
        </View>
      ) : (
        <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
          <FlatList
            data={filtered}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <GymCard
                gym={item}
                onPress={() =>
                  navigation.navigate('GymDetail', {
                    gymId:    item.id,
                    placeId:  item.place_id,
                    gymName:  item.name,
                  })
                }
              />
            )}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />
        </Animated.View>
      )}
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg.base,
  },

  // Header
  header: {
    flexDirection:   'row',
    justifyContent:  'space-between',
    alignItems:      'center',
    paddingHorizontal: spacing.screen,
    paddingTop:      spacing[4],
    paddingBottom:   spacing[3],
  },
  title: {
    ...typography.styles.h2,
  },
  subtitle: {
    ...typography.styles.bodySmall,
    color: colors.text.muted,
    marginTop: 2,
  },
  locBtn: {
    width:  40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: colors.bg.elevated,
    borderWidth: 1,
    borderColor: colors.border.default,
    alignItems: 'center',
    justifyContent: 'center',
  },
  locBtnText: { fontSize: 18 },

  // Search
  searchWrap: {
    flexDirection:   'row',
    alignItems:      'center',
    marginHorizontal: spacing.screen,
    marginBottom:    spacing[3],
    backgroundColor: colors.bg.elevated,
    borderRadius:    radius.input,
    borderWidth:     1,
    borderColor:     colors.border.default,
    paddingHorizontal: spacing[4],
    height: 44,
  },
  searchIcon: { fontSize: 15, marginRight: spacing[2], color: colors.text.muted },
  searchInput: {
    flex:      1,
    color:     colors.text.primary,
    fontSize:  typography.size.base,
    height:    '100%',
  },
  searchClear: {
    color: colors.text.muted,
    fontSize: 14,
    paddingLeft: spacing[2],
  },

  // Radius chips
  chipRow: {
    flexDirection:   'row',
    paddingHorizontal: spacing.screen,
    gap:             spacing[2],
    marginBottom:    spacing[4],
  },
  chip: {
    paddingVertical:   spacing[1],
    paddingHorizontal: spacing[4],
    borderRadius:      radius.chip,
    backgroundColor:   colors.bg.elevated,
    borderWidth:       1,
    borderColor:       colors.border.default,
  },
  chipSelected: {
    backgroundColor: colors.accent.muted,
    borderColor:     colors.accent.base,
  },
  chipText: {
    fontSize:   typography.size.sm,
    fontWeight: '600',
    color:      colors.text.secondary,
  },
  chipTextSelected: {
    color: colors.accent.base,
  },

  // Banner
  banner: {
    marginHorizontal: spacing.screen,
    marginBottom:     spacing[3],
    padding:          spacing[3],
    borderRadius:     radius.md,
    backgroundColor:  `${colors.warning}15`,
    borderWidth:      1,
    borderColor:      `${colors.warning}40`,
  },
  bannerText: {
    color:    colors.warning,
    fontSize: typography.size.sm,
  },

  // States
  center: {
    flex:           1,
    alignItems:     'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  loadingText: {
    ...typography.styles.bodySmall,
    color:     colors.text.muted,
    marginTop: spacing[4],
  },
  errorEmoji: {
    fontSize:     48,
    marginBottom: spacing[3],
  },
  errorTitle: {
    ...typography.styles.h3,
    marginBottom: spacing[2],
  },
  errorMsg: {
    ...typography.styles.bodySmall,
    color:     colors.text.muted,
    textAlign: 'center',
    lineHeight: 20,
  },
  retryBtn: {
    marginTop:        spacing[5],
    paddingVertical:  spacing[3],
    paddingHorizontal: spacing[6],
    borderRadius:     radius.button,
    backgroundColor:  colors.accent.muted,
    borderWidth:      1,
    borderColor:      colors.accent.base,
  },
  retryText: {
    color:      colors.accent.base,
    fontWeight: '700',
    fontSize:   typography.size.sm,
  },

  // List
  list: {
    paddingHorizontal: spacing.screen,
    paddingBottom:     spacing['2xl'],
  },
  separator: {
    height: spacing[3],
  },

  // Gym card
  gymCard: {
    flexDirection:   'row',
    alignItems:      'center',
    backgroundColor: colors.bg.surface,
    borderRadius:    radius.card,
    borderWidth:     1,
    borderColor:     colors.border.default,
    overflow:        'hidden',
    ...shadows.sm,
  },
  gymStripe: {
    width:           4,
    alignSelf:       'stretch',
    backgroundColor: colors.accent.base,
    opacity:         0.7,
  },
  gymBody: {
    flex:    1,
    padding: spacing[4],
  },
  gymRow: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'center',
    marginBottom:   spacing[1],
  },
  gymName: {
    flex:       1,
    fontSize:   typography.size.base,
    fontWeight: '700',
    color:      colors.text.primary,
    marginRight: spacing[2],
  },
  gymDistance: {
    fontSize:   typography.size.sm,
    fontWeight: '600',
    color:      colors.accent.base,
  },
  gymAddress: {
    ...typography.styles.bodySmall,
    color:        colors.text.secondary,
    marginBottom: spacing[2],
  },
  gymMeta: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           spacing[1],
  },
  gymStars: {
    color:    colors.warning,
    fontSize: typography.size.sm,
  },
  gymRating: {
    fontSize:   typography.size.sm,
    fontWeight: '700',
    color:      colors.text.primary,
  },
  gymReviewCount: {
    ...typography.styles.caption,
    color: colors.text.muted,
  },
  gymArrow: {
    fontSize:    24,
    color:       colors.text.muted,
    paddingRight: spacing[4],
  },
});
