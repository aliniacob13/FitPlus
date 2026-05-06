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
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import { colors, radius, shadows, spacing, typography } from "@/constants/theme";
import { aiApi, Conversation, Message } from "@/services/aiApi";

// ── Types ────────────────────────────────────────────────────────────────────

type AgentType = "workout" | "diet";

export type ChatScreenBaseProps = {
  agentType: AgentType;
  title: string;
  subtitle: string;
  emptyEmoji: string;
  emptyHint: string;
  inputPlaceholder: string;
};

// ── Message bubble ────────────────────────────────────────────────────────────

type LocalMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

const MessageBubble = ({ message }: { message: LocalMessage }) => {
  const isUser = message.role === "user";
  return (
    <View style={[bubbleStyles.row, isUser ? bubbleStyles.rowUser : bubbleStyles.rowAI]}>
      {!isUser && (
        <View style={bubbleStyles.aiAvatar}>
          <Ionicons name="flash" size={13} color={colors.accent.base} />
        </View>
      )}
      <View
        style={[
          bubbleStyles.bubble,
          isUser ? bubbleStyles.bubbleUser : bubbleStyles.bubbleAI,
        ]}
      >
        <Text
          style={[
            bubbleStyles.text,
            isUser ? bubbleStyles.textUser : bubbleStyles.textAI,
          ]}
        >
          {message.content}
        </Text>
      </View>
    </View>
  );
};

const TypingBubble = () => (
  <View style={[bubbleStyles.row, bubbleStyles.rowAI]}>
    <View style={bubbleStyles.aiAvatar}>
      <Ionicons name="flash" size={13} color={colors.accent.base} />
    </View>
    <View style={[bubbleStyles.bubble, bubbleStyles.bubbleAI, bubbleStyles.typingBubble]}>
      <View style={bubbleStyles.dots}>
        <View style={[bubbleStyles.dot, bubbleStyles.dot1]} />
        <View style={[bubbleStyles.dot, bubbleStyles.dot2]} />
        <View style={[bubbleStyles.dot, bubbleStyles.dot3]} />
      </View>
    </View>
  </View>
);

const bubbleStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginBottom: spacing[3],
    paddingHorizontal: spacing.md,
  },
  rowUser: {
    justifyContent: "flex-end",
  },
  rowAI: {
    justifyContent: "flex-start",
  },
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
  },
  aiAvatarText: {
    fontSize: 9,
    fontWeight: "700",
    color: colors.accent.base,
    letterSpacing: 0.5,
  },
  bubble: {
    maxWidth: "78%",
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
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.textPalette.secondary,
  },
  dot1: { opacity: 0.4 },
  dot2: { opacity: 0.7 },
  dot3: { opacity: 1 },
});

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
  emoji: {
    fontSize: 56,
    marginBottom: spacing[2],
  },
  title: {
    ...typography.styles.h3,
    textAlign: "center",
  },
  hint: {
    ...typography.styles.bodySmall,
    textAlign: "center",
    lineHeight: 20,
  },
});

// ── Conversation list modal ───────────────────────────────────────────────────

type ConvModalProps = {
  visible: boolean;
  conversations: Conversation[];
  activeConvId: number | null;
  onClose: () => void;
  onSelect: (conv: Conversation) => void;
  onNewChat: () => void;
  onDelete: (convId: number) => void;
};

