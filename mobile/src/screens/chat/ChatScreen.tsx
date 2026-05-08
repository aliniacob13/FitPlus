import React, { useState } from 'react';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { MainTabParamList } from '@/types/navigation';
import { WorkoutChatScreen } from '@/screens/chat/WorkoutChatScreen';
import { DietChatScreen } from '@/screens/chat/DietChatScreen';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/context/ThemeContext';
import { FpIcon } from '@/components/ui/FpIcon';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppStackParamList } from '@/types/navigation';

type Props = BottomTabScreenProps<MainTabParamList, 'Chat'>;

const SERIF = Platform.OS === 'ios' ? 'Georgia' : 'serif';
const MONO = Platform.OS === 'ios' ? 'Courier New' : 'monospace';

export const ChatScreen = ({ route }: Props) => {
  const { t } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const initialAgent = route.params?.agentType ?? 'diet';
  const [agent, setAgent] = useState<'diet' | 'workout'>(initialAgent);

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      {/* Header with switcher */}
      <SafeAreaView style={[s.headerWrap, { backgroundColor: t.bg, borderBottomColor: t.lineSoft }]} edges={['top']}>
        <View style={s.header}>
          <View style={{ gap: 2, alignItems: 'center' }}>
            <Text style={[s.eyebrow, { color: t.muted, fontFamily: MONO }]}>AI COACH</Text>
            <Text style={[s.headerTitle, { fontFamily: SERIF, color: t.ink }]}>
              {agent === 'diet' ? 'Nutrition' : 'Workout'}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => navigation.navigate('ConversationHistory', { agentType: agent })}
            activeOpacity={0.7}
            style={s.menuBtn}
          >
            <FpIcon name="menu" size={20} color={t.ink}/>
          </TouchableOpacity>
        </View>

        {/* Segment selector */}
        <View style={[s.segWrap, { backgroundColor: t.surface2, borderColor: t.line }]}>
          <TouchableOpacity
            onPress={() => setAgent('diet')}
            activeOpacity={0.7}
            style={[s.segBtn, agent === 'diet' && { backgroundColor: t.ink }]}
          >
            <Text style={[s.segBtnText, { color: agent === 'diet' ? t.bg : t.muted }]}>Diet</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setAgent('workout')}
            activeOpacity={0.7}
            style={[s.segBtn, agent === 'workout' && { backgroundColor: t.ink }]}
          >
            <Text style={[s.segBtnText, { color: agent === 'workout' ? t.bg : t.muted }]}>Workout</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* Chat content */}
      <View style={{ flex: 1 }}>
        {agent === 'diet'
          ? <DietChatScreen key="diet-chat" route={{ key: 'Diet', name: 'Diet', params: undefined } as any} navigation={null as any}/>
          : <WorkoutChatScreen key="workout-chat" route={{ key: 'Workout', name: 'Workout', params: undefined } as any} navigation={null as any}/>
        }
      </View>
    </View>
  );
};

const s = StyleSheet.create({
  headerWrap: { borderBottomWidth: 1, paddingBottom: 12 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 22, paddingTop: 8, position: 'relative',
  },
  menuBtn: { position: 'absolute', right: 22 },
  eyebrow: { fontSize: 10, letterSpacing: 1.8, textTransform: 'uppercase', fontWeight: '500' },
  headerTitle: { fontSize: 18, letterSpacing: -0.3 },
  segWrap: {
    flexDirection: 'row', borderRadius: 999, padding: 3, gap: 2, borderWidth: 1,
    alignSelf: 'center', marginTop: 12,
  },
  segBtn: { paddingHorizontal: 20, paddingVertical: 7, borderRadius: 999 },
  segBtnText: { fontSize: 12, fontWeight: '600', letterSpacing: 0.1 },
});
