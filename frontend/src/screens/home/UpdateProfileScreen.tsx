import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { api } from '../../lib/api';
import { useUserStore } from '../../lib/userStore';
import { Button, Input, Card } from '../../components/ui';
import { colors, typography, spacing } from '../../theme';

// ─── Fitness level options ────────────────────────────────────────────────────

const FITNESS_LEVELS = ['Beginner', 'Intermediate', 'Advanced', 'Elite'];

export default function UpdateProfileScreen() {
  const navigation = useNavigation();
  const user  = useUserStore((state) => state.user);
  const login = useUserStore((state) => state.login);
  const token = useUserStore((state) => state.token);

  const [fullName,      setFullName]      = useState(user?.name || '');
  const [weight,        setWeight]        = useState(user?.weight_kg?.toString() || '');
  const [height,        setHeight]        = useState(user?.height_cm?.toString() || '');
  const [goals,         setGoals]         = useState(user?.goals || '');
  const [fitnessLevel,  setFitnessLevel]  = useState(user?.fitness_level || '');
  const [isLoading,     setIsLoading]     = useState(false);

  const handleUpdate = async () => {
    setIsLoading(true);
    try {
      const payload = {
        name:          fullName     || null,
        weight_kg:     weight       ? parseFloat(weight) : null,
        height_cm:     height       ? parseFloat(height) : null,
        goals:         goals        || null,
        fitness_level: fitnessLevel || null,
      };

      const response = await api.put('/users/me', payload);

      if (token) {
        await login(response.data, token);
      }

      Alert.alert('Saved!', 'Your profile has been updated.');
      navigation.goBack();
    } catch (error: any) {
      const msg = error.response?.data?.detail || 'Could not update profile.';
      Alert.alert('Update Failed', msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ─────────────────────────────────────────── */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backBtnText}>← Back</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.pageTitle}>Fitness Profile</Text>
        <Text style={styles.pageSubtitle}>
          Help us personalize your workout and diet plans.
        </Text>

        {/* ── Basic info ─────────────────────────────────────── */}
        <Card variant="default" title="Basic Info" padding="md">
          <Input
            label="Full name"
            placeholder="Jane Doe"
            value={fullName}
            onChangeText={setFullName}
            autoComplete="name"
          />

          {/* Weight + Height side by side */}
          <View style={styles.row}>
            <View style={styles.halfInput}>
              <Input
                label="Weight (kg)"
                placeholder="70"
                keyboardType="decimal-pad"
                value={weight}
                onChangeText={setWeight}
              />
            </View>
            <View style={[styles.halfInput, styles.halfRight]}>
              <Input
                label="Height (cm)"
                placeholder="175"
                keyboardType="decimal-pad"
                value={height}
                onChangeText={setHeight}
              />
            </View>
          </View>
        </Card>

        {/* ── Fitness level ───────────────────────────────────── */}
        <Card variant="default" title="Fitness Level" padding="md">
          <View style={styles.chipRow}>
            {FITNESS_LEVELS.map((level) => {
              const active = fitnessLevel === level;
              return (
                <TouchableOpacity
                  key={level}
                  style={[styles.chip, active && styles.chipActive]}
                  onPress={() => setFitnessLevel(level)}
                >
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>
                    {level}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Card>

        {/* ── Goals ───────────────────────────────────────────── */}
        <Card variant="default" title="Your Goals" padding="md">
          <Input
            label="Describe your fitness goals"
            placeholder="e.g. Lose weight, build muscle, improve cardio..."
            value={goals}
            onChangeText={setGoals}
            multiline
            numberOfLines={4}
            inputStyle={styles.textArea}
            hint="The more detail you give, the better your AI recommendations."
          />
        </Card>

        {/* ── Actions ─────────────────────────────────────────── */}
        <Button
          label="Save Profile"
          onPress={handleUpdate}
          loading={isLoading}
          fullWidth
          size="lg"
          style={styles.saveBtn}
        />

        <Button
          label="Cancel"
          onPress={() => navigation.goBack()}
          variant="ghost"
          size="md"
          fullWidth
        />
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

  // Header nav
  header: {
    marginBottom: spacing[4],
    marginTop: spacing[2],
  },
  backBtn: {
    alignSelf: 'flex-start',
  },
  backBtnText: {
    color: colors.accent.text,
    fontSize: typography.size.base,
    fontWeight: '600',
  },

  // Page heading
  pageTitle: {
    ...typography.styles.h1,
    marginBottom: spacing[1],
  },
  pageSubtitle: {
    ...typography.styles.bodySmall,
    color: colors.text.secondary,
    marginBottom: spacing.xl,
  },

  // Side-by-side inputs
  row: {
    flexDirection: 'row',
  },
  halfInput: {
    flex: 1,
  },
  halfRight: {
    marginLeft: spacing[3],
  },

  // Multi-line input override
  textArea: {
    height: 100,
    textAlignVertical: 'top',
    paddingTop: spacing[3],
  },

  // Fitness level chips
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
    marginTop: spacing[1],
  },
  chip: {
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[4],
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: colors.border.default,
    backgroundColor: colors.bg.elevated,
  },
  chipActive: {
    backgroundColor: colors.accent.muted,
    borderColor: colors.accent.base,
  },
  chipText: {
    color: colors.text.secondary,
    fontSize: typography.size.sm,
    fontWeight: '600',
  },
  chipTextActive: {
    color: colors.accent.text,
  },

  saveBtn: {
    marginBottom: spacing[3],
  },
});