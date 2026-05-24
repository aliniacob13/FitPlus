import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { aiApi, MessageRecord } from "@/services/aiApi";
import { colors, radius, spacing, typography } from "@/constants/theme";

// ── Types ─────────────────────────────────────────────────────────────────────

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

type Props = {
  agentType: "workout" | "diet";
  title: string;
  subtitle?: string;
  placeholder?: string;
};

// ── Helpers ───────────────────────────────────────────────────────────────────

const toMessage = (r: MessageRecord): Message => ({
  id: String(r.id),
  role: r.role,
  content: r.content,
});

// ── Component ─────────────────────────────────────────────────────────────────

export const AIChatScreen = ({ agentType, title, subtitle, placeholder }: Props) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [conversationId, setConversationId] = useState<number | undefined>();
  const [error, setError] = useState<string | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(true);

  const abortRef = useRef<AbortController | null>(null);
  const fullContentRef = useRef("");
  const listRef = useRef<FlatList<Message>>(null);

  const streamFn =
    agentType === "diet" ? aiApi.streamDietMessage : aiApi.streamWorkoutMessage;

  // ── Load history on mount ─────────────────────────────────────────────────

  useEffect(() => {
    let cancelled = false;

    const loadHistory = async () => {
      try {
        const conversations = await aiApi.listConversations();
        // Backend returns newest-first; find the most recent one for this agent.
        const latest = conversations.find((c) => c.agent_type === agentType);
        if (!latest || cancelled) return;

        const records = await aiApi.getMessages(latest.id);
        if (cancelled) return;

        setMessages(records.map(toMessage));
        setConversationId(latest.id);
      } catch {
        // History load failing is non-fatal — start a fresh conversation.
      } finally {
        if (!cancelled) setLoadingHistory(false);
      }
    };

    void loadHistory();
    return () => { cancelled = true; };
  }, [agentType]);

  // ── Auto-scroll ───────────────────────────────────────────────────────────

  useEffect(() => {
    if (!loadingHistory) {
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 80);
    }
  }, [messages.length, streamingContent, loadingHistory]);

  // ── Send ──────────────────────────────────────────────────────────────────

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || streaming) return;

    setInput("");
    setError(null);
    setStreamingContent("");
    setStreaming(true);
    fullContentRef.current = "";

    const userMsg: Message = { id: `user-${Date.now()}`, role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);

    const controller = new AbortController();
    abortRef.current = controller;

    await streamFn(
      { message: text, conversation_id: conversationId },
      {
        onChunk: (chunk) => {
          fullContentRef.current += chunk;
          setStreamingContent(fullContentRef.current);
        },
        onDone: (convId) => {
          setMessages((prev) => [
            ...prev,
            { id: `ai-${Date.now()}`, role: "assistant", content: fullContentRef.current },
          ]);
          setStreamingContent("");
          setStreaming(false);
          if (convId != null) setConversationId(convId);
          fullContentRef.current = "";
        },
        onError: (msg) => {
          setError(msg);
          if (fullContentRef.current) {
            setMessages((prev) => [
              ...prev,
              { id: `ai-${Date.now()}`, role: "assistant", content: fullContentRef.current },
            ]);
            fullContentRef.current = "";
          }
          setStreamingContent("");
          setStreaming(false);
        },
      },
      controller.signal,
    );

    // Handle cancel (stream ended without onDone/onError being called).
    setStreaming((prev) => {
      if (prev) {
        if (fullContentRef.current) {
          setMessages((msgs) => [
            ...msgs,
            { id: `ai-${Date.now()}`, role: "assistant", content: fullContentRef.current },
          ]);
          fullContentRef.current = "";
        }
        setStreamingContent("");
        return false;
      }
      return prev;
    });
  }, [input, streaming, conversationId, streamFn]);

  // ── Cancel ────────────────────────────────────────────────────────────────

  const cancel = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  // ── Render ────────────────────────────────────────────────────────────────

  const listData: Message[] =
    streaming && streamingContent !== ""
      ? [...messages, { id: "streaming", role: "assistant", content: streamingContent }]
      : streaming
      ? [...messages, { id: "streaming-empty", role: "assistant", content: "" }]
      : messages;

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 24}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{title}</Text>
          {subtitle ? <Text style={styles.headerSubtitle}>{subtitle}</Text> : null}
        </View>

        {/* Messages / loading skeleton */}
        {loadingHistory ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : (
          <FlatList
            ref={listRef}
            data={listData}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            style={styles.flex}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={<EmptyState agentType={agentType} />}
            renderItem={({ item }) => <MessageBubble message={item} />}
          />
        )}

        {/* Error bar */}
        {error ? (
          <Pressable style={styles.errorBar} onPress={() => setError(null)}>
            <Text style={styles.errorText}>⚠ {error}</Text>
            <Text style={styles.errorDismiss}>✕</Text>
          </Pressable>
        ) : null}

        {/* Input row */}
        <View style={styles.inputRow}>
          <TextInput
            style={styles.textInput}
            value={input}
            onChangeText={setInput}
            placeholder={placeholder ?? "Scrie un mesaj..."}
            placeholderTextColor={colors.mutedText}
            multiline
            editable={!streaming && !loadingHistory}
          />
          {streaming ? (
            <Pressable style={styles.stopBtn} onPress={cancel}>
              <Text style={styles.stopIcon}>■</Text>
            </Pressable>
          ) : (
            <Pressable
              style={[styles.sendBtn, (!input.trim() || loadingHistory) && styles.sendDisabled]}
              onPress={send}
              disabled={!input.trim() || loadingHistory}
            >
              <Text style={styles.sendIcon}>↑</Text>
            </Pressable>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

// ── MessageBubble ─────────────────────────────────────────────────────────────

const MessageBubble = ({ message }: { message: Message }) => {
  const isUser = message.role === "user";
  const isStreaming = message.id === "streaming" || message.id === "streaming-empty";
  const isEmpty = message.content === "";

  return (
    <View style={[styles.bubbleWrapper, isUser ? styles.bubbleWrapperUser : styles.bubbleWrapperAi]}>
      {!isUser && (
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>AI</Text>
        </View>
      )}
      <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAi, isStreaming && styles.bubbleStreaming]}>
        {isEmpty ? (
          <View style={styles.typingDots}>
            <Text style={styles.typingText}>●  ●  ●</Text>
          </View>
        ) : (
          <Text style={[styles.bubbleText, isUser ? styles.bubbleTextUser : styles.bubbleTextAi]}>
            {message.content}
            {isStreaming ? <Text style={styles.cursor}>▍</Text> : null}
          </Text>
        )}
      </View>
    </View>
  );
};