const ConversationModal = ({
  visible,
  conversations,
  activeConvId,
  onClose,
  onSelect,
  onNewChat,
  onDelete,
}: ConvModalProps) => (
  <Modal
    visible={visible}
    transparent
    animationType="slide"
    onRequestClose={onClose}
  >
    <Pressable style={modalStyles.overlay} onPress={onClose}>
      <View
        style={modalStyles.sheet}
        // Prevent taps inside the sheet from closing the modal
        onStartShouldSetResponder={() => true}
      >
        <View style={modalStyles.handle} />

        <View style={modalStyles.header}>
          <Text style={modalStyles.title}>Chat History</Text>
          <TouchableOpacity onPress={onNewChat} style={modalStyles.newBtn}>
            <Text style={modalStyles.newBtnText}>+ New Chat</Text>
          </TouchableOpacity>
        </View>

        {conversations.length === 0 ? (
          <View style={modalStyles.emptyRow}>
            <Text style={modalStyles.emptyText}>No conversations yet.</Text>
          </View>
        ) : (
          conversations.map((conv) => (
            <View key={conv.id} style={modalStyles.convRow}>
              <TouchableOpacity
                style={[
                  modalStyles.convItem,
                  conv.id === activeConvId && modalStyles.convItemActive,
                ]}
                onPress={() => onSelect(conv)}
                activeOpacity={0.7}
              >
                <Text style={modalStyles.convTitle} numberOfLines={2}>
                  {conv.title}
                </Text>
                <Text style={modalStyles.convDate}>
                  {new Date(conv.created_at).toLocaleDateString("ro-RO", {
                    day: "numeric",
                    month: "short",
                  })}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={modalStyles.deleteBtn}
                onPress={() => onDelete(conv.id)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={modalStyles.deleteBtnText}>✕</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </View>
    </Pressable>
  </Modal>
);

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: colors.bg.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    borderTopWidth: 1,
    borderColor: colors.borderPalette.default,
    paddingBottom: spacing["2xl"],
    maxHeight: "70%",
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.borderPalette.default,
    alignSelf: "center",
    marginTop: spacing[3],
    marginBottom: spacing.md,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingBottom: spacing[3],
    borderBottomWidth: 1,
    borderColor: colors.borderPalette.default,
    marginBottom: spacing[2],
  },
  title: {
    ...typography.styles.h3,
  },
  newBtn: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderRadius: radius.button,
    borderWidth: 1.5,
    borderColor: colors.accent.base,
  },
  newBtnText: {
    fontSize: typography.size.sm,
    fontWeight: "700",
    color: colors.accent.base,
  },
  emptyRow: {
    padding: spacing.md,
    alignItems: "center",
  },
  emptyText: {
    ...typography.styles.bodySmall,
  },
  convRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: spacing.md,
    paddingRight: spacing[3],
    borderBottomWidth: 1,
    borderColor: colors.borderPalette.muted,
  },
  convItem: {
    flex: 1,
    paddingVertical: spacing[4],
    gap: 4,
  },
  convItemActive: {
    // highlight handled via title color below
  },
  convTitle: {
    fontSize: typography.size.base,
    fontWeight: "500",
    color: colors.textPalette.primary,
  },
  convDate: {
    fontSize: typography.size.xs,
    color: colors.textPalette.muted,
  },
  deleteBtn: {
    padding: spacing[2],
    marginLeft: spacing[2],
  },
  deleteBtnText: {
    fontSize: typography.size.sm,
    color: colors.textPalette.muted,
  },
});

// ── Main ChatScreenBase ───────────────────────────────────────────────────────

