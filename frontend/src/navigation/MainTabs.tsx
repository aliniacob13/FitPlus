import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet } from 'react-native';

import HomeScreen    from '../screens/home/HomeScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import { colors, typography } from '../theme';

const Tab = createBottomTabNavigator();

// ─── Placeholder (remove as each screen gets built) ──────────────────────────

const PlaceholderScreen = ({ name }: { name: string }) => (
  <View style={placeholder.root}>
    <Text style={placeholder.emoji}>🚧</Text>
    <Text style={placeholder.title}>{name}</Text>
    <Text style={placeholder.subtitle}>Coming soon</Text>
  </View>
);

const placeholder = StyleSheet.create({
  root:     { flex: 1, backgroundColor: colors.bg.base, alignItems: 'center', justifyContent: 'center' },
  emoji:    { fontSize: 40, marginBottom: 12 },
  title:    { fontSize: typography.size.xl, fontWeight: '700', color: colors.text.primary, marginBottom: 4 },
  subtitle: { fontSize: typography.size.sm, color: colors.text.muted },
});

// ─── Tab icon ─────────────────────────────────────────────────────────────────

// Simple emoji-based icons — swap for an icon library (e.g. @expo/vector-icons)
// once the team decides on one. Using emoji keeps zero extra dependencies for now.
const TAB_ICONS: Record<string, { active: string; inactive: string }> = {
  Home:       { active: '⚡', inactive: '○' },
  Map:        { active: '📍', inactive: '◎' },
  'Workout AI': { active: '🏋️', inactive: '◻' },
  'Diet AI':  { active: '🥗', inactive: '◽' },
  Profile:    { active: '👤', inactive: '◷' },
};

function TabIcon({ name, focused }: { name: string; focused: boolean }) {
  const icon = TAB_ICONS[name] ?? { active: '●', inactive: '○' };
  return (
    <Text style={{ fontSize: 18, opacity: focused ? 1 : 0.4 }}>
      {focused ? icon.active : icon.inactive}
    </Text>
  );
}

// ─── Navigator ────────────────────────────────────────────────────────────────

export default function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused }) => (
          <TabIcon name={route.name} focused={focused} />
        ),
        tabBarStyle: {
          backgroundColor: colors.bg.surface,
          borderTopColor:  colors.border.default,
          borderTopWidth:  1,
          height: 60,
          paddingBottom: 8,
          paddingTop: 4,
        },
        tabBarLabelStyle: {
          fontSize: typography.size.xs,
          fontWeight: '600',
        },
        tabBarActiveTintColor:   colors.accent.base,
        tabBarInactiveTintColor: colors.text.muted,
      })}
    >
      <Tab.Screen name="Home"       component={HomeScreen} />
      <Tab.Screen name="Map"        component={() => <PlaceholderScreen name="Map" />} />
      <Tab.Screen name="Workout AI" component={() => <PlaceholderScreen name="Workout AI" />} />
      <Tab.Screen name="Diet AI"    component={() => <PlaceholderScreen name="Diet AI" />} />
      <Tab.Screen name="Profile"    component={ProfileScreen} />
    </Tab.Navigator>
  );
}