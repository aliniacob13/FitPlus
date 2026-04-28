import { useEffect } from "react";
import { FlatList, Image, Pressable, StyleSheet, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";

import { Loader } from "@/components/ui/Loader";
import { Screen } from "@/components/ui/Screen";
import { colors, radius, spacing, typography } from "@/constants/theme";
import { FavoriteGymEntry } from "@/services/gymApi";
import { useGymStore } from "@/store/gymStore";

export const FavoriteGymsScreen = () => {
  const navigation = useNavigation();
  const favorites = useGymStore((s) => s.favorites);
  const isFetching = useGymStore((s) => s.isFetching);
  const fetchFavorites = useGymStore((s) => s.fetchFavorites);

  useEffect(() => {
    void fetchFavorites();
  }, [fetchFavorites]);

  const renderItem = ({ item }: { item: FavoriteGymEntry }) => (
    <View style={styles.card}>
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
          Saved {new Date(item.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
        </Text>
      </View>
    </View>
  );

  if (isFetching && favorites.length === 0) {
    return <Loader />;
  }

  return (
    <Screen>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backLabel}>← Back</Text>
        </Pressable>
        <Text style={styles.title}>My Favorites</Text>
      </View>

      <FlatList
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
  list: {
    gap: spacing.sm,
    paddingBottom: spacing["2xl"],
  },
  card: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.card,
    backgroundColor: colors.card,
    overflow: "hidden",
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
});
