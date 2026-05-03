/**
 * GymDetailScreen — Full gym profile, reviews, and favourite toggle.
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { api } from '../../lib/api';
import { Button } from '../../components/ui';
import { colors, radius, shadows, spacing, typography } from '../../theme';

// ─── Route params ─────────────────────────────────────────────────────────────

type GymDetailParams = {
  GymDetail: {
    gymId:   number;
    placeId: string | null;
    gymName: string;
  };
};

// ─── Types ────────────────────────────────────────────────────────────────────

interface Review {
  id: number;
  user_id: number;
  gym_id: number;
  rating: number;
  comment: string | null;
  created_at: string;
}

interface GymDetail {
  id: number;
  place_id: string | null;
  name: string;
  address: string | null;
  phone: string | null;
  website: string | null;
  rating: number | null;
  description: string | null;
  image_url: string | null;
  opening_hours: Record<string, string> | string[] | null;
  equipment: Record<string, unknown> | string[] | null;
  pricing_plans: Record<string, unknown> | null;
  review_count: number;
  latitude: number;
  longitude: number;
  reviews: Review[];
  average_rating: number | null;
  is_favorited: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function Stars({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 2 }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Text key={n} style={{ fontSize: size, color: n <= rating ? colors.warning : colors.border.default }}>
          ★
        </Text>
      ))}
    </View>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string | null | undefined;
}) {
  if (!value) return null;
  return (
    <View style={infoStyles.row}>
      <Text style={infoStyles.icon}>{icon}</Text>
      <View style={infoStyles.body}>
        <Text style={infoStyles.label}>{label}</Text>
        <Text style={infoStyles.value}>{value}</Text>
      </View>
    </View>
  );
}

const infoStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems:    'flex-start',
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.border.muted,
  },
  icon: {
    fontSize:    18,
    marginRight: spacing[3],
    marginTop:   1,
  },
  body: { flex: 1 },
  label: {
    ...typography.styles.caption,
    color:        colors.text.muted,
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  value: {
    fontSize:   typography.size.base,
    color:      colors.text.primary,
    lineHeight: 20,
  },
});

// ─── Review card ──────────────────────────────────────────────────────────────

function ReviewCard({ review }: { review: Review }) {
  const date = new Date(review.created_at).toLocaleDateString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric',
  });
  return (
    <View style={styles.reviewCard}>
      <View style={styles.reviewHeader}>
        <View style={styles.reviewAvatar}>
          <Text style={styles.reviewAvatarText}>U</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Stars rating={review.rating} size={12} />
          <Text style={styles.reviewDate}>{date}</Text>
        </View>
      </View>
      {review.comment && (
        <Text style={styles.reviewComment}>{review.comment}</Text>
      )}
    </View>
  );
}

// ─── Add-review form ──────────────────────────────────────────────────────────

function AddReviewForm({
  gymId,
  onSubmit,
}: {
  gymId: number;
  onSubmit: () => void;
}) {
  const [rating,    setRating]    = useState(0);
  const [comment,   setComment]   = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!rating) { Alert.alert('Rating required', 'Please select a star rating.'); return; }
    setSubmitting(true);
    try {
      await api.post(`/gyms/${gymId}/reviews`, { rating, comment: comment.trim() || null });
      setRating(0);
      setComment('');
      Alert.alert('Thanks!', 'Your review has been submitted.');
      onSubmit();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })
        ?.response?.data?.detail ?? 'Could not submit review.';
      Alert.alert('Error', msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.reviewForm}>
      <Text style={styles.reviewFormTitle}>Leave a Review</Text>

      {/* Star picker */}
      <View style={styles.starPicker}>
        {[1, 2, 3, 4, 5].map((n) => (
          <TouchableOpacity key={n} onPress={() => setRating(n)} hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}>
            <Text style={[styles.starPickerStar, n <= rating && styles.starPickerStarActive]}>
              ★
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TextInput
        style={styles.reviewInput}
        placeholder="Share your experience… (optional)"
        placeholderTextColor={colors.text.muted}
        multiline
        numberOfLines={3}
        value={comment}
        onChangeText={setComment}
        maxLength={2000}
      />

      <Button
        label={submitting ? 'Submitting…' : 'Submit Review'}
        onPress={handleSubmit}
        loading={submitting}
        variant="primary"
        size="md"
        fullWidth
      />
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function GymDetailScreen() {
  const navigation = useNavigation();
  const route      = useRoute<RouteProp<GymDetailParams, 'GymDetail'>>();
  const { gymId, placeId, gymName } = route.params;

  const [gym,          setGym]          = useState<GymDetail | null>(null);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState<string | null>(null);
  const [favoriting,   setFavoriting]   = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);

  const scrollY = React.useRef(new Animated.Value(0)).current;

  const fetchGym = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // If place_id exists and is not a local ID, use resolve-place
      if (placeId && !placeId.startsWith('local_')) {
        const { data } = await api.post<GymDetail>(`/gyms/resolve-place/${placeId}`, {});
        setGym(data);
      } else {
        const { data } = await api.get<GymDetail>(`/gyms/${gymId}`);
        setGym(data);
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })
        ?.response?.data?.detail ?? 'Could not load gym details.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [gymId, placeId]);

  useEffect(() => { fetchGym(); }, [fetchGym]);

  const toggleFavorite = async () => {
    if (!gym) return;
    setFavoriting(true);
    try {
      await api.post(`/gyms/${gym.id}/favorite`);
      setGym((prev) => prev ? { ...prev, is_favorited: !prev.is_favorited } : prev);
    } catch {
      Alert.alert('Error', 'Could not update favourite.');
    } finally {
      setFavoriting(false);
    }
  };

  // Header opacity on scroll
  const headerBg = scrollY.interpolate({
    inputRange:  [0, 80],
    outputRange: ['transparent', colors.bg.base],
    extrapolate: 'clamp',
  });

  if (loading) {
    return (
      <SafeAreaView style={styles.root}>
        <View style={styles.center}>
          <ActivityIndicator color={colors.accent.base} size="large" />
          <Text style={styles.loadingText}>Loading gym…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !gym) {
    return (
      <SafeAreaView style={styles.root}>
        <TouchableOpacity style={styles.backBtnAbsolute} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>‹ Back</Text>
        </TouchableOpacity>
        <View style={styles.center}>
          <Text style={styles.errorEmoji}>⚡</Text>
          <Text style={styles.errorTitle}>{error ?? 'Gym not found'}</Text>
          <Button label="Go Back" onPress={() => navigation.goBack()} variant="secondary" size="md" />
        </View>
      </SafeAreaView>
    );
  }

  const hoursArray: string[] = Array.isArray(gym.opening_hours)
    ? (gym.opening_hours as string[])
    : gym.opening_hours
      ? Object.entries(gym.opening_hours as Record<string, string>).map(([k, v]) => `${k}: ${v}`)
      : [];

  return (
    <SafeAreaView style={styles.root}>
      {/* Floating header */}
      <Animated.View style={[styles.floatingHeader, { backgroundColor: headerBg }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>‹ Back</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={toggleFavorite}
          style={[styles.favBtn, gym.is_favorited && styles.favBtnActive]}
          disabled={favoriting}
        >
          <Text style={styles.favBtnText}>{favoriting ? '…' : gym.is_favorited ? '♥' : '♡'}</Text>
        </TouchableOpacity>
      </Animated.View>

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: false })}
        scrollEventThrottle={16}
      >
        {/* Hero / colour block */}
        <View style={styles.hero}>
          <Text style={styles.heroEmoji}>🏋️</Text>
          <Text style={styles.heroName}>{gym.name}</Text>
          {gym.address && <Text style={styles.heroAddress}>{gym.address}</Text>}

          <View style={styles.heroMeta}>
            {gym.average_rating !== null && (
              <>
                <Stars rating={Math.round(gym.average_rating ?? 0)} size={16} />
                <Text style={styles.heroRating}>{(gym.average_rating ?? 0).toFixed(1)}</Text>
              </>
            )}
            {gym.review_count > 0 && (
              <Text style={styles.heroReviews}>
                {gym.review_count} review{gym.review_count !== 1 ? 's' : ''}
              </Text>
            )}
          </View>
        </View>

        <View style={styles.body}>
          {/* Info section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Info</Text>
            <InfoRow icon="📍" label="Address" value={gym.address} />
            <InfoRow icon="📞" label="Phone"   value={gym.phone} />
            <InfoRow icon="🌐" label="Website" value={gym.website} />
            {gym.description && (
              <View style={{ paddingVertical: spacing[3] }}>
                <Text style={styles.description}>{gym.description}</Text>
              </View>
            )}
          </View>

          {/* Opening hours */}
          {hoursArray.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Opening Hours</Text>
              {hoursArray.map((h, i) => (
                <Text key={i} style={styles.hoursLine}>{h}</Text>
              ))}
            </View>
          )}

          {/* Equipment */}
          {Array.isArray(gym.equipment) && (gym.equipment as string[]).length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Equipment</Text>
              <View style={styles.tags}>
                {(gym.equipment as string[]).map((e, i) => (
                  <View key={i} style={styles.tag}>
                    <Text style={styles.tagText}>{e}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Reviews */}
          <View style={styles.section}>
            <View style={styles.sectionRow}>
              <Text style={styles.sectionTitle}>Reviews</Text>
              <TouchableOpacity onPress={() => setShowReviewForm((v) => !v)}>
                <Text style={styles.addReviewLink}>
                  {showReviewForm ? 'Cancel' : '+ Add Review'}
                </Text>
              </TouchableOpacity>
            </View>

            {showReviewForm && (
              <AddReviewForm
                gymId={gym.id}
                onSubmit={() => { setShowReviewForm(false); fetchGym(); }}
              />
            )}

            {gym.reviews.length === 0 ? (
              <Text style={styles.noReviews}>No reviews yet. Be the first!</Text>
            ) : (
              gym.reviews.map((r) => <ReviewCard key={r.id} review={r} />)
            )}
          </View>
        </View>
      </Animated.ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg.base },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  loadingText: { ...typography.styles.bodySmall, color: colors.text.muted, marginTop: spacing[4] },
  errorEmoji: { fontSize: 48, marginBottom: spacing[3] },
  errorTitle: { ...typography.styles.h3, marginBottom: spacing[4], textAlign: 'center' },

  // Floating header bar
  floatingHeader: {
    position:       'absolute',
    top:            0,
    left:           0,
    right:          0,
    zIndex:         10,
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'center',
    paddingHorizontal: spacing.screen,
    paddingVertical: spacing[4],
  },
  backBtnAbsolute: {
    position: 'absolute',
    top: spacing[4],
    left: spacing.screen,
    zIndex: 10,
  },
  backBtn: {},
  backBtnText: {
    color:      colors.text.primary,
    fontSize:   typography.size.md,
    fontWeight: '600',
  },
  favBtn: {
    width:           40,
    height:          40,
    borderRadius:    radius.full,
    backgroundColor: colors.bg.elevated,
    borderWidth:     1,
    borderColor:     colors.border.default,
    alignItems:      'center',
    justifyContent:  'center',
  },
  favBtnActive: {
    backgroundColor: `${colors.error}20`,
    borderColor:     colors.error,
  },
  favBtnText: {
    fontSize: 18,
    color:    colors.error,
  },

  // Hero block
  hero: {
    backgroundColor: colors.bg.surface,
    paddingTop:      spacing['3xl'] + spacing[4],
    paddingBottom:   spacing.xl,
    paddingHorizontal: spacing.screen,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
    alignItems:      'center',
  },
  heroEmoji: { fontSize: 48, marginBottom: spacing[3] },
  heroName: {
    ...typography.styles.h1,
    textAlign: 'center',
    marginBottom: spacing[2],
  },
  heroAddress: {
    ...typography.styles.bodySmall,
    color:     colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing[3],
  },
  heroMeta: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           spacing[2],
  },
  heroRating: {
    fontSize:   typography.size.base,
    fontWeight: '700',
    color:      colors.text.primary,
  },
  heroReviews: { ...typography.styles.bodySmall, color: colors.text.muted },

  // Body
  body: { paddingHorizontal: spacing.screen },

  // Sections
  section: {
    marginTop:    spacing.xl,
    marginBottom: spacing[2],
  },
  sectionRow: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'center',
    marginBottom:   spacing[3],
  },
  sectionTitle: {
    ...typography.styles.h3,
    marginBottom: spacing[3],
  },
  description: {
    ...typography.styles.body,
    color: colors.text.secondary,
    lineHeight: 22,
  },
  hoursLine: {
    ...typography.styles.bodySmall,
    color:          colors.text.secondary,
    paddingVertical: spacing[1],
  },
  addReviewLink: {
    color:      colors.accent.base,
    fontSize:   typography.size.sm,
    fontWeight: '700',
  },

  // Equipment tags
  tags: {
    flexDirection:  'row',
    flexWrap:       'wrap',
    gap:            spacing[2],
  },
  tag: {
    paddingVertical:   spacing[1],
    paddingHorizontal: spacing[3],
    borderRadius:      radius.chip,
    backgroundColor:   colors.bg.elevated,
    borderWidth:       1,
    borderColor:       colors.border.default,
  },
  tagText: {
    fontSize: typography.size.sm,
    color:    colors.text.secondary,
  },

  // Reviews
  noReviews: {
    ...typography.styles.bodySmall,
    color:      colors.text.muted,
    fontStyle:  'italic',
  },
  reviewCard: {
    padding:          spacing[4],
    backgroundColor:  colors.bg.elevated,
    borderRadius:     radius.md,
    marginBottom:     spacing[3],
    borderWidth:      1,
    borderColor:      colors.border.muted,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           spacing[3],
    marginBottom:  spacing[2],
  },
  reviewAvatar: {
    width:           32,
    height:          32,
    borderRadius:    16,
    backgroundColor: colors.accent.muted,
    alignItems:      'center',
    justifyContent:  'center',
  },
  reviewAvatarText: {
    color:      colors.accent.base,
    fontWeight: '700',
    fontSize:   typography.size.sm,
  },
  reviewDate: { ...typography.styles.caption, marginTop: 3 },
  reviewComment: { ...typography.styles.bodySmall, lineHeight: 20 },

  // Review form
  reviewForm: {
    backgroundColor: colors.bg.elevated,
    borderRadius:    radius.md,
    padding:         spacing[4],
    marginBottom:    spacing[4],
    borderWidth:     1,
    borderColor:     colors.border.default,
  },
  reviewFormTitle: {
    ...typography.styles.h3,
    marginBottom: spacing[3],
  },
  starPicker: {
    flexDirection:  'row',
    gap:            spacing[3],
    marginBottom:   spacing[4],
  },
  starPickerStar: {
    fontSize: 32,
    color:    colors.border.default,
  },
  starPickerStarActive: {
    color: colors.warning,
  },
  reviewInput: {
    backgroundColor: colors.bg.surface,
    borderRadius:    radius.input,
    borderWidth:     1,
    borderColor:     colors.border.default,
    padding:         spacing[3],
    color:           colors.text.primary,
    fontSize:        typography.size.base,
    minHeight:       80,
    marginBottom:    spacing[4],
    textAlignVertical: 'top',
  },
});
