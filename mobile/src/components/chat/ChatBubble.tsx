import { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius, shadows, spacing, typography } from "@/constants/theme";

// ── Types ─────────────────────────────────────────────────────────────────────

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  /** ISO timestamp string — shown below the bubble */
  timestamp?: string;
};

// ── Timestamp helper ──────────────────────────────────────────────────────────

function formatTimestamp(iso: string): string {
  try {
    const date = new Date(iso);
    return date.toLocaleTimeString("ro-RO", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

// ── ChatBubble ────────────────────────────────────────────────────────────────

type ChatBubbleProps = {
  message: ChatMessage;
  /** When true the content is still streaming in — shows a blinking cursor */
  isStreaming?: boolean;
};

export const ChatBubble = ({ message, isStreaming = false }: ChatBubbleProps) => {
  const isUser = message.role === "user";
  const cursorOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!isStreaming) {
      cursorOpacity.setValue(0);
      return;
    }
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(cursorOpacity, {
          toValue: 0,
          duration: 450,
          useNativeDriver: true,
        }),
        Animated.timing(cursorOpacity, {
          toValue: 1,
          duration: 450,
          useNativeDriver: true,
        }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [isStreaming, cursorOpacity]);

  return (
    <View style={[styles.row, isUser ? styles.rowUser : styles.rowAI]}>
      {!isUser && (
        <View style={styles.aiAvatar}>
          <Ionicons name="flash" size={13} color={colors.accent.base} />
        </View>
      )}

      <View style={styles.bubbleWrapper}>
        <View
          style={[
            styles.bubble,
            isUser ? styles.bubbleUser : styles.bubbleAI,
          ]}
        >
          <Text
            style={[
              styles.text,
              isUser ? styles.textUser : styles.textAI,
            ]}
          >
            {message.content}
            {isStreaming && (
              <Animated.Text
                style={[styles.cursor, { opacity: cursorOpacity }]}
              >
                {"▍"}
              </Animated.Text>
            )}
          </Text>
        </View>

        {message.timestamp && (
          <Text
            style={[
              styles.timestamp,
              isUser ? styles.timestampUser : styles.timestampAI,
            ]}
          >
            {formatTimestamp(message.timestamp)}
          </Text>
        )}
      </View>
    </View>
  );
};

// ── TypingBubble ──────────────────────────────────────────────────────────────

/** Animated three-dot indicator shown while waiting for the AI to start streaming */
export const TypingBubble = () => {
  const dot1 = useRef(new Animated.Value(0.25)).current;
  const dot2 = useRef(new Animated.Value(0.25)).current;
  const dot3 = useRef(new Animated.Value(0.25)).current;

  useEffect(() => {
    const makePulse = (value: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(value, {
            toValue: 1,
            duration: 280,
            useNativeDriver: true,
          }),
          Animated.timing(value, {
            toValue: 0.25,
            duration: 280,
            useNativeDriver: true,
          }),
          Animated.delay(560 - delay),
        ]),
      );

    const a1 = makePulse(dot1, 0);
    const a2 = makePulse(dot2, 180);
    const a3 = makePulse(dot3, 360);
    a1.start();
    a2.start();
    a3.start();
    return () => {
      a1.stop();
      a2.stop();
      a3.stop();
    };
  }, [dot1, dot2, dot3]);

  return (
    <View style={[styles.row, styles.rowAI]}>
      <View style={styles.aiAvatar}>
        <Ionicons name="flash" size={13} color={colors.accent.base} />
      </View>
      <View style={[styles.bubble, styles.bubbleAI, styles.typingBubble]}>
        <View style={styles.dots}>
          {[dot1, dot2, dot3].map((opacity, i) => (
            <Animated.View key={i} style={[styles.dot, { opacity }]} />
          ))}
        </View>
      </View>
    </View>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginBottom: spacing[3],
    paddingHorizontal: spacing.md,
  },
  rowUser: { justifyContent: "flex-end" },
  rowAI: { justifyContent: "flex-start" },

  aiAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.accent.muted,
    borderWidth: 1,
    borderColor: colors.accent.base,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing[2],
    flexShrink: 0,
    alignSelf: "flex-end",
    marginBottom: 18,
  },

  bubbleWrapper: {
    maxWidth: "78%",
    gap: 3,
  },

  bubble: {
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing[3],
  },
  bubbleUser: {
    backgroundColor: colors.accent.base,
    borderBottomRightRadius: radius.sm,
    ...shadows.accent,
  },
  bubbleAI: {
    backgroundColor: colors.bg.elevated,
    borderWidth: 1,
    borderColor: colors.borderPalette.default,
    borderBottomLeftRadius: radius.sm,
  },

  text: {
    fontSize: typography.size.base,
    lineHeight: 22,
  },
  textUser: {
    color: colors.textPalette.inverse,
    fontWeight: "500",
  },
  textAI: {
    color: colors.textPalette.primary,
  },

  cursor: {
    color: colors.accent.base,
    fontSize: typography.size.base,
  },

  timestamp: {
    fontSize: typography.size.xs,
    color: colors.textPalette.muted,
  },
  timestampUser: { textAlign: "right" },
  timestampAI: { textAlign: "left", marginLeft: 2 },

  // Typing bubble
  typingBubble: {
    paddingVertical: spacing[4],
    paddingHorizontal: spacing.lg,
  },
  dots: {
    flexDirection: "row",
    gap: spacing[1],
    alignItems: "center",
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.textPalette.secondary,
  },
});

