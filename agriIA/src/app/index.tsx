import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, Animated,
  TouchableOpacity, StatusBar, Platform,
} from 'react-native';
import { router } from 'expo-router';
import { Colors, Spacing, Radius, Shadows } from '@/constants/theme';

// Palette fond blanc
const C = {
  bgLight:     '#ffffff',
  bgSoft:      '#f4f9f5',
  green:       '#3cb95a',
  greenDark:   '#2d9148',
  greenLight:  '#6fe08d',
  greenPale:   '#8fd4a0',
  greenFaint:  '#c8ebd0',
  text:        '#1a2e1d',
  textSub:     '#4a7a55',
  textMuted:   '#9ab8a0',
  border:      'rgba(60,185,90,0.18)',
  greenFaded:  'rgba(60,185,90,0.10)',
};

interface StatItem    { val: string; lbl: string; }
interface FeatureItem { icon: string; title: string; desc: string; }

const STATS: StatItem[] = [
  { val: 'IoT',  lbl: 'Capteurs'   },
  { val: 'IA',   lbl: 'Prédiction' },
  { val: '24/7', lbl: 'Monitoring' },
];

const FEATURES: FeatureItem[] = [
  { icon: '🌱', title: 'Analyse du sol',     desc: 'pH, humidité, nutriments en temps réel' },
  { icon: '🌦️', title: 'Météo locale',       desc: 'Prévisions adaptées à votre région'     },
  { icon: '🤖', title: 'Recommandations IA', desc: 'Conseils personnalisés par culture'      },
];

// ── Composants ──────────────────────────────────────────────────────────────

function LogoMark(): React.JSX.Element {
  return (
    <View style={s.logoContainer}>
      <View style={s.ringOuter} />
      <View style={s.ringMid}   />
      <View style={s.ringInner}>
        <Text style={s.logoEmoji}>🌿</Text>
      </View>
    </View>
  );
}

function StatPill({ item }: { item: StatItem }): React.JSX.Element {
  return (
    <View style={s.statPill}>
      <Text style={s.statVal}>{item.val}</Text>
      <Text style={s.statLbl}>{item.lbl}</Text>
    </View>
  );
}

function FeatureRow({ item, isLast }: { item: FeatureItem; isLast: boolean }): React.JSX.Element {
  return (
    <View style={[s.featItem, isLast && s.featItemLast]}>
      <View style={s.featIcon}>
        <Text style={s.featIconText}>{item.icon}</Text>
      </View>
      <View style={s.featText}>
        <Text style={s.featTitle}>{item.title}</Text>
        <Text style={s.featDesc}>{item.desc}</Text>
      </View>
    </View>
  );
}

// ── Composant principal ──────────────────────────────────────────────────────

export default function SplashScreen(): React.JSX.Element {
  const logoAnim  = useRef(new Animated.Value(0)).current;
  const titleAnim = useRef(new Animated.Value(0)).current;
  const statsAnim = useRef(new Animated.Value(0)).current;
  const featAnim  = useRef(new Animated.Value(0)).current;
  const btnAnim   = useRef(new Animated.Value(0)).current;
  const dot1      = useRef(new Animated.Value(0.2)).current;
  const dot2      = useRef(new Animated.Value(0.2)).current;
  const dot3      = useRef(new Animated.Value(0.2)).current;

  useEffect(() => {
    Animated.stagger(160, [
      Animated.spring(logoAnim,  { toValue: 1, useNativeDriver: true, tension: 55, friction: 8 }),
      Animated.spring(titleAnim, { toValue: 1, useNativeDriver: true, tension: 55, friction: 8 }),
      Animated.spring(statsAnim, { toValue: 1, useNativeDriver: true, tension: 55, friction: 8 }),
      Animated.spring(featAnim,  { toValue: 1, useNativeDriver: true, tension: 55, friction: 8 }),
      Animated.spring(btnAnim,   { toValue: 1, useNativeDriver: true, tension: 55, friction: 8 }),
    ]).start();

    const pulse = (dot: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, { toValue: 1,   duration: 380, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0.2, duration: 380, useNativeDriver: true }),
        ])
      ).start();

    pulse(dot1, 0);
    pulse(dot2, 200);
    pulse(dot3, 400);
  }, []);

  const slideUp = (anim: Animated.Value) => ({
    opacity: anim,
    transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [28, 0] }) }],
  });

  const scaleIn = {
    opacity: logoAnim,
    transform: [{ scale: logoAnim.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] }) }],
  };

  return (
    <View style={s.root}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bgLight} />
      <View style={s.halo1} />
      <View style={s.halo2} />

      <Animated.View style={[s.logoWrapper, scaleIn]}>
        <LogoMark />
      </Animated.View>

      <Animated.View style={[s.titleBlock, slideUp(titleAnim)]}>
        <Text style={s.brandName}>AgriSmart</Text>
        <Text style={s.brandTagline}>AGRICULTURE INTELLIGENTE · CAMEROUN</Text>
      </Animated.View>

      <Animated.View style={[s.statsRow, slideUp(statsAnim)]}>
        {STATS.map((item) => <StatPill key={item.lbl} item={item} />)}
      </Animated.View>

      <Animated.View style={[s.featuresList, slideUp(featAnim)]}>
        {FEATURES.map((item, i) => (
          <FeatureRow key={item.title} item={item} isLast={i === FEATURES.length - 1} />
        ))}
      </Animated.View>

      <Animated.View style={[s.btnWrapper, slideUp(btnAnim)]}>
        <TouchableOpacity
          style={s.startBtn}
          activeOpacity={0.82}
          onPress={() => router.replace('/(auth)/login')}
        >
          <Text style={s.startBtnText}>Commencer →</Text>
        </TouchableOpacity>
      </Animated.View>

      <Animated.View style={[s.footer, slideUp(btnAnim)]}>
        <Text style={s.bottomNote}>Conçu pour les agriculteurs camerounais</Text>
        <View style={s.dotsRow}>
          {([dot1, dot2, dot3] as Animated.Value[]).map((dot, i) => (
            <Animated.View
              key={i}
              style={[
                s.dot,
                i === 1 && { backgroundColor: C.greenLight },
                i === 2 && { backgroundColor: C.greenPale  },
                { opacity: dot, transform: [{ scale: dot }] },
              ]}
            />
          ))}
        </View>
      </Animated.View>
    </View>
  );
}

