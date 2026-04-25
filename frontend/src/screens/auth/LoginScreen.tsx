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
import * as SecureStore from 'expo-secure-store';
import { useNavigation } from '@react-navigation/native';
import { useUserStore } from '../../lib/userStore';
import { api } from '../../lib/api';
import { Button, Input } from '../../components/ui';
import { colors, typography, spacing } from '../../theme';

export default function LoginScreen() {
  const navigation = useNavigation();
  const login      = useUserStore((state) => state.login);

  const [email,     setEmail]     = useState('');
  const [password,  setPassword]  = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Field-level validation errors
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const validate = () => {
    const next: typeof errors = {};
    if (!email)    next.email    = 'Email is required';
    if (!password) next.password = 'Password is required';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;

    setIsLoading(true);
    try {
      const response = await api.post('/auth/login', { email, password });
      const token = response.data.access_token;

      await SecureStore.setItemAsync('jwt_token', token);

      const userResponse = await api.get('/users/me', {
        headers: { Authorization: `Bearer ${token}` },
      });

      await login(userResponse.data, token);
      // RootNavigator will automatically redirect to Home
    } catch (error: any) {
      const msg = error.response?.data?.detail || error.message;
      Alert.alert('Login Failed', msg);
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
          <Text style={styles.logo}>FitPlus</Text>
          <Text style={styles.tagline}>Welcome back. Ready to sweat?</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
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
            placeholder="••••••••"
            isPassword
            autoComplete="password"
            value={password}
            onChangeText={(v) => { setPassword(v); setErrors((e) => ({ ...e, password: undefined })); }}
            error={errors.password}
          />

          <Button
            label="Sign In"
            onPress={handleLogin}
            loading={isLoading}
            fullWidth
            size="lg"
            style={styles.submitBtn}
          />
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Register' as never)}>
            <Text style={styles.footerLink}>Sign up</Text>
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
    fontSize: typography.size['4xl'],
    fontWeight: '800',
    color: colors.accent.base,
    letterSpacing: -1,
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