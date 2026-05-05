import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Image, Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";

import { Loader } from "@/components/ui/Loader";
import { Screen } from "@/components/ui/Screen";
import { GymReviewForm } from "@/components/gym/GymReviewForm";
import { GymReviewList } from "@/components/gym/GymReviewList";
import { colors, radius, spacing, typography } from "@/constants/theme";
import { FavoriteGymEntry, GymDetailExtended, gymApi } from "@/services/gymApi";
import { useGymStore } from "@/store/gymStore";

export const FavoriteGymsScreen = () => {
  const navigation = useNavigation();
  const favorites = useGymStore((s) => s.favorites);
  const isFetching = useGymStore((s) => s.isFetching);
  const fetchFavorites = useGymStore((s) => s.fetchFavorites);
  const toggleFavorite = useGymStore((s) => s.toggleFavorite);
  const favoriteGymIds = useGymStore((s) => s.favoriteGymIds);

  const [gymDetail, setGymDetail] = useState<GymDetailExtended | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);

  useEffect(() => {
    void fetchFavorites();
  }, [fetchFavorites]);

  const openDetail = async (gymId: number) => {
    setLoadingDetail(true);
    setGymDetail(null);
    setShowReviewForm(false);
    try {
      const detail = await gymApi.getDetailExtended(gymId);
      setGymDetail(detail);
    } catch {
      // silently ignore — modal just won't open
    } finally {
      setLoadingDetail(false);
    }
  };

  const closeDetail = () => {
    setGymDetail(null);
    setShowReviewForm(false);
  };

  const handleHeartToggle = async () => {
    if (!gymDetail) return;
    await toggleFavorite(gymDetail.id);
    // If unfavorited, close the modal and refresh the list
    if (favoriteGymIds.has(gymDetail.id)) {
      closeDetail();
      void fetchFavorites();
    }
  };

  const refreshDetail = () => {
    if (!gymDetail) return;
    gymApi
      .getDetailExtended(gymDetail.id)
      .then((d) => setGymDetail(d))
      .catch(() => {});
  };

  const isDetailFavorited = gymDetail ? favoriteGymIds.has(gymDetail.id) : false;

  const renderItem = ({ item }: { item: FavoriteGymEntry }) => (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={() => void openDetail(item.gym_id)}
    >
      {item.image_url ? (
        <Image source={{ uri: item.image_url }} style={styles.cardImage} resizeMode="cover" />
      ) : (
        <View style={styles.cardImagePlaceholder}>
          <Text style={styles.placeholderIcon}>🏋️</Text>
        </View>
      )}
      <View style={styles.cardBody}>
        <Text style={styles.cardName} numberOfLines={1}>{item.name}</Text>
        {item.address ? (
          <Text style={styles.cardAddress} numberOfLines={2}>{item.address}</Text>
        ) : null}
        <Text style={styles.cardDate}>
          Saved {new Date(item.created_at).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        </Text>
      </View>
      <Text style={styles.chevron}>›</Text>
    </Pressable>
  );

  if (isFetching && favorites.length === 0) {
    return <Loader />;
  }

  return (
    <Screen scrollable={false}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backLabel}>← Back</Text>
        </Pressable>
        <Text style={styles.title}>My Favorites</Text>
      </View>

      <FlatList
        style={styles.listFlex}
        data={favorites}
        keyExtractor={(item) => String(item.favorite_id)}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>♡</Text>
            <Text style={styles.emptyTitle}>No favorites yet</Text>
            <Text style={styles.emptySubtitle}>
              Open a gym on the map and tap the heart to save it here.
            </Text>
          </View>
        }
      />

      {/* Loading overlay while fetching detail */}
      {loadingDetail ? (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={colors.accent.base} />
        </View>
      ) : null}

      {/* Gym detail modal */}
      <Modal
        visible={Boolean(gymDetail)}
        transparent
        animationType="slide"
        onRequestClose={closeDetail}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <ScrollView contentContainerStyle={styles.modalContent} showsVerticalScrollIndicator={false}>
              {gymDetail ? (
                <>
                  {/* Header */}
                  <View style={styles.row}>
                    <Text style={styles.modalTitle} numberOfLines={2}>{gymDetail.name}</Text>
                    <Pressable onPress={() => void handleHeartToggle()} style={styles.heartBtn} hitSlop={8}>
                      <Text style={[styles.heartText, isDetailFavorited && styles.heartTextActive]}>
                        {isDetailFavorited ? "♥" : "♡"}
                      </Text>
                    </Pressable>
                    <Pressable onPress={closeDetail}>
                      <Text style={styles.close}>Inchide</Text>
                    </Pressable>
                  </View>

                  {gymDetail.image_url ? (
                    <Image
                      source={{ uri: gymDetail.image_url }}
                      style={styles.heroImage}
                      resizeMode="cover"
                    />
                  ) : null}

                  {gymDetail.address ? (
                    <Text style={styles.meta}>{gymDetail.address}</Text>
                  ) : null}

                  {gymDetail.average_rating !== null ? (
                    <Text style={styles.avgRating}>★ {gymDetail.average_rating.toFixed(1)} medie</Text>
                  ) : null}

                  {/* Reviews */}
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Recenzii</Text>
                    <GymReviewList
                      reviews={gymDetail.reviews}
                      averageRating={gymDetail.average_rating}
                    />
                    {showReviewForm ? (
                      <GymReviewForm
                        gymId={gymDetail.id}
                        onSuccess={() => {
                          setShowReviewForm(false);
                          refreshDetail();
                        }}
                      />
                    ) : (
                      <Pressable
                        onPress={() => setShowReviewForm(true)}
                        style={styles.addReviewBtn}
                      >
                        <Text style={styles.addReviewLabel}>+ Adauga recenzie</Text>
                      </Pressable>
                    )}
                  </View>
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingBottom: spacing.md,
  },
  backBtn: {
    paddingVertical: spacing[1],
  },
  backLabel: {
    color: colors.accent.base,
    fontWeight: "700",
    fontSize: typography.size.base,
  },
  title: {
    ...typography.styles.h2,
    flex: 1,
  },
  listFlex: {
    flex: 1,
  },
  list: {
    gap: spacing.sm,
    paddingBottom: spacing["2xl"],
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.card,
    backgroundColor: colors.card,
    overflow: "hidden",
  },
  cardPressed: {
    opacity: 0.75,
  },
  cardImage: {
    width: 90,
    height: 90,
  },
  cardImagePlaceholder: {
    width: 90,
    height: 90,
    backgroundColor: colors.bg.elevated,
    alignItems: "center",
    justifyContent: "center",
  },
  placeholderIcon: {
    fontSize: 32,
  },
  cardBody: {
    flex: 1,
    padding: spacing.sm,
    gap: spacing[1],
    justifyContent: "center",
  },
  cardName: {
    color: colors.text,
    fontWeight: "700",
    fontSize: typography.size.base,
  },
  cardAddress: {
    ...typography.styles.bodySmall,
  },
  cardDate: {
    ...typography.styles.caption,
  },
  chevron: {
    color: colors.mutedText,
    fontSize: 22,
    paddingHorizontal: spacing.sm,
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: spacing["3xl"],
    gap: spacing.md,
  },
  emptyIcon: {
    fontSize: 56,
    color: colors.border,
  },
  emptyTitle: {
    ...typography.styles.h3,
  },
  emptySubtitle: {
    ...typography.styles.bodySmall,
    textAlign: "center",
    paddingHorizontal: spacing.lg,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center",
    justifyContent: "center",
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
    borderWidth: 1,
    borderColor: colors.border,
    maxHeight: "75%",
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
  heroImage: {
    width: "100%",
    height: 160,
    borderRadius: 12,
    backgroundColor: colors.border,
  },
  meta: {
    color: colors.mutedText,
  },
  avgRating: {
    color: colors.accent.base,
    fontWeight: "700",
    fontSize: typography.size.base,
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
  heartBtn: {
    padding: 4,
  },
  heartText: {
    fontSize: 24,
    color: colors.border,
  },
  heartTextActive: {
    color: "#EF4444",
  },
  close: {
    color: colors.primary,
    fontWeight: "700",
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
