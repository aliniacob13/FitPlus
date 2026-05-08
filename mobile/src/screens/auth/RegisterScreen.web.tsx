import React, { useMemo, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';

import { useTheme } from '@/context/ThemeContext';
import { FpIcon } from '@/components/ui/FpIcon';
import { useAuthStore } from '@/store/authStore';
import { AuthStackParamList } from '@/types/navigation';

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

const SERIF = 'Georgia';
const MONO = 'monospace';

function passwordStrength(pw: string): number {
  if (!pw) return 0;
  if (pw.length < 8) return 1;
  const hasNum = /\d/.test(pw);
  const hasLetter = /[a-zA-Z]/.test(pw);
  if (!hasNum || !hasLetter) return 2;
  if (pw.length >= 12 && /[^a-zA-Z0-9]/.test(pw)) return 4;
  return 3;
}

export const RegisterScreen = ({ navigation }: Props) => {
  const { t } = useTheme();
  const [name, setName]         = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw]     = useState(false);
  const [agreed, setAgreed]     = useState(false);

  const register     = useAuthStore((s) => s.register);
  const isSubmitting = useAuthStore((s) => s.isSubmitting);
  const error        = useAuthStore((s) => s.error);

  const strength  = useMemo(() => passwordStrength(password), [password]);
  const isValid   = useMemo(() => name.trim().length > 1 && email.includes('@') && strength >= 2 && agreed, [name, email, strength, agreed]);

  const strengthColor = strength >= 3 ? t.good : t.accent;

  const handleRegister = async () => {
    if (!isValid) return;
    const ok = await register(name.trim(), email, password);
    if (ok) navigation.navigate('Onboarding');
  };

  return (
    <View style={[s.root, { backgroundColor: t.bg }]}>
      {/* Left brand panel */}
      <View style={[s.brandPanel, { backgroundColor: t.bgDeep, borderRightColor: t.line }]}>
        <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
          <Svg viewBox="0 0 480 700" style={{ width: '100%', height: '100%' }} preserveAspectRatio="xMidYMid slice">
            <Defs>
              <RadialGradient id="wsplit2" cx="50%" cy="50%" r="60%">
                <Stop offset="0%" stopColor={t.primary} stopOpacity="0.18"/>
                <Stop offset="100%" stopColor={t.primary} stopOpacity="0"/>
              </RadialGradient>
            </Defs>
            <Circle cx="240" cy="380" r="220" fill="url(#wsplit2)"/>
            <Circle cx="240" cy="380" r="160" fill="none" stroke={t.primary} strokeWidth="1" opacity="0.22"/>
            <Circle cx="240" cy="380" r="110" fill="none" stroke={t.primary} strokeWidth="1" opacity="0.32"/>
            <Circle cx="240" cy="380" r="60"  fill={t.primary} opacity="0.18"/>
          </Svg>
        </View>

        <View style={s.brandMark}>
          <View style={[s.brandIcon, { backgroundColor: t.primary }]}>
            <FpIcon name="leaf" size={24} color={t.primaryInk}/>
          </View>
          <View style={{ gap: 2 }}>
            <Text style={[s.brandName, { fontFamily: SERIF, color: t.ink }]}>FitPlus</Text>
            <Text style={[s.eyebrow, { color: t.muted, fontFamily: MONO }]}>wellness · daily</Text>
          </View>
        </View>

        <View style={[s.marketing, { zIndex: 1 }]}>
          <Text style={[s.eyebrow, { color: t.muted, fontFamily: MONO }]}>DE CE FITPLUS</Text>
          <Text style={[s.heroText, { fontFamily: SERIF, color: t.ink }]}>
            {'Mănâncă bine.\nAntrenează-te '}
            <Text style={{ fontStyle: 'italic', color: t.primary }}>smart.</Text>
          </Text>
          <Text style={[s.heroSub, { color: t.muted }]}>
            Plate Coach AI, antrenamente personalizate și 1 200+ săli aproape de tine — într-o singură aplicație.
          </Text>
          <View style={s.statRow}>
            {[{ num: '120k+', label: 'users in RO' }, { num: '4.8 ★', label: 'app store' }, { num: '1 200+', label: 'gyms' }].map((stat) => (
              <View key={stat.label} style={[s.statTile, { backgroundColor: t.surface, borderColor: t.line }]}>
                <Text style={[s.statNum, { fontFamily: SERIF, color: t.ink }]}>{stat.num}</Text>
                <Text style={[s.eyebrow, { color: t.muted, fontFamily: MONO, fontSize: 9 }]}>{stat.label}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* Right form panel */}
      <ScrollView style={{ flex: 1 }} contentContainerStyle={s.formPanel}>
        <View style={s.formInner}>
          <Text style={[s.eyebrow, { color: t.muted, fontFamily: MONO }]}>CREATE ACCOUNT · 1 / 4</Text>
          <Text style={[s.formTitle, { fontFamily: SERIF, color: t.ink }]}>
            {'Hai să-ți facem un '}
            <Text style={{ fontStyle: 'italic', color: t.primary }}>cont.</Text>
          </Text>
          <Text style={[s.formSub, { color: t.muted }]}>
            Vom personaliza planul tău după pasul de onboarding.
          </Text>

          <View style={s.fields}>
            {/* Name */}
            <View style={{ gap: 6 }}>
              <Text style={[s.fieldLabel, { color: t.muted, fontFamily: MONO }]}>NUME COMPLET</Text>
              <View style={[s.fieldRow, { backgroundColor: t.surface, borderColor: t.line }]}>
                <FpIcon name="user" size={18} color={t.muted}/>
                <TextInput value={name} onChangeText={setName} placeholder="ex. Andrei Mocanu"
                  placeholderTextColor={t.muted2} style={[s.fieldInput, { color: t.ink }]}/>
              </View>
            </View>

            {/* Email */}
            <View style={{ gap: 6 }}>
              <Text style={[s.fieldLabel, { color: t.muted, fontFamily: MONO }]}>EMAIL</Text>
              <View style={[s.fieldRow, { backgroundColor: t.surface, borderColor: t.line }]}>
                <FpIcon name="bell" size={18} color={t.muted}/>
                <TextInput value={email} onChangeText={setEmail} placeholder="email@exemplu.ro"
                  placeholderTextColor={t.muted2} keyboardType="email-address" autoCapitalize="none"
                  style={[s.fieldInput, { color: t.ink }]}/>
              </View>
            </View>

            {/* Password + strength */}
            <View style={{ gap: 6 }}>
              <Text style={[s.fieldLabel, { color: t.muted, fontFamily: MONO }]}>PAROLĂ</Text>
              <View style={[s.fieldRow, { backgroundColor: t.surface, borderColor: t.line }]}>
                <FpIcon name="key" size={18} color={t.muted}/>
                <TextInput value={password} onChangeText={setPassword} placeholder="min. 8 caractere"
                  placeholderTextColor={t.muted2} secureTextEntry={!showPw}
                  style={[s.fieldInput, { color: t.ink }]}/>
                <View style={{ flexDirection: 'row', gap: 3, marginRight: 2 }}>
                  {[0, 1, 2, 3].map((i) => (
                    <View key={i} style={[s.strengthBar, {
                      backgroundColor: i < strength
                        ? strengthColor
                        : t.line,
                    }]}/>
                  ))}
                </View>
                <TouchableOpacity onPress={() => setShowPw(!showPw)}>
                  <Text style={[s.eyebrow, { color: t.muted, fontFamily: MONO, fontSize: 9 }]}>
                    {showPw ? 'HIDE' : 'SHOW'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Terms checkbox */}
            <TouchableOpacity
              onPress={() => setAgreed(!agreed)}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}
              activeOpacity={0.7}
            >
              <View style={[s.checkbox, { backgroundColor: agreed ? t.primary : 'transparent', borderColor: agreed ? t.primary : t.line }]}>
                {agreed && <FpIcon name="check" size={11} color={t.primaryInk}/>}
              </View>
              <Text style={[{ fontSize: 12, color: t.muted, lineHeight: 18, flex: 1 }]}>
                {'Sunt de acord cu '}
                <Text style={{ textDecorationLine: 'underline' }}>Termenii</Text>
                {' și '}
                <Text style={{ textDecorationLine: 'underline' }}>Politica de confidențialitate</Text>.
              </Text>
            </TouchableOpacity>
          </View>

          {error ? <Text style={[{ color: t.bad, fontSize: 13, marginTop: 4 }]}>{error}</Text> : null}

          <TouchableOpacity
            onPress={() => void handleRegister()}
            disabled={isSubmitting || !isValid}
            activeOpacity={0.85}
            style={[s.submitBtn, { backgroundColor: t.primary, opacity: (!isValid || isSubmitting) ? 0.5 : 1 }]}
          >
            {isSubmitting
              ? <ActivityIndicator color={t.primaryInk} size="small"/>
              : <>
                  <Text style={[{ fontSize: 15, fontWeight: '600', color: t.primaryInk }]}>Continuă cu onboarding</Text>
                  <FpIcon name="arrow" size={14} color={t.primaryInk}/>
                </>
            }
          </TouchableOpacity>

          <View style={s.divider}>
            <View style={[s.divLine, { backgroundColor: t.lineSoft }]}/>
            <Text style={[s.eyebrow, { color: t.muted, fontFamily: MONO, fontSize: 9 }]}>sau</Text>
            <View style={[s.divLine, { backgroundColor: t.lineSoft }]}/>
          </View>

          <View style={{ flexDirection: 'row', gap: 10 }}>
            {[{ glyph: '', label: 'Apple' }, { glyph: 'G', label: 'Google' }, { glyph: 'f', label: 'Facebook' }].map((item) => (
              <TouchableOpacity key={item.label} activeOpacity={0.7}
                style={[s.socialBtn, { backgroundColor: t.surface, borderColor: t.line }]}>
                <Text style={[{ fontSize: 16, fontWeight: '700', color: t.ink }]}>{item.glyph}</Text>
                <Text style={[{ fontSize: 12, fontWeight: '500', color: t.ink2 }]}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[{ fontSize: 13, color: t.muted, textAlign: 'center', marginTop: 24 }]}>
            {'Ai deja cont? '}
            <Text style={[{ color: t.primary, fontWeight: '600' }]} onPress={() => navigation.navigate('Login')}>
              Sign in →
            </Text>
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const s = StyleSheet.create({
  root: { flex: 1, flexDirection: 'row' },
  brandPanel: { width: 480, padding: 44, borderRightWidth: 1, overflow: 'hidden' as any },
  brandMark: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  brandIcon: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  brandName: { fontSize: 23, letterSpacing: -0.5, lineHeight: 24 },
  marketing: { marginTop: 'auto' as any, gap: 0 },
  heroText: { fontSize: 38, lineHeight: 44, letterSpacing: -0.8, marginTop: 8 },
  heroSub: { fontSize: 14, lineHeight: 22, maxWidth: 360, marginTop: 14 },
  statRow: { flexDirection: 'row', gap: 12, marginTop: 28 },
  statTile: { paddingVertical: 12, paddingHorizontal: 14, borderRadius: 16, borderWidth: 1, gap: 2 },
  statNum: { fontSize: 22, letterSpacing: -0.4 },
  formPanel: { padding: 60, justifyContent: 'center' as any, flexGrow: 1 },
  formInner: { maxWidth: 460, alignSelf: 'center' as any, width: '100%' as any },
  formTitle: { fontSize: 44, letterSpacing: -0.9, lineHeight: 48, marginTop: 8 },
  formSub: { fontSize: 14, marginTop: 10 },
  fields: { gap: 14, marginTop: 32 },
  fieldLabel: { fontSize: 9, letterSpacing: 1.8, textTransform: 'uppercase', fontWeight: '500' },
  fieldRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderWidth: 1, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 16,
  },
  fieldInput: { flex: 1, fontSize: 15, outlineWidth: 0 } as any,
  strengthBar: { width: 14, height: 4, borderRadius: 2 },
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
