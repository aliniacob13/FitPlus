import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';

import { useTheme } from '@/context/ThemeContext';
import { FpIcon, type FpIconName } from '@/components/ui/FpIcon';
import { useUserStore } from '@/store/userStore';

const SERIF = 'Georgia';
const MONO = 'monospace';

const NAV_ITEMS: { route: string; label: string; icon: FpIconName }[] = [
  { route: 'Home',    label: 'Dashboard',  icon: 'home'  },
  { route: 'Diary',   label: 'Food Diary', icon: 'bowl'  },
  { route: 'Chat',    label: 'AI Coach',   icon: 'spark' },
  { route: 'Map',     label: 'Gyms',       icon: 'pin'   },
  { route: 'Profile', label: 'Profile',    icon: 'user'  },
];

export const CustomTabBar = ({ state, navigation }: BottomTabBarProps) => {
  const { t } = useTheme();
  const profile = useUserStore((s) => s.profile);

  const activeRoute = state.routes[state.index]?.name;
  const displayName = profile?.name || profile?.email?.split('@')[0] || 'User';
  const email = profile?.email || '';
  const initials = displayName.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase() || '?';

  return (
    <View style={[s.sidebar, {
      backgroundColor: t.surface,
      borderRightColor: t.lineSoft,
      // @ts-ignore – web-only
      position: 'fixed',
      top: 0, left: 0, bottom: 0,
      zIndex: 100,
    }]}>
      {/* Brand */}
      <View style={s.brand}>
        <View style={[s.brandIcon, { backgroundColor: t.primary }]}>
          <FpIcon name="leaf" size={18} color={t.primaryInk}/>
        </View>
        <View style={{ gap: 2 }}>
          <Text style={[s.brandName, { fontFamily: SERIF, color: t.ink }]}>FitPlus</Text>
          <Text style={[s.brandSub, { color: t.muted, fontFamily: MONO }]}>wellness · daily</Text>
        </View>
      </View>

      {/* Nav items */}
      <View style={s.nav}>
        {NAV_ITEMS.map((item) => {
          const active = activeRoute === item.route;
          return (
            <TouchableOpacity
              key={item.route}
              onPress={() => navigation.navigate(item.route)}
              activeOpacity={0.7}
              style={[s.navItem, active && { backgroundColor: t.surface2 }]}
            >
              <FpIcon name={item.icon} size={16} color={active ? t.ink : t.muted}/>
              <Text style={[s.navLabel, { color: active ? t.ink : t.muted, fontWeight: active ? '600' : '500' }]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Bottom section */}
      <View style={[s.bottom, { marginTop: 'auto' as any }]}>
        {/* Pro card */}
        <View style={[s.proCard, { backgroundColor: t.surface2, borderColor: t.line }]}>
          <FpIcon name="spark" size={14} color={t.accent}/>
          <Text style={[s.proTitle, { fontFamily: SERIF, color: t.ink }]}>Try Pro</Text>
          <Text style={[s.proBody, { color: t.muted }]}>
            Plan-uri AI personalizate, plate scan nelimitat & analize săptămânale.
          </Text>
          <TouchableOpacity activeOpacity={0.8} style={[s.proBtn, { backgroundColor: t.primary }]}>
            <Text style={[{ fontSize: 12, fontWeight: '600', color: t.primaryInk }]}>Upgrade</Text>
          </TouchableOpacity>
        </View>

        {/* User row */}
        <View style={s.userRow}>
          <View style={[s.avatar, { backgroundColor: t.primarySoft }]}>
            <Text style={[s.avatarText, { color: t.primary, fontFamily: SERIF }]}>{initials}</Text>
          </View>
          <View style={{ flex: 1, gap: 1 }}>
            <Text style={[s.userName, { color: t.ink }]} numberOfLines={1}>{displayName}</Text>
            <Text style={[s.userEmail, { color: t.muted }]} numberOfLines={1}>{email}</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const s = StyleSheet.create({
  sidebar: {
    width: 230,
    paddingTop: 24,
    paddingHorizontal: 18,
    paddingBottom: 20,
    borderRightWidth: 1,
    flexShrink: 0,
  },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 24 },
  brandIcon: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  brandName: { fontSize: 20, letterSpacing: -0.4, lineHeight: 20 },
  brandSub: { fontSize: 9, letterSpacing: 1.6, textTransform: 'uppercase' },
  nav: { gap: 2 },
  navItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 10, paddingHorizontal: 12, borderRadius: 12,
  },
  navLabel: { fontSize: 13 },
  bottom: { gap: 0 },
  proCard: { borderRadius: 16, borderWidth: 1, padding: 14, gap: 4, marginBottom: 14 },
  proTitle: { fontSize: 17, letterSpacing: -0.3 },
  proBody: { fontSize: 11, lineHeight: 16 },
  proBtn: { marginTop: 6, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 999, alignSelf: 'flex-start' },
  userRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 4 },
  avatar: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 12, fontWeight: '700' },
  userName: { fontSize: 12, fontWeight: '600' },
  userEmail: { fontSize: 10 },
});
