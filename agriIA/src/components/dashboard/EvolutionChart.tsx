import React, { useRef, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Animated, Dimensions, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius, useThemeColors } from '@/constants/theme';
import { EVOLUTION, EvolutionPoint } from '@/components/data/mockData';
import Card from '@/components/ui/Card';

const G = Colors.splash.green;
const { width: SCREEN_W } = Dimensions.get('window');
const CHART_W = SCREEN_W - 32 - 32 - 32; // marges card + padding
const CHART_H = 140;

// ── Couleurs par culture ──────────────────────────────────────────────────────
const CULTURE_CONFIG: Record<string, { color: string; icon: keyof typeof Ionicons.glyphMap; label: string }> = {
  maïs:   { color: '#f5a623', icon: 'leaf-outline',      label: 'Maïs'   },
  tomate: { color: '#e74c3c', icon: 'rose-outline',      label: 'Tomate' },
  manioc: { color: '#27ae60', icon: 'nutrition-outline', label: 'Manioc' },
};

// ── Simulation : dernier point live ──────────────────────────────────────────
function fluctuate(base: number, delta: number): number {
  return Math.round(Math.min(100, Math.max(0, base + (Math.random() * 2 - 1) * delta)));
}

function useLiveEvolution(interval = 5000): EvolutionPoint[] {
  const [data, setData] = useState<EvolutionPoint[]>(EVOLUTION);

  useEffect(() => {
    const id = setInterval(() => {
      setData(prev => {
        const last = prev[prev.length - 1];
        const updated = [...prev];
        updated[updated.length - 1] = {
          ...last,
          maïs:   fluctuate(last.maïs,   2),
          tomate: fluctuate(last.tomate, 2),
          manioc: fluctuate(last.manioc, 2),
        };
        return updated;
      });
    }, interval);
    return () => clearInterval(id);
  }, [interval]);

  return data;
}

// ── Génère les points SVG-like pour le path ───────────────────────────────────
function buildPath(points: number[], w: number, h: number, minV: number, maxV: number): string {
  if (points.length < 2) return '';
  const range = maxV - minV || 1;
  const xs = points.map((_, i) => (i / (points.length - 1)) * w);
  const ys = points.map(v => h - ((v - minV) / range) * (h - 10) - 5);

  // Courbe de Bézier lisse
  let d = `M ${xs[0]} ${ys[0]}`;
  for (let i = 1; i < points.length; i++) {
    const cpX = (xs[i - 1] + xs[i]) / 2;
    d += ` C ${cpX} ${ys[i - 1]}, ${cpX} ${ys[i]}, ${xs[i]} ${ys[i]}`;
  }
  return d;
}

// ── Composant Sparkline (mini courbe SVG via View) ────────────────────────────
// On simule le graphe avec des Views proportionnelles (pas de SVG natif)
function ChartLine({ data, culture, w, h, minV, maxV, animated: isAnim }: {
  data: EvolutionPoint[]; culture: string;
  w: number; h: number; minV: number; maxV: number; animated?: boolean;
}): React.JSX.Element {
  const { colors } = useThemeColors();
  const cfg    = CULTURE_CONFIG[culture];
  const values = data.map(d => (d as any)[culture] as number);
  const range  = maxV - minV || 1;

  const scaleAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(scaleAnim, {
      toValue: 1, duration: 800, useNativeDriver: false,
    }).start();
  }, []);

  return (
    <View style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}>
      {/* Barres verticales de chaque point */}
      {values.map((v, i) => {
        const barH   = ((v - minV) / range) * (h - 10);
        const x      = (i / (values.length - 1)) * w;
        const y      = h - barH - 5;

        return (
          <View key={i}>
            {/* Ligne verticale légère */}
            {i > 0 && (() => {
              const prev   = values[i - 1];
              const prevH  = ((prev - minV) / range) * (h - 10);
              const prevX  = ((i - 1) / (values.length - 1)) * w;
              const prevY  = h - prevH - 5;
              const lineH  = Math.abs(y - prevY);
              const lineW  = x - prevX;
              const angle  = Math.atan2(y - prevY, lineW) * (180 / Math.PI);
              const dist   = Math.sqrt(lineW * lineW + (y - prevY) * (y - prevY));

              return (
                <View
                  style={{
                    position: 'absolute',
                    left: prevX,
                    top: Math.min(prevY, y),
                    width: dist,
                    height: 2.5,
                    backgroundColor: cfg.color,
                    opacity: 0.9,
                    borderRadius: 2,
                    transform: [{ rotate: `${angle}deg` }, { translateX: 0 }],
                    transformOrigin: 'left center',
                  }}
                />
              );
            })()}
            {/* Point */}
            <View style={{
              position: 'absolute',
              left: x - 5,
              top: y - 5,
              width: 10, height: 10, borderRadius: 5,
              backgroundColor: cfg.color,
              borderWidth: 2, borderColor: colors.card ?? '#fff',
              shadowColor: cfg.color,
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.4,
              shadowRadius: 3,
              elevation: 3,
            }} />
          </View>
        );
      })}
    </View>
  );
}

