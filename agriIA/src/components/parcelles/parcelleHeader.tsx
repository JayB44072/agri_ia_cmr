// ─────────────────────────────────────────────────────────────
//  ParcelleHeader.tsx
//  Barre de titre + stats rapides + bouton ajouter
//  Mode clair : fond blanc   |   Mode sombre : fond #0f172a
// ─────────────────────────────────────────────────────────────
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  totalParcelles:  number;
  onAdd:           () => void;
  totalSurface?:   string;
  avgSante?:       number;
  alertCount?:     number;
  totalRendement?: string;
}

const GREEN = '#3cb95a';

export default function ParcelleHeader({
  totalParcelles,
  onAdd,
  totalSurface    = '—',
  avgSante        = 0,
  alertCount      = 0,
  totalRendement  = '—',
}: Props) {
  const scheme = useColorScheme();
  const dark   = scheme === 'dark';

  const bg         = dark ? '#0f172a'                   : '#ffffff';
  const borderBot  = dark ? 'rgba(34,197,94,0.12)'      : 'rgba(60,185,90,0.12)';
  const titleColor = dark ? '#f1f5f9'                   : '#1a2e1d';
  const subColor   = dark ? '#6b7280'                   : '#4a7a55';

  const slideY  = useRef(new Animated.Value(-20)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideY,  { toValue: 0, duration: 450, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 450, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[
        s.wrap,
        { backgroundColor: bg, borderBottomColor: borderBot },
        { opacity, transform: [{ translateY: slideY }] },
      ]}
    >
      {/* Title row */}
      <View style={s.titleRow}>
        <View style={s.titleLeft}>
          <View style={s.iconWrap}>
            <Ionicons name="map" size={18} color="#fff" />
          </View>
          <View>
            <Text style={[s.title, { color: titleColor }]}>Mes Parcelles</Text>
            <Text style={[s.subtitle, { color: subColor }]}>
              {totalParcelles} parcelles enregistrées
            </Text>
          </View>
        </View>

        <TouchableOpacity style={s.addBtn} onPress={onAdd} activeOpacity={0.8}>
          <Ionicons name="add" size={18} color="#fff" />
          <Text style={s.addBtnText}>Ajouter</Text>
        </TouchableOpacity>
      </View>

      {/* Stats rapides */}
      <View style={s.statsRow}>
        <StatChip
          icon="resize-outline"
          value={`${totalSurface} ha`}
          label="Surface totale"
          color="#3cb95a"
          dark={dark}
        />
        <StatChip
          icon="heart"
          value={`${avgSante}%`}
          label="Santé moy."
          color={avgSante >= 80 ? '#22c55e' : avgSante >= 60 ? '#f59e0b' : '#ef4444'}
          dark={dark}
        />
        <StatChip
          icon="warning"
          value={`${alertCount}`}
          label="Alertes"
          color={alertCount > 0 ? '#f97316' : '#3cb95a'}
          alert={alertCount > 0}
          dark={dark}
        />
        <StatChip
          icon="trending-up"
          value={`${totalRendement}t`}
          label="Rendement"
          color="#3b82f6"
          dark={dark}
        />
      </View>
    </Animated.View>
  );
}

// ── StatChip ──────────────────────────────────────────────────

function StatChip({ icon, value, label, color, alert, dark }: {
  icon: string; value: string; label: string;
  color: string; alert?: boolean; dark: boolean;
}) {
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (alert) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, { toValue: 1.12, duration: 600, useNativeDriver: true }),
          Animated.timing(pulse, { toValue: 1,    duration: 600, useNativeDriver: true }),
        ])
      ).start();
    }
  }, [alert]);

  const chipBg = dark
    ? (alert ? '#431407'           : '#1e293b')
    : (alert ? '#fff4ed'           : '#f4f9f5');

  const chipBorder = dark
    ? (alert ? 'rgba(251,146,60,0.35)' : 'rgba(255,255,255,0.04)')
    : (alert ? 'rgba(249,115,22,0.25)' : 'rgba(60,185,90,0.15)');

  const labelColor = dark ? '#6b7280' : '#4a7a55';

  return (
    <Animated.View
      style={[
        s.chip,
        { backgroundColor: chipBg, borderColor: chipBorder },
        { transform: [{ scale: pulse }] },
      ]}
    >
      <Ionicons name={icon as any} size={13} color={color} />
      <Text style={[s.chipVal, { color }]}>{value}</Text>
      <Text style={[s.chipLabel, { color: labelColor }]}>{label}</Text>
    </Animated.View>
  );
}

// ── Styles ────────────────────────────────────────────────────

const s = StyleSheet.create({
  wrap: {
    paddingHorizontal: 16,
    paddingTop: 54,
    paddingBottom: 14,
    borderBottomWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  titleRow:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  titleLeft:  { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconWrap:   {
    backgroundColor: GREEN, borderRadius: 10, padding: 8,
    shadowColor: GREEN, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35, shadowRadius: 8, elevation: 6,
  },
  title:      { fontSize: 18, fontWeight: '800', letterSpacing: -0.3 },
  subtitle:   { fontSize: 11, marginTop: 1 },
  addBtn:     {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: GREEN, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 12,
    shadowColor: GREEN, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35, shadowRadius: 8, elevation: 6,
  },
  addBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  statsRow:   { flexDirection: 'row', gap: 8 },
  chip:       { flex: 1, borderRadius: 10, padding: 8, alignItems: 'center', gap: 2, borderWidth: 1 },
  chipVal:    { fontSize: 13, fontWeight: '800' },
  chipLabel:  { fontSize: 8, textAlign: 'center' },
});