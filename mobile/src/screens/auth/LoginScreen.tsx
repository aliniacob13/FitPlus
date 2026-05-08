import type { ReactNode } from 'react';
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

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

const SERIF = Platform.OS === 'ios' ? 'Georgia' : 'serif';
const MONO = Platform.OS === 'ios' ? 'Courier New' : 'monospace';

type LoginFieldProps = {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder: string;
  secure?: boolean;
  showPw: boolean;
  ink: string;
  muted: string;
  muted2: string;
  surface: string;
  line: string;
  trailing?: ReactNode;
};

/** Must stay outside LoginScreen so TextInput identity is stable (avoids keyboard closing each keystroke). */
function LoginField({
  label,
  value,
  onChangeText,
  placeholder,
  secure,
  showPw,
  ink,
  muted,
  muted2,
  surface,
  line,
  trailing,
}: LoginFieldProps) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={[s.fieldLabel, { color: muted, fontFamily: MONO }]}>{label}</Text>
      <View style={[s.fieldRow, { backgroundColor: surface, borderColor: line }]}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={muted2}
          secureTextEntry={Boolean(secure && !showPw)}
          autoCapitalize="none"
          autoCorrect={false}
          style={[s.fieldInput, { color: ink }]}
        />
        {trailing}
      </View>
    </View>
  );
}

export const LoginScreen = ({ navigation }: Props) => {
  const { t } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const login = useAuthStore((s) => s.login);
  const isSubmitting = useAuthStore((s) => s.isSubmitting);
  const error = useAuthStore((s) => s.error);

  const isValid = useMemo(() => email.includes('@') && password.length >= 6, [email, password]);

  return (
    <SafeAreaView style={[s.root, { backgroundColor: t.bg }]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
          <View style={s.inner}>
            {/* Top nav */}
            <View style={s.topRow}>
              <TouchableOpacity onPress={() => navigation.navigate('Welcome')} activeOpacity={0.7}>
                <FpIcon name="left" size={22} color={t.ink}/>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => navigation.navigate('Register')} activeOpacity={0.7}>
                <Text style={[s.topLink, { color: t.muted }]}>Cont nou</Text>
              </TouchableOpacity>
            </View>

            {/* Title */}
            <View style={{ gap: 6, marginTop: 28 }}>
              <Text style={[s.eyebrow, { color: t.muted, fontFamily: MONO }]}>SIGN IN</Text>
              <Text style={[s.title, { fontFamily: SERIF, color: t.ink }]}>
                {'Bine ai '}
                <Text style={{ fontStyle: 'italic', color: t.primary }}>revenit.</Text>
              </Text>
              <Text style={[s.subtitle, { color: t.muted }]}>Continuă streak-ul de azi.</Text>
            </View>

            {/* Form */}
            <View style={{ gap: 14, marginTop: 32 }}>
              <LoginField
                label="EMAIL"
                value={email}
                onChangeText={setEmail}
                placeholder="email@exemplu.ro"
                showPw={showPw}
                ink={t.ink}
                muted={t.muted}
                muted2={t.muted2}
                surface={t.surface}
                line={t.line}
              />
              <LoginField
                label="PAROLĂ"
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                secure
                showPw={showPw}
                ink={t.ink}
                muted={t.muted}
                muted2={t.muted2}
                surface={t.surface}
                line={t.line}
                trailing={
                  <TouchableOpacity onPress={() => setShowPw((v) => !v)} activeOpacity={0.7} style={{ padding: 4 }}>
                    <Text style={[s.showPw, { color: t.muted, fontFamily: MONO }]}>
                      {showPw ? 'HIDE' : 'SHOW'}
                    </Text>
                  </TouchableOpacity>
                }
              />

              <View style={s.rememberRow}>
                <TouchableOpacity onPress={() => setRememberMe(v => !v)} activeOpacity={0.7} style={s.checkRow}>
                  <View style={[s.checkbox, {
                    backgroundColor: rememberMe ? t.primary : 'transparent',
                    borderColor: rememberMe ? t.primary : t.line,
                  }]}>
                    {rememberMe && <FpIcon name="check" size={12} color={t.primaryInk} stroke={2.5}/>}
                  </View>
                  <Text style={[s.checkLabel, { color: t.muted }]}>Ține-mă conectat</Text>
                </TouchableOpacity>
                <TouchableOpacity activeOpacity={0.7}>
                  <Text style={[s.forgotPw, { color: t.primary }]}>Ai uitat parola?</Text>
                </TouchableOpacity>
              </View>
            </View>

            {error ? (
              <View style={[s.errorBox, { backgroundColor: t.bad + '18', borderColor: t.bad + '40' }]}>
                <Text style={[s.errorText, { color: t.bad }]}>{error}</Text>
              </View>
            ) : null}

            {/* Submit */}
            <TouchableOpacity
              onPress={() => void login(email.trim(), password)}
              disabled={!isValid || isSubmitting}
              activeOpacity={0.85}
              style={[s.btnPrimary, {
                backgroundColor: t.primary,
                opacity: (!isValid || isSubmitting) ? 0.55 : 1,
                marginTop: 'auto',
              }]}
            >
              <Text style={[s.btnPrimaryText, { color: t.primaryInk }]}>
                {isSubmitting ? 'Se conectează…' : 'Intră în cont'}
              </Text>
              {!isSubmitting && <FpIcon name="arrow" size={14} color={t.primaryInk}/>}
            </TouchableOpacity>

            {/* Divider */}
            <View style={s.divider}>
              <View style={[s.divLine, { backgroundColor: t.lineSoft }]}/>
              <Text style={[s.divLabel, { color: t.muted, fontFamily: MONO }]}>sau continuă cu</Text>
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
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  root: { flex: 1 },
  inner: { flex: 1, padding: 24, paddingBottom: 30, gap: 0, minHeight: '100%' },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  topLink: { fontSize: 12, fontWeight: '500' },
  eyebrow: { fontSize: 10, letterSpacing: 1.8, textTransform: 'uppercase', fontWeight: '500' },
  title: { fontSize: 34, lineHeight: 38, letterSpacing: -0.8 },
  subtitle: { fontSize: 13, marginTop: 4 },
  fieldLabel: { fontSize: 9, letterSpacing: 1.8, textTransform: 'uppercase', fontWeight: '500' },
  fieldRow: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 14, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12,
  },
  fieldInput: { flex: 1, fontSize: 14 },
  showPw: { fontSize: 9, letterSpacing: 1.2 },
  rememberRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: -2 },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  checkbox: { width: 18, height: 18, borderRadius: 5, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  checkLabel: { fontSize: 12 },
  forgotPw: { fontSize: 12, fontWeight: '600' },
  errorBox: { marginTop: 8, padding: 12, borderRadius: 12, borderWidth: 1 },
  errorText: { fontSize: 13, fontWeight: '500' },
  btnPrimary: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, padding: 16, borderRadius: 999, marginTop: 24,
  },
  btnPrimaryText: { fontSize: 15, fontWeight: '600' },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 20 },
  divLine: { flex: 1, height: 1 },
  divLabel: { fontSize: 9, letterSpacing: 1.5, textTransform: 'uppercase' },
  socialRow: { flexDirection: 'row', gap: 8 },
  socialBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, padding: 12, borderRadius: 14, borderWidth: 1,
  },
  socialGlyph: { fontSize: 16, fontWeight: '700', minWidth: 14, textAlign: 'center' },
  socialLabel: { fontSize: 12, fontWeight: '500' },
});