// ── Légende culture ───────────────────────────────────────────────────────────
function CultureToggle({ culture, active, value, onPress }: {
  culture: string; active: boolean; value: number; onPress: () => void;
}): React.JSX.Element {
  const cfg = CULTURE_CONFIG[culture];
  return (
    <TouchableOpacity
      style={[ct.chip, active && { borderColor: cfg.color, backgroundColor: `${cfg.color}12` }]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <View style={[ct.dot, { backgroundColor: active ? cfg.color : '#ccc' }]} />
      <Ionicons name={cfg.icon} size={13} color={active ? cfg.color : '#aaa'} />
      <Text style={[ct.label, { color: active ? cfg.color : '#aaa' }]}>{cfg.label}</Text>
      <Text style={[ct.value, { color: active ? cfg.color : '#aaa' }]}>{value}%</Text>
    </TouchableOpacity>
  );
}
const ct = StyleSheet.create({
  chip:  { flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1.5, borderColor: 'rgba(0,0,0,0.1)', borderRadius: Radius.full, paddingHorizontal: 10, paddingVertical: 6 },
  dot:   { width: 6, height: 6, borderRadius: 3 },
  label: { fontSize: 11, fontWeight: '700' },
  value: { fontSize: 12, fontWeight: '900' },
});

// ── Composant principal ───────────────────────────────────────────────────────
export default function EvolutionChart(): React.JSX.Element {
  const { colors } = useThemeColors();
  const data   = useLiveEvolution(5000);

  const [activeCultures, setActiveCultures] = useState<Set<string>>(
    new Set(['maïs', 'tomate', 'manioc'])
  );

  const toggleCulture = (c: string) => {
    setActiveCultures(prev => {
      const next = new Set(prev);
      if (next.has(c) && next.size > 1) next.delete(c);
      else next.add(c);
      return next;
    });
  };

  const allValues = data.flatMap(d => [d.maïs, d.tomate, d.manioc]);
  const minV = Math.max(0,   Math.min(...allValues) - 10);
  const maxV = Math.min(100, Math.max(...allValues) + 10);

  // Grilles horizontales
  const gridLines = [0, 25, 50, 75, 100];

  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(12)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start();
  }, []);

  const lastPoint = data[data.length - 1];

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
      <Card style={s.card}>

        {/* ── En-tête ── */}
        <View style={s.header}>
          <View style={s.headerLeft}>
            <View style={[s.headerIcon, { backgroundColor: `${G}15` }]}>
              <Ionicons name="trending-up-outline" size={18} color={G} />
            </View>
            <View>
              <Text style={[s.headerTitle, { color: colors.text }]}>Évolution des cultures</Text>
              <Text style={[s.headerSub, { color: colors.textSecondary }]}>Indice santé · 5 derniers mois</Text>
            </View>
          </View>
          <View style={s.livePill}>
            <View style={s.liveDot} />
            <Text style={s.liveText}>LIVE</Text>
          </View>
        </View>

        {/* ── Toggles cultures ── */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.togglesScroll}>
          <View style={s.togglesRow}>
            {Object.keys(CULTURE_CONFIG).map(c => (
              <CultureToggle
                key={c}
                culture={c}
                active={activeCultures.has(c)}
                value={(lastPoint as any)[c]}
                onPress={() => toggleCulture(c)}
              />
            ))}
          </View>
        </ScrollView>

        {/* ── Zone graphe ── */}
        <View style={s.chartWrapper}>
          {/* Axe Y avec labels */}
          <View style={s.yAxis}>
            {[100, 75, 50, 25, 0].map(v => (
              <Text key={v} style={[s.yLabel, { color: colors.textSecondary }]}>{v}</Text>
            ))}
          </View>

          {/* Graphe */}
          <View style={[s.chart, { height: CHART_H }]}>
            {/* Lignes de grille */}
            {gridLines.map(v => (
              <View
                key={v}
                style={[s.gridLine, {
                  bottom: ((v - 0) / 100) * (CHART_H - 10) + 5 - 0.5,
                  backgroundColor: colors.cardBorder,
                }]}
              />
            ))}

            {/* Courbes */}
            {Object.keys(CULTURE_CONFIG).map(c =>
              activeCultures.has(c) ? (
                <ChartLine
                  key={c}
                  data={data}
                  culture={c}
                  w={CHART_W - 40}
                  h={CHART_H}
                  minV={minV}
                  maxV={maxV}
                />
              ) : null
            )}

            {/* Labels mois en bas */}
            <View style={s.xAxis}>
              {data.map((d, i) => (
                <Text
                  key={d.mois}
                  style={[
                    s.xLabel,
                    { color: i === data.length - 1 ? G : colors.textSecondary },
                    i === data.length - 1 && { fontWeight: '800' },
                  ]}
                >
                  {i === data.length - 1 ? '▸ ' + d.mois : d.mois}
                </Text>
              ))}
            </View>
          </View>
        </View>

        {/* ── Résumé tendances ── */}
        <View style={[s.separator, { backgroundColor: colors.cardBorder }]} />
        <View style={s.trendsRow}>
          {Object.keys(CULTURE_CONFIG).map(c => {
            const cfg    = CULTURE_CONFIG[c];
            const vals   = data.map(d => (d as any)[c] as number);
            const first  = vals[0];
            const last2  = vals[vals.length - 1];
            const diff   = last2 - first;
            const isUp   = diff >= 0;
            return (
              <View key={c} style={s.trendItem}>
                <Ionicons
                  name={isUp ? 'trending-up-outline' : 'trending-down-outline'}
                  size={14}
                  color={isUp ? '#27ae60' : '#e74c3c'}
                />
                <Text style={[s.trendLabel, { color: colors.textSecondary }]}>{cfg.label}</Text>
                <Text style={[s.trendVal, { color: isUp ? '#27ae60' : '#e74c3c' }]}>
                  {isUp ? '+' : ''}{diff}pts
                </Text>
              </View>
            );
          })}
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

  togglesScroll: { marginBottom: 14 },
  togglesRow:    { flexDirection: 'row', gap: 8, paddingBottom: 2 },

  chartWrapper: { flexDirection: 'row', gap: 4, marginBottom: 8 },
  yAxis:        { width: 26, justifyContent: 'space-between', alignItems: 'flex-end', paddingBottom: 20, paddingTop: 4 },
  yLabel:       { fontSize: 9 },

  chart:     { flex: 1, position: 'relative' },
  gridLine:  { position: 'absolute', left: 0, right: 0, height: 1 },

  xAxis:   { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-between' },
  xLabel:  { fontSize: 9, textAlign: 'center' },

  separator: { height: 1, marginVertical: 12 },

  trendsRow: { flexDirection: 'row', justifyContent: 'space-around' },
  trendItem: { alignItems: 'center', gap: 3 },
  trendLabel:{ fontSize: 10 },
  trendVal:  { fontSize: 12, fontWeight: '800' },
});