import { StyleSheet, Text, View } from "react-native";

import { colors, radius, spacing, typography } from "@/constants/theme";
import { GymReview } from "@/services/gymApi";

type Props = {
  reviews: GymReview[];
  averageRating: number | null;
};

const StarRow = ({ rating }: { rating: number }) => (
  <Text style={styles.stars}>
    {[1, 2, 3, 4, 5].map((n) => (
      <Text key={n} style={n <= rating ? styles.starFilled : styles.starEmpty}>
        {n <= rating ? "★" : "☆"}
      </Text>
    ))}
  </Text>
);

export const GymReviewList = ({ reviews, averageRating }: Props) => (
  <View style={styles.container}>
    <View style={styles.header}>
      {averageRating !== null ? (
        <Text style={styles.avgRating}>★ {averageRating.toFixed(1)}</Text>
      ) : (
        <Text style={styles.noRating}>No ratings yet</Text>
      )}
      <Text style={styles.count}>
        {reviews.length} review{reviews.length !== 1 ? "s" : ""}
      </Text>
    </View>

    {reviews.length === 0 ? (
      <Text style={styles.empty}>Be the first to review this gym!</Text>
    ) : (
      reviews.map((r) => (
        <View key={r.id} style={styles.item}>
          <View style={styles.itemHeader}>
            <StarRow rating={r.rating} />
            <Text style={styles.date}>
              {new Date(r.created_at).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </Text>
          </View>
          {r.comment ? <Text style={styles.comment}>{r.comment}</Text> : null}
        </View>
      ))
    )}
  </View>
);

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  avgRating: {
    fontSize: typography.size.lg,
    fontWeight: "700",
    color: colors.accent.base,
  },
  noRating: {
    ...typography.styles.bodySmall,
  },
  count: {
    ...typography.styles.bodySmall,
  },
  empty: {
    ...typography.styles.bodySmall,
    fontStyle: "italic",
  },
  item: {
    backgroundColor: colors.bg.elevated,
    borderRadius: radius.sm,
    padding: spacing.sm,
    gap: spacing[1],
  },
  itemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  stars: {
    flexDirection: "row",
  },
  starFilled: {
    color: colors.accent.base,
    fontSize: 16,
  },
  starEmpty: {
    color: colors.border,
    fontSize: 16,
  },
  date: {
    ...typography.styles.caption,
  },
  comment: {
    color: colors.text,
    fontSize: typography.size.sm,
  },
});
