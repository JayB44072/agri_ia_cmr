import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Parcelle, StatutCapteur, Priorite } from '@/components/data/parcellesData';

interface Props {
  parcelle: Parcelle;
  index:    number;
  onPress:  () => void;
  onEdit:   () => void;
}

const STATUT_CONFIG: Record<StatutCapteur, { label: string; color: string; bg: string }> = {
  ok:        { label: '✅ Bonne santé', color: '#22c55e', bg: 'rgba(34,197,94,0.12)'  },
  attention: { label: '⚠️ Attention',   color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  critique:  { label: '🚨 Critique',    color: '#ef4444', bg: 'rgba(239,68,68,0.12)'  },
};

const PRIORITE_CONFIG: Record<Priorite, { color: string; icon: string }> = {
  urgent:    { color: '#ef4444', icon: 'alert-circle'        },
  important: { color: '#f59e0b', icon: 'warning'             },
  conseil:   { color: '#22c55e', icon: 'information-circle'  },
};

function ProgressBar({ value, color }: { value: number; color: string }) {
  const width = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(width, { toValue: value, duration: 700, delay: 200, useNativeDriver: false }).start();
  }, [value]);
  return (
    <View style={ps.barBg}>
      <Animated.View style={[ps.barFill, { backgroundColor: color, width: width.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] }) }]} />
    </View>
  );
}

function CapteurPuce({ icon, value, label, alert }: { icon: string; value: string; label: string; alert?: boolean }) {
  return (
    <View style={[ps.puce, alert && ps.puceAlert]}>
      <Ionicons name={icon as any} size={11} color={alert ? '#fbbf24' : '#4ade80'} />
      <Text style={[ps.puceVal, alert && { color: '#fbbf24' }]}>{value}</Text>
      <Text style={ps.puceLabel}>{label}</Text>
    </View>
  );
}

