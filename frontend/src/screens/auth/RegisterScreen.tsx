import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { api } from '../../lib/api';
import { Button, Input } from '../../components/ui';
import { colors, typography, spacing } from '../../theme';

export default function RegisterScreen() {
  const navigation = useNavigation();

  const [fullName,  setFullName]  = useState('');
  const [email,     setEmail]     = useState('');
  const [password,  setPassword]  = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors]       = useState<{
    fullName?: string;
    email?: string;
    password?: string;
  }>({});

  const validate = () => {
    const next: typeof errors = {};
    if (!fullName) next.fullName = 'Full name is required';
    if (!email)    next.email    = 'Email is required';
    if (!password) next.password = 'Password is required';
    else if (password.length < 8) next.password = 'Password must be at least 8 characters';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;

    setIsLoading(true);
    try {
      await api.post('/auth/register', {
        email,
        password,
        full_name: fullName,
      });

      Alert.alert(
        'Account created!',
        'You can now sign in.',
        [{ text: 'Sign In', onPress: () => navigation.navigate('Login' as never) }]
      );
    } catch (error: any) {
      const msg = error.response?.data?.detail || error.message;
      Alert.alert('Registration Failed', msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Branding */}
        <View style={styles.brandRow}>
          <Text style={styles.logo}>Join FitPlus</Text>
          <Text style={styles.tagline}>Start your journey today.</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <Input
            label="Full name"
            placeholder="Jane Doe"
            autoComplete="name"
            value={fullName}
            onChangeText={(v) => { setFullName(v); setErrors((e) => ({ ...e, fullName: undefined })); }}
            error={errors.fullName}
          />

          <Input
            label="Email address"
            placeholder="you@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            value={email}
            onChangeText={(v) => { setEmail(v); setErrors((e) => ({ ...e, email: undefined })); }}
            error={errors.email}
          />

          <Input
            label="Password"
            placeholder="Min. 8 characters"
            isPassword
            hint="At least 8 characters"
            value={password}
            onChangeText={(v) => { setPassword(v); setErrors((e) => ({ ...e, password: undefined })); }}
            error={errors.password}
          />

          <Button
            label="Create Account"
            onPress={handleRegister}
            loading={isLoading}
            fullWidth
            size="lg"
            style={styles.submitBtn}
          />
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login' as never)}>
            <Text style={styles.footerLink}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg.base,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.screen,
    paddingVertical: spacing['3xl'],
  },
  brandRow: {
    alignItems: 'center',
    marginBottom: spacing['2xl'],
  },
  logo: {
    fontSize: typography.size['3xl'],
    fontWeight: '800',
    color: colors.accent.base,
    letterSpacing: -0.8,
    marginBottom: spacing[2],
  },
  tagline: {
    ...typography.styles.bodySmall,
    color: colors.text.secondary,
  },
  form: {
    marginBottom: spacing.xl,
  },
  submitBtn: {
    marginTop: spacing[2],
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    ...typography.styles.bodySmall,
    color: colors.text.secondary,
  },
  footerLink: {
    ...typography.styles.bodySmall,
    color: colors.accent.text,
    fontWeight: '700',
  },
});