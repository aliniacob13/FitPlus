import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Platform, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import Svg, { Defs, RadialGradient, Stop, Rect, Circle, Path } from 'react-native-svg';

import { useTheme } from '@/context/ThemeContext';
import { FpIcon } from '@/components/ui/FpIcon';
import { AuthStackParamList } from '@/types/navigation';

type Props = NativeStackScreenProps<AuthStackParamList, 'Welcome'>;

const SERIF = Platform.OS === 'ios' ? 'Georgia' : 'serif';
const MONO = Platform.OS === 'ios' ? 'Courier New' : 'monospace';
const { width: W, height: H } = Dimensions.get('window');

export const WelcomeScreen = ({ navigation }: Props) => {
  const { t } = useTheme();

  return (
    <SafeAreaView style={[s.root, { backgroundColor: t.bg }]}>
      {/* Decorative background */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <Svg width={W} height={H} style={StyleSheet.absoluteFill}>
          <Defs>
            <RadialGradient id="rg1" cx="50%" cy="20%" r="60%">
              <Stop offset="0%" stopColor={t.primary} stopOpacity="0.3"/>
              <Stop offset="100%" stopColor={t.primary} stopOpacity="0"/>
            </RadialGradient>
          </Defs>
          <Rect width={W} height={H} fill="url(#rg1)"/>
          <Circle cx={W * 0.82} cy={H * 0.18} r={110} fill="none" stroke={t.primary} strokeWidth="1" opacity="0.22"/>
          <Circle cx={W * 0.82} cy={H * 0.18} r={68} fill="none" stroke={t.primary} strokeWidth="1" opacity="0.38"/>
          <Circle cx={W * 0.82} cy={H * 0.18} r={30} fill={t.primary} opacity="0.16"/>
          <Path d={`M-20,${H*0.76} C100,${H*0.73} 200,${H*0.8} ${W+20},${H*0.72}`} fill="none" stroke={t.line} strokeWidth="1"/>
          <Path d={`M-20,${H*0.82} C140,${H*0.79} 240,${H*0.87} ${W+20},${H*0.79}`} fill="none" stroke={t.line} strokeWidth="1"/>
        </Svg>
      </View>

      {/* BrandMark */}
      <View style={s.brand}>
        <View style={[s.brandIcon, { backgroundColor: t.primary, shadowColor: t.primary }]}>
          <FpIcon name="leaf" size={22} color={t.primaryInk}/>
        </View>
        <View style={{ gap: 2 }}>
          <Text style={[s.brandName, { fontFamily: SERIF, color: t.ink }]}>FitPlus</Text>
          <Text style={[s.eyebrow, { color: t.muted, fontFamily: MONO }]}>WELLNESS · DAILY</Text>
        </View>
      </View>

      {/* Hero copy */}
      <View style={s.heroSection}>
        <Text style={[s.eyebrow, { color: t.muted, fontFamily: MONO, marginBottom: 12 }]}>
          YOUR DAILY WELLNESS · 2026
        </Text>
        <Text style={[s.heroTitle, { fontFamily: SERIF, color: t.ink }]}>
          {'Mănâncă bine.\nAntrenează-te '}
          <Text style={[s.heroTitleAccent, { color: t.primary, fontStyle: 'italic' }]}>smart.</Text>
        </Text>
        <Text style={[s.heroSub, { color: t.muted }]}>
          Plate Coach AI, antrenamente personalizate și 1 200+ săli aproape de tine.
        </Text>
      </View>

      {/* CTAs */}
      <View style={s.ctaSection}>
        <TouchableOpacity
          onPress={() => navigation.navigate('Register')}
          activeOpacity={0.85}
          style={[s.btnPrimary, { backgroundColor: t.primary }]}
        >
          <Text style={[s.btnPrimaryText, { color: t.primaryInk }]}>
            Începe gratuit · 7 zile
          </Text>
          <FpIcon name="arrow" size={14} color={t.primaryInk}/>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => navigation.navigate('Login')}
          activeOpacity={0.85}
          style={[s.btnGhost, { borderColor: t.line }]}
        >
          <Text style={[s.btnGhostText, { color: t.ink }]}>Am deja cont</Text>
        </TouchableOpacity>

        <Text style={[s.terms, { color: t.muted }]}>
          Continuând accepți{' '}
          <Text style={{ textDecorationLine: 'underline' }}>Termenii</Text>
          {' '}și{' '}
          <Text style={{ textDecorationLine: 'underline' }}>Politica de confidențialitate</Text>.
        </Text>
      </View>
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  root: { flex: 1, padding: 24, paddingTop: 40, paddingBottom: 30 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  brandIcon: {
    width: 44, height: 44, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
    shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 6,
  },
  brandName: { fontSize: 22, letterSpacing: -0.5, lineHeight: 24 },
  heroSection: { flex: 1, justifyContent: 'flex-end', paddingBottom: 36 },
  heroTitle: { fontSize: 44, lineHeight: 48, letterSpacing: -1, marginBottom: 16 },
  heroTitleAccent: { fontSize: 44 },
  heroSub: { fontSize: 14, lineHeight: 22, maxWidth: 320 },
  ctaSection: { gap: 10 },
  btnPrimary: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, padding: 16, borderRadius: 999,
  },
  btnPrimaryText: { fontSize: 15, fontWeight: '600', letterSpacing: 0.1 },
  btnGhost: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    padding: 16, borderRadius: 999, borderWidth: 1,
  },
  btnGhostText: { fontSize: 14, fontWeight: '500' },
  eyebrow: { fontSize: 10, letterSpacing: 1.8, textTransform: 'uppercase', fontWeight: '500' },
  terms: { fontSize: 11, textAlign: 'center', lineHeight: 16, marginTop: 8 },
});