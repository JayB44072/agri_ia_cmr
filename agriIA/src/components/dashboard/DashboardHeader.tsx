import React, { useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Animated, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius } from '@/constants/theme';
import { useUser } from '@/context/UserContext';
import { ALERTES, METEO } from '@/components/data/mockData';

const G   = Colors.splash.green;  // #3cb95a
const G2  = '#2da34a';            // vert foncé pour gradient simulé
const W   = '#ffffff';

// ── Petit composant : point "live" qui pulse ──────────────────────────────────
function LiveDot(): React.JSX.Element {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(scale,   { toValue: 1.6, duration: 700, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0,   duration: 700, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(scale,   { toValue: 1, duration: 0,   useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 1, duration: 0,   useNativeDriver: true }),
        ]),
        Animated.delay(600),
      ])
    ).start();
  }, []);

  return (
    <View style={ld.wrap}>
      <Animated.View style={[ld.ring, { transform: [{ scale }], opacity }]} />
      <View style={ld.dot} />
    </View>
  );
}
const ld = StyleSheet.create({
  wrap: { width: 14, height: 14, alignItems: 'center', justifyContent: 'center' },
  ring: { position: 'absolute', width: 12, height: 12, borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.4)' },
  dot:  { width: 7,  height: 7,  borderRadius: 3.5, backgroundColor: W },
});

// ── Petit chip métrique (météo rapide / IoT) ──────────────────────────────────
function MetricChip({ icon, value, label }: { icon: keyof typeof Ionicons.glyphMap; value: string; label: string }): React.JSX.Element {
  return (
    <View style={mc.chip}>
      <Ionicons name={icon} size={13} color="rgba(255,255,255,0.85)" />
      <View>
        <Text style={mc.val}>{value}</Text>
        <Text style={mc.lbl}>{label}</Text>
      </View>
    </View>
  );
}
const mc = StyleSheet.create({
  chip: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(255,255,255,0.14)', borderRadius: Radius.md, paddingHorizontal: 9, paddingVertical: 5 },
  val:  { fontSize: 12, fontWeight: '700', color: W, lineHeight: 15 },
  lbl:  { fontSize: 9,  color: 'rgba(255,255,255,0.7)', lineHeight: 11 },
});

