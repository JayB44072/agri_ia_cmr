import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

// ── Types ─────────────────────────────────────────────────────────────────────
interface Capteur {
  humidite: number;
  temperature: number;
  ph: number;
  statut: 'ok' | 'warning' | 'critical';
}

interface Parcelle {
  id: string;
  nom: string;
  surface: number; // hectares
  culture: string;
  stade: string;
  sante: number; // 0-100
  rendementPrevu: number; // t/ha
  capteur: Capteur;
  couleur: string;
  icon: string;
  coordX: number; // position sur mini-carte (%)
  coordY: number;
  dernierArrosage: string;
  prochaineTache: string;
}

// ── Mock data ─────────────────────────────────────────────────────────────────
const PARCELLES_INIT: Parcelle[] = [
  {
    id: 'p1',
    nom: 'Parcelle Nord',
    surface: 2.4,
    culture: 'Maïs',
    stade: 'Floraison',
    sante: 87,
    rendementPrevu: 6.2,
    capteur: { humidite: 68, temperature: 28.4, ph: 6.8, statut: 'ok' },
    couleur: '#22c55e',
    icon: 'leaf',
    coordX: 15,
    coordY: 20,
    dernierArrosage: 'Il y a 2h',
    prochaineTache: 'Fertilisation dans 3j',
  },
  {
    id: 'p2',
    nom: 'Parcelle Est',
    surface: 1.8,
    culture: 'Tomate',
    stade: 'Fructification',
    sante: 72,
    rendementPrevu: 8.5,
    capteur: { humidite: 52, temperature: 31.2, ph: 6.2, statut: 'warning' },
    couleur: '#f97316',
    icon: 'nutrition',
    coordX: 65,
    coordY: 30,
    dernierArrosage: 'Il y a 5h',
    prochaineTache: 'Arrosage urgent !',
  },
  {
    id: 'p3',
    nom: 'Parcelle Sud',
    surface: 3.1,
    culture: 'Manioc',
    stade: 'Croissance',
    sante: 94,
    rendementPrevu: 12.0,
    capteur: { humidite: 74, temperature: 26.8, ph: 7.1, statut: 'ok' },
    couleur: '#a855f7',
    icon: 'grid',
    coordX: 40,
    coordY: 70,
    dernierArrosage: 'Il y a 1h',
    prochaineTache: 'Désherbage dans 5j',
  },
  {
    id: 'p4',
    nom: 'Parcelle Ouest',
    surface: 0.9,
    culture: 'Piment',
    stade: 'Semis',
    sante: 61,
    rendementPrevu: 2.1,
    capteur: { humidite: 41, temperature: 33.5, ph: 5.9, statut: 'critical' },
    couleur: '#ef4444',
    icon: 'flame',
    coordX: 78,
    coordY: 65,
    dernierArrosage: 'Il y a 9h',
    prochaineTache: '⚠️ Capteur critique',
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
const fluctuate = (val: number, range: number, min: number, max: number) =>
  Math.min(max, Math.max(min, val + (Math.random() - 0.5) * range * 2));

const getSanteColor = (s: number) =>
  s >= 85 ? '#22c55e' : s >= 65 ? '#f59e0b' : '#ef4444';

const getStatutColor = (s: 'ok' | 'warning' | 'critical') =>
  s === 'ok' ? '#22c55e' : s === 'warning' ? '#f59e0b' : '#ef4444';

const getStatutLabel = (s: 'ok' | 'warning' | 'critical') =>
  s === 'ok' ? 'Optimal' : s === 'warning' ? 'Attention' : 'Critique';

// ── Mini Map Dot ──────────────────────────────────────────────────────────────
const MapDot = ({
  parcelle,
  selected,
  onPress,
}: {
  parcelle: Parcelle;
  selected: boolean;
  onPress: () => void;
}) => {
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (parcelle.capteur.statut !== 'ok') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, { toValue: 1.5, duration: 700, useNativeDriver: true }),
          Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
        ])
      ).start();
    }
  }, []);

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.mapDotWrapper,
        { left: `${parcelle.coordX}%`, top: `${parcelle.coordY}%` },
      ]}
    >
      <Animated.View
        style={[
          styles.mapDotRing,
          {
            borderColor: parcelle.couleur,
            transform: [{ scale: pulse }],
            opacity: parcelle.capteur.statut !== 'ok' ? 0.4 : 0,
          },
        ]}
      />
      <View
        style={[
          styles.mapDot,
          {
            backgroundColor: parcelle.couleur,
            borderWidth: selected ? 3 : 0,
            borderColor: '#fff',
            width: selected ? 18 : 12,
            height: selected ? 18 : 12,
            borderRadius: selected ? 9 : 6,
          },
        ]}
      />
      {selected && (
        <View style={[styles.mapLabel, { backgroundColor: parcelle.couleur }]}>
          <Text style={styles.mapLabelText}>{parcelle.nom.split(' ')[1]}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

// ── Metric Chip ───────────────────────────────────────────────────────────────
const MetricChip = ({
  icon,
  value,
  label,
  flash,
}: {
  icon: string;
  value: string;
  label: string;
  flash: boolean;
}) => {
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (flash) {
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.2, duration: 150, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]).start();
    }
  }, [value]);

  return (
    <View style={styles.metricChip}>
      <Ionicons name={icon as any} size={13} color="#86efac" />
      <Animated.Text style={[styles.metricValue, { opacity }]}>{value}</Animated.Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
};

