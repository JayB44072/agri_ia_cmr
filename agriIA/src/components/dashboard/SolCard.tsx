import React, { useRef, useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius } from '@/constants/theme';
import { useColorScheme } from 'react-native';
import { DONNEES_SOL } from '@/components/data/mockData';
import Card from '@/components/ui/Card';

const G = Colors.splash.green;

// ── Simulation live sol ───────────────────────────────────────────────────────
function fluctuate(base: number, delta: number, dec = 1): number {
  return parseFloat((base + (Math.random() * 2 - 1) * delta).toFixed(dec));
}

interface LiveSol {
  ph: number; humidite: number; temperature: number;
  azote: number; phosphore: number; potassium: number;
  conductivite: number; matiereOrganique: number;
}

function useLiveSol(interval = 4000): LiveSol {
  const [live, setLive] = useState<LiveSol>({ ...DONNEES_SOL });
  useEffect(() => {
    const id = setInterval(() => {
      setLive({
        ph:               fluctuate(DONNEES_SOL.ph,               0.05, 1),
        humidite:         Math.round(fluctuate(DONNEES_SOL.humidite,         1.5, 0)),
        temperature:      fluctuate(DONNEES_SOL.temperature,      0.3,  1),
        azote:            Math.round(fluctuate(DONNEES_SOL.azote,            1.0, 0)),
        phosphore:        Math.round(fluctuate(DONNEES_SOL.phosphore,        0.8, 0)),
        potassium:        Math.round(fluctuate(DONNEES_SOL.potassium,        1.2, 0)),
        conductivite:     fluctuate(DONNEES_SOL.conductivite,     0.05, 2),
        matiereOrganique: fluctuate(DONNEES_SOL.matiereOrganique, 0.05, 1),
      });
    }, interval);
    return () => clearInterval(id);
  }, [interval]);
  return live;
}

// ── Flash animation ───────────────────────────────────────────────────────────
function useFlash(value: number | string): Animated.Value {
  const anim = useRef(new Animated.Value(1)).current;
  const prev = useRef(value);
  useEffect(() => {
    if (prev.current !== value) {
      prev.current = value;
      Animated.sequence([
        Animated.timing(anim, { toValue: 0.2, duration: 120, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 1,   duration: 300, useNativeDriver: true }),
      ]).start();
    }
  }, [value]);
  return anim;
}

function LiveValue({ value, style, suffix }: {
  value: number | string; style: object; suffix?: string;
}): React.JSX.Element {
  const opacity = useFlash(value);
  return (
    <Animated.Text style={[style, { opacity }]}>
      {value}{suffix ?? ''}
    </Animated.Text>
  );
}

// ── Barre de progression animée ───────────────────────────────────────────────
function AnimatedBar({ value, max, color }: {
  value: number; max: number; color: string;
}): React.JSX.Element {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const widthAnim = useRef(new Animated.Value((value / max) * 100)).current;

  useEffect(() => {
    Animated.timing(widthAnim, {
      toValue: Math.min((value / max) * 100, 100),
      duration: 600,
      useNativeDriver: false,
    }).start();
  }, [value]);

  const widthInterpolated = widthAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={[bar.bg, { backgroundColor: colors.backgroundElement }]}>
      <Animated.View style={[bar.fill, { width: widthInterpolated, backgroundColor: color }]} />
    </View>
  );
}
const bar = StyleSheet.create({
  bg:   { height: 5, borderRadius: 3, overflow: 'hidden', marginVertical: 6 },
  fill: { height: '100%', borderRadius: 3 },
});

// ── Statut de la valeur (optimal / attention / critique) ─────────────────────
function getStatus(value: number, optimal: [number, number]): 'optimal' | 'warning' | 'danger' {
  const [min, max] = optimal;
  if (value >= min && value <= max) return 'optimal';
  const range = max - min;
  if (value >= min - range * 0.3 && value <= max + range * 0.3) return 'warning';
  return 'danger';
}

const STATUS_COLORS = {
  optimal: '#27ae60',
  warning: '#f5a623',
  danger:  '#e74c3c',
};
const STATUS_LABELS = {
  optimal: 'Optimal',
  warning: 'Attention',
  danger:  'Critique',
};

