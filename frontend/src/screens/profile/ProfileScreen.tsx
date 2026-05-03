import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useUserStore } from '../../lib/userStore';
import { Card, Button } from '../../components/ui';
import { colors, typography, spacing, radius } from '../../theme';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statRow}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

function SectionDivider() {
  return <View style={styles.divider} />;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ProfileScreen() {
  const navigation = useNavigation();
  const user       = useUserStore((state) => state.user);
  const logout     = useUserStore((state) => state.logout);

  const displayName = user?.name || user?.email?.split('@')[0] || 'Athlete';
  const initials    = displayName
    .split(' ')
    .map((w: string) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const handleLogout = () => {
    Alert.alert(
      'Log out',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Log out', style: 'destructive', onPress: logout },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Avatar + name ──────────────────────────────────── */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarRing}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
          </View>

          <Text style={styles.displayName}>{displayName}</Text>
          <Text style={styles.email}>{user?.email}</Text>

          {user?.fitness_level && (
            <View style={styles.levelBadge}>
              <Text style={styles.levelBadgeText}>{user.fitness_level}</Text>
            </View>
          )}
        </View>

        {/* ── Body stats ─────────────────────────────────────── */}
        <Card variant="default" title="Body Stats" padding="md">
          <StatRow
            label="Age"
            value={user?.age ? `${user.age} yrs` : '—'}
          />
          <SectionDivider />
          <StatRow
            label="Weight"
            value={user?.weight_kg ? `${user.weight_kg} kg` : '—'}
          />
          <SectionDivider />
          <StatRow
            label="Height"
            value={user?.height_cm ? `${user.height_cm} cm` : '—'}
          />
        </Card>

        {/* ── Goals ──────────────────────────────────────────── */}
        <Card variant="default" title="My Goals" padding="md">
          {user?.goals ? (
            <Text style={styles.goalsText}>{user.goals}</Text>
          ) : (
            <Text style={styles.emptyText}>
              No goals set yet. Tap Edit Profile to add them.
            </Text>
          )}
        </Card>

        {/* ── Actions ────────────────────────────────────────── */}
        <Button
          label="Edit Profile"
          onPress={() => navigation.navigate('UpdateProfile' as never)}
          variant="primary"
          size="lg"
          fullWidth
          style={styles.editBtn}
        />

        <Button
          label="Log Out"
          onPress={handleLogout}
          variant="danger"
          size="md"
          fullWidth
        />

        {/* Account info footer */}
        <Text style={styles.accountId}>Account #{user?.id}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg.base,
  },
  scroll: {
    padding: spacing.screen,
    paddingBottom: spacing['2xl'],
  },

  // Avatar section
  avatarSection: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    marginBottom: spacing[4],
  },
  avatarRing: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 2,
    borderColor: colors.accent.base,
    padding: 3,
    marginBottom: spacing[4],
    // lime glow
    shadowColor: colors.accent.base,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  avatar: {
    flex: 1,
    borderRadius: 48,
    backgroundColor: colors.accent.muted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: typography.size['2xl'],
    fontWeight: '800',
    color: colors.accent.base,
    letterSpacing: 1,
  },
  displayName: {
    ...typography.styles.h2,
    marginBottom: spacing[1],
  },
  email: {
    ...typography.styles.bodySmall,
    color: colors.text.secondary,
    marginBottom: spacing[3],
  },
  levelBadge: {
    paddingVertical: spacing[1],
    paddingHorizontal: spacing[4],
    borderRadius: radius.chip,
    backgroundColor: colors.accent.muted,
    borderWidth: 1,
    borderColor: `${colors.accent.base}40`,
  },
  levelBadgeText: {
    color: colors.accent.text,
    fontSize: typography.size.xs,
    fontWeight: '700',
    letterSpacing: typography.tracking.widest,
    textTransform: 'uppercase',
  },

  // Stat rows inside card
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing[3],
  },
  statLabel: {
    ...typography.styles.bodySmall,
    color: colors.text.secondary,
  },
  statValue: {
    fontSize: typography.size.base,
    fontWeight: '700',
    color: colors.text.primary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border.muted,
  },

  // Goals text
  goalsText: {
    ...typography.styles.body,
    color: colors.text.primary,
    lineHeight: 22,
  },
  emptyText: {
    ...typography.styles.bodySmall,
    color: colors.text.muted,
    fontStyle: 'italic',
  },

  // Buttons
  editBtn: {
    marginBottom: spacing[3],
  },

  // Footer
  accountId: {
    ...typography.styles.caption,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
});
