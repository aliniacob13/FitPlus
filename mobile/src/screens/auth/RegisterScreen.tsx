import React, { useMemo, useState } from 'react';
import {
  View, Text, TouchableOpacity, TextInput, StyleSheet,
  Platform, KeyboardAvoidingView, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { useTheme } from '@/context/ThemeContext';
import { FpIcon } from '@/components/ui/FpIcon';
import { useAuthStore } from '@/store/authStore';
import { AuthStackParamList } from '@/types/navigation';

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

const SERIF = Platform.OS === 'ios' ? 'Georgia' : 'serif';
const MONO = Platform.OS === 'ios' ? 'Courier New' : 'monospace';

function passwordStrength(pw: string): number {
  if (!pw) return 0;
  if (pw.length < 8) return 1;
  const hasNum = /\d/.test(pw);
  const hasSym = /[^a-zA-Z0-9]/.test(pw);
  if (pw.length >= 12 && hasNum && hasSym) return 4;
  if (pw.length >= 8 && hasNum) return 3;
  return 2;
}

export const RegisterScreen = ({ navigation }: Props) => {
  const { t } = useTheme();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);

  const register = useAuthStore((s) => s.register);
  const isSubmitting = useAuthStore((s) => s.isSubmitting);
  const error = useAuthStore((s) => s.error);

  const pwLevel = passwordStrength(password);
  const isValid = useMemo(() => email.includes('@') && password.length >= 8, [email, password]);

  const handleRegister = async () => {
    const success = await register(email.trim(), password);
    if (success !== false) {
      navigation.navigate('Onboarding');
    }
  };

  const StrengthMeter = () => (
    <View style={{ flexDirection: 'row', gap: 3 }}>
      {[0, 1, 2, 3].map(i => (
        <View key={i} style={{
          width: 14, height: 4, borderRadius: 2,
          backgroundColor: i < pwLevel
            ? (pwLevel >= 3 ? t.good : t.warn)
            : t.line,
        }}/>
      ))}
    </View>
  );

  return (
    <SafeAreaView style={[s.root, { backgroundColor: t.bg }]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 24, paddingBottom: 30 }} keyboardShouldPersistTaps="handled">
          {/* Top nav */}
          <View style={s.topRow}>
            <TouchableOpacity onPress={() => navigation.navigate('Welcome')} activeOpacity={0.7}>
              <FpIcon name="left" size={22} color={t.ink}/>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('Login')} activeOpacity={0.7}>
              <Text style={[s.topLink, { color: t.muted }]}>Sign in</Text>
            </TouchableOpacity>
          </View>

          {/* Title */}
          <View style={{ gap: 6, marginTop: 28 }}>
            <Text style={[s.eyebrow, { color: t.muted, fontFamily: MONO }]}>CREATE ACCOUNT · 1 / 4</Text>
            <Text style={[s.title, { fontFamily: SERIF, color: t.ink }]}>
              {'Hai să-ți facem un '}
              <Text style={{ fontStyle: 'italic', color: t.primary }}>cont.</Text>
            </Text>
            <Text style={[s.subtitle, { color: t.muted }]}>
              Vom folosi datele ca să-ți personalizăm planul.
            </Text>
          </View>

          {/* Progress dots */}
          <View style={[s.dots, { marginTop: 22 }]}>
            {[0, 1, 2, 3].map(i => (
              <View key={i} style={[s.dot, { backgroundColor: i === 0 ? t.primary : t.line }]}/>
            ))}
          </View>

          {/* Fields */}
          <View style={{ gap: 14, marginTop: 22 }}>
            {/* Name */}
            <View style={{ gap: 6 }}>
              <Text style={[s.label, { color: t.muted, fontFamily: MONO }]}>NUME COMPLET</Text>
              <View style={[s.fieldRow, { backgroundColor: t.surface, borderColor: t.line }]}>
                <FpIcon name="user" size={16} color={t.muted}/>
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder="ex. Andrei Mocanu"
                  placeholderTextColor={t.muted2}
                  autoCapitalize="words"
                  style={[s.fieldInput, { color: t.ink }]}
                />
              </View>
            </View>

            {/* Email */}
            <View style={{ gap: 6 }}>
              <Text style={[s.label, { color: t.muted, fontFamily: MONO }]}>EMAIL</Text>
              <View style={[s.fieldRow, { backgroundColor: t.surface, borderColor: t.line }]}>
                <FpIcon name="bell" size={16} color={t.muted}/>
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="email@exemplu.ro"
                  placeholderTextColor={t.muted2}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  style={[s.fieldInput, { color: t.ink }]}
                />
              </View>
            </View>

            {/* Password */}
            <View style={{ gap: 6 }}>
              <Text style={[s.label, { color: t.muted, fontFamily: MONO }]}>PAROLĂ</Text>
              <View style={[s.fieldRow, { backgroundColor: t.surface, borderColor: t.line }]}>
                <FpIcon name="key" size={16} color={t.muted}/>
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="min. 8 caractere"
                  placeholderTextColor={t.muted2}
                  secureTextEntry={!showPw}
                  autoCapitalize="none"
                  style={[s.fieldInput, { color: t.ink }]}
                />
                <StrengthMeter/>
              </View>
            </View>
          </View>

          {error ? (
            <View style={[s.errorBox, { backgroundColor: t.bad + '18', borderColor: t.bad + '40', marginTop: 12 }]}>
              <Text style={[s.errorText, { color: t.bad }]}>{error}</Text>
            </View>
          ) : null}

          <TouchableOpacity
            onPress={handleRegister}
            disabled={!isValid || isSubmitting}
            activeOpacity={0.85}
            style={[s.btnPrimary, {
              backgroundColor: t.primary,
              opacity: (!isValid || isSubmitting) ? 0.55 : 1,
              marginTop: 24,
            }]}
          >
            <Text style={[s.btnPrimaryText, { color: t.primaryInk }]}>
              {isSubmitting ? 'Se creează contul…' : 'Continuă'}
            </Text>
            {!isSubmitting && <FpIcon name="arrow" size={14} color={t.primaryInk}/>}
          </TouchableOpacity>

          {/* Divider */}
          <View style={[s.divider, { marginVertical: 20 }]}>
            <View style={[s.divLine, { backgroundColor: t.lineSoft }]}/>
            <Text style={[s.divLabel, { color: t.muted, fontFamily: MONO }]}>sau</Text>
            <View style={[s.divLine, { backgroundColor: t.lineSoft }]}/>
          </View>

          {/* Social */}
          <View style={s.socialRow}>
            {[['', 'Apple'], ['G', 'Google'], ['f', 'Facebook']].map(([glyph, name]) => (
              <TouchableOpacity key={name} activeOpacity={0.7}
                style={[s.socialBtn, { backgroundColor: t.surface, borderColor: t.line }]}>
                <Text style={[s.socialGlyph, { color: t.ink }]}>{glyph}</Text>
                <Text style={[s.socialLabel, { color: t.ink2 }]}>{name}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[s.terms, { color: t.muted, marginTop: 18 }]}>
            Continuând accepți{' '}
            <Text style={{ textDecorationLine: 'underline' }}>Termenii</Text>
            {' '}și{' '}
            <Text style={{ textDecorationLine: 'underline' }}>Politica de confidențialitate</Text>.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  root: { flex: 1 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  topLink: { fontSize: 12, fontWeight: '500' },
  eyebrow: { fontSize: 10, letterSpacing: 1.8, textTransform: 'uppercase', fontWeight: '500' },
  title: { fontSize: 32, lineHeight: 36, letterSpacing: -0.7 },
  subtitle: { fontSize: 13, marginTop: 4 },
  dots: { flexDirection: 'row', gap: 6 },
  dot: { flex: 1, height: 4, borderRadius: 999 },
  label: { fontSize: 9, letterSpacing: 1.8, textTransform: 'uppercase', fontWeight: '500' },
  fieldRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderRadius: 14, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12,
  },
  fieldInput: { flex: 1, fontSize: 14 },
  errorBox: { padding: 12, borderRadius: 12, borderWidth: 1 },
  errorText: { fontSize: 13, fontWeight: '500' },
  btnPrimary: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, padding: 16, borderRadius: 999,
  },
  btnPrimaryText: { fontSize: 15, fontWeight: '600' },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  divLine: { flex: 1, height: 1 },
  divLabel: { fontSize: 9, letterSpacing: 1.5, textTransform: 'uppercase' },
  socialRow: { flexDirection: 'row', gap: 8 },
  socialBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, padding: 12, borderRadius: 14, borderWidth: 1,
  },
  socialGlyph: { fontSize: 16, fontWeight: '700', minWidth: 14, textAlign: 'center' },
  socialLabel: { fontSize: 12, fontWeight: '500' },
  terms: { fontSize: 11, textAlign: 'center', lineHeight: 16 },
});