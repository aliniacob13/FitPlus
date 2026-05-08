import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View, Text, TouchableOpacity, StyleSheet, TextInput, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';

import { useTheme } from '@/context/ThemeContext';
import { FpIcon } from '@/components/ui/FpIcon';
import { DietChatScreen } from '@/screens/chat/DietChatScreen';
import { WorkoutChatScreen } from '@/screens/chat/WorkoutChatScreen';
import { AppStackParamList, MainTabParamList } from '@/types/navigation';
import { aiApi, Conversation } from '@/services/aiApi';
import { useChatStore } from '@/store/chatStore';

type Props = BottomTabScreenProps<MainTabParamList, 'Chat'>;

const SERIF = 'Georgia';
const MONO  = 'monospace';

export const ChatScreen = ({ route }: Props) => {
  const { t } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const initialAgent = route.params?.agentType ?? 'diet';
  const [agent,            setAgent]      = useState<'diet' | 'workout'>(initialAgent);
  const [filter,           setFilter]     = useState<'all' | 'diet' | 'workout'>('all');
  const [search,           setSearch]     = useState('');
  const [conversations,    setConvs]      = useState<Conversation[]>([]);
  const [loadingConvs,     setLoadConvs]  = useState(false);
  const [activeConvId,     setActiveConvId] = useState<number | null>(null);

  const setActiveId = useChatStore((s) => s.setActiveConversationId);

  useEffect(() => {
    setLoadConvs(true);
    aiApi.getConversations()
      .then((data) => setConvs(data.filter((c) => c.agent_type !== 'nutrition_vision')))
      .catch(() => {})
      .finally(() => setLoadConvs(false));
  }, []);

  const tagColor = (agentType: string) => agentType === 'diet' ? t.primary : t.accent;
  const tagLabel = (agentType: string) => agentType === 'diet' ? 'Diet' : 'Workout';

  const filtered = conversations.filter((c) => {
    if (filter !== 'all' && c.agent_type !== filter) return false;
    if (search && !c.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const handleSelectConv = (conv: Conversation) => {
    setActiveConvId(conv.id);
    const convAgent = conv.agent_type as 'diet' | 'workout';
    setAgent(convAgent);
    setActiveId(convAgent, conv.id);
  };

  const handleNewConversation = () => {
    setActiveConvId(null);
    setActiveId(agent, null);
  };

  function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins  = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days  = Math.floor(diff / 86400000);
    if (mins < 2)   return 'acum';
    if (hours < 1)  return `${mins} min`;
    if (hours < 24) return `${hours}h`;
    return `${days}z`;
  }

  return (
    <View style={[s.root, { backgroundColor: t.bg }]}>
      {/* Left: conversation list */}
      <View style={[s.convPanel, { borderRightColor: t.lineSoft }]}>
        <Text style={[s.convTitle, { fontFamily: SERIF, color: t.ink }]}>Conversations</Text>

        {/* Search */}
        <View style={[s.searchBox, { backgroundColor: t.surface, borderColor: t.line }]}>
          <FpIcon name="search" size={14} color={t.muted}/>
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search…"
            placeholderTextColor={t.muted2}
            style={[s.searchInput, { color: t.ink }]}
          />
        </View>

        {/* Filter */}
        <View style={[s.seg, { backgroundColor: t.surface2, borderColor: t.line }]}>
          {(['all', 'diet', 'workout'] as const).map((f) => (
            <TouchableOpacity key={f} onPress={() => setFilter(f)} activeOpacity={0.7}
              style={[s.segBtn, filter === f && { backgroundColor: t.ink }]}>
              <Text style={[s.segText, { color: filter === f ? t.bg : t.muted }]}>
                {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* List */}
        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
          {loadingConvs ? (
            <View style={{ alignItems: 'center', paddingTop: 24 }}>
              <ActivityIndicator size="small" color={t.primary}/>
            </View>
          ) : filtered.length === 0 ? (
            <View style={{ paddingTop: 24, alignItems: 'center', gap: 8 }}>
              <Text style={[{ fontSize: 13, color: t.muted, textAlign: 'center' }]}>
                {conversations.length === 0 ? 'Nicio conversație încă.\nÎncepe un chat nou!' : 'Niciun rezultat.'}
              </Text>
            </View>
          ) : (
            <View style={{ gap: 4 }}>
              {filtered.map((conv) => {
                const isActive = activeConvId === conv.id;
                return (
                  <TouchableOpacity key={conv.id} onPress={() => handleSelectConv(conv)} activeOpacity={0.7}
                    style={[s.convRow, {
                      backgroundColor: isActive ? t.surface2 : 'transparent',
                      borderLeftColor: isActive ? t.primary : 'transparent',
                    }]}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                      <Text style={[s.convRowTitle, { color: t.ink }]} numberOfLines={1}>{conv.title}</Text>
                      <Text style={[s.eyebrow, { color: t.muted, fontFamily: MONO, fontSize: 9 }]}>{timeAgo(conv.created_at)}</Text>
                    </View>
                    <View style={[s.tagChip, { backgroundColor: tagColor(conv.agent_type) + '22', alignSelf: 'flex-start' }]}>
                      <Text style={[s.eyebrow, { color: tagColor(conv.agent_type), fontSize: 9, fontFamily: MONO }]}>
                        {tagLabel(conv.agent_type).toUpperCase()}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </ScrollView>

        <TouchableOpacity
          onPress={handleNewConversation}
          activeOpacity={0.85}
          style={[s.newConvBtn, { backgroundColor: t.primary }]}
        >
          <FpIcon name="plus" size={14} color={t.primaryInk}/>
          <Text style={[{ fontSize: 13, fontWeight: '600', color: t.primaryInk }]}>Conversație nouă</Text>
        </TouchableOpacity>
      </View>

      {/* Right: chat thread */}
      <View style={{ flex: 1, display: 'flex' as any, flexDirection: 'column' }}>
        {/* Thread header */}
        <View style={[s.threadHeader, { borderBottomColor: t.lineSoft }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={[s.agentIcon, { backgroundColor: t.primarySoft }]}>
              <FpIcon name={agent === 'diet' ? 'leaf' : 'dumbbell'} size={18} color={t.primary}/>
            </View>
            <View style={{ gap: 2 }}>
              <Text style={[s.threadTitle, { fontFamily: SERIF, color: t.ink }]}>
                {agent === 'diet' ? 'Diet Coach' : 'Workout Coach'}
              </Text>
              <Text style={[s.eyebrow, { color: t.muted, fontFamily: MONO }]}>
                {agent === 'diet' ? 'cină ușoară cu somon' : 'plan push de azi'}
              </Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={[s.onlineBadge, { backgroundColor: t.good }]}>
              <Text style={[s.eyebrow, { color: '#fff', fontFamily: MONO, fontSize: 9 }]}>● ONLINE</Text>
            </View>
            {/* Agent toggle */}
            <View style={[s.seg, { backgroundColor: t.surface2, borderColor: t.line }]}>
              {(['diet', 'workout'] as const).map((a) => (
                <TouchableOpacity key={a} onPress={() => setAgent(a)} activeOpacity={0.7}
                  style={[s.segBtn, agent === a && { backgroundColor: t.ink }]}>
                  <Text style={[s.segText, { color: agent === a ? t.bg : t.muted }]}>
                    {a.charAt(0).toUpperCase() + a.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity
              onPress={() => navigation.navigate('ConversationHistory', { agentType: agent })}
              activeOpacity={0.7}
              style={[s.exportBtn, { borderColor: t.line }]}
            >
              <Text style={[{ fontSize: 12, fontWeight: '500', color: t.ink }]}>History</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Embed the actual chat screen */}
        <View style={{ flex: 1 }}>
          {agent === 'diet'
            ? <DietChatScreen key={`diet-chat-${activeConvId ?? 'new'}`}
                route={{ key: 'Diet', name: 'Diet', params: activeConvId ? { conversationId: activeConvId } : undefined } as any}
                navigation={null as any}/>
            : <WorkoutChatScreen key={`workout-chat-${activeConvId ?? 'new'}`}
                route={{ key: 'Workout', name: 'Workout', params: activeConvId ? { conversationId: activeConvId } : undefined } as any}
                navigation={null as any}/>
          }
        </View>
      </View>
    </View>
  );
};

const s = StyleSheet.create({
  root: { flex: 1, flexDirection: 'row' },
  convPanel: {
    width: 270, borderRightWidth: 1,
    paddingTop: 24, paddingHorizontal: 18, paddingBottom: 20,
    flexDirection: 'column', gap: 16,
  },
  convTitle: { fontSize: 22, letterSpacing: -0.4 },
  searchBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, borderWidth: 1,
  },
  searchInput: { flex: 1, fontSize: 12, outlineWidth: 0 } as any,
  seg: { flexDirection: 'row', borderRadius: 999, padding: 3, gap: 2, borderWidth: 1, alignSelf: 'flex-start' },
  segBtn: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 999 },
  segText: { fontSize: 11, fontWeight: '500' },
  convRow: {
    padding: 10, borderRadius: 12, borderLeftWidth: 2, paddingLeft: 12,
  },
  convRowTitle: { fontSize: 13, fontWeight: '600', flex: 1 },
  tagChip: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 999 },
  newConvBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 11, borderRadius: 14,
  },
  threadHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 32, paddingVertical: 20, borderBottomWidth: 1,
  },
  agentIcon: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  threadTitle: { fontSize: 18, letterSpacing: -0.3 },
  onlineBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 },
  exportBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, borderWidth: 1 },
  eyebrow: { fontSize: 10, letterSpacing: 1.8, textTransform: 'uppercase', fontWeight: '500' },
});