// ── MetricCard ────────────────────────────────────────────────────────────────
function MetricCard({ label, value, unit, icon, color, max, optimal }: {
  label: string; value: number; unit: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string; max: number; optimal: [number, number];
}): React.JSX.Element {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const status = getStatus(value, optimal);
  const statusColor = STATUS_COLORS[status];

  return (
    <View style={[mc.card, { backgroundColor: colors.backgroundElement }]}>
      {/* En-tête : icône + statut */}
      <View style={mc.topRow}>
        <View style={[mc.iconBox, { backgroundColor: `${color}18` }]}>
          <Ionicons name={icon} size={16} color={color} />
        </View>
        <View style={[mc.statusBadge, { backgroundColor: `${statusColor}18` }]}>
          <View style={[mc.statusDot, { backgroundColor: statusColor }]} />
          <Text style={[mc.statusText, { color: statusColor }]}>{STATUS_LABELS[status]}</Text>
        </View>
      </View>

      {/* Valeur live */}
      <View style={mc.valueRow}>
        <LiveValue
          value={value}
          suffix={unit}
          style={[mc.value, { color: colors.text }]}
        />
      </View>

      {/* Barre animée */}
      <AnimatedBar value={value} max={max} color={color} />

      {/* Label + plage optimale */}
      <Text style={[mc.label, { color: colors.textSecondary }]}>{label}</Text>
      <Text style={[mc.optimal, { color: colors.textSecondary }]}>
        Optimal : {optimal[0]}–{optimal[1]}{unit}
      </Text>
    </View>
  );
}
const mc = StyleSheet.create({
  card:        { width: '47%', borderRadius: Radius.lg, padding: 10, gap: 2 },
  topRow:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  iconBox:     { width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  statusDot:   { width: 5, height: 5, borderRadius: 2.5 },
  statusText:  { fontSize: 9, fontWeight: '700' },
  valueRow:    { flexDirection: 'row', alignItems: 'baseline', gap: 2 },
  value:       { fontSize: 18, fontWeight: '900' },
  label:       { fontSize: 10, fontWeight: '600' },
  optimal:     { fontSize: 9, marginTop: 1 },
});

// ── Score santé global ────────────────────────────────────────────────────────
function ScoreGlobal({ sol }: { sol: LiveSol }): React.JSX.Element {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];

  // Score basé sur combien de métriques sont dans la plage optimale
  const checks = [
    getStatus(sol.ph,               [6.0, 7.0]) === 'optimal',
    getStatus(sol.humidite,         [60,  80])  === 'optimal',
    getStatus(sol.temperature,      [20,  30])  === 'optimal',
    getStatus(sol.azote,            [40,  60])  === 'optimal',
    getStatus(sol.phosphore,        [30,  50])  === 'optimal',
    getStatus(sol.potassium,        [50,  70])  === 'optimal',
  ];
  const score = Math.round((checks.filter(Boolean).length / checks.length) * 100);
  const scoreColor = score >= 80 ? '#27ae60' : score >= 60 ? '#f5a623' : '#e74c3c';
  const scoreLabel = score >= 80 ? 'Sol en bonne santé' : score >= 60 ? 'Sol à surveiller' : 'Sol en état critique';

  const scoreAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(scoreAnim, {
      toValue: score,
      duration: 800,
      useNativeDriver: false,
    }).start();
  }, [score]);

  const widthInterp = scoreAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={[sg.box, { backgroundColor: `${scoreColor}10`, borderColor: `${scoreColor}25` }]}>
      <View style={sg.left}>
        <Ionicons name="analytics-outline" size={16} color={scoreColor} />
        <View>
          <Text style={[sg.label, { color: scoreColor }]}>{scoreLabel}</Text>
          <Text style={[sg.sub, { color: colors.textSecondary }]}>
            {checks.filter(Boolean).length}/{checks.length} indicateurs optimaux
          </Text>
        </View>
      </View>
      <View style={sg.right}>
        <LiveValue value={score} suffix="%" style={[sg.score, { color: scoreColor }]} />
      </View>
    </View>
  );
}

// ── Petite métrique secondaire (conductivité, matière org.) ──────────────────
function MiniMetric({ icon, label, value, unit, color }: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string; value: number; unit: string; color: string;
}): React.JSX.Element {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  return (
    <View style={[mm.item, { backgroundColor: colors.backgroundElement }]}>
      <Ionicons name={icon} size={14} color={color} />
      <View style={mm.texts}>
        <LiveValue value={value} suffix={unit} style={[mm.val, { color: colors.text }]} />
        <Text style={[mm.lbl, { color: colors.textSecondary }]}>{label}</Text>
      </View>
    </View>
  );
}

const sg = StyleSheet.create({
  box:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: Radius.md, borderWidth: 1, padding: 12, marginBottom: 14 },
  left:  { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  label: { fontSize: 13, fontWeight: '700' },
  sub:   { fontSize: 10, marginTop: 1 },
  right: {},
  score: { fontSize: 22, fontWeight: '900' },
});

