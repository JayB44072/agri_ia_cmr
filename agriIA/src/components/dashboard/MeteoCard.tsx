import React, { useRef, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius } from '@/constants/theme';
import { useColorScheme } from 'react-native';
import { METEO } from '@/components/data/mockData';
import Card from '@/components/ui/Card';

const G = Colors.splash.green;

// ── Simulation live ────────────────────────────────────────────────────────────
function fluctuate(base: number, delta: number, dec = 1): number {
  return parseFloat((base + (Math.random() * 2 - 1) * delta).toFixed(dec));
}

interface LiveMeteo {
  temperature: number; ressentie: number; humidite: number;
  vent: number; pluieProbabilite: number; visibilite: number; uvIndex: number;
}

function useLiveMeteo(interval = 3000): LiveMeteo {
  const [live, setLive] = useState<LiveMeteo>({
    temperature: METEO.temperature, ressentie: METEO.ressentie,
    humidite: METEO.humidite, vent: METEO.vent,
    pluieProbabilite: METEO.pluieProbabilite,
    visibilite: METEO.visibilite, uvIndex: METEO.uvIndex,
  });
  useEffect(() => {
    const id = setInterval(() => {
      setLive({
        temperature:      fluctuate(METEO.temperature,      0.4, 1),
        ressentie:        fluctuate(METEO.ressentie,        0.5, 1),
        humidite:         Math.round(fluctuate(METEO.humidite,         1.5, 0)),
        vent:             Math.round(fluctuate(METEO.vent,             1.0, 0)),
        pluieProbabilite: Math.round(fluctuate(METEO.pluieProbabilite, 2.0, 0)),
        visibilite:       fluctuate(METEO.visibilite,       0.3, 1),
        uvIndex:          METEO.uvIndex,
      });
    }, interval);
    return () => clearInterval(id);
  }, [interval]);
  return live;
}