export const ChatScreenBase = ({
  agentType,
  title,
  subtitle,
  emptyEmoji,
  emptyHint,
  inputPlaceholder,
}: ChatScreenBaseProps) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<number | null>(null);
  const [messages, setMessages] = useState<LocalMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [showConvModal, setShowConvModal] = useState(false);

  const flatListRef = useRef<FlatList<LocalMessage>>(null);
  const inputRef = useRef<TextInput>(null);

  // ── Data loaders ─────────────────────────────────────────────────────────

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

  const loadMessages = useCallback(async (convId: number) => {
    setIsLoadingHistory(true);
    try {
      const raw = await aiApi.getMessages(convId);
      setMessages(
        raw.map((m) => ({
          id: String(m.id),
          role: m.role as "user" | "assistant",
          content: m.content,
        })),
      );
    } catch {
      setMessages([]);
    } finally {
      setIsLoadingHistory(false);
    }
  }, []);

  // ── Init ──────────────────────────────────────────────────────────────────

  useEffect(() => {
    void (async () => {
      const convs = await loadConversations();
      if (convs.length > 0) {
        setActiveConvId(convs[0].id);
        await loadMessages(convs[0].id);
      }
    })();
  }, [loadConversations, loadMessages]);

  // ── Scroll to bottom when messages change ─────────────────────────────────

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 80);
    }
  }, [messages]);

  // ── Actions ───────────────────────────────────────────────────────────────

  const handleSend = async () => {
    const text = inputText.trim();
    if (!text || isSending) return;

    const tempUserMsg: LocalMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: text,
    };

    setMessages((prev) => [...prev, tempUserMsg]);
    setInputText("");
    setIsSending(true);

    try {
      const send =
        agentType === "workout"
          ? aiApi.sendWorkoutMessage
          : aiApi.sendDietMessage;

      const result = await send({
        message: text,
        conversation_id: activeConvId ?? undefined,
      });

      const aiMsg: LocalMessage = {
        id: `ai-${Date.now()}`,
        role: "assistant",
        content: result.response,
      };
      setMessages((prev) => [...prev, aiMsg]);

      // If a new conversation was created, track it
      if (result.conversation_id !== activeConvId) {
        setActiveConvId(result.conversation_id);
        await loadConversations();
      }
    } catch {
      const errMsg: LocalMessage = {
        id: `err-${Date.now()}`,
        role: "assistant",
        content: "A apărut o eroare. Te rog încearcă din nou.",
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setIsSending(false);
    }
  };

  const handleNewChat = () => {
    setActiveConvId(null);
    setMessages([]);
    setShowConvModal(false);
    inputRef.current?.focus();
  };

  const handleSelectConversation = async (conv: Conversation) => {
    setActiveConvId(conv.id);
    setShowConvModal(false);
    await loadMessages(conv.id);
  };

  const handleDeleteConversation = async (convId: number) => {
    try {
      await aiApi.deleteConversation(convId);
      const updated = await loadConversations();
      if (convId === activeConvId) {
        if (updated.length > 0) {
          setActiveConvId(updated[0].id);
          await loadMessages(updated[0].id);
        } else {
          setActiveConvId(null);
          setMessages([]);
        }
      }
    } catch {
      // silent failure — user stays in current conversation
    }
  };

  // ── Derived state ─────────────────────────────────────────────────────────

  const activeConv = conversations.find((c) => c.id === activeConvId);
  const canSend = inputText.trim().length > 0 && !isSending;

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
        <View style={styles.headerRight}>
          {conversations.length > 0 && (
            <TouchableOpacity
              style={styles.headerBtn}
              onPress={() => setShowConvModal(true)}
              activeOpacity={0.7}
            >
              <Text style={styles.headerBtnText}>History</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.headerBtn, styles.newChatBtn]}
            onPress={handleNewChat}
            activeOpacity={0.7}
          >
            <Text style={[styles.headerBtnText, styles.newChatBtnText]}>
              + New
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
          </View>
        ) : messages.length === 0 ? (
          <EmptyState
            emoji={emptyEmoji}
            title={title}
            hint={emptyHint}
          />
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <MessageBubble message={item} />}
            contentContainerStyle={styles.messageList}
            showsVerticalScrollIndicator={false}
            ListFooterComponent={isSending ? <TypingBubble /> : null}
            onContentSizeChange={() =>
              flatListRef.current?.scrollToEnd({ animated: false })
            }
          />
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
            editable={!isSending}
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
          >
            {isSending ? (
              <ActivityIndicator
                size="small"
                color={colors.textPalette.inverse}
              />
            ) : (
              <Text style={styles.sendBtnIcon}>↑</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* ── Conversation history modal ── */}
      <ConversationModal
        visible={showConvModal}
        conversations={conversations}
        activeConvId={activeConvId}
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
  safeArea: {
    flex: 1,
    backgroundColor: colors.bg.base,
  },
  flex: {
    flex: 1,
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingTop: spacing[3],
    paddingBottom: spacing[4],
    borderBottomWidth: 1,
    borderColor: colors.borderPalette.default,
    backgroundColor: colors.bg.surface,
    ...shadows.sm,
  },
  headerLeft: {
    flex: 1,
    marginRight: spacing[3],
  },
  headerTitle: {
    fontSize: typography.size.md,
    fontWeight: "700",
    color: colors.textPalette.primary,
  },
  headerSub: {
    fontSize: typography.size.xs,
    color: colors.textPalette.muted,
    marginTop: 2,
  },
  headerRight: {
    flexDirection: "row",
    gap: spacing[2],
  },
  headerBtn: {
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
    letterSpacing: 0.3,
  },
  newChatBtn: {
    borderColor: colors.accent.base,
    backgroundColor: colors.accent.muted,
  },
  newChatBtnText: {
    color: colors.accent.base,
  },

  // Loading / centered
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  // Message list
  messageList: {
    paddingTop: spacing.md,
    paddingBottom: spacing[2],
    flexGrow: 1,
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
    maxHeight: 120,
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
  sendBtnIcon: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.textPalette.inverse,
    lineHeight: 22,
  },
});