const mm = StyleSheet.create({
  item:  { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: Radius.md, padding: 10 },
  texts: { flex: 1 },
  val:   { fontSize: 14, fontWeight: '800' },
  lbl:   { fontSize: 9, marginTop: 1 },
});

// ── Composant principal ───────────────────────────────────────────────────────
export default function SolCard(): React.JSX.Element {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const live = useLiveSol(4000);

  // Animation d'entrée
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(12)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
      <Card style={s.card}>

        {/* ── En-tête avec badge LIVE ── */}
        <View style={s.header}>
          <View style={s.headerLeft}>
            <View style={[s.headerIcon, { backgroundColor: `${G}15` }]}>
              <Ionicons name="planet-outline" size={18} color={G} />
            </View>
            <View>
              <Text style={[s.headerTitle, { color: colors.text }]}>Capteurs Sol</Text>
              <Text style={[s.headerSub, { color: colors.textSecondary }]}>Mise à jour toutes les 4s</Text>
            </View>
          </View>
          <View style={s.livePill}>
            <View style={s.liveDot} />
            <Text style={s.liveText}>LIVE</Text>
          </View>
        </View>

        {/* ── Score santé global ── */}
        <ScoreGlobal sol={live} />

        {/* ── Grille 6 métriques principales ── */}
        <View style={s.grid}>
          <MetricCard label="pH du sol"      value={live.ph}          unit=""   icon="flask-outline"         color="#27ae60" max={14}  optimal={[6.0, 7.0]} />
          <MetricCard label="Humidité"        value={live.humidite}    unit="%"  icon="water-outline"         color="#3498db" max={100} optimal={[60, 80]}   />
          <MetricCard label="Température"     value={live.temperature} unit="°C" icon="thermometer-outline"   color="#f5a623" max={50}  optimal={[20, 30]}   />
          <MetricCard label="Azote (N)"       value={live.azote}       unit="%"  icon="leaf-outline"          color="#27ae60" max={100} optimal={[40, 60]}   />
          <MetricCard label="Phosphore (P)"   value={live.phosphore}   unit="%"  icon="cellular-outline"      color="#e74c3c" max={100} optimal={[30, 50]}   />
          <MetricCard label="Potassium (K)"   value={live.potassium}   unit="%"  icon="battery-charging-outline" color="#f39c12" max={100} optimal={[50, 70]} />
        </View>

        {/* ── 2 métriques secondaires ── */}
        <View style={s.miniRow}>
          <MiniMetric icon="pulse-outline"  label="Conductivité (mS/cm)" value={live.conductivite}     unit=" mS" color="#9b59b6" />
          <MiniMetric icon="earth-outline"  label="Matière organique"     value={live.matiereOrganique} unit="%"   color="#8B4513" />
        </View>

        {/* ── Conseil IA dynamique ── */}
        <View style={[s.iaBox, { backgroundColor: `${G}10` }]}>
          <View style={s.iaRow}>
            <Ionicons name="hardware-chip-outline" size={13} color={G} />
            <Text style={[s.iaTitle, { color: G }]}>Analyse IA — Sol</Text>
          </View>
          <Text style={[s.iaText, { color: colors.textSecondary }]}>
            {live.humidite < 60
              ? `⚠️ Humidité critique (${live.humidite}%) — irrigation urgente recommandée sur vos parcelles.`
              : live.ph < 5.8
              ? `⚠️ pH acide (${live.ph}) — envisagez un chaulage pour corriger l'acidité du sol.`
              : live.azote < 38
              ? `⚠️ Azote faible (${live.azote}%) — apport d'engrais azoté recommandé cette semaine.`
              : `✅ Sol globalement sain — pH ${live.ph}, humidité ${live.humidite}%. Conditions favorables à la croissance.`}
          </Text>
        </View>

      </Card>
    </Animated.View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  card: { padding: 16 },

  header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  headerLeft:  { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerIcon:  { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 14, fontWeight: '800' },
  headerSub:   { fontSize: 10, marginTop: 1 },
  livePill:    { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: 'rgba(60,185,90,0.12)', borderRadius: 8, paddingHorizontal: 7, paddingVertical: 3 },
  liveDot:     { width: 5, height: 5, borderRadius: 2.5, backgroundColor: G },
  liveText:    { fontSize: 9, fontWeight: '800', color: G, letterSpacing: 0.8 },

  grid:        { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 10 },

  miniRow:     { flexDirection: 'row', gap: 10, marginBottom: 12 },

  iaBox:   { borderRadius: Radius.md, padding: 10 },
  iaRow:   { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 5 },
  iaTitle: { fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  iaText:  { fontSize: 12, lineHeight: 17 },
});