// ── Sante Bar ─────────────────────────────────────────────────────────────────
const SanteBar = ({ sante, couleur }: { sante: number; couleur: string }) => {
  const width = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(width, {
      toValue: sante,
      duration: 800,
      useNativeDriver: false,
    }).start();
  }, [sante]);

  return (
    <View style={styles.santeBarBg}>
      <Animated.View
        style={[
          styles.santeBarFill,
          {
            backgroundColor: couleur,
            width: width.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] }),
          },
        ]}
      />
    </View>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────
export default function ParcellesCard() {
  const [parcelles, setParcelles] = useState<Parcelle[]>(PARCELLES_INIT);
  const [selectedId, setSelectedId] = useState<string>('p1');
  const [vue, setVue] = useState<'liste' | 'carte'>('liste');
  const [flash, setFlash] = useState(false);
  const slideAnim = useRef(new Animated.Value(0)).current;

  const selected = parcelles.find((p) => p.id === selectedId)!;

  // Live simulation
  useEffect(() => {
    const interval = setInterval(() => {
      setParcelles((prev) =>
        prev.map((p) => {
          const newHum = fluctuate(p.capteur.humidite, 1.5, 30, 95);
          const newTemp = fluctuate(p.capteur.temperature, 0.3, 20, 40);
          const newPh = Math.round(fluctuate(p.capteur.ph, 0.05, 4.5, 8.5) * 100) / 100;
          const newSante = Math.round(fluctuate(p.sante, 1, 40, 100));
          const statut: 'ok' | 'warning' | 'critical' =
            newHum < 45 || newTemp > 33 ? (newHum < 38 || newTemp > 36 ? 'critical' : 'warning') : 'ok';
          return {
            ...p,
            sante: newSante,
            capteur: { humidite: Math.round(newHum), temperature: Math.round(newTemp * 10) / 10, ph: newPh, statut },
          };
        })
      );
      setFlash(true);
      setTimeout(() => setFlash(false), 400);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Slide animation on vue change
  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: vue === 'liste' ? 0 : 1,
      useNativeDriver: false,
    }).start();
  }, [vue]);

  const totalSurface = parcelles.reduce((s, p) => s + p.surface, 0);
  const avgSante = Math.round(parcelles.reduce((s, p) => s + p.sante, 0) / parcelles.length);
  const alertCount = parcelles.filter((p) => p.capteur.statut !== 'ok').length;

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.iconBadge}>
            <Ionicons name="map" size={16} color="#fff" />
          </View>
          <View>
            <Text style={styles.title}>Mes Parcelles</Text>
            <View style={styles.liveBadge}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>LIVE IoT</Text>
            </View>
          </View>
        </View>
        <View style={styles.headerStats}>
          <Text style={styles.headerStatVal}>{totalSurface.toFixed(1)} ha</Text>
          <Text style={styles.headerStatLabel}>Surface totale</Text>
        </View>
      </View>

      {/* Summary chips */}
      <View style={styles.summaryRow}>
        <View style={styles.summaryChip}>
          <Ionicons name="leaf-outline" size={14} color="#4ade80" />
          <Text style={styles.summaryVal}>{parcelles.length}</Text>
          <Text style={styles.summaryLabel}>Parcelles</Text>
        </View>
        <View style={styles.summaryChip}>
          <Ionicons name="heart-outline" size={14} color="#4ade80" />
          <Text style={styles.summaryVal}>{avgSante}%</Text>
          <Text style={styles.summaryLabel}>Santé moy.</Text>
        </View>
        <View style={[styles.summaryChip, alertCount > 0 && styles.summaryChipAlert]}>
          <Ionicons name="warning-outline" size={14} color={alertCount > 0 ? '#fbbf24' : '#4ade80'} />
          <Text style={[styles.summaryVal, alertCount > 0 && { color: '#fbbf24' }]}>{alertCount}</Text>
          <Text style={styles.summaryLabel}>Alertes</Text>
        </View>
      </View>

      {/* Toggle vue */}
      <View style={styles.toggleRow}>
        <TouchableOpacity
          style={[styles.toggleBtn, vue === 'liste' && styles.toggleActive]}
          onPress={() => setVue('liste')}
        >
          <Ionicons name="list" size={14} color={vue === 'liste' ? '#fff' : '#6b7280'} />
          <Text style={[styles.toggleText, vue === 'liste' && styles.toggleTextActive]}>Liste</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleBtn, vue === 'carte' && styles.toggleActive]}
          onPress={() => setVue('carte')}
        >
          <Ionicons name="map-outline" size={14} color={vue === 'carte' ? '#fff' : '#6b7280'} />
          <Text style={[styles.toggleText, vue === 'carte' && styles.toggleTextActive]}>Carte</Text>
        </TouchableOpacity>
      </View>

      {/* Vue Carte */}
      {vue === 'carte' && (
        <View>
          <View style={styles.miniMap}>
            <View style={styles.miniMapGrid} />
            {parcelles.map((p) => (
              <MapDot
                key={p.id}
                parcelle={p}
                selected={selectedId === p.id}
                onPress={() => setSelectedId(p.id)}
              />
            ))}
            <Text style={styles.miniMapLabel}>🛰️ Vue satellite simulée</Text>
          </View>

          {/* Detail card selected */}
          <View style={[styles.detailCard, { borderLeftColor: selected.couleur }]}>
            <View style={styles.detailHeader}>
              <View style={[styles.detailIcon, { backgroundColor: selected.couleur + '30' }]}>
                <Ionicons name={selected.icon as any} size={18} color={selected.couleur} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.detailNom}>{selected.nom}</Text>
                <Text style={styles.detailCulture}>
                  {selected.culture} · {selected.stade} · {selected.surface} ha
                </Text>
              </View>
              <View style={[styles.statutBadge, { backgroundColor: getStatutColor(selected.capteur.statut) + '20' }]}>
                <Text style={[styles.statutText, { color: getStatutColor(selected.capteur.statut) }]}>
                  {getStatutLabel(selected.capteur.statut)}
                </Text>
              </View>
            </View>

            <View style={styles.metricsRow}>
              <MetricChip icon="water" value={`${selected.capteur.humidite}%`} label="Humidité" flash={flash} />
              <MetricChip icon="thermometer" value={`${selected.capteur.temperature}°`} label="Temp." flash={flash} />
              <MetricChip icon="flask" value={`pH ${selected.capteur.ph}`} label="Sol" flash={flash} />
            </View>

            <View style={styles.santeRow}>
              <Text style={styles.santeLabel}>Santé</Text>
              <SanteBar sante={selected.sante} couleur={getSanteColor(selected.sante)} />
              <Text style={[styles.santeScore, { color: getSanteColor(selected.sante) }]}>{selected.sante}%</Text>
            </View>

            <View style={styles.tacheRow}>
              <Ionicons name="time-outline" size={12} color="#9ca3af" />
              <Text style={styles.tacheText}>{selected.prochaineTache}</Text>
            </View>
          </View>
        </View>
      )}

      {/* Vue Liste */}
      {vue === 'liste' && (
        <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 340 }}>
          {parcelles.map((p, idx) => (
            <TouchableOpacity
              key={p.id}
              style={[
                styles.parcelleItem,
                selectedId === p.id && styles.parcelleItemSelected,
                { borderLeftColor: p.couleur, borderLeftWidth: 3 },
              ]}
              onPress={() => setSelectedId(p.id)}
              activeOpacity={0.85}
            >
              {/* Top row */}
              <View style={styles.itemTopRow}>
                <View style={styles.itemLeft}>
                  <View style={[styles.itemIconBadge, { backgroundColor: p.couleur + '25' }]}>
                    <Ionicons name={p.icon as any} size={15} color={p.couleur} />
                  </View>
                  <View>
                    <Text style={styles.itemNom}>{p.nom}</Text>
                    <Text style={styles.itemSub}>
                      {p.culture} · {p.stade} · {p.surface} ha
                    </Text>
                  </View>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <View style={[styles.statutBadge, { backgroundColor: getStatutColor(p.capteur.statut) + '20' }]}>
                    <Text style={[styles.statutText, { color: getStatutColor(p.capteur.statut) }]}>
                      {getStatutLabel(p.capteur.statut)}
                    </Text>
                  </View>
                  <Text style={styles.rendement}>↑ {p.rendementPrevu} t/ha prévu</Text>
                </View>
              </View>

              {/* Sante bar */}
              <View style={styles.santeRow}>
                <Text style={styles.santeLabel}>Santé</Text>
                <SanteBar sante={p.sante} couleur={getSanteColor(p.sante)} />
                <Text style={[styles.santeScore, { color: getSanteColor(p.sante) }]}>{p.sante}%</Text>
              </View>

              {/* Metrics */}
              <View style={styles.metricsRow}>
                <MetricChip icon="water" value={`${p.capteur.humidite}%`} label="Hum." flash={flash && selectedId === p.id} />
                <MetricChip icon="thermometer" value={`${p.capteur.temperature}°`} label="Temp." flash={flash && selectedId === p.id} />
                <MetricChip icon="flask" value={`pH ${p.capteur.ph}`} label="Sol" flash={flash && selectedId === p.id} />
              </View>

              {/* Tache */}
              <View style={styles.tacheRow}>
                <Ionicons name="checkmark-circle-outline" size={12} color="#6b7280" />
                <Text style={styles.tacheText}>{p.prochaineTache}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* IA Conseil */}
      <View style={styles.iaBox}>
        <Ionicons name="sparkles" size={14} color="#4ade80" />
        <Text style={styles.iaText}>
          {alertCount > 0
            ? `⚠️ ${alertCount} parcelle(s) nécessitent votre attention. Vérifiez l'humidité et la température.`
            : `✅ Toutes vos parcelles sont en bonne santé. Rendement global estimé à ${parcelles.reduce((s, p) => s + p.rendementPrevu * p.surface, 0).toFixed(1)} tonnes.`}
        </Text>
      </View>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  card: {
    backgroundColor: '#0f172a',
    borderRadius: 20,
    padding: 16,
    margin: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },

  // Header
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconBadge: { backgroundColor: '#16a34a', borderRadius: 10, padding: 8 },
  title: { color: '#f1f5f9', fontSize: 16, fontWeight: '700' },
  liveBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  liveDot: {
    width: 6, height: 6, borderRadius: 3, backgroundColor: '#4ade80',
    // pulsing via static for RN (no CSS animation)
  },
  liveText: { color: '#4ade80', fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  headerStats: { alignItems: 'flex-end' },
  headerStatVal: { color: '#4ade80', fontSize: 18, fontWeight: '800' },
  headerStatLabel: { color: '#6b7280', fontSize: 10 },

  // Summary
  summaryRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  summaryChip: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#1e293b', borderRadius: 10, padding: 8,
  },
  summaryChipAlert: { backgroundColor: '#78350f20', borderWidth: 1, borderColor: '#f59e0b40' },
  summaryVal: { color: '#f1f5f9', fontSize: 13, fontWeight: '700' },
  summaryLabel: { color: '#6b7280', fontSize: 10 },

  // Toggle
  toggleRow: {
    flexDirection: 'row', backgroundColor: '#1e293b',
    borderRadius: 10, padding: 3, marginBottom: 12, gap: 3,
  },
  toggleBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 6, borderRadius: 8 },
  toggleActive: { backgroundColor: '#16a34a' },
  toggleText: { color: '#6b7280', fontSize: 12, fontWeight: '600' },
  toggleTextActive: { color: '#fff' },

  // Mini map
  miniMap: {
    height: 160, backgroundColor: '#1a2e1a', borderRadius: 14,
    marginBottom: 12, overflow: 'hidden', position: 'relative',
    borderWidth: 1, borderColor: '#166534',
  },
  miniMapGrid: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    opacity: 0.15,
  },
  miniMapLabel: { position: 'absolute', bottom: 6, right: 8, color: '#4ade80', fontSize: 9, opacity: 0.7 },
  mapDotWrapper: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  mapDotRing: {
    position: 'absolute', width: 24, height: 24, borderRadius: 12,
    borderWidth: 2,
  },
  mapDot: { shadowColor: '#000', shadowOpacity: 0.5, shadowRadius: 4, elevation: 4 },
  mapLabel: {
    position: 'absolute', top: -18, paddingHorizontal: 5, paddingVertical: 1,
    borderRadius: 4,
  },
  mapLabelText: { color: '#fff', fontSize: 9, fontWeight: '700' },

  // Detail card (carte view)
  detailCard: {
    backgroundColor: '#1e293b', borderRadius: 14, padding: 12,
    marginBottom: 12, borderLeftWidth: 3,
  },
  detailHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  detailIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  detailNom: { color: '#f1f5f9', fontSize: 14, fontWeight: '700' },
  detailCulture: { color: '#6b7280', fontSize: 11, marginTop: 1 },

  // Parcelle list item
  parcelleItem: {
    backgroundColor: '#1e293b', borderRadius: 14, padding: 12,
    marginBottom: 10,
  },
  parcelleItemSelected: { backgroundColor: '#1a2f1a', borderWidth: 1, borderColor: '#22c55e40' },
  itemTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  itemLeft: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  itemIconBadge: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  itemNom: { color: '#f1f5f9', fontSize: 13, fontWeight: '700' },
  itemSub: { color: '#6b7280', fontSize: 10, marginTop: 1 },
  rendement: { color: '#4ade80', fontSize: 10, marginTop: 4 },

  // Statut badge
  statutBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  statutText: { fontSize: 10, fontWeight: '700' },

  // Sante bar
  santeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  santeLabel: { color: '#6b7280', fontSize: 10, width: 35 },
  santeBarBg: { flex: 1, height: 5, backgroundColor: '#334155', borderRadius: 3, overflow: 'hidden' },
  santeBarFill: { height: '100%', borderRadius: 3 },
  santeScore: { fontSize: 11, fontWeight: '700', width: 32, textAlign: 'right' },

  // Metrics row
  metricsRow: { flexDirection: 'row', gap: 6, marginBottom: 8 },
  metricChip: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#0f172a', borderRadius: 8, paddingHorizontal: 7, paddingVertical: 5,
  },
  metricValue: { color: '#f1f5f9', fontSize: 11, fontWeight: '700' },
  metricLabel: { color: '#6b7280', fontSize: 9 },

  // Tache
  tacheRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  tacheText: { color: '#94a3b8', fontSize: 10 },

  // IA box
  iaBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    backgroundColor: '#0d2218', borderRadius: 10, padding: 10,
    borderLeftWidth: 2, borderLeftColor: '#22c55e', marginTop: 4,
  },
  iaText: { color: '#86efac', fontSize: 11, flex: 1, lineHeight: 16 },
});