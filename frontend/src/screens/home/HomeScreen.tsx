import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useUserStore } from '../../lib/userStore';
import { Card, Button } from '../../components/ui';
import { colors, typography, spacing, radius } from '../../theme';

export default function HomeScreen() {
  const navigation = useNavigation();
  const user       = useUserStore((state) => state.user);
  const logout     = useUserStore((state) => state.logout);

  const displayName = user?.name || user?.email?.split('@')[0] || 'Athlete';

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ─────────────────────────────────────────── */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Good morning,</Text>
            <Text style={styles.name}>{displayName} 👋</Text>
          </View>

          <TouchableOpacity style={styles.avatarBtn} onPress={logout}>
            <Text style={styles.avatarText}>
              {displayName[0].toUpperCase()}
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── Today's Progress ────────────────────────────────── */}
        <Card variant="accent" title="Today's Progress" padding="md">
          <View style={styles.statsRow}>
            <StatItem value="0" label="Workouts" />
            <View style={styles.statDivider} />
            <StatItem value="0" label="Minutes" />
            <View style={styles.statDivider} />
            <StatItem value="0" label="Kcal" />
          </View>
        </Card>

        {/* ── Quick Actions ───────────────────────────────────── */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>

        <Button
          label="Start New Workout"
          onPress={() => {/* navigate to Workout AI tab */}}
          variant="primary"
          size="lg"
          fullWidth
          style={styles.actionBtn}
        />

        <Button
          label="Plan My Meals"
          onPress={() => {/* navigate to Diet AI tab */}}
          variant="outline"
          size="lg"
          fullWidth
          style={styles.actionBtn}
        />

        <Button
          label="Update Fitness Profile"
          onPress={() => navigation.navigate('UpdateProfile' as never)}
          variant="secondary"
          size="md"
          fullWidth
          style={styles.actionBtn}
        />

        {/* ── Info cards row ──────────────────────────────────── */}
        <Text style={styles.sectionTitle}>Your Stats</Text>

        <View style={styles.infoRow}>
          <Card variant="elevated" style={styles.infoCard} padding="md">
            <Text style={styles.infoEmoji}>⚖️</Text>
            <Text style={styles.infoValue}>{user?.weight_kg ?? '—'}</Text>
            <Text style={styles.infoLabel}>kg</Text>
          </Card>

          <Card variant="elevated" style={styles.infoCard} padding="md">
            <Text style={styles.infoEmoji}>📏</Text>
            <Text style={styles.infoValue}>{user?.height_cm ?? '—'}</Text>
            <Text style={styles.infoLabel}>cm</Text>
          </Card>

          <Card variant="elevated" style={styles.infoCard} padding="md">
            <Text style={styles.infoEmoji}>🎯</Text>
            <Text style={styles.infoValue} numberOfLines={1}>
              {user?.fitness_level ?? '—'}
            </Text>
            <Text style={styles.infoLabel}>level</Text>
          </Card>
        </View>

        <Text style={styles.footerNote}>
          Data synced securely with your account.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Sub-component ────────────────────────────────────────────────────────────

function StatItem({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.statItem}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
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

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xl,
    marginTop: spacing[3],
  },
  greeting: {
    ...typography.styles.bodySmall,
    color: colors.text.secondary,
    marginBottom: 2,
  },
  name: {
    ...typography.styles.h2,
  },
  avatarBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.accent.muted,
    borderWidth: 1.5,
    borderColor: colors.accent.base,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: colors.accent.base,
    fontSize: typography.size.md,
    fontWeight: '700',
  },

  // Stats inside the card
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: spacing[2],
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: typography.size['3xl'],
    fontWeight: '800',
    color: colors.accent.base,
    letterSpacing: -1,
  },
  statLabel: {
    ...typography.styles.label,
    marginTop: spacing[1],
  },
  statDivider: {
    width: 1,
    height: 36,
    backgroundColor: colors.border.default,
  },

  // Section title
  sectionTitle: {
    ...typography.styles.h3,
    marginTop: spacing[2],
    marginBottom: spacing[4],
  },

  actionBtn: {
    marginBottom: spacing[3],
  },

  // Info row cards
  infoRow: {
    flexDirection: 'row',
    gap: spacing[3],
    marginBottom: spacing[2],
  },
  infoCard: {
    flex: 1,
    marginBottom: 0,
    alignItems: 'center',
  },
  infoEmoji: {
    fontSize: 22,
    marginBottom: spacing[1],
  },
  infoValue: {
    fontSize: typography.size.lg,
    fontWeight: '700',
    color: colors.text.primary,
  },
  infoLabel: {
    ...typography.styles.caption,
    marginTop: 2,
  },

  footerNote: {
    ...typography.styles.caption,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
});