export default function ParcelleListItem({ parcelle, index, onPress, onEdit }: Props) {
  const slideX  = useRef(new Animated.Value(-30)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideX,  { toValue: 0, duration: 380, delay: index * 80, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 380, delay: index * 80, useNativeDriver: true }),
    ]).start();
  }, []);

  const statut     = STATUT_CONFIG[parcelle.capteur.statut];
  const prio       = PRIORITE_CONFIG[parcelle.prioriteTache];
  const santeColor = parcelle.sante >= 80 ? '#22c55e' : parcelle.sante >= 60 ? '#f59e0b' : '#ef4444';

  return (
    <Animated.View style={[ps.wrap, { opacity, transform: [{ translateX: slideX }] }]}>
      <TouchableOpacity onPress={onPress} activeOpacity={0.88} style={[ps.card, { borderLeftColor: parcelle.couleur }]}>

        {/* Ligne 1 : emoji + nom + statut + modifier */}
        <View style={ps.row1}>
          <View style={[ps.emojiBox, { backgroundColor: parcelle.couleur + '22' }]}>
            <Text style={ps.emoji}>{parcelle.emoji}</Text>
          </View>
          <View style={ps.nameBlock}>
            <Text style={ps.nom}>{parcelle.nom}</Text>
            <Text style={ps.cultureSub}>{parcelle.culture} · {parcelle.stade} · {parcelle.surface} ha</Text>
          </View>
          <View style={[ps.statutBadge, { backgroundColor: statut.bg }]}>
            <Text style={[ps.statutText, { color: statut.color }]}>{statut.label}</Text>
          </View>
          <TouchableOpacity onPress={onEdit} style={ps.modifyBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="pencil" size={14} color="#6b7280" />
          </TouchableOpacity>
        </View>

        {/* Ligne 2 : santé */}
        <View style={ps.santeRow}>
          <Text style={ps.santeLabel}>Santé de la parcelle</Text>
          <ProgressBar value={parcelle.sante} color={santeColor} />
          <Text style={[ps.santePct, { color: santeColor }]}>{parcelle.sante}%</Text>
        </View>

        {/* Ligne 3 : capteurs */}
        <View style={ps.capteursRow}>
          <CapteurPuce icon="water"         value={`${parcelle.capteur.humidite}%`}    label="Humidité sol"  alert={parcelle.capteur.humidite < 45} />
          <CapteurPuce icon="thermometer"   value={`${parcelle.capteur.temperature}°C`} label="Température"  alert={parcelle.capteur.temperature > 33} />
          <CapteurPuce icon="flask-outline" value={`pH ${parcelle.capteur.ph}`}          label="Acidité sol"  alert={parcelle.capteur.ph < 6 || parcelle.capteur.ph > 7.5} />
          <CapteurPuce icon="leaf-outline"  value={`${parcelle.capteur.azote}%`}         label="Azote"        alert={parcelle.capteur.azote < 10} />
        </View>

        {/* Ligne 4 : prochaine tâche */}
        <View style={[ps.tacheRow, { borderTopColor: parcelle.couleur + '30' }]}>
          <Ionicons name={prio.icon as any} size={13} color={prio.color} />
          <Text style={[ps.tacheText, { color: prio.color }]}>{parcelle.prochaineTache}</Text>
          <Text style={ps.arrosage}>💧 {parcelle.dernierArrosage}</Text>
        </View>

        {/* Rendement prévu */}
        <View style={ps.rendRow}>
          <Ionicons name="trending-up" size={12} color="#60a5fa" />
          <Text style={ps.rendText}>
            Rendement prévu :{' '}
            <Text style={{ color: '#93c5fd', fontWeight: '700' }}>{parcelle.rendementPrevu} t/ha</Text>
            {'  →  '}
            <Text style={{ color: '#93c5fd', fontWeight: '700' }}>{(parcelle.rendementPrevu * parcelle.surface).toFixed(1)} t au total</Text>
          </Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const ps = StyleSheet.create({
  wrap: { paddingHorizontal: 12, marginBottom: 10 },
  card: {
    backgroundColor: '#1e293b', borderRadius: 16, borderLeftWidth: 4, padding: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 4,
  },
  row1:        { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  emojiBox:    { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  emoji:       { fontSize: 20 },
  nameBlock:   { flex: 1 },
  nom:         { color: '#f1f5f9', fontSize: 14, fontWeight: '800' },
  cultureSub:  { color: '#6b7280', fontSize: 10, marginTop: 1 },
  statutBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  statutText:  { fontSize: 9, fontWeight: '700' },
  modifyBtn:   { backgroundColor: '#334155', padding: 7, borderRadius: 8 },

  santeRow:   { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  santeLabel: { color: '#6b7280', fontSize: 10, width: 110 },
  santePct:   { fontSize: 11, fontWeight: '800', width: 34, textAlign: 'right' },
  barBg:      { flex: 1, height: 6, backgroundColor: '#0f172a', borderRadius: 3, overflow: 'hidden' },
  barFill:    { height: '100%', borderRadius: 3 },

  capteursRow: { flexDirection: 'row', gap: 6, marginBottom: 10 },
  puce:        { flex: 1, backgroundColor: '#0f172a', borderRadius: 8, paddingHorizontal: 6, paddingVertical: 6, alignItems: 'center', gap: 2, borderWidth: 1, borderColor: 'rgba(34,197,94,0.10)' },
  puceAlert:   { borderColor: 'rgba(251,191,36,0.30)', backgroundColor: '#1c1400' },
  puceVal:     { color: '#f1f5f9', fontSize: 11, fontWeight: '700' },
  puceLabel:   { color: '#6b7280', fontSize: 8, textAlign: 'center' },

  tacheRow:  { flexDirection: 'row', alignItems: 'center', gap: 6, paddingTop: 8, borderTopWidth: 1, marginBottom: 6 },
  tacheText: { flex: 1, fontSize: 11, fontWeight: '600' },
  arrosage:  { color: '#6b7280', fontSize: 10 },

  rendRow:  { flexDirection: 'row', alignItems: 'center', gap: 5 },
  rendText: { color: '#6b7280', fontSize: 10 },
});