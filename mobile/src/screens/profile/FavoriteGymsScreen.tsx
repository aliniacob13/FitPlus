import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator, FlatList, Image, Modal, Platform, ScrollView,
  StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

import { useTheme } from '@/context/ThemeContext';
import { FpIcon } from '@/components/ui/FpIcon';
import { GymReviewForm } from '@/components/gym/GymReviewForm';
import { GymReviewList } from '@/components/gym/GymReviewList';
import { FavoriteGymEntry, GymDetailExtended, gymApi } from '@/services/gymApi';
import { useGymStore } from '@/store/gymStore';

const SERIF = Platform.OS === 'ios' ? 'Georgia' : 'serif';
const MONO  = Platform.OS === 'ios' ? 'Courier New' : 'monospace';

export const FavoriteGymsScreen = () => {
  const { t } = useTheme();
  const navigation = useNavigation();

  const favorites       = useGymStore((s) => s.favorites);
  const isFetching      = useGymStore((s) => s.isFetching);
  const fetchFavorites  = useGymStore((s) => s.fetchFavorites);
  const toggleFavorite  = useGymStore((s) => s.toggleFavorite);
  const favoriteGymIds  = useGymStore((s) => s.favoriteGymIds);

  const [gymDetail,       setGymDetail]       = useState<GymDetailExtended | null>(null);
  const [loadingDetail,   setLoadingDetail]   = useState(false);
  const [showReviewForm,  setShowReviewForm]  = useState(false);

  useEffect(() => { void fetchFavorites(); }, [fetchFavorites]);

  const openDetail = async (gymId: number) => {
    setLoadingDetail(true); setGymDetail(null); setShowReviewForm(false);
    try { setGymDetail(await gymApi.getDetailExtended(gymId)); }
    catch {}
    finally { setLoadingDetail(false); }
  };

  const closeDetail = () => { setGymDetail(null); setShowReviewForm(false); };

  const handleHeartToggle = async () => {
    if (!gymDetail) return;
    await toggleFavorite(gymDetail.id);
    if (favoriteGymIds.has(gymDetail.id)) { closeDetail(); void fetchFavorites(); }
  };

  const refreshDetail = () => {
    if (!gymDetail) return;
    gymApi.getDetailExtended(gymDetail.id).then((d) => setGymDetail(d)).catch(() => {});
  };

  const isDetailFavorited = gymDetail ? favoriteGymIds.has(gymDetail.id) : false;

  const renderItem = ({ item }: { item: FavoriteGymEntry }) => (
    <TouchableOpacity
      onPress={() => void openDetail(item.gym_id)}
      activeOpacity={0.75}
      style={[s.card, { backgroundColor: t.surface, borderColor: t.line }]}
    >
      {item.image_url ? (
        <Image source={{ uri: item.image_url }} style={s.cardImg} resizeMode="cover"/>
      ) : (
        <View style={[s.cardImgPlaceholder, { backgroundColor: t.surface2 }]}>
          <FpIcon name="dumbbell" size={22} color={t.muted2}/>
        </View>
      )}
      <View style={s.cardBody}>
        <Text style={[s.cardName, { color: t.ink }]} numberOfLines={1}>{item.name}</Text>
        {item.address ? <Text style={[{ fontSize: 12, color: t.muted, marginTop: 2 }]} numberOfLines={1}>{item.address}</Text> : null}
        <Text style={[{ fontSize: 11, color: t.muted2, marginTop: 6, fontFamily: MONO }]}>
          Salvat {new Date(item.created_at).toLocaleDateString('ro-RO', { day: 'numeric', month: 'short', year: 'numeric' })}
        </Text>
      </View>
      <View style={{ paddingRight: 16, justifyContent: 'center' }}>
        <FpIcon name="right" size={16} color={t.muted2}/>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[s.root, { backgroundColor: t.bg }]}>
      {/* Header */}
      <View style={[s.header, { borderBottomColor: t.lineSoft }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.7} style={s.backBtn}>
          <FpIcon name="left" size={20} color={t.ink}/>
        </TouchableOpacity>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={[s.eyebrow, { color: t.muted, fontFamily: MONO }]}>PROFIL</Text>
          <Text style={[s.headerTitle, { fontFamily: SERIF, color: t.ink }]}>Săli favorite</Text>
        </View>
        <View style={[s.heartBadge, { backgroundColor: t.bad + '18' }]}>
          <Text style={{ fontSize: 16 }}>♥</Text>
          <Text style={[{ fontSize: 12, fontWeight: '700', color: t.bad }]}>{favorites.length}</Text>
        </View>
      </View>

      {isFetching && favorites.length === 0 ? (
        <View style={[s.center]}>
          <ActivityIndicator size="large" color={t.primary}/>
          <Text style={[{ fontSize: 13, color: t.muted, marginTop: 12 }]}>Se încarcă…</Text>
        </View>
      ) : (
        <FlatList
          data={favorites}
          keyExtractor={(item) => String(item.favorite_id)}
          renderItem={renderItem}
          contentContainerStyle={s.list}
          ListEmptyComponent={
            <View style={s.empty}>
              <View style={[s.emptyIcon, { backgroundColor: t.surface2 }]}>
                <Text style={{ fontSize: 32 }}>♡</Text>
              </View>
              <Text style={[s.emptyTitle, { fontFamily: SERIF, color: t.ink }]}>Nicio sală salvată</Text>
              <Text style={[{ fontSize: 13, color: t.muted, textAlign: 'center', lineHeight: 20 }]}>
                Deschide o sală pe hartă și apasă inima pentru a o salva aici.
              </Text>
            </View>
          }
        />
      )}

      {loadingDetail ? (
        <View style={s.loadingOverlay}>
          <ActivityIndicator size="large" color={t.primary}/>
        </View>
      ) : null}

      {/* Gym detail modal */}
      <Modal visible={Boolean(gymDetail)} transparent animationType="slide" onRequestClose={closeDetail}>
        <View style={s.modalBackdrop}>
          <View style={[s.modalSheet, { backgroundColor: t.surface, borderColor: t.line }]}>
            {gymDetail ? (
              <ScrollView contentContainerStyle={s.modalContent} showsVerticalScrollIndicator={false}>
                {/* Modal header */}
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
                  <Text style={[s.modalTitle, { fontFamily: SERIF, color: t.ink, flex: 1 }]} numberOfLines={2}>
                    {gymDetail.name}
                  </Text>
                  <TouchableOpacity onPress={() => void handleHeartToggle()} style={s.heartBtn} hitSlop={8 as any}>
                    <Text style={[{ fontSize: 22, color: isDetailFavorited ? '#EF4444' : t.muted2 }]}>
                      {isDetailFavorited ? '♥' : '♡'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={closeDetail}>
                    <FpIcon name="close" size={20} color={t.ink}/>
                  </TouchableOpacity>
                </View>

                {/* Hero image */}
                {gymDetail.image_url ? (
                  <Image source={{ uri: gymDetail.image_url }} style={s.heroImage} resizeMode="cover"/>
                ) : (
                  <View style={[s.heroImagePlaceholder, { backgroundColor: t.surface2 }]}>
                    <FpIcon name="dumbbell" size={32} color={t.muted2}/>
                  </View>
                )}

                {/* Meta info */}
                <View style={[s.metaCard, { backgroundColor: t.surface2, borderColor: t.lineSoft }]}>
                  {gymDetail.address ? (
                    <View style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-start' }}>
                      <FpIcon name="pin" size={14} color={t.muted}/>
                      <Text style={[{ fontSize: 13, color: t.ink2, flex: 1 }]}>{gymDetail.address}</Text>
                    </View>
                  ) : null}
                  {gymDetail.average_rating !== null ? (
                    <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center', marginTop: 8 }}>
                      <FpIcon name="star" size={14} color={t.accent}/>
                      <Text style={[{ fontSize: 13, fontWeight: '700', color: t.ink }]}>
                        {gymDetail.average_rating.toFixed(1)} medie ({gymDetail.reviews.length} recenzii)
                      </Text>
                    </View>
                  ) : null}
                </View>

                {/* Reviews section */}
                <View style={[{ borderTopWidth: 1, borderTopColor: t.lineSoft, paddingTop: 16, gap: 12 }]}>
                  <Text style={[s.eyebrow, { color: t.muted, fontFamily: MONO }]}>RECENZII</Text>
                  <GymReviewList reviews={gymDetail.reviews} averageRating={gymDetail.average_rating}/>

                  {showReviewForm ? (
                    <GymReviewForm gymId={gymDetail.id} onSuccess={() => { setShowReviewForm(false); refreshDetail(); }}/>
                  ) : (
                    <TouchableOpacity
                      onPress={() => setShowReviewForm(true)}
                      activeOpacity={0.8}
                      style={[s.addReviewBtn, { backgroundColor: t.primary }]}
                    >
                      <FpIcon name="plus" size={14} color={t.primaryInk}/>
                      <Text style={[{ fontSize: 13, fontWeight: '600', color: t.primaryInk }]}>Adaugă recenzie</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </ScrollView>
            ) : null}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const s = StyleSheet.create({
  root:   { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16, borderBottomWidth: 1,
  },
  backBtn:     { padding: 4 },
  eyebrow:     { fontSize: 10, letterSpacing: 1.8, textTransform: 'uppercase', fontWeight: '500' },
  headerTitle: { fontSize: 26, letterSpacing: -0.5, lineHeight: 30 },
  heartBadge:  { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
  list:        { padding: 16, gap: 12, paddingBottom: 80 },
  card: {
    flexDirection: 'row', borderRadius: 20, borderWidth: 1,
    overflow: 'hidden', alignItems: 'center',
  },
  cardImg:            { width: 90, height: 90 },
  cardImgPlaceholder: { width: 90, height: 90, alignItems: 'center', justifyContent: 'center' },
  cardBody:           { flex: 1, padding: 14, gap: 2 },
  cardName:           { fontSize: 14, fontWeight: '700' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  empty:  { alignItems: 'center', paddingVertical: 60, paddingHorizontal: 32, gap: 14 },
  emptyIcon: { width: 72, height: 72, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: 24, letterSpacing: -0.4 },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center', justifyContent: 'center',
  },
  modalBackdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalSheet: {
    borderTopLeftRadius: 26, borderTopRightRadius: 26,
    borderWidth: 1, maxHeight: '80%',
  },
  modalContent: { padding: 22, gap: 14, paddingBottom: 32 },
  modalTitle:   { fontSize: 22, letterSpacing: -0.4, lineHeight: 26 },
  heroImage:    { width: '100%', height: 180, borderRadius: 16 },
  heroImagePlaceholder: { width: '100%', height: 120, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  metaCard:     { borderRadius: 16, borderWidth: 1, padding: 14 },
  heartBtn:     { padding: 4 },
  addReviewBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 12, borderRadius: 16,
  },
});
