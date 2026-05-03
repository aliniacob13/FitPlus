/**
 * AIChatScreen — Shared AI chat interface for Workout Trainer & Diet Counselor.
 *
 * Uses POST /ai/{agentType}/chat  (non-streaming, reliable cross-platform)
 * Conversation history is persisted server-side and loaded on mount.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { api } from '../../lib/api';
import { colors, radius, shadows, spacing, typography } from '../../theme';

// ─── Types ────────────────────────────────────────────────────────────────────

export type AgentType = 'workout' | 'diet';

interface Message {
  id:         number;
  role:       'user' | 'assistant';
  content:    string;
  created_at: string;
}

interface OptimisticMessage {
  tempId:  string;
  role:    'user' | 'assistant';
  content: string;
  pending: boolean;
}

type DisplayMessage = Message | OptimisticMessage;

interface Conversation {
  id:         number;
  agent_type: string;
  title:      string;
  created_at: string;
}

interface AIChatScreenProps {
  agentType: AgentType;
}

// ─── Config ───────────────────────────────────────────────────────────────────

const AGENT_CONFIG: Record<AgentType, { name: string; emoji: string; placeholder: string; color: string }> = {
  workout: {
    name:        'Workout Trainer',
    emoji:       '🏋️',
    placeholder: 'Ask about workouts, exercises, goals…',
    color:       '#c5f135',
  },
  diet: {
    name:        'Diet Counselor',
    emoji:       '🥗',
    placeholder: 'Ask about meals, nutrition, recipes…',
    color:       '#4ade80',
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isTempMessage(m: DisplayMessage): m is OptimisticMessage {
  return 'tempId' in m;
}

function getKey(m: DisplayMessage): string {
  return isTempMessage(m) ? m.tempId : m.id.toString();
}

function getRole(m: DisplayMessage): string {
  return m.role;
}

function getContent(m: DisplayMessage): string {
  return m.content;
}

function isPending(m: DisplayMessage): boolean {
  return isTempMessage(m) && m.pending;
}

function formatTime(iso: string | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

// ─── Typing indicator ─────────────────────────────────────────────────────────

function TypingDots() {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const pulse = (val: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(val, { toValue: 1, duration: 300, useNativeDriver: true }),
          Animated.timing(val, { toValue: 0, duration: 300, useNativeDriver: true }),
          Animated.delay(600 - delay),
        ])
      );

    const a1 = pulse(dot1, 0);
    const a2 = pulse(dot2, 200);
    const a3 = pulse(dot3, 400);
    a1.start(); a2.start(); a3.start();
    return () => { a1.stop(); a2.stop(); a3.stop(); };
  }, [dot1, dot2, dot3]);

  const dotStyle = (val: Animated.Value) => ({
    width:        6,
    height:       6,
    borderRadius: 3,
    backgroundColor: colors.text.muted,
    opacity:      val.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] }),
    transform:    [{ translateY: val.interpolate({ inputRange: [0, 1], outputRange: [0, -4] }) }],
  });

  return (
    <View style={{ flexDirection: 'row', gap: 4, alignItems: 'center', padding: spacing[3] }}>
      <Animated.View style={dotStyle(dot1)} />
      <Animated.View style={dotStyle(dot2)} />
      <Animated.View style={dotStyle(dot3)} />
    </View>
  );
}

// ─── Message bubble ───────────────────────────────────────────────────────────

function Bubble({
  message,
  agentColor,
}: {
  message: DisplayMessage;
  agentColor: string;
}) {
  const isUser  = getRole(message) === 'user';
  const pending = isPending(message);
  const time    = !isTempMessage(message) ? formatTime((message as Message).created_at) : '';

  return (
    <View style={[bubbleStyles.row, isUser && bubbleStyles.rowUser]}>
      {!isUser && (
        <View style={[bubbleStyles.avatar, { borderColor: agentColor }]}>
          <Text style={bubbleStyles.avatarText}>AI</Text>
        </View>
      )}

      <View style={[bubbleStyles.bubble, isUser ? bubbleStyles.bubbleUser : bubbleStyles.bubbleAI]}>
        {pending ? (
          <TypingDots />
        ) : (
          <>
            <Text style={[bubbleStyles.text, isUser && bubbleStyles.textUser]}>
              {getContent(message)}
            </Text>
            {time && <Text style={[bubbleStyles.time, isUser && bubbleStyles.timeUser]}>{time}</Text>}
          </>
        )}
      </View>
    </View>
  );
}

const bubbleStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems:    'flex-end',
    marginBottom:  spacing[3],
    paddingHorizontal: spacing.screen,
    gap: spacing[2],
  },
  rowUser: { flexDirection: 'row-reverse' },

  avatar: {
    width:           28,
    height:          28,
    borderRadius:    14,
    borderWidth:     1.5,
    backgroundColor: colors.bg.elevated,
    alignItems:      'center',
    justifyContent:  'center',
    marginBottom:    2,
  },
  avatarText: {
    fontSize:   9,
    fontWeight: '800',
    color:      colors.text.primary,
  },

  bubble: {
    maxWidth:     '78%',
    borderRadius: radius.lg,
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
  },
  bubbleUser: {
    backgroundColor: colors.accent.base,
    borderBottomRightRadius: radius.xs,
  },
  bubbleAI: {
    backgroundColor: colors.bg.elevated,
    borderWidth:     1,
    borderColor:     colors.border.default,
    borderBottomLeftRadius: radius.xs,
  },

  text: {
    fontSize:   typography.size.base,
    color:      colors.text.primary,
    lineHeight: 22,
  },
  textUser: { color: colors.text.inverse },

  time: {
    fontSize:   typography.size.xs,
    color:      colors.text.muted,
    marginTop:  spacing[1],
    alignSelf:  'flex-end',
  },
  timeUser: { color: `${colors.text.inverse}80` },
});

// ─── Conversation list modal ───────────────────────────────────────────────────

function ConversationListModal({
  visible,
  onClose,
  conversations,
  activeId,
  onSelect,
  onDelete,
  onNew,
}: {
  visible:       boolean;
  onClose:       () => void;
  conversations: Conversation[];
  activeId:      number | null;
  onSelect:      (id: number) => void;
  onDelete:      (id: number) => void;
  onNew:         () => void;
}) {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={convStyles.overlay}>
        <TouchableOpacity style={{ flex: 1 }} onPress={onClose} />
        <View style={convStyles.sheet}>
          <View style={convStyles.handle} />
          <View style={convStyles.sheetHeader}>
            <Text style={convStyles.sheetTitle}>Conversations</Text>
            <TouchableOpacity onPress={onNew} style={convStyles.newBtn}>
              <Text style={convStyles.newBtnText}>+ New</Text>
            </TouchableOpacity>
          </View>

          {conversations.length === 0 ? (
            <Text style={convStyles.empty}>No conversations yet.</Text>
          ) : (
            <FlatList
              data={conversations}
              keyExtractor={(c) => c.id.toString()}
              contentContainerStyle={{ paddingBottom: spacing['2xl'] }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[convStyles.item, item.id === activeId && convStyles.itemActive]}
                  onPress={() => { onSelect(item.id); onClose(); }}
                >
                  <Text style={convStyles.itemTitle} numberOfLines={1}>{item.title}</Text>
                  <Text style={convStyles.itemDate}>
                    {new Date(item.created_at).toLocaleDateString()}
                  </Text>
                  <TouchableOpacity
                    onPress={() => onDelete(item.id)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Text style={convStyles.deleteBtn}>🗑</Text>
                  </TouchableOpacity>
                </TouchableOpacity>
              )}
            />
          )}
        </View>
      </View>
    </Modal>
  );
}

const convStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.bg.surface,
    borderTopLeftRadius: radius['2xl'],
    borderTopRightRadius: radius['2xl'],
    maxHeight: '70%',
    paddingBottom: Platform.OS === 'ios' ? spacing.xl : spacing.lg,
  },
  handle: {
    width:           40,
    height:          4,
    borderRadius:    2,
    backgroundColor: colors.border.default,
    alignSelf:       'center',
    marginTop:       spacing[3],
    marginBottom:    spacing[3],
  },
  sheetHeader: {
    flexDirection:   'row',
    justifyContent:  'space-between',
    alignItems:      'center',
    paddingHorizontal: spacing.screen,
    marginBottom:    spacing[3],
  },
  sheetTitle: { ...typography.styles.h3 },
  newBtn: {
    paddingVertical:   spacing[1],
    paddingHorizontal: spacing[3],
    borderRadius:      radius.button,
    backgroundColor:   colors.accent.muted,
    borderWidth:       1,
    borderColor:       colors.accent.base,
  },
  newBtnText: { color: colors.accent.base, fontWeight: '700', fontSize: typography.size.sm },
  empty: {
    ...typography.styles.bodySmall,
    color:      colors.text.muted,
    textAlign:  'center',
    paddingVertical: spacing.xl,
  },
  item: {
    flexDirection:   'row',
    alignItems:      'center',
    paddingHorizontal: spacing.screen,
    paddingVertical: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: colors.border.muted,
    gap: spacing[3],
  },
  itemActive: { backgroundColor: colors.bg.elevated },
  itemTitle: {
    flex:       1,
    fontSize:   typography.size.base,
    color:      colors.text.primary,
    fontWeight: '600',
  },
  itemDate: { ...typography.styles.caption },
  deleteBtn: { fontSize: 16 },
});

// ─── Main component ───────────────────────────────────────────────────────────

export default function AIChatScreen({ agentType }: AIChatScreenProps) {
  const config = AGENT_CONFIG[agentType];

  const [messages,       setMessages]       = useState<DisplayMessage[]>([]);
  const [inputText,      setInputText]      = useState('');
  const [sending,        setSending]        = useState(false);
  const [conversations,  setConversations]  = useState<Conversation[]>([]);
  const [activeConvId,   setActiveConvId]   = useState<number | null>(null);
  const [showConvList,   setShowConvList]   = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const flatListRef   = useRef<FlatList>(null);
  const inputRef      = useRef<TextInput>(null);
  const tempIdCounter = useRef(0);

  // ── Load conversations on mount ────────────────────────────────────────────

  const loadConversations = useCallback(async () => {
    try {
      const { data } = await api.get<Conversation[]>('/ai/conversations');
      const mine = data.filter((c) => c.agent_type === agentType);
      setConversations(mine);
      return mine;
    } catch {
      return [];
    }
  }, [agentType]);

  useEffect(() => {
    loadConversations().then((convs) => {
      // Auto-open most recent conversation for this agent
      if (convs.length > 0) {
        loadHistory(convs[0].id);
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Load message history ───────────────────────────────────────────────────

  const loadHistory = useCallback(async (convId: number) => {
    setLoadingHistory(true);
    setActiveConvId(convId);
    try {
      const { data } = await api.get<Message[]>(`/ai/conversations/${convId}/messages`);
      setMessages(data);
    } catch {
      setMessages([]);
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  // ── New conversation ───────────────────────────────────────────────────────

  const startNewConversation = useCallback(() => {
    setActiveConvId(null);
    setMessages([]);
    setShowConvList(false);
    inputRef.current?.focus();
  }, []);

  // ── Delete conversation ────────────────────────────────────────────────────

  const deleteConversation = useCallback(async (convId: number) => {
    Alert.alert('Delete Conversation', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/ai/conversations/${convId}`);
            const updated = await loadConversations();
            if (activeConvId === convId) {
              if (updated.length > 0) {
                loadHistory(updated[0].id);
              } else {
                startNewConversation();
              }
            }
          } catch {
            Alert.alert('Error', 'Could not delete conversation.');
          }
        },
      },
    ]);
  }, [activeConvId, loadConversations, loadHistory, startNewConversation]);

  // ── Send message ───────────────────────────────────────────────────────────

  const sendMessage = useCallback(async () => {
    const text = inputText.trim();
    if (!text || sending) return;

    setInputText('');
    setSending(true);

    // Optimistic user message
    tempIdCounter.current += 1;
    const userTempId = `u_${tempIdCounter.current}`;
    tempIdCounter.current += 1;
    const aiTempId = `a_${tempIdCounter.current}`;

    const userMsg: OptimisticMessage = { tempId: userTempId, role: 'user',      content: text,  pending: false };
    const aiMsg:   OptimisticMessage = { tempId: aiTempId,   role: 'assistant', content: '',    pending: true  };

    setMessages((prev) => [...prev, userMsg, aiMsg]);

    // Scroll to bottom
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);

    try {
      const { data } = await api.post<{ response: string; conversation_id: number }>(
        `/ai/${agentType}/chat`,
        { message: text, conversation_id: activeConvId ?? undefined }
      );

      // Replace optimistic messages with real ones
      const newMessages: DisplayMessage[] = [
        { id: Date.now(),     role: 'user',      content: text,          created_at: new Date().toISOString() },
        { id: Date.now() + 1, role: 'assistant', content: data.response, created_at: new Date().toISOString() },
      ];

      setMessages((prev) => {
        const withoutOptimistic = prev.filter(
          (m) => !(isTempMessage(m) && (m.tempId === userTempId || m.tempId === aiTempId))
        );
        return [...withoutOptimistic, ...newMessages];
      });

      // Update active conversation
      if (activeConvId !== data.conversation_id) {
        setActiveConvId(data.conversation_id);
        loadConversations();
      }
    } catch (err: unknown) {
      // Remove pending AI bubble on error
      setMessages((prev) =>
        prev.filter((m) => !(isTempMessage(m) && m.tempId === aiTempId))
      );
      const msg = (err as { response?: { data?: { detail?: string } } })
        ?.response?.data?.detail ?? 'Could not reach the AI. Try again.';
      Alert.alert('Error', msg);
    } finally {
      setSending(false);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 150);
    }
  }, [inputText, sending, agentType, activeConvId, loadConversations]);

  // ─── Render ────────────────────────────────────────────────────────────────

  const accentColor = config.color;

  return (
    <SafeAreaView style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <View style={[styles.agentIcon, { borderColor: accentColor }]}>
          <Text style={styles.agentEmoji}>{config.emoji}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>{config.name}</Text>
          {activeConvId && (
            <Text style={styles.headerSub}>
              {conversations.find((c) => c.id === activeConvId)?.title ?? 'Active conversation'}
            </Text>
          )}
        </View>
        <TouchableOpacity
          style={styles.headerBtn}
          onPress={startNewConversation}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.headerBtnText}>+</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.headerBtn, { marginLeft: spacing[2] }]}
          onPress={async () => { await loadConversations(); setShowConvList(true); }}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.headerBtnText}>☰</Text>
        </TouchableOpacity>
      </View>

      {/* Message list */}
      {loadingHistory ? (
        <View style={styles.center}>
          <ActivityIndicator color={accentColor} />
          <Text style={styles.loadingText}>Loading history…</Text>
        </View>
      ) : messages.length === 0 ? (
        <View style={styles.emptyChat}>
          <Text style={[styles.emptyChatEmoji, { color: accentColor }]}>{config.emoji}</Text>
          <Text style={styles.emptyChatTitle}>Hi! I'm your {config.name}.</Text>
          <Text style={styles.emptyChatBody}>
            Ask me anything about {agentType === 'workout' ? 'workouts, exercises, and fitness goals' : 'meals, nutrition, and healthy eating'}.
          </Text>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={getKey}
          contentContainerStyle={styles.messageList}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
          renderItem={({ item }) => (
            <Bubble message={item} agentColor={accentColor} />
          )}
        />
      )}

      {/* Input bar */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <View style={styles.inputBar}>
          <TextInput
            ref={inputRef}
            style={styles.input}
            placeholder={config.placeholder}
            placeholderTextColor={colors.text.muted}
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={4000}
            returnKeyType="send"
            onSubmitEditing={sendMessage}
            blurOnSubmit={false}
            editable={!sending}
          />
          <TouchableOpacity
            style={[
              styles.sendBtn,
              { backgroundColor: accentColor },
              (sending || !inputText.trim()) && styles.sendBtnDisabled,
            ]}
            onPress={sendMessage}
            disabled={sending || !inputText.trim()}
            activeOpacity={0.8}
          >
            {sending ? (
              <ActivityIndicator color={colors.text.inverse} size="small" />
            ) : (
              <Text style={styles.sendBtnText}>↑</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Conversation list modal */}
      <ConversationListModal
        visible={showConvList}
        onClose={() => setShowConvList(false)}
        conversations={conversations}
        activeId={activeConvId}
        onSelect={loadHistory}
        onDelete={deleteConversation}
        onNew={startNewConversation}
      />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg.base },

  // Header
  header: {
    flexDirection:    'row',
    alignItems:       'center',
    paddingHorizontal: spacing.screen,
    paddingVertical:  spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
    gap: spacing[3],
  },
  agentIcon: {
    width:           42,
    height:          42,
    borderRadius:    21,
    borderWidth:     2,
    backgroundColor: colors.bg.elevated,
    alignItems:      'center',
    justifyContent:  'center',
  },
  agentEmoji: { fontSize: 20 },
  headerTitle: {
    fontSize:   typography.size.base,
    fontWeight: '700',
    color:      colors.text.primary,
  },
  headerSub: {
    ...typography.styles.caption,
    marginTop: 1,
  },
  headerBtn: {
    width:           36,
    height:          36,
    borderRadius:    radius.md,
    backgroundColor: colors.bg.elevated,
    borderWidth:     1,
    borderColor:     colors.border.default,
    alignItems:      'center',
    justifyContent:  'center',
  },
  headerBtnText: {
    color:      colors.text.primary,
    fontSize:   18,
    fontWeight: '600',
  },

  // States
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing[3] },
  loadingText: { ...typography.styles.bodySmall, color: colors.text.muted },

  emptyChat: {
    flex:            1,
    alignItems:      'center',
    justifyContent:  'center',
    paddingHorizontal: spacing['2xl'],
  },
  emptyChatEmoji: { fontSize: 56, marginBottom: spacing[4] },
  emptyChatTitle: {
    ...typography.styles.h3,
    marginBottom: spacing[2],
    textAlign:    'center',
  },
  emptyChatBody: {
    ...typography.styles.bodySmall,
    color:     colors.text.muted,
    textAlign: 'center',
    lineHeight: 20,
  },

  // Messages
  messageList: {
    paddingTop:    spacing[4],
    paddingBottom: spacing[4],
  },

  // Input bar
  inputBar: {
    flexDirection:   'row',
    alignItems:      'flex-end',
    paddingHorizontal: spacing.screen,
    paddingVertical: spacing[3],
    paddingBottom:   Platform.OS === 'ios' ? spacing[4] : spacing[3],
    borderTopWidth:  1,
    borderTopColor:  colors.border.default,
    backgroundColor: colors.bg.base,
    gap:             spacing[2],
  },
  input: {
    flex:            1,
    minHeight:       44,
    maxHeight:       120,
    backgroundColor: colors.bg.elevated,
    borderRadius:    radius.button,
    borderWidth:     1,
    borderColor:     colors.border.default,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    color:           colors.text.primary,
    fontSize:        typography.size.base,
    lineHeight:      22,
  },
  sendBtn: {
    width:        44,
    height:       44,
    borderRadius: radius.full,
    alignItems:   'center',
    justifyContent: 'center',
    ...shadows.accent,
  },
  sendBtnDisabled: {
    opacity: 0.4,
  },
  sendBtnText: {
    color:      colors.text.inverse,
    fontSize:   20,
    fontWeight: '700',
  },
});