// ── Styles ──────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root: {
    flex: 1, backgroundColor: C.bgLight,
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop:    Platform.OS === 'android' ? Spacing.xl : Spacing.xxl,
    paddingBottom: Spacing.xl,
  },
  halo1: { position: 'absolute', width: 320, height: 320, borderRadius: 160, backgroundColor: C.greenFaint, top: -80,  right: -80, opacity: 0.35 },
  halo2: { position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: C.greenFaint, bottom: -40, left: -40, opacity: 0.45 },

  logoWrapper:   { marginBottom: Spacing.lg },
  logoContainer: { width: 110, height: 110, alignItems: 'center', justifyContent: 'center' },
  ringOuter:     { position: 'absolute', width: 104, height: 104, borderRadius: 52, borderWidth: 1.5, borderColor: C.green, borderStyle: 'dashed', opacity: 0.4 },
  ringMid:       { position: 'absolute', width: 80,  height: 80,  borderRadius: 40, borderWidth: 0.8, borderColor: C.green, backgroundColor: C.greenFaded, opacity: 0.8 },
  ringInner:     { width: 58, height: 58, borderRadius: 29, backgroundColor: 'rgba(60,185,90,0.15)', alignItems: 'center', justifyContent: 'center' },
  logoEmoji:     { fontSize: 28 },

  titleBlock:   { alignItems: 'center', marginBottom: Spacing.lg + Spacing.sm },
  brandName:    { fontWeight: '700', fontSize: 34, color: C.text,    letterSpacing: 1,   textAlign: 'center', marginBottom: 4 },
  brandTagline: { fontWeight: '400', fontSize: 11, color: C.textSub, letterSpacing: 2.5, textAlign: 'center' },

  statsRow: { flexDirection: 'row', gap: 12, marginBottom: Spacing.lg, width: '100%' },
  statPill: { flex: 1, backgroundColor: C.bgSoft, borderWidth: 1, borderColor: C.border, borderRadius: Radius.md, paddingVertical: 12, alignItems: 'center' },
  statVal:  { fontWeight: '700', fontSize: 18, color: C.green },
  statLbl:  { fontSize: 10, color: C.textSub, letterSpacing: 1, marginTop: 3 },

  featuresList: { width: '100%', marginBottom: Spacing.lg },
  featItem:     { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: 'rgba(60,185,90,0.15)' },
  featItemLast: { borderBottomWidth: 0 },
  featIcon:     { width: 38, height: 38, borderRadius: Radius.sm + 2, backgroundColor: C.greenFaded, alignItems: 'center', justifyContent: 'center' },
  featIconText: { fontSize: 18 },
  featText:     { flex: 1 },
  featTitle:    { fontWeight: '600', fontSize: 14, color: C.text,    marginBottom: 2 },
  featDesc:     { fontSize: 12,      color: C.textSub, lineHeight: 18 },

  btnWrapper:   { width: '100%', marginBottom: Spacing.md },
  startBtn:     { backgroundColor: C.green, borderRadius: Radius.lg, paddingVertical: 18, alignItems: 'center', ...Shadows.green },
  startBtnText: { fontWeight: '700', fontSize: 16, color: '#ffffff', letterSpacing: 0.5 },

  footer:     { alignItems: 'center', gap: Spacing.sm },
  bottomNote: { fontSize: 11, color: C.textMuted, letterSpacing: 0.5 },
  dotsRow:    { flexDirection: 'row', gap: 6 },
  dot:        { width: 6, height: 6, borderRadius: 3, backgroundColor: C.green },
});