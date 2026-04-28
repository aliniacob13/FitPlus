import { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { colors, radius, spacing, typography } from "@/constants/theme";
import { gymApi } from "@/services/gymApi";

type Props = {
  gymId: number;
  onSuccess: () => void;
};

export const GymReviewForm = ({ gymId, onSuccess }: Props) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (rating === 0 || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      await gymApi.addReview(gymId, { rating, comment: comment.trim() || undefined });
      onSuccess();
    } catch (err) {
      const status = (err as { response?: { status?: number } }).response?.status;
      if (status === 409) {
        setError("You have already reviewed this gym.");
      } else {
        setError("Could not submit. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const isDisabled = rating === 0 || submitting;

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Your Rating</Text>
      <View style={styles.stars}>
        {[1, 2, 3, 4, 5].map((n) => (
          <Pressable key={n} onPress={() => setRating(n)} hitSlop={6} style={styles.starHit}>
            <Text style={[styles.star, n <= rating && styles.starFilled]}>
              {n <= rating ? "★" : "☆"}
            </Text>
          </Pressable>
        ))}
      </View>

      <TextInput
        style={styles.textarea}
        placeholder="Share your experience (optional)"
        placeholderTextColor={colors.mutedText}
        value={comment}
        onChangeText={(t) => setComment(t.slice(0, 500))}
        multiline
        numberOfLines={3}
        textAlignVertical="top"
      />
      <Text style={styles.charCount}>{comment.length} / 500</Text>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Pressable
        onPress={() => void handleSubmit()}
        disabled={isDisabled}
        style={[styles.submitBtn, isDisabled && styles.submitDisabled]}
      >
        {submitting ? (
          <ActivityIndicator color={colors.textPalette.inverse} size="small" />
        ) : (
          <Text style={styles.submitLabel}>Submit Review</Text>
        )}
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  label: {
    ...typography.styles.label,
  },
  stars: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  starHit: {
    padding: spacing[1],
  },
  star: {
    fontSize: 28,
    color: colors.border,
  },
  starFilled: {
    color: colors.accent.base,
  },
  textarea: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    backgroundColor: colors.bg.elevated,
    color: colors.text,
    padding: spacing.sm,
    fontSize: typography.size.base,
    minHeight: 80,
  },
  charCount: {
    ...typography.styles.caption,
    textAlign: "right",
  },
  error: {
    color: colors.error,
    fontSize: typography.size.sm,
  },
  submitBtn: {
    backgroundColor: colors.accent.base,
    borderRadius: radius.button,
    paddingVertical: spacing.sm,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
  },
  submitDisabled: {
    opacity: 0.55,
  },
  submitLabel: {
    color: colors.textPalette.inverse,
    fontWeight: "700",
    fontSize: typography.size.base,
  },
});
