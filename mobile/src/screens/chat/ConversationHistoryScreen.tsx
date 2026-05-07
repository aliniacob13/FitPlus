import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  SafeAreaView,
  SectionList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useFocusEffect, useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RouteProp } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

import { colors, radius, shadows, spacing, typography } from "@/constants/theme";
import { aiApi, Conversation } from "@/services/aiApi";
import { ConversationItem } from "@/components/chat/ConversationList";
import { AppStackParamList, MainTabParamList } from "@/types/navigation";
import { CompositeNavigationProp } from "@react-navigation/native";
import { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";

type Nav = CompositeNavigationProp<
  NativeStackNavigationProp<AppStackParamList, "ConversationHistory">,
  BottomTabNavigationProp<MainTabParamList>
>;
type RouteProps = RouteProp<AppStackParamList, "ConversationHistory">;

type Section = {
  title: string;
  data: Conversation[];
};

export const ConversationHistoryScreen = () => {
  const navigation = useNavigation<Nav>();
  const route = useRoute<RouteProps>();
  const { agentType } = route.params;

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const all = await aiApi.getConversations();
      setConversations(all.filter((c) => c.agent_type === agentType));
    } catch {
      setConversations([]);
    } finally {
      setLoading(false);
    }
  }, [agentType]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const handleSelect = (conv: Conversation) => {
    // Navigate to the chat tab, passing the conversation id as a param so the
    // chat screen can pre-load it.
    const tabScreen = agentType === "workout" ? "Workout" : "Diet";
    navigation.navigate("MainTabs" as any, {
      screen: tabScreen,
      params: { conversationId: conv.id },
    } as any);
  };

  const handleNewChat = () => {
    const tabScreen = agentType === "workout" ? "Workout" : "Diet";
    navigation.navigate("MainTabs" as any, {
      screen: tabScreen,
      params: { conversationId: undefined },
    } as any);
  };

  const handleDelete = async (convId: number) => {
    setDeletingId(convId);
    try {
      await aiApi.deleteConversation(convId);
      setConversations((prev) => prev.filter((c) => c.id !== convId));
    } catch {
      // silent — keep list as is
    } finally {
      setDeletingId(null);
    }
  };

  // Group by date (today / this week / older)
  const sections = buildSections(conversations);

  const agentLabel = agentType === "workout" ? "Workout AI" : "Diet AI";
  const agentIcon: React.ComponentProps<typeof Ionicons>["name"] =
    agentType === "workout" ? "barbell" : "nutrition";

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={22} color={colors.textPalette.primary} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <View style={styles.headerIcon}>
            <Ionicons name={agentIcon} size={16} color={colors.accent.base} />
          </View>
          <View>
            <Text style={styles.headerTitle}>{agentLabel}</Text>
            <Text style={styles.headerSub}>Conversation History</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.newBtn}
          onPress={handleNewChat}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={16} color={colors.textPalette.inverse} />
          <Text style={styles.newBtnText}>New</Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.accent.base} size="large" />
        </View>
      ) : conversations.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyEmoji}>💬</Text>
          <Text style={styles.emptyTitle}>No conversations yet</Text>
          <Text style={styles.emptySub}>
            Start your first {agentLabel.toLowerCase()} chat to see it here.
          </Text>
          <TouchableOpacity
            style={styles.startBtn}
            onPress={handleNewChat}
            activeOpacity={0.8}
          >
            <Text style={styles.startBtnText}>Start a new chat</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          stickySectionHeadersEnabled={false}
          renderSectionHeader={({ section }) => (
            <Text style={styles.sectionHeader}>{section.title}</Text>
          )}
          renderItem={({ item }) => (
            <View style={[styles.itemWrapper, deletingId === item.id && styles.itemDeleting]}>
              <ConversationItem
                conversation={item}
                isActive={false}
                onSelect={handleSelect}
                onDelete={handleDelete}
              />
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
};

// ── Date grouping ──────────────────────────────────────────────────────────────

function buildSections(convs: Conversation[]): Section[] {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekStart = new Date(todayStart);
  weekStart.setDate(weekStart.getDate() - 6);

  const today: Conversation[] = [];
  const thisWeek: Conversation[] = [];
  const older: Conversation[] = [];

  for (const c of convs) {
    const d = new Date(c.created_at);
    if (d >= todayStart) today.push(c);
    else if (d >= weekStart) thisWeek.push(c);
    else older.push(c);
  }

  return [
    today.length > 0 && { title: "Today", data: today },
    thisWeek.length > 0 && { title: "This week", data: thisWeek },
    older.length > 0 && { title: "Older", data: older },
  ].filter(Boolean) as Section[];
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg.base },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing[4],
    borderBottomWidth: 1,
    borderColor: colors.borderPalette.default,
    backgroundColor: colors.bg.surface,
    ...shadows.sm,
    gap: spacing[3],
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.bg.elevated,
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
  },
  headerIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.accent.muted,
    borderWidth: 1,
    borderColor: colors.accent.base,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: typography.size.md,
    fontWeight: "700",
    color: colors.textPalette.primary,
  },
  headerSub: {
    fontSize: typography.size.xs,
    color: colors.textPalette.muted,
    marginTop: 1,
  },
  newBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderRadius: radius.button,
    backgroundColor: colors.accent.base,
  },
  newBtnText: {
    fontSize: typography.size.sm,
    fontWeight: "700",
    color: colors.textPalette.inverse,
  },

  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing[3],
    padding: spacing.xl,
  },
  emptyEmoji: { fontSize: 52, marginBottom: spacing[2] },
  emptyTitle: { ...typography.styles.h3, textAlign: "center" },
  emptySub: {
    ...typography.styles.bodySmall,
    textAlign: "center",
    lineHeight: 20,
  },
  startBtn: {
    marginTop: spacing[3],
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing[3],
    borderRadius: radius.button,
    backgroundColor: colors.accent.base,
  },
  startBtnText: {
    fontSize: typography.size.base,
    fontWeight: "700",
    color: colors.textPalette.inverse,
  },

  list: {
    paddingBottom: spacing["2xl"],
  },
  sectionHeader: {
    ...typography.styles.label,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing[2],
    color: colors.textPalette.muted,
  },
  itemWrapper: {
    marginHorizontal: spacing[3],
    marginBottom: spacing[2],
    borderRadius: radius.card,
    backgroundColor: colors.bg.elevated,
    borderWidth: 1,
    borderColor: colors.borderPalette.default,
    overflow: "hidden",
  },
  itemDeleting: {
    opacity: 0.45,
  },
});
