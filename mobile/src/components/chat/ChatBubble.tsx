import { useEffect, useMemo, useRef } from "react";
import { Animated, Platform, StyleSheet, Text, View } from "react-native";
import Markdown from "react-native-markdown-display";
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

/** Styles merged into react-native-markdown-display defaults (headings, lists, bold, etc.). */
const assistantMarkdownStyles = StyleSheet.create({
  body: {
    color: colors.textPalette.primary,
    fontSize: typography.size.base,
    lineHeight: 22,
  },
  text: {
    color: colors.textPalette.primary,
    fontSize: typography.size.base,
    lineHeight: 22,
  },
  paragraph: {
    marginTop: 0,
    marginBottom: spacing[2],
    color: colors.textPalette.primary,
    fontSize: typography.size.base,
    lineHeight: 22,
  },
  heading1: {
    fontSize: typography.size["2xl"],
    fontWeight: "800",
    color: colors.textPalette.primary,
    marginTop: spacing[2],
    marginBottom: spacing[2],
    lineHeight: 28,
  },
  heading2: {
    fontSize: typography.size.xl,
    fontWeight: "700",
    color: colors.textPalette.primary,
    marginTop: spacing[3],
    marginBottom: spacing[2],
    lineHeight: 26,
  },
  heading3: {
    fontSize: typography.size.lg,
    fontWeight: "700",
    color: colors.accent.base,
    marginTop: spacing[2],
    marginBottom: spacing[1],
    lineHeight: 24,
  },
  heading4: {
    fontSize: typography.size.md,
    fontWeight: "700",
    color: colors.textPalette.primary,
    marginTop: spacing[2],
    marginBottom: spacing[1],
    lineHeight: 22,
  },
  heading5: {
    fontSize: typography.size.sm,
    fontWeight: "700",
    color: colors.textPalette.secondary,
    marginTop: spacing[1],
    marginBottom: spacing[1],
  },
  heading6: {
    fontSize: typography.size.xs,
    fontWeight: "700",
    color: colors.textPalette.muted,
    marginTop: spacing[1],
    marginBottom: spacing[1],
  },
  strong: {
    fontWeight: "700",
    color: colors.textPalette.primary,
  },
  em: {
    fontStyle: "italic",
    color: colors.textPalette.secondary,
  },
  bullet_list: {
    marginBottom: spacing[2],
  },
  ordered_list: {
    marginBottom: spacing[2],
  },
  list_item: {
    marginBottom: spacing[1],
  },
  bullet_list_icon: {
    marginLeft: 0,
    marginRight: spacing[2],
  },
  bullet_list_content: {
    flex: 1,
  },
  ordered_list_icon: {
    marginLeft: 0,
    marginRight: spacing[2],
    minWidth: 20,
  },
  ordered_list_content: {
    flex: 1,
  },
  blockquote: {
    backgroundColor: colors.bg.surface,
    borderLeftWidth: 3,
    borderLeftColor: colors.accent.base,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    marginVertical: spacing[2],
    borderRadius: radius.sm,
  },
  hr: {
    backgroundColor: colors.borderPalette.default,
    height: StyleSheet.hairlineWidth,
    marginVertical: spacing[3],
  },
  code_inline: {
    borderWidth: 1,
    borderColor: colors.borderPalette.default,
    backgroundColor: colors.bg.surface,
    paddingHorizontal: spacing[2],
    paddingVertical: 2,
    borderRadius: radius.sm,
    fontSize: typography.size.sm,
    ...Platform.select({
      ios: { fontFamily: "Menlo" },
      android: { fontFamily: "monospace" },
      default: { fontFamily: "monospace" },
    }),
  },
  code_block: {
    borderWidth: 1,
    borderColor: colors.borderPalette.default,
    backgroundColor: colors.bg.surface,
    padding: spacing[3],
    borderRadius: radius.md,
    marginVertical: spacing[2],
    ...Platform.select({
      ios: { fontFamily: "Menlo" },
      android: { fontFamily: "monospace" },
      default: { fontFamily: "monospace" },
    }),
  },
  fence: {
    borderWidth: 1,
    borderColor: colors.borderPalette.default,
    backgroundColor: colors.bg.surface,
    padding: spacing[3],
    borderRadius: radius.md,
    marginVertical: spacing[2],
  },
  link: {
    color: colors.accent.base,
    textDecorationLine: "underline",
  },
});

// ── ChatBubble ────────────────────────────────────────────────────────────────

type ChatBubbleProps = {
  message: ChatMessage;
  /** When true the content is still streaming in — shows a blinking cursor */
  isStreaming?: boolean;
};

export const ChatBubble = ({ message, isStreaming = false }: ChatBubbleProps) => {
  const isUser = message.role === "user";
  const cursorOpacity = useRef(new Animated.Value(1)).current;

  const assistantMd = useMemo(
    () => (message.content.trim().length > 0 ? message.content : " "),
    [message.content],
  );

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
          {isUser ? (
            <Text
              style={[
                styles.text,
                styles.textUser,
              ]}
            >
              {message.content}
            </Text>
          ) : (
            <View style={styles.aiBody}>
              <Markdown mergeStyle style={assistantMarkdownStyles}>
                {assistantMd}
              </Markdown>
              {isStreaming && (
                <Animated.Text
                  style={[styles.cursor, styles.cursorAI, { opacity: cursorOpacity }]}
                >
                  {"▍"}
                </Animated.Text>
              )}
            </View>
          )}
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

  aiBody: {
    alignSelf: "stretch",
  },

  text: {
    fontSize: typography.size.base,
    lineHeight: 22,
  },
  textUser: {
    color: colors.textPalette.inverse,
    fontWeight: "500",
  },

  cursor: {
    fontSize: typography.size.base,
  },
  cursorAI: {
    color: colors.accent.base,
    marginTop: 2,
    lineHeight: 22,
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
