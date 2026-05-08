import React, { useMemo, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';

import { useTheme } from '@/context/ThemeContext';
import { FpIcon } from '@/components/ui/FpIcon';
import { useAuthStore } from '@/store/authStore';
import { AuthStackParamList } from '@/types/navigation';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

const SERIF = 'Georgia';
const MONO = 'monospace';

export const LoginScreen = ({ navigation }: Props) => {
  const { t } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [remember, setRemember] = useState(true);

  const login = useAuthStore((s) => s.login);
  const isSubmitting = useAuthStore((s) => s.isSubmitting);
  const error = useAuthStore((s) => s.error);
  const isValid = useMemo(() => email.includes('@') && password.length >= 6, [email, password]);

  const handleLogin = async () => {
    if (!isValid) return;
    await login(email, password);
  };

  return (
    <View style={[s.root, { backgroundColor: t.bg }]}>
      {/* Left brand panel */}
      <View style={[s.brandPanel, { backgroundColor: t.bgDeep, borderRightColor: t.line }]}>
        {/* Decorative SVG */}
        <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
          <Svg viewBox="0 0 480 700" style={{ width: '100%', height: '100%' }} preserveAspectRatio="xMidYMid slice">
            <Defs>
              <RadialGradient id="wsplit" cx="50%" cy="50%" r="60%">
                <Stop offset="0%" stopColor={t.primary} stopOpacity="0.18"/>
                <Stop offset="100%" stopColor={t.primary} stopOpacity="0"/>
              </RadialGradient>
            </Defs>
            <Circle cx="240" cy="380" r="220" fill="url(#wsplit)"/>
            <Circle cx="240" cy="380" r="160" fill="none" stroke={t.primary} strokeWidth="1" opacity="0.22"/>
            <Circle cx="240" cy="380" r="110" fill="none" stroke={t.primary} strokeWidth="1" opacity="0.32"/>
            <Circle cx="240" cy="380" r="60"  fill={t.primary} opacity="0.18"/>
          </Svg>
        </View>

        {/* Brand mark */}
        <View style={s.brandMark}>
          <View style={[s.brandIcon, { backgroundColor: t.primary, shadowColor: t.primary }]}>
            <FpIcon name="leaf" size={24} color={t.primaryInk}/>
          </View>
          <View style={{ gap: 2 }}>
            <Text style={[s.brandName, { fontFamily: SERIF, color: t.ink }]}>FitPlus</Text>
            <Text style={[s.eyebrow, { color: t.muted, fontFamily: MONO }]}>wellness · daily</Text>
          </View>
        </View>

        {/* Marketing copy */}
        <View style={[s.marketing, { zIndex: 1 }]}>
          <Text style={[s.eyebrow, { color: t.muted, fontFamily: MONO }]}>DE CE FITPLUS</Text>
          <Text style={[s.heroText, { fontFamily: SERIF, color: t.ink }]}>
            {'Mănâncă bine.\nAntrenează-te '}
            <Text style={{ fontStyle: 'italic', color: t.primary }}>smart.</Text>
          </Text>
          <Text style={[s.heroSub, { color: t.muted }]}>
            Plate Coach AI, antrenamente personalizate și 1 200+ săli aproape de tine — într-o singură aplicație.
          </Text>
          {/* Stat tiles */}
          <View style={s.statRow}>
            {[
              { num: '120k+', label: 'users in RO' },
              { num: '4.8 ★', label: 'app store' },
              { num: '1 200+', label: 'gyms' },
            ].map((stat) => (
              <View key={stat.label} style={[s.statTile, { backgroundColor: t.surface, borderColor: t.line }]}>
                <Text style={[s.statNum, { fontFamily: SERIF, color: t.ink }]}>{stat.num}</Text>
                <Text style={[s.eyebrow, { color: t.muted, fontFamily: MONO, fontSize: 9 }]}>{stat.label}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* Right form panel */}
      <View style={s.formPanel}>
        <View style={[s.formInner]}>
          <Text style={[s.eyebrow, { color: t.muted, fontFamily: MONO }]}>SIGN IN · WELCOME BACK</Text>
          <Text style={[s.formTitle, { fontFamily: SERIF, color: t.ink }]}>
            {'Bine ai '}
            <Text style={{ fontStyle: 'italic', color: t.primary }}>revenit.</Text>
          </Text>
          <Text style={[s.formSub, { color: t.muted }]}>Continuă streak-ul de 5 zile și planul de azi.</Text>

          <View style={s.fields}>
            {/* Email */}
            <View style={{ gap: 6 }}>
              <Text style={[s.fieldLabel, { color: t.muted, fontFamily: MONO }]}>EMAIL</Text>
              <View style={[s.fieldRow, { backgroundColor: t.surface, borderColor: t.line }]}>
                <FpIcon name="user" size={18} color={t.muted}/>
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="andrei@fitplus.ro"
                  placeholderTextColor={t.muted2}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  style={[s.fieldInput, { color: t.ink }]}
                />
              </View>
            </View>

            {/* Password */}
            <View style={{ gap: 6 }}>
              <Text style={[s.fieldLabel, { color: t.muted, fontFamily: MONO }]}>PAROLĂ</Text>
              <View style={[s.fieldRow, { backgroundColor: t.surface, borderColor: t.line }]}>
                <FpIcon name="key" size={18} color={t.muted}/>
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="••••••••"
                  placeholderTextColor={t.muted2}
                  secureTextEntry={!showPw}
                  style={[s.fieldInput, { color: t.ink }]}
                />
                <TouchableOpacity onPress={() => setShowPw(!showPw)}>
                  <Text style={[s.eyebrow, { color: t.muted, fontFamily: MONO, fontSize: 9 }]}>
                    {showPw ? 'HIDE' : 'SHOW'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Remember + forgot */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <TouchableOpacity
                onPress={() => setRemember(!remember)}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}
                activeOpacity={0.7}
              >
                <View style={[s.checkbox, { backgroundColor: remember ? t.primary : 'transparent', borderColor: remember ? t.primary : t.line }]}>
                  {remember && <FpIcon name="check" size={11} color={t.primaryInk}/>}
                </View>
                <Text style={[{ fontSize: 13, color: t.muted }]}>Ține-mă conectat</Text>
              </TouchableOpacity>
              <Text style={[{ fontSize: 13, color: t.primary, fontWeight: '600' }]}>Ai uitat parola?</Text>
            </View>
          </View>

          {error ? <Text style={[{ color: t.bad, fontSize: 13, marginTop: 4 }]}>{error}</Text> : null}

          <TouchableOpacity
            onPress={() => void handleLogin()}
            disabled={isSubmitting || !isValid}
            activeOpacity={0.85}
            style={[s.submitBtn, { backgroundColor: t.primary, opacity: (!isValid || isSubmitting) ? 0.5 : 1 }]}
          >
            {isSubmitting
              ? <ActivityIndicator color={t.primaryInk} size="small"/>
              : <>
                  <Text style={[{ fontSize: 15, fontWeight: '600', color: t.primaryInk }]}>Sign in</Text>
                  <FpIcon name="arrow" size={14} color={t.primaryInk}/>
                </>
            }
          </TouchableOpacity>

          {/* Divider */}
          <View style={s.divider}>
            <View style={[s.divLine, { backgroundColor: t.lineSoft }]}/>
            <Text style={[s.eyebrow, { color: t.muted, fontFamily: MONO, fontSize: 9 }]}>sau continuă cu</Text>
            <View style={[s.divLine, { backgroundColor: t.lineSoft }]}/>
          </View>

          {/* Social */}
          <View style={{ flexDirection: 'row', gap: 10 }}>
            {[{ glyph: '', label: 'Apple' }, { glyph: 'G', label: 'Google' }, { glyph: 'f', label: 'Facebook' }].map((s2) => (
              <TouchableOpacity key={s2.label} activeOpacity={0.7}
                style={[s.socialBtn, { backgroundColor: t.surface, borderColor: t.line }]}>
                <Text style={[{ fontSize: 16, fontWeight: '700', color: t.ink }]}>{s2.glyph}</Text>
                <Text style={[{ fontSize: 12, fontWeight: '500', color: t.ink2 }]}>{s2.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[{ fontSize: 13, color: t.muted, textAlign: 'center', marginTop: 24 }]}>
            {'Nu ai cont? '}
            <Text
              style={[{ color: t.primary, fontWeight: '600' }]}
              onPress={() => navigation.navigate('Register')}
            >
              Înregistrează-te gratuit →
            </Text>
          </Text>
        </View>
      </View>
    </View>
  );
};

const s = StyleSheet.create({
  root: { flex: 1, flexDirection: 'row' },
  brandPanel: { width: 480, padding: 44, borderRightWidth: 1, overflow: 'hidden' },
  brandMark: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  brandIcon: {
    width: 42, height: 42, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
    shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 0,
  },
  brandName: { fontSize: 23, letterSpacing: -0.5, lineHeight: 24 },
  marketing: { marginTop: 'auto' as any, gap: 0 },
  heroText: { fontSize: 38, lineHeight: 44, letterSpacing: -0.8, marginTop: 8 },
  heroSub: { fontSize: 14, lineHeight: 22, maxWidth: 360, marginTop: 14 },
  statRow: { flexDirection: 'row', gap: 12, marginTop: 28 },
  statTile: { paddingVertical: 12, paddingHorizontal: 14, borderRadius: 16, borderWidth: 1, gap: 2 },
  statNum: { fontSize: 22, letterSpacing: -0.4 },
  formPanel: { flex: 1, padding: 60, justifyContent: 'center', overflow: 'auto' as any },
  formInner: { maxWidth: 460, alignSelf: 'center', width: '100%' as any },
  formTitle: { fontSize: 44, letterSpacing: -0.9, lineHeight: 48, marginTop: 8 },
  formSub: { fontSize: 14, marginTop: 10 },
  fields: { gap: 14, marginTop: 32 },
  fieldLabel: { fontSize: 9, letterSpacing: 1.8, textTransform: 'uppercase', fontWeight: '500' },
  fieldRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderWidth: 1, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 16,
  },
  fieldInput: { flex: 1, fontSize: 15, outlineWidth: 0 } as any,
  checkbox: { width: 18, height: 18, borderRadius: 6, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  submitBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 14, borderRadius: 999, marginTop: 24,
  },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 28 },
  divLine: { flex: 1, height: 1 },
  socialBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 12, borderRadius: 14, borderWidth: 1,
  },
  eyebrow: { fontSize: 10, letterSpacing: 1.8, textTransform: 'uppercase', fontWeight: '500' },
});
