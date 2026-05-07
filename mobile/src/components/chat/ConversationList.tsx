import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius, spacing, typography } from "@/constants/theme";
import { Conversation } from "@/services/aiApi";

// ── ConversationItem ──────────────────────────────────────────────────────────

type ConversationItemProps = {
  conversation: Conversation;
  isActive: boolean;
  onSelect: (conv: Conversation) => void;
  onDelete: (convId: number) => void;
};

export const ConversationItem = ({
  conversation,
  isActive,
  onSelect,
  onDelete,
}: ConversationItemProps) => (
  <View style={styles.row}>
    <TouchableOpacity
      style={[styles.item, isActive && styles.itemActive]}
      onPress={() => onSelect(conversation)}
      activeOpacity={0.7}
    >
      <View style={styles.itemLeft}>
        <View style={[styles.badge, isActive && styles.badgeActive]}>
          <Ionicons
            name={conversation.agent_type === "workout" ? "barbell" : "nutrition"}
            size={12}
            color={isActive ? colors.textPalette.inverse : colors.textPalette.muted}
          />
        </View>
        <View style={styles.itemText}>
          <Text
            style={[styles.itemTitle, isActive && styles.itemTitleActive]}
            numberOfLines={2}
          >
            {conversation.title}
          </Text>
          <Text style={styles.itemDate}>
            {new Date(conversation.created_at).toLocaleDateString("ro-RO", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </Text>
        </View>
      </View>
    </TouchableOpacity>

    <TouchableOpacity
      style={styles.deleteBtn}
      onPress={() => onDelete(conversation.id)}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    >
      <Ionicons name="trash-outline" size={16} color={colors.textPalette.muted} />
    </TouchableOpacity>
  </View>
);

// ── ConversationListModal ─────────────────────────────────────────────────────

type ConversationListModalProps = {
  visible: boolean;
  conversations: Conversation[];
  activeConvId: number | null;
  onClose: () => void;
  onSelect: (conv: Conversation) => void;
  onNewChat: () => void;
  onDelete: (convId: number) => void;
};

export const ConversationListModal = ({
  visible,
  conversations,
  activeConvId,
  onClose,
  onSelect,
  onNewChat,
  onDelete,
}: ConversationListModalProps) => (
  <Modal
    visible={visible}
    transparent
    animationType="slide"
    onRequestClose={onClose}
  >
    <Pressable style={styles.overlay} onPress={onClose}>
      <View
        style={styles.sheet}
        onStartShouldSetResponder={() => true}
      >
        <View style={styles.handle} />

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Chat History</Text>
          <TouchableOpacity
            onPress={onNewChat}
            style={styles.newBtn}
            activeOpacity={0.8}
          >
            <Ionicons name="add" size={14} color={colors.accent.base} />
            <Text style={styles.newBtnText}>New Chat</Text>
          </TouchableOpacity>
        </View>

        {/* List */}
        {conversations.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>💬</Text>
            <Text style={styles.emptyText}>No conversations yet.</Text>
            <Text style={styles.emptySubtext}>
              Start a new chat and it will appear here.
            </Text>
          </View>
        ) : (
          <ScrollView
            style={styles.list}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {conversations.map((conv) => (
              <ConversationItem
                key={conv.id}
                conversation={conv}
                isActive={conv.id === activeConvId}
                onSelect={(c) => {
                  onSelect(c);
                  onClose();
                }}
                onDelete={onDelete}
              />
            ))}
          </ScrollView>
        )}
      </View>
    </Pressable>
  </Modal>
);

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.65)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: colors.bg.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    borderTopWidth: 1,
    borderColor: colors.borderPalette.default,
    paddingBottom: spacing["2xl"],
    maxHeight: "72%",
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
    marginBottom: spacing[1],
  },
  headerTitle: {
    ...typography.styles.h3,
  },
  newBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
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
  list: {
    flexGrow: 0,
  },
  emptyContainer: {
    padding: spacing.xl,
    alignItems: "center",
    gap: spacing[2],
  },
  emptyEmoji: { fontSize: 40 },
  emptyText: {
    ...typography.styles.h3,
    textAlign: "center",
  },
  emptySubtext: {
    ...typography.styles.bodySmall,
    textAlign: "center",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: spacing.md,
    paddingRight: spacing[3],
    borderBottomWidth: 1,
    borderColor: colors.borderPalette.muted,
  },
  item: {
    flex: 1,
    paddingVertical: spacing[4],
  },
  itemActive: {
    // subtle highlight handled by text / badge below
  },
  itemLeft: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing[3],
  },
  badge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.bg.overlay,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
    flexShrink: 0,
  },
  badgeActive: {
    backgroundColor: colors.accent.base,
  },
  itemText: { flex: 1, gap: 3 },
  itemTitle: {
    fontSize: typography.size.base,
    fontWeight: "500",
    color: colors.textPalette.primary,
  },
  itemTitleActive: {
    color: colors.accent.base,
    fontWeight: "700",
  },
  itemDate: {
    fontSize: typography.size.xs,
    color: colors.textPalette.muted,
  },
  deleteBtn: {
    padding: spacing[2],
    marginLeft: spacing[2],
  },
});