// ── EmptyState ────────────────────────────────────────────────────────────────

const SUGGESTIONS: Record<"workout" | "diet", string[]> = {
  workout: ["Plan full body 3×/săptămână", "Exercitii acasa fara echipament", "Cum sa cresc masa musculara?"],
  diet: ["Meniu saptamanal 2000 kcal", "Retete rapide cu pui", "Ce sa mananc inainte de antrenament?"],
};

const EmptyState = ({ agentType }: { agentType: "workout" | "diet" }) => (
  <View style={styles.emptyContainer}>
    <Text style={styles.emptyEmoji}>{agentType === "diet" ? "🥗" : "💪"}</Text>
    <Text style={styles.emptyTitle}>Cum te pot ajuta?</Text>
    <Text style={styles.emptyHint}>Încearcă una dintre întrebările de mai jos:</Text>
    <View style={styles.chips}>
      {SUGGESTIONS[agentType].map((s) => (
        <View key={s} style={styles.chip}>
          <Text style={styles.chipText}>{s}</Text>
        </View>
      ))}
    </View>
  </View>
);

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },

  header: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: { fontSize: typography.size.xl, fontWeight: "700", color: colors.text },
  headerSubtitle: { fontSize: typography.size.sm, color: colors.mutedText, marginTop: 2 },

  loadingContainer: { flex: 1, alignItems: "center", justifyContent: "center" },

  listContent: { padding: spacing.md, gap: spacing.sm, flexGrow: 1 },

  bubbleWrapper: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginBottom: spacing.sm,
    maxWidth: "85%",
  },
  bubbleWrapperUser: { alignSelf: "flex-end", flexDirection: "row-reverse" },
  bubbleWrapperAi: { alignSelf: "flex-start" },

  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.xs,
    flexShrink: 0,
  },
  avatarText: { fontSize: 10, fontWeight: "800", color: colors.background },

  bubble: { borderRadius: radius.lg, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, flexShrink: 1 },
  bubbleUser: { backgroundColor: colors.primary, borderBottomRightRadius: radius.sm },
  bubbleAi: { backgroundColor: colors.card, borderBottomLeftRadius: radius.sm, borderWidth: 1, borderColor: colors.border },
  bubbleStreaming: { borderColor: `${colors.primary}55` },

  bubbleText: { fontSize: typography.size.base, lineHeight: 22 },
  bubbleTextUser: { color: colors.background, fontWeight: "500" },
  bubbleTextAi: { color: colors.text },
  cursor: { color: colors.primary, fontSize: typography.size.base },

  typingDots: { paddingVertical: spacing.xs, paddingHorizontal: spacing.xs },
  typingText: { color: colors.mutedText, fontSize: typography.size.sm, letterSpacing: 4 },

  errorBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#ff5a5a22",
    borderTopWidth: 1,
    borderColor: colors.danger,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  errorText: { color: colors.danger, fontSize: typography.size.sm, flex: 1 },
  errorDismiss: { color: colors.danger, fontSize: typography.size.sm, marginLeft: spacing.sm },

  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.sm,
    backgroundColor: colors.background,
  },
  textInput: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.button,
    backgroundColor: colors.card,
    color: colors.text,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    fontSize: typography.size.base,
  },
  sendBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" },
  sendDisabled: { opacity: 0.35 },
  sendIcon: { color: colors.background, fontSize: 20, fontWeight: "700", lineHeight: 22 },
  stopBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center" },
  stopIcon: { color: colors.danger, fontSize: 14 },

  emptyContainer: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: spacing.lg, paddingTop: spacing["2xl"] },
  emptyEmoji: { fontSize: 48, marginBottom: spacing.md },
  emptyTitle: { fontSize: typography.size.lg, fontWeight: "700", color: colors.text, marginBottom: spacing.xs },
  emptyHint: { fontSize: typography.size.sm, color: colors.mutedText, textAlign: "center", marginBottom: spacing.lg },
  chips: { gap: spacing.sm, width: "100%" },
  chip: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: radius.button, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  chipText: { color: colors.mutedText, fontSize: typography.size.sm, textAlign: "center" },
});