// ── Flash animation à chaque changement de valeur ─────────────────────────────
function useFlash(value: number | string): Animated.Value {
  const anim = useRef(new Animated.Value(1)).current;
  const prev = useRef(value);
  useEffect(() => {
    if (prev.current !== value) {
      prev.current = value;
      Animated.sequence([
        Animated.timing(anim, { toValue: 0.25, duration: 120, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 1,    duration: 280, useNativeDriver: true }),
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

// ── Icône météo Ionicons ──────────────────────────────────────────────────────
function getMeteoIcon(icone: string): keyof typeof Ionicons.glyphMap {
  const MAP: Record<string, keyof typeof Ionicons.glyphMap> = {
    'sunny-outline':        'sunny-outline',
    'partly-sunny-outline': 'partly-sunny-outline',
    'rainy-outline':        'rainy-outline',
    'cloud-outline':        'cloud-outline',
    'thunderstorm-outline': 'thunderstorm-outline',
  };
  return MAP[icone] ?? 'partly-sunny-outline';
}

function getUVColor(uv: number): string {
  if (uv <= 2) return '#27ae60';
  if (uv <= 5) return '#f5a623';
  if (uv <= 7) return '#e67e22';
  return '#e74c3c';
}
function getUVLabel(uv: number): string {
  if (uv <= 2) return 'Faible';
  if (uv <= 5) return 'Modéré';
  if (uv <= 7) return 'Élevé';
  return 'Très élevé';
}

// ── StatItem ──────────────────────────────────────────────────────────────────
function StatItem({ icon, value, label, color, sub }: {
  icon: keyof typeof Ionicons.glyphMap;
  value: number | string; label: string; color?: string; sub?: string;
}): React.JSX.Element {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  return (
    <View style={si.item}>
      <View style={[si.iconBox, { backgroundColor: `${color ?? G}18` }]}>
        <Ionicons name={icon} size={17} color={color ?? G} />
      </View>
      <LiveValue value={value} style={[si.val, { color: colors.text }]} />
      {sub && <Text style={[si.sub, { color: color ?? G }]}>{sub}</Text>}
      <Text style={[si.lbl, { color: colors.textSecondary }]}>{label}</Text>
    </View>
  );
}
const si = StyleSheet.create({
  item:    { flex: 1, alignItems: 'center', gap: 3 },
  iconBox: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  val:     { fontSize: 13, fontWeight: '800' },
  sub:     { fontSize: 9,  fontWeight: '700', marginTop: -2 },
  lbl:     { fontSize: 10, textAlign: 'center' },
});

// ── PrevisionItem ─────────────────────────────────────────────────────────────
function PrevisionItem({ jour, min, max, icone, pluie, isToday }: {
  jour: string; min: number; max: number;
  icone: string; pluie: number; isToday?: boolean;
}): React.JSX.Element {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const pluieColor = pluie >= 60 ? '#3498db' : pluie >= 30 ? '#f5a623' : '#27ae60';
  return (
    <View style={[
      pv.item,
      { backgroundColor: isToday ? `${G}15` : colors.backgroundElement },
      isToday && { borderWidth: 1.5, borderColor: G },
    ]}>
      <Text style={[pv.jour, { color: isToday ? G : colors.textSecondary, fontWeight: isToday ? '800' : '600' }]}>
        {isToday ? 'Auj.' : jour}
      </Text>
      <Ionicons name={getMeteoIcon(icone)} size={22} color={isToday ? G : colors.textSecondary} />
      <Text style={[pv.max, { color: colors.text }]}>{max}°</Text>
      <Text style={[pv.min, { color: colors.textSecondary }]}>{min}°</Text>
      <View style={pv.pluieRow}>
        <Ionicons name="water-outline" size={9} color={pluieColor} />
        <Text style={[pv.pluiePct, { color: pluieColor }]}>{pluie}%</Text>
      </View>
    </View>
  );
}
const pv = StyleSheet.create({
  item:     { alignItems: 'center', borderRadius: Radius.lg, paddingHorizontal: 10, paddingVertical: 11, marginRight: 8, minWidth: 66, gap: 4 },
  jour:     { fontSize: 11 },
  max:      { fontSize: 14, fontWeight: '800' },
  min:      { fontSize: 11 },
  pluieRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  pluiePct: { fontSize: 9, fontWeight: '600' },
});

// ── Composant principal ───────────────────────────────────────────────────────
export default function MeteoCard(): React.JSX.Element {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const live   = useLiveMeteo(3000);

  // Animation d'entrée
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(12)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();
  }, []);

  const uvColor = getUVColor(live.uvIndex);

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
      <Card style={s.card}>

        {/* ── En-tête ── */}
        <View style={s.topRow}>
          <View style={s.topLeft}>
            {/* Ville + badge LIVE */}
            <View style={s.villeRow}>
              <Ionicons name="location-outline" size={13} color={G} />
              <Text style={[s.ville, { color: colors.text }]}>{METEO.ville}</Text>
              <View style={s.livePill}>
                <View style={s.liveDot} />
                <Text style={s.liveText}>LIVE</Text>
              </View>
            </View>

            {/* Condition */}
            <View style={s.conditionRow}>
              <Ionicons name={getMeteoIcon(METEO.icone)} size={13} color={colors.textSecondary} />
              <Text style={[s.condition, { color: colors.textSecondary }]}>{METEO.condition}</Text>
            </View>

            {/* Barre probabilité pluie */}
            <View style={s.pluieRow}>
              <Ionicons name="rainy-outline" size={12} color="#3498db" />
              <Text style={s.pluieLabel}>Pluie</Text>
              <View style={[s.pluieBarBg, { backgroundColor: colors.backgroundElement }]}>
                <View style={[s.pluieBarFill, { width: `${live.pluieProbabilite}%` as any }]} />
              </View>
              <LiveValue value={live.pluieProbabilite} suffix="%" style={s.pluiePct} />
            </View>
          </View>

          {/* Température principale */}
          <View style={s.tempBlock}>
            <View style={[s.tempCircle, { backgroundColor: `${G}14` }]}>
              <Ionicons name={getMeteoIcon(METEO.icone)} size={34} color={G} />
            </View>
            <LiveValue value={live.temperature} suffix="°C" style={[s.temp, { color: colors.text }]} />
            <Text style={[s.ressenti, { color: colors.textSecondary }]}>
              Ressenti{' '}
              <Text style={{ fontWeight: '700', color: '#f5a623' }}>{live.ressentie}°</Text>
            </Text>
          </View>
        </View>

        <View style={[s.separator, { backgroundColor: colors.cardBorder }]} />

        {/* ── 4 métriques live ── */}
        <View style={s.statsRow}>
          <StatItem icon="water-outline"       value={`${live.humidite}%`}     label="Humidité"  color="#3498db" />
          <View style={[s.divider, { backgroundColor: colors.cardBorder }]} />
          <StatItem icon="speedometer-outline" value={`${live.vent} km/h`}     label="Vent"      color="#9b59b6" />
          <View style={[s.divider, { backgroundColor: colors.cardBorder }]} />
          <StatItem icon="eye-outline"         value={`${live.visibilite}km`}  label="Visibilité" color="#3498db" />
          <View style={[s.divider, { backgroundColor: colors.cardBorder }]} />
          <StatItem icon="sunny-outline"       value={`UV ${live.uvIndex}`}    label="Indice UV" color={uvColor} sub={getUVLabel(live.uvIndex)} />
        </View>

        <View style={[s.separator, { backgroundColor: colors.cardBorder }]} />

        {/* ── Prévisions 5 jours ── */}
        <Text style={[s.prevTitle, { color: colors.textSecondary }]}>PRÉVISIONS 5 JOURS</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.prevContent}
        >
          <PrevisionItem
            jour="Auj."
            min={METEO.temperature - 5}
            max={METEO.temperature}
            icone={METEO.icone}
            pluie={live.pluieProbabilite}
            isToday
          />
          {METEO.previsions.map((p) => (
            <PrevisionItem
              key={p.jour}
              jour={p.jour}
              min={p.min}
              max={p.max}
              icone={p.icone}
              pluie={p.pluie}
            />
          ))}
        </ScrollView>

        {/* ── Conseil IA dynamique ── */}
        <View style={[s.iaBox, { backgroundColor: `${G}10` }]}>
          <View style={s.iaRow}>
            <Ionicons name="analytics-outline" size={13} color={G} />
            <Text style={[s.iaTitle, { color: G }]}>Conseil IA</Text>
          </View>
          <Text style={[s.iaText, { color: colors.textSecondary }]}>
            {live.pluieProbabilite >= 50
              ? `Pluies probables (${live.pluieProbabilite}%) — reportez l'arrosage et les traitements.`
              : live.humidite < 62
              ? `Humidité faible (${live.humidite}%) — irriguez vos parcelles sensibles aujourd'hui.`
              : `Conditions favorables — bonne fenêtre pour semis et traitements préventifs.`}
          </Text>
        </View>

      </Card>
    </Animated.View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  card: { padding: 16 },

  topRow:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
  topLeft:     { flex: 1, gap: 7 },

  villeRow:    { flexDirection: 'row', alignItems: 'center', gap: 5 },
  ville:       { fontSize: 15, fontWeight: '800' },
  livePill:    { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: 'rgba(60,185,90,0.12)', borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2 },
  liveDot:     { width: 5, height: 5, borderRadius: 2.5, backgroundColor: G },
  liveText:    { fontSize: 9, fontWeight: '800', color: G, letterSpacing: 0.8 },

  conditionRow:{ flexDirection: 'row', alignItems: 'center', gap: 5 },
  condition:   { fontSize: 12 },

  pluieRow:    { flexDirection: 'row', alignItems: 'center', gap: 5 },
  pluieLabel:  { fontSize: 10, color: '#3498db', fontWeight: '600' },
  pluieBarBg:  { flex: 1, height: 5, borderRadius: 3, overflow: 'hidden', maxWidth: 80 },
  pluieBarFill:{ height: '100%', borderRadius: 3, backgroundColor: '#3498db' },
  pluiePct:    { fontSize: 11, fontWeight: '700', color: '#3498db', minWidth: 30 },

  tempBlock:   { alignItems: 'center', gap: 3 },
  tempCircle:  { width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center' },
  temp:        { fontSize: 30, fontWeight: '900' },
  ressenti:    { fontSize: 10 },

  separator:   { height: 1, marginVertical: 12 },
  divider:     { width: 1, alignSelf: 'stretch' },
  statsRow:    { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 4 },

  prevTitle:   { fontSize: 10, fontWeight: '700', letterSpacing: 1, marginBottom: 10 },
  prevContent: { paddingBottom: 4 },

  iaBox:   { borderRadius: Radius.md, padding: 10, marginTop: 12 },
  iaRow:   { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  iaTitle: { fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  iaText:  { fontSize: 12, lineHeight: 17 },
});