// ── Composant principal ───────────────────────────────────────────────────────
export default function DashboardHeader(): React.JSX.Element {
  const { profile } = useUser();

  const alertesUrgentes = ALERTES.filter(a => !a.lu).length;

  const getGreeting = (): string => {
    const h = new Date().getHours();
    if (h < 6)  return 'Bonne nuit';
    if (h < 12) return 'Bonjour';
    if (h < 18) return 'Bon après-midi';
    return 'Bonsoir';
  };

  const prenom = profile?.nom?.split(' ')[0] ?? 'Agriculteur';

  // Score IA fictif basé sur la complétude du profil
  const scoreIA = profile
    ? Math.min(100, 40
        + (profile.cultures.length > 0 ? 20 : 0)
        + (profile.ville ? 15 : 0)
        + (profile.superficie ? 10 : 0)
        + (profile.objectif ? 15 : 0))
    : 40;

  // Nombre de capteurs actifs (simulé)
  const capteursActifs = 4;

  return (
    <View style={s.root}>
      {/* ── Fond dégradé simulé avec deux couches ── */}
      <View style={s.bgTop} />
      <View style={s.bgBottom} />
      {/* Motif décoratif */}
      <View style={s.deco1} />
      <View style={s.deco2} />

      {/* ── Ligne principale : logo + salutation + notif ── */}
      <View style={s.mainRow}>
        {/* Logo */}
        <View style={s.logoCircle}>
          <Ionicons name="leaf" size={20} color={G} />
        </View>

        {/* Salutation */}
        <View style={s.greetBlock}>
          <Text style={s.greeting}>{getGreeting()}, {prenom} 👋</Text>
          {profile?.ville ? (
            <View style={s.locRow}>
              <Ionicons name="location-outline" size={11} color="rgba(255,255,255,0.75)" />
              <Text style={s.subtitle}>{profile.ville} · {profile.region}</Text>
            </View>
          ) : (
            <Text style={s.subtitle}>AgriSmart · IA & IoT</Text>
          )}
        </View>

        {/* Bouton notifications */}
        <TouchableOpacity style={s.notifBtn} activeOpacity={0.75}>
          <Ionicons name="notifications-outline" size={20} color={W} />
          {alertesUrgentes > 0 && (
            <View style={s.badge}>
              <Text style={s.badgeText}>{alertesUrgentes}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* ── Ligne secondaire : métriques rapides ── */}
      <View style={s.metricsRow}>
        {/* Météo rapide */}
        <MetricChip
          icon="thermometer-outline"
          value={`${METEO.temperature}°C`}
          label={METEO.condition.split(' ')[0]}
        />
        <MetricChip
          icon="water-outline"
          value={`${METEO.humidite}%`}
          label="Humidité air"
        />
        <MetricChip
          icon="rainy-outline"
          value={`${METEO.pluieProbabilite}%`}
          label="Pluie"
        />

        {/* Spacer */}
        <View style={{ flex: 1 }} />

        {/* Badge IoT Live */}
        <TouchableOpacity style={s.iotBadge} activeOpacity={0.8}>
          <LiveDot />
          <Text style={s.iotText}>{capteursActifs} IoT</Text>
        </TouchableOpacity>
      </View>

      {/* ── Barre score IA ── */}
      {profile && (
        <View style={s.scoreRow}>
          <View style={s.scoreLeft}>
            <Ionicons name="analytics-outline" size={13} color="rgba(255,255,255,0.85)" />
            <Text style={s.scoreLabel}>Score IA</Text>
          </View>
          <View style={s.scoreBarBg}>
            <View style={[s.scoreBarFill, { width: `${scoreIA}%` as any }]} />
          </View>
          <Text style={s.scoreValue}>{scoreIA}%</Text>
        </View>
      )}
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: {
    backgroundColor: G,
    paddingTop: Platform.OS === 'android' ? Spacing.xl + 8 : Spacing.xxl,
    paddingBottom: 14,
    paddingHorizontal: Spacing.lg,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    overflow: 'hidden',
    // Ombre portée
    shadowColor: G2,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 10,
  },

  // Fond dégradé simulé (deux rectangles)
  bgTop: {
    position: 'absolute', top: 0, left: 0, right: 0, height: '60%',
    backgroundColor: '#2ea84a',
  },
  bgBottom: {
    position: 'absolute', bottom: 0, left: 0, right: 0, height: '40%',
    backgroundColor: G,
  },

  // Éléments décoratifs circulaires
  deco1: {
    position: 'absolute', width: 180, height: 180, borderRadius: 90,
    backgroundColor: 'rgba(255,255,255,0.06)',
    top: -60, right: -40,
  },
  deco2: {
    position: 'absolute', width: 100, height: 100, borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.05)',
    bottom: -20, left: 20,
  },

  // Ligne principale
  mainRow: {
    flexDirection: 'row', alignItems: 'center',
    marginBottom: 12,
    gap: 10,
  },
  logoCircle: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: W,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12, shadowRadius: 4, elevation: 3,
  },
  greetBlock: { flex: 1 },
  greeting:   { fontSize: 16, fontWeight: '800', color: W, letterSpacing: 0.3 },
  locRow:     { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 },
  subtitle:   { fontSize: 11, color: 'rgba(255,255,255,0.78)', letterSpacing: 0.4 },

  notifBtn: {
    position: 'relative', width: 42, height: 42, borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)',
  },
  badge:     { position: 'absolute', top: 7, right: 7, width: 16, height: 16, borderRadius: 8, backgroundColor: '#e74c3c', alignItems: 'center', justifyContent: 'center' },
  badgeText: { fontSize: 9, fontWeight: '700', color: W },

  // Métriques
  metricsRow: {
    flexDirection: 'row', alignItems: 'center',
    gap: 8, marginBottom: 10,
  },
  iotBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: Radius.full,
    paddingHorizontal: 10, paddingVertical: 5,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)',
  },
  iotText: { fontSize: 11, fontWeight: '700', color: W },

  // Score IA
  scoreRow: {
    flexDirection: 'row', alignItems: 'center',
    gap: 8, marginTop: 2,
  },
  scoreLeft:    { flexDirection: 'row', alignItems: 'center', gap: 4 },
  scoreLabel:   { fontSize: 10, color: 'rgba(255,255,255,0.8)', fontWeight: '600' },
  scoreBarBg:   { flex: 1, height: 5, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.2)', overflow: 'hidden' },
  scoreBarFill: { height: '100%', borderRadius: 3, backgroundColor: W },
  scoreValue:   { fontSize: 10, fontWeight: '800', color: W, minWidth: 28, textAlign: 'right' },
});