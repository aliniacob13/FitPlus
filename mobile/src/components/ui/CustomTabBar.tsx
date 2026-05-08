import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/context/ThemeContext';
import { FpIcon, type FpIconName } from '@/components/ui/FpIcon';

const TAB_ICONS: Record<string, FpIconName> = {
  Home: 'home',
  Diary: 'bowl',
  Chat: 'spark',
  Map: 'pin',
  Profile: 'user',
};

const MONO = Platform.OS === 'ios' ? 'Courier New' : 'monospace';

export const CustomTabBar = ({ state, descriptors, navigation }: BottomTabBarProps) => {
  const { t } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.wrapper, { paddingBottom: insets.bottom + 8, backgroundColor: 'transparent' }]}>
      <View style={[styles.pill, {
        backgroundColor: t.surface,
        borderColor: t.line,
      }]}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;
          const isChat = route.name === 'Chat';
          const iconName = TAB_ICONS[route.name] || 'home';

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          if (isChat) {
            return (
              <TouchableOpacity
                key={route.key}
                onPress={onPress}
                activeOpacity={0.85}
                style={styles.chatBtn}
              >
                <View style={[styles.chatBtnInner, { backgroundColor: t.primary }]}>
                  <FpIcon name="spark" size={22} color={t.primaryInk} stroke={1.8}/>
                </View>
              </TouchableOpacity>
            );
          }

          return (
            <TouchableOpacity
              key={route.key}
              onPress={onPress}
              activeOpacity={0.7}
              style={styles.tabItem}
            >
              <FpIcon
                name={iconName}
                size={20}
                color={isFocused ? t.ink : t.muted}
                stroke={isFocused ? 2 : 1.5}
              />
              <Text style={[styles.tabLabel, {
                color: isFocused ? t.ink : t.muted,
                fontFamily: MONO,
              }]}>
                {route.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 14,
    paddingTop: 8,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    borderRadius: 26,
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 12,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
    paddingVertical: 4,
  },
  tabLabel: {
    fontSize: 9,
    fontWeight: '500',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  chatBtn: {
    flex: 1,
    alignItems: 'center',
  },
  chatBtnInner: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 10,
  },
});