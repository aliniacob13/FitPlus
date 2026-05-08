/**
 * ChatScreenBase
 *
 * Shared implementation for WorkoutChatScreen and DietChatScreen.
 *
 * Key behaviours:
 *  • Reads / writes active conversation + messages via chatStore so the
 *    session survives tab switching.
 *  • Streams AI responses via SSE (XHR-based aiApi.streamXxxMessage).
 *  • Shows ChatBubble with timestamps and a blinking cursor while streaming.
 *  • Shows TypingBubble while waiting for the first chunk.
 *  • ConversationListModal for history browsing / switching.
 *  • Aborts the XHR stream on component unmount.
 */

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { Ionicons } from "@expo/vector-icons";
import { colors, radius, shadows, spacing, typography } from "@/constants/theme";
import { aiApi, Conversation } from "@/services/aiApi";
import { ChatBubble, ChatMessage, TypingBubble } from "@/components/chat/ChatBubble";
import { ConversationListModal } from "@/components/chat/ConversationList";
import { useChatStore } from "@/store/chatStore";
import { AppStackParamList } from "@/types/navigation";

// ── Types ─────────────────────────────────────────────────────────────────────

type AgentType = "workout" | "diet";

export type ChatScreenBaseProps = {
  agentType: AgentType;
  title: string;
  subtitle: string;
  emptyEmoji: string;
  emptyHint: string;
  inputPlaceholder: string;
  /**
   * When provided (e.g. coming from ConversationHistoryScreen) the screen will
   * load this conversation on first mount, overriding whatever was cached in
   * the store.
   */
  initialConversationId?: number;
};

type Nav = NativeStackNavigationProp<AppStackParamList>;

// ── Empty state ───────────────────────────────────────────────────────────────

const EmptyState = ({
  emoji,
  title,
  hint,
}: {
  emoji: string;
  title: string;
  hint: string;
}) => (
  <View style={emptyStyles.container}>
    <Text style={emptyStyles.emoji}>{emoji}</Text>
    <Text style={emptyStyles.title}>{title}</Text>
    <Text style={emptyStyles.hint}>{hint}</Text>
  </View>
);

const emptyStyles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing["2xl"],
    gap: spacing[3],
  },
  emoji: { fontSize: 56, marginBottom: spacing[2] },
  title: { ...typography.styles.h3, textAlign: "center" },
  hint: {
    ...typography.styles.bodySmall,
    textAlign: "center",
    lineHeight: 20,
  },
});

// ── Main component ────────────────────────────────────────────────────────────

export const ChatScreenBase = ({
  agentType,
  title,
  subtitle,
  emptyEmoji,
  emptyHint,
  inputPlaceholder,
  initialConversationId,
}: ChatScreenBaseProps) => {
  const navigation = useNavigation<Nav>();

  // ── Store ─────────────────────────────────────────────────────────────────
  const storeActiveId = useChatStore((s) => s[agentType].activeConversationId);
  const storeMessages = useChatStore((s) => s[agentType].messages);
  const setActiveConversationId = useChatStore((s) => s.setActiveConversationId);
  const setStoreMessages = useChatStore((s) => s.setMessages);
  const appendToStore = useChatStore((s) => s.appendMessage);
  const patchInStore = useChatStore((s) => s.patchMessage);
  const resetSlice = useChatStore((s) => s.resetSlice);

  // ── Local UI state (not persisted) ───────────────────────────────────────
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [inputText, setInputText] = useState("");
  /** Waiting for the FIRST chunk — show TypingBubble */
  const [isWaiting, setIsWaiting] = useState(false);
  /** A stream is in progress — disable input / send */
  const [isStreaming, setIsStreaming] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [showConvModal, setShowConvModal] = useState(false);

  const flatListRef = useRef<FlatList<ChatMessage>>(null);
  const inputRef = useRef<TextInput>(null);
  const abortStreamRef = useRef<(() => void) | null>(null);
  const streamingMsgIdRef = useRef<string | null>(null);

  // ── Loaders ───────────────────────────────────────────────────────────────

  const loadConversations = useCallback(async (): Promise<Conversation[]> => {
    try {
      const all = await aiApi.getConversations();
      const filtered = all.filter((c) => c.agent_type === agentType);
      setConversations(filtered);
      return filtered;
    } catch {
      return [];
    }
  }, [agentType]);

  const loadMessages = useCallback(
    async (convId: number) => {
      setIsLoadingHistory(true);
      try {
        const raw = await aiApi.getMessages(convId);
        const msgs: ChatMessage[] = raw.map((m) => ({
          id: String(m.id),
          role: m.role as "user" | "assistant",
          content: m.content,
          timestamp: m.created_at,
        }));
        setStoreMessages(agentType, msgs);
        setActiveConversationId(agentType, convId);
      } catch {
        setStoreMessages(agentType, []);
      } finally {
        setIsLoadingHistory(false);
      }
    },
    [agentType, setStoreMessages, setActiveConversationId],
  );

  // ── Initial load ──────────────────────────────────────────────────────────

  useEffect(() => {
    void (async () => {
      const convs = await loadConversations();

      // If a specific conversation was requested (e.g. from History screen)
      // and it differs from what's currently cached, load it.
      if (
        initialConversationId != null &&
        initialConversationId !== storeActiveId
      ) {
        await loadMessages(initialConversationId);
        return;
      }

      // If nothing is loaded yet, open the most recent conversation.
      if (storeActiveId == null && convs.length > 0) {
        await loadMessages(convs[0].id);
      }
    })();
    // Only run when initialConversationId changes (tab params change).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialConversationId]);

  // ── Cleanup stream on unmount ─────────────────────────────────────────────

  useEffect(() => {
    return () => {
      abortStreamRef.current?.();
    };
  }, []);

  // ── Auto-scroll ───────────────────────────────────────────────────────────

  useEffect(() => {
    if (storeMessages.length > 0) {
      setTimeout(
        () => flatListRef.current?.scrollToEnd({ animated: true }),
        80,
      );
    }
  }, [storeMessages]);

  // ── Send ──────────────────────────────────────────────────────────────────

  const handleSend = useCallback(async () => {
    const text = inputText.trim();
    if (!text || isStreaming || isWaiting) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: text,
      timestamp: new Date().toISOString(),
    };

    appendToStore(agentType, userMsg);
    setInputText("");
    setIsWaiting(true);

    const streamingId = `ai-${Date.now()}`;
    streamingMsgIdRef.current = streamingId;
    let firstChunk = true;

    abortStreamRef.current = (
      agentType === "workout"
        ? aiApi.streamWorkoutMessage
        : aiApi.streamDietMessage
    )(
      { message: text, conversation_id: storeActiveId ?? undefined },
      {
        onChunk: (chunk) => {
          if (firstChunk) {
            firstChunk = false;
            setIsWaiting(false);
            setIsStreaming(true);
            appendToStore(agentType, {
              id: streamingId,
              role: "assistant",
              content: chunk,
              timestamp: new Date().toISOString(),
            });
          } else {
            // Append chunk to the streaming message
            patchInStore(agentType, streamingId, {
              content:
                (useChatStore
                  .getState()
                  [agentType].messages.find((m) => m.id === streamingId)
                  ?.content ?? "") + chunk,
            });
          }
        },

        onDone: async (convId) => {
          setIsWaiting(false);
          setIsStreaming(false);
          streamingMsgIdRef.current = null;
          if (convId !== storeActiveId) {
            setActiveConversationId(agentType, convId);
            await loadConversations();
          }
        },

        onError: (_errMsg) => {
          setIsWaiting(false);
          setIsStreaming(false);
          streamingMsgIdRef.current = null;
          if (firstChunk) {
            appendToStore(agentType, {
              id: `err-${Date.now()}`,
              role: "assistant",
              content: "A apărut o eroare. Te rog încearcă din nou.",
              timestamp: new Date().toISOString(),
            });
          }
        },
      },
    );
  }, [
    agentType,
    storeActiveId,
    inputText,
    isStreaming,
    isWaiting,
    appendToStore,
    patchInStore,
    setActiveConversationId,
    loadConversations,
  ]);

  // ── Conversation management ───────────────────────────────────────────────

  const handleNewChat = useCallback(() => {
    abortStreamRef.current?.();
    setIsStreaming(false);
    setIsWaiting(false);
    resetSlice(agentType);
    setShowConvModal(false);
    inputRef.current?.focus();
  }, [agentType, resetSlice]);

  const handleSelectConversation = useCallback(
    async (conv: Conversation) => {
      abortStreamRef.current?.();
      setIsStreaming(false);
      setIsWaiting(false);
      setShowConvModal(false);
      await loadMessages(conv.id);
    },
    [loadMessages],
  );

  const handleDeleteConversation = useCallback(
    async (convId: number) => {
      try {
        await aiApi.deleteConversation(convId);
        const updated = await loadConversations();
        if (convId === storeActiveId) {
          if (updated.length > 0) {
            await loadMessages(updated[0].id);
          } else {
            resetSlice(agentType);
          }
        }
      } catch {
        // silent
      }
    },
    [agentType, storeActiveId, loadConversations, loadMessages, resetSlice],
  );

  // ── Open history screen ───────────────────────────────────────────────────

  const goToHistory = () => {
    navigation.navigate("ConversationHistory", { agentType });
  };

  // ── Derived ───────────────────────────────────────────────────────────────

  const activeConv = conversations.find((c) => c.id === storeActiveId);
  const canSend = inputText.trim().length > 0 && !isStreaming && !isWaiting;
  const isBusy = isStreaming || isWaiting;
  const messages = storeMessages;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>{title}</Text>
          <Text style={styles.headerSub} numberOfLines={1}>
            {activeConv ? activeConv.title : subtitle}
          </Text>
        </View>

        <View style={styles.headerActions}>
          {conversations.length > 0 && (
            <TouchableOpacity
              style={styles.headerBtn}
              onPress={() => setShowConvModal(true)}
              activeOpacity={0.7}
              accessibilityLabel="Open conversation list"
            >
              <Ionicons
                name="chatbubbles-outline"
                size={15}
                color={colors.textPalette.secondary}
              />
              <Text style={styles.headerBtnText}>History</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.headerBtn, styles.newChatBtn]}
            onPress={handleNewChat}
            activeOpacity={0.7}
            accessibilityLabel="Start new chat"
          >
            <Ionicons
              name="add"
              size={15}
              color={colors.accent.base}
            />
            <Text style={[styles.headerBtnText, styles.newChatBtnText]}>
              New
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 88 : 0}
      >
        {/* ── Message area ── */}
        {isLoadingHistory ? (
          <View style={styles.centered}>
            <ActivityIndicator color={colors.accent.base} size="large" />
            <Text style={styles.loadingText}>Loading conversation…</Text>
          </View>
        ) : messages.length === 0 && !isWaiting ? (
          <EmptyState emoji={emptyEmoji} title={title} hint={emptyHint} />
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <ChatBubble
                message={item}
                isStreaming={item.id === streamingMsgIdRef.current}
              />
            )}
            contentContainerStyle={styles.messageList}
            showsVerticalScrollIndicator={false}
            ListFooterComponent={isWaiting ? <TypingBubble /> : null}
            onContentSizeChange={() =>
              flatListRef.current?.scrollToEnd({ animated: false })
            }
            maintainVisibleContentPosition={{
              minIndexForVisible: 0,
              autoscrollToTopThreshold: 10,
            }}
          />
        )}

        {/* ── Streaming status bar ── */}
        {isStreaming && (
          <View style={styles.streamingBar}>
            <ActivityIndicator
              size="small"
              color={colors.accent.base}
              style={{ transform: [{ scale: 0.75 }] }}
            />
            <Text style={styles.streamingText}>AI is responding…</Text>
          </View>
        )}

        {/* ── Input bar ── */}
        <View style={styles.inputBar}>
          <TextInput
            ref={inputRef}
            style={styles.textInput}
            value={inputText}
            onChangeText={setInputText}
            placeholder={inputPlaceholder}
            placeholderTextColor={colors.textPalette.muted}
            multiline
            maxLength={2000}
            editable={!isBusy}
            returnKeyType="send"
            blurOnSubmit={false}
            onSubmitEditing={() => {
              if (Platform.OS !== "web") void handleSend();
            }}
          />
          <TouchableOpacity
            style={[styles.sendBtn, !canSend && styles.sendBtnDisabled]}
            onPress={() => void handleSend()}
            disabled={!canSend}
            activeOpacity={0.8}
            accessibilityLabel="Send message"
          >
            {isBusy ? (
              <ActivityIndicator
                size="small"
                color={colors.textPalette.inverse}
              />
            ) : (
              <Ionicons
                name="arrow-up"
                size={20}
                color={
                  canSend
                    ? colors.textPalette.inverse
                    : colors.textPalette.muted
                }
              />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* ── Conversation list modal ── */}
      <ConversationListModal
        visible={showConvModal}
        conversations={conversations}
        activeConvId={storeActiveId}
        onClose={() => setShowConvModal(false)}
        onSelect={(conv) => void handleSelectConversation(conv)}
        onNewChat={handleNewChat}
        onDelete={(id) => void handleDeleteConversation(id)}
      />
    </SafeAreaView>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.bg.base },
  flex: { flex: 1 },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingTop: spacing[3],
    paddingBottom: spacing[3],
    borderBottomWidth: 1,
    borderColor: colors.borderPalette.default,
    backgroundColor: colors.bg.surface,
    ...shadows.sm,
    gap: spacing[2],
  },
  headerLeft: { flex: 1, gap: 2, minWidth: 0 },
  headerTitle: {
    fontSize: typography.size.md,
    fontWeight: "700",
    color: colors.textPalette.primary,
  },
  headerSub: {
    fontSize: typography.size.xs,
    color: colors.textPalette.muted,
  },
  headerActions: {
    flexDirection: "row",
    gap: spacing[2],
    flexShrink: 0,
  },
  headerBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.borderPalette.default,
    backgroundColor: colors.bg.elevated,
  },
  headerBtnText: {
    fontSize: typography.size.xs,
    fontWeight: "600",
    color: colors.textPalette.secondary,
  },
  newChatBtn: {
    borderColor: colors.accent.base,
    backgroundColor: colors.accent.muted,
  },
  newChatBtnText: { color: colors.accent.base },

  // Body
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing[3],
  },
  loadingText: {
    fontSize: typography.size.sm,
    color: colors.textPalette.muted,
  },

  messageList: {
    paddingTop: spacing.md,
    paddingBottom: spacing[2],
    flexGrow: 1,
  },

  // Streaming status
  streamingBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
    paddingHorizontal: spacing.md,
    paddingVertical: spacing[2],
    backgroundColor: colors.accent.muted,
    borderTopWidth: 1,
    borderColor: colors.accent.base + "40",
  },
  streamingText: {
    fontSize: typography.size.xs,
    color: colors.accent.base,
    fontWeight: "600",
    letterSpacing: 0.3,
  },

  // Input bar
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: spacing[2],
    paddingHorizontal: spacing.md,
    paddingTop: spacing[3],
    paddingBottom: spacing[4],
    borderTopWidth: 1,
    borderColor: colors.borderPalette.default,
    backgroundColor: colors.bg.surface,
  },
  textInput: {
    flex: 1,
    minHeight: 44,
    maxHeight: 130,
    backgroundColor: colors.bg.elevated,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderPalette.default,
    paddingHorizontal: spacing.md,
    paddingTop: spacing[3],
    paddingBottom: spacing[3],
    fontSize: typography.size.base,
    color: colors.textPalette.primary,
    lineHeight: 20,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.accent.base,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    ...shadows.accent,
  },
  sendBtnDisabled: {
    backgroundColor: colors.bg.elevated,
    shadowOpacity: 0,
    elevation: 0,
  },
});
