import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Animated, ActivityIndicator, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, useThemeColors } from '@/constants/theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { callGemini } from '@/lib/gemini';
import { getUVColor, getUVLabel } from '@/lib/uv';
import LiveBadge from '@/components/ui/LiveBadge';

// ── Config APIs ───────────────────────────────────────────────────────────────
// OpenWeatherMap (gratuit 1000 req/jour) : https://openweathermap.org/api
const OWM_KEY = 'YOUR_OWM_KEY'; // Remplacez par votre clé OpenWeatherMap

// Coordonnées Yaoundé, Cameroun
const LAT = 3.848;
const LON = 11.502;
const VILLE = 'Yaoundé, CM';

// ── Types ─────────────────────────────────────────────────────────────────────
interface WeatherData {
  temp: number;
  tempRessentie: number;
  humidite: number;
  vent: number;
  visibilite: number;
  uv: number;
  pluie: number;
  condition: string;
  icon: string;
  soleil: string;
  coucher: string;
}

interface PrevisionJour {
  jour: string;
  min: number;
  max: number;
  pluie: number;
  condition: string;
  icon: string;
}

interface ConseilAgri {
  type: 'arrosage' | 'traitement' | 'recolte' | 'semis';
  titre: string;
  texte: string;
  emoji: string;
  couleur: string;
}

// ── Données de secours (offline) ──────────────────────────────────────────────
const METEO_FALLBACK: WeatherData = {
  temp: 27, tempRessentie: 30, humidite: 78, vent: 12,
  visibilite: 8.5, uv: 6, pluie: 35, condition: 'Partiellement nuageux',
  icon: 'partly-sunny-outline', soleil: '6:18', coucher: '18:22',
};

const PREVISIONS_FALLBACK: PrevisionJour[] = [
  { jour: 'Dem.', min: 20, max: 28, pluie: 45, condition: 'Pluie légère', icon: 'rainy-outline' },
  { jour: 'Mar.', min: 19, max: 27, pluie: 60, condition: 'Orages', icon: 'thunderstorm-outline' },
  { jour: 'Mer.', min: 21, max: 29, pluie: 20, condition: 'Nuageux', icon: 'cloud-outline' },
  { jour: 'Jeu.', min: 22, max: 30, pluie: 10, condition: 'Ensoleillé', icon: 'sunny-outline' },
  { jour: 'Ven.', min: 21, max: 29, pluie: 30, condition: 'Partiellement nuageux', icon: 'partly-sunny-outline' },
];

// ── Récupérer météo réelle ────────────────────────────────────────────────────
async function fetchMeteoReelle(): Promise<{ current: WeatherData; previsions: PrevisionJour[] }> {
  try {
    // Données en temps réel
    const [currentRes, forecastRes, uvRes] = await Promise.all([
      fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${LAT}&lon=${LON}&appid=${OWM_KEY}&units=metric&lang=fr`),
      fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${LAT}&lon=${LON}&appid=${OWM_KEY}&units=metric&lang=fr&cnt=40`),
      fetch(`https://api.openweathermap.org/data/2.5/uvi?lat=${LAT}&lon=${LON}&appid=${OWM_KEY}`),
    ]);

    if (!currentRes.ok) throw new Error('API unavailable');

    const curr = await currentRes.json();
    const forecast = await forecastRes.json();
    const uvi = await uvRes.json();

    // Mapper les icônes OWM → Ionicons
    function owmToIon(code: string): string {
      if (code.startsWith('01')) return 'sunny-outline';
      if (code.startsWith('02') || code.startsWith('03')) return 'partly-sunny-outline';
      if (code.startsWith('04')) return 'cloud-outline';
      if (code.startsWith('09') || code.startsWith('10')) return 'rainy-outline';
      if (code.startsWith('11')) return 'thunderstorm-outline';
      return 'partly-sunny-outline';
    }

    // Sunrise/Sunset
    const toHHMM = (ts: number) => {
      const d = new Date(ts * 1000);
      return `${d.getHours()}:${String(d.getMinutes()).padStart(2,'0')}`;
    };

    const current: WeatherData = {
      temp: Math.round(curr.main.temp),
      tempRessentie: Math.round(curr.main.feels_like),
      humidite: curr.main.humidity,
      vent: Math.round(curr.wind.speed * 3.6),
      visibilite: Math.round((curr.visibility ?? 10000) / 1000 * 10) / 10,
      uv: Math.round(uvi.value ?? 5),
      pluie: Math.round((curr.rain?.['1h'] ?? 0) * 100),
      condition: curr.weather[0]?.description ?? 'Inconnu',
      icon: owmToIon(curr.weather[0]?.icon ?? '01d'),
      soleil: toHHMM(curr.sys.sunrise),
      coucher: toHHMM(curr.sys.sunset),
    };

    // Prévisions 5 jours (1 par jour midi)
    const joursMap: Record<string, PrevisionJour> = {};
    const JOURS = ['Dim.', 'Lun.', 'Mar.', 'Mer.', 'Jeu.', 'Ven.', 'Sam.'];
    forecast.list?.forEach((item: any) => {
      const date = new Date(item.dt * 1000);
      const key = date.toDateString();
      if (!joursMap[key]) {
        joursMap[key] = {
          jour: JOURS[date.getDay()],
          min: Math.round(item.main.temp_min),
          max: Math.round(item.main.temp_max),
          pluie: Math.round((item.pop ?? 0) * 100),
          condition: item.weather[0]?.description ?? '',
          icon: owmToIon(item.weather[0]?.icon ?? '01d'),
        };
      } else {
        joursMap[key].min = Math.min(joursMap[key].min, Math.round(item.main.temp_min));
        joursMap[key].max = Math.max(joursMap[key].max, Math.round(item.main.temp_max));
      }
    });

    const previsions = Object.values(joursMap).slice(1, 6);
    return { current, previsions };
  } catch {
    return { current: METEO_FALLBACK, previsions: PREVISIONS_FALLBACK };
  }
}

// ── Conseils agricoles via Gemini ─────────────────────────────────────────────
async function getConseilsAgricoles(meteo: WeatherData): Promise<ConseilAgri[]> {
  const prompt = `Tu es un expert en agriculture tropicale camerounaise.
Météo actuelle à Yaoundé :
- Température: ${meteo.temp}°C (ressenti ${meteo.tempRessentie}°C)
- Humidité: ${meteo.humidite}%
- Vent: ${meteo.vent} km/h
- Probabilité de pluie: ${meteo.pluie}%
- UV: ${meteo.uv}

Donne 3 conseils agricoles pratiques et concis adaptés à ces conditions.
Réponds UNIQUEMENT en JSON valide (sans markdown) :
[{"type":"arrosage|traitement|recolte|semis","titre":"...","texte":"...","emoji":"...","couleur":"#hexcode"}]`;

  const fallback: ConseilAgri[] = [
    { type: 'arrosage', titre: 'Arrosage conseillé', texte: `Humidité à ${meteo.humidite}%. ${meteo.humidite < 65 ? 'Irriguez vos cultures sensibles.' : 'Arrosage non urgent.'}`, emoji: '💧', couleur: '#3498db' },
    { type: 'traitement', titre: 'Traitements phytosanitaires', texte: `${meteo.vent < 15 ? 'Vent faible — bonne conditions pour les traitements.' : 'Vent fort — évitez les traitements aériens.'}`, emoji: '🌿', couleur: '#27ae60' },
    { type: 'recolte', titre: 'Fenêtre de récolte', texte: `${meteo.pluie < 30 ? 'Bonne fenêtre pour récolter et sécher vos cultures.' : 'Pluies probables — évitez la récolte aujourd\'hui.'}`, emoji: '🌾', couleur: '#f59e0b' },
  ];

  return callGemini<ConseilAgri[]>(prompt, fallback);
}

// ── Composants ────────────────────────────────────────────────────────────────
function StatMini({ icon, value, label, color, colors }: {
  icon: keyof typeof Ionicons.glyphMap;
  value: string; label: string; color: string;
  colors: typeof Colors.light | typeof Colors.dark;
}) {
  const flash = useRef(new Animated.Value(1)).current;
  const prev = useRef(value);
  useEffect(() => {
    if (prev.current !== value) {
      prev.current = value;
      Animated.sequence([
        Animated.timing(flash, { toValue: 0.3, duration: 100, useNativeDriver: true }),
        Animated.timing(flash, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]).start();
    }
  }, [value]);

  return (
    <View style={sm.item}>
      <View style={[sm.iconBox, { backgroundColor: `${color}18` }]}>
        <Ionicons name={icon} size={16} color={color} />
      </View>
      <Animated.Text style={[sm.val, { color: colors.text, opacity: flash }]}>{value}</Animated.Text>
      <Text style={[sm.lbl, { color: colors.textSecondary }]}>{label}</Text>
    </View>
  );
}

const sm = StyleSheet.create({
  item: { flex: 1, alignItems: 'center', gap: 4 },
  iconBox: { width: 36, height: 36, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  val: { fontSize: 13, fontWeight: '800' },
  lbl: { fontSize: 10, textAlign: 'center' },
});

function PrevisionItem({ p, colors, isFirst }: { p: PrevisionJour; colors: typeof Colors.light | typeof Colors.dark; isFirst?: boolean }) {
  const G = colors.primary;
  const pc = p.pluie >= 60 ? colors.danger : p.pluie >= 30 ? '#f5a623' : colors.success;
  return (
    <View style={[pi.item, { backgroundColor: isFirst ? `${G}15` : colors.backgroundElement }, isFirst && { borderWidth: 1.5, borderColor: G }]}>
      <Text style={[pi.jour, { color: isFirst ? G : colors.textSecondary, fontWeight: isFirst ? '800' : '600' }]}>{p.jour}</Text>
      <Ionicons name={p.icon as any} size={22} color={isFirst ? G : colors.textSecondary} />
      <Text style={[pi.max, { color: colors.text }]}>{p.max}°</Text>
      <Text style={[pi.min, { color: colors.textSecondary }]}>{p.min}°</Text>
      <View style={pi.pluieRow}>
        <Ionicons name="water-outline" size={9} color={pc} />
        <Text style={[pi.pluie, { color: pc }]}>{p.pluie}%</Text>
      </View>
    </View>
  );
}

const pi = StyleSheet.create({
  item: { alignItems: 'center', borderRadius: Radius.lg, paddingHorizontal: 10, paddingVertical: 11, marginRight: 8, minWidth: 66, gap: 4 },
  jour: { fontSize: 11 },
  max: { fontSize: 14, fontWeight: '800' },
  min: { fontSize: 11 },
  pluieRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  pluie: { fontSize: 9, fontWeight: '600' },
});

// ── Barre UV ──────────────────────────────────────────────────────────────────
function UVBar({ uv, colors }: { uv: number; colors: typeof Colors.light | typeof Colors.dark }) {
  const uvColor = getUVColor(uv);
  const uvLabel = getUVLabel(uv);
  const pct = Math.min(uv / 11, 1);
  return (
    <View style={uv_s.row}>
      <Text style={[uv_s.label, { color: colors.textSecondary }]}>UV {uv}</Text>
      <View style={[uv_s.barBg, { backgroundColor: colors.backgroundElement }]}>
        <View style={[uv_s.barFill, { width: `${pct*100}%` as any, backgroundColor: uvColor }]} />
      </View>
      <View style={[uv_s.badge, { backgroundColor: `${uvColor}20` }]}>
        <Text style={[uv_s.badgeText, { color: uvColor }]}>{uvLabel}</Text>
      </View>
    </View>
  );
}
const uv_s = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  label: { fontSize: 11, fontWeight: '600', minWidth: 30 },
  barBg: { flex: 1, height: 7, borderRadius: 4, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 4 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  badgeText: { fontSize: 10, fontWeight: '700' },
});

// ── Écran principal ───────────────────────────────────────────────────────────
export default function MeteoScreen() {
  const { colors } = useThemeColors();
  const G = colors.primary;

  const [meteo, setMeteo] = useState<WeatherData>(METEO_FALLBACK);
  const [previsions, setPrevisions] = useState<PrevisionJour[]>(PREVISIONS_FALLBACK);
  const [conseils, setConseils] = useState<ConseilAgri[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingIA, setLoadingIA] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [onglet, setOnglet] = useState<'auj' | 'semaine' | 'conseils'>('auj');

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    chargerTout();
  }, []);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 80, friction: 12 }),
    ]).start();
  }, [loading]);

  async function chargerTout() {
    setLoading(true);
    const { current, previsions: prev } = await fetchMeteoReelle();
    setMeteo(current);
    setPrevisions(prev);
    setLoading(false);

    setLoadingIA(true);
    const c = await getConseilsAgricoles(current);
    setConseils(c);
    setLoadingIA(false);
  }

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await chargerTout();
    setRefreshing(false);
  }, []);

  // Fluctuation live
  useEffect(() => {
    const id = setInterval(() => {
      setMeteo(prev => ({
        ...prev,
        temp: parseFloat((prev.temp + (Math.random() * 0.4 - 0.2)).toFixed(1)),
        humidite: Math.max(0, Math.min(100, prev.humidite + Math.round(Math.random() * 2 - 1))),
      }));
    }, 4000);
    return () => clearInterval(id);
  }, []);

  const pluieColor = meteo.pluie >= 60 ? colors.danger : meteo.pluie >= 30 ? '#f5a623' : G;

  return (
    <SafeAreaView style={[s.root, { backgroundColor: colors.background }]} edges={['top']}>
      {/* ── Header ── */}
      <View style={[s.header, { backgroundColor: colors.background }]}>
        <View style={s.headerTop}>
          <View>
            <Text style={[s.titre, { color: colors.text }]}>Météo Agricole</Text>
            <View style={s.locRow}>
              <Ionicons name="location-outline" size={12} color={G} />
              <Text style={[s.loc, { color: colors.textSecondary }]}>{VILLE}</Text>
            </View>
          </View>
          <LiveBadge color={G} />
        </View>

        {/* Onglets */}
        <View style={[s.onglets, { backgroundColor: colors.backgroundElement }]}>
          {(['auj', 'semaine', 'conseils'] as const).map(o => (
            <TouchableOpacity
              key={o}
              style={[s.onglet, onglet === o && { backgroundColor: colors.card, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 }]}
              onPress={() => setOnglet(o)}
            >
              <Text style={[s.ongletText, { color: onglet === o ? colors.text : colors.textSecondary, fontWeight: onglet === o ? '800' : '500' }]}>
                {o === 'auj' ? "Aujourd'hui" : o === 'semaine' ? '5 Jours' : 'Conseils IA'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={G} />}
      >
        {loading ? (
          <View style={s.loadingBox}>
            <ActivityIndicator size="large" color={G} />
            <Text style={[s.loadingText, { color: colors.textSecondary }]}>Chargement météo...</Text>
          </View>
        ) : (
          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>

            {/* ─────────── ONGLET AUJOURD'HUI ─────────── */}
            {onglet === 'auj' && (
              <>
                {/* Carte principale température */}
                <View style={[s.mainCard, { backgroundColor: `${G}12` }]}>
                  <View style={s.mainTop}>
                    <View style={s.mainLeft}>
                      <View style={s.condRow}>
                        <Ionicons name={meteo.icon as any} size={14} color={colors.textSecondary} />
                        <Text style={[s.condText, { color: colors.textSecondary }]}>{meteo.condition}</Text>
                      </View>
                      <Text style={[s.bigTemp, { color: colors.text }]}>{Math.round(meteo.temp)}°C</Text>
                      <Text style={[s.ressenti, { color: colors.textSecondary }]}>Ressenti <Text style={{ color: '#f5a623', fontWeight: '700' }}>{Math.round(meteo.tempRessentie)}°C</Text></Text>

                      {/* Barre pluie */}
                      <View style={s.pluieRow}>
                        <Ionicons name="rainy-outline" size={13} color={pluieColor} />
                        <Text style={[s.pluieLabel, { color: pluieColor }]}>Pluie</Text>
                        <View style={[s.pluieBarBg, { backgroundColor: colors.backgroundElement }]}>
                          <View style={[s.pluieBarFill, { width: `${meteo.pluie}%` as any, backgroundColor: pluieColor }]} />
                        </View>
                        <Text style={[s.pluiePct, { color: pluieColor }]}>{meteo.pluie}%</Text>
                      </View>
                    </View>

                    <View style={s.mainRight}>
                      <View style={[s.bigCircle, { backgroundColor: `${G}20` }]}>
                        <Ionicons name={meteo.icon as any} size={48} color={G} />
                      </View>
                    </View>
                  </View>

                  {/* Soleil */}
                  <View style={[s.soleilRow, { borderTopColor: `${G}20` }]}>
                    <View style={s.soleilItem}>
                      <Ionicons name="sunny-outline" size={13} color="#f5a623" />
                      <Text style={[s.soleilText, { color: colors.textSecondary }]}>Lever {meteo.soleil}</Text>
                    </View>
                    <View style={[s.soleilDiv, { backgroundColor: `${G}20` }]} />
                    <View style={s.soleilItem}>
                      <Ionicons name="moon-outline" size={13} color="#9b59b6" />
                      <Text style={[s.soleilText, { color: colors.textSecondary }]}>Coucher {meteo.coucher}</Text>
                    </View>
                  </View>
                </View>

                {/* 4 stats */}
                <View style={[s.statsGrid, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                  <StatMini icon="water-outline" value={`${meteo.humidite}%`} label="Humidité" color="#3498db" colors={colors} />
                  <View style={[s.statDiv, { backgroundColor: colors.cardBorder }]} />
                  <StatMini icon="speedometer-outline" value={`${meteo.vent}km/h`} label="Vent" color="#9b59b6" colors={colors} />
                  <View style={[s.statDiv, { backgroundColor: colors.cardBorder }]} />
                  <StatMini icon="eye-outline" value={`${meteo.visibilite}km`} label="Visibilité" color="#3498db" colors={colors} />
                  <View style={[s.statDiv, { backgroundColor: colors.cardBorder }]} />
                  <StatMini icon="sunny-outline" value={`${meteo.uv}`} label="Indice UV" color="#f5a623" colors={colors} />
                </View>

                {/* Barre UV détaillée */}
                <View style={[s.uvCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                  <Text style={[s.sectionMini, { color: colors.textSecondary }]}>INDICE UV</Text>
                  <UVBar uv={meteo.uv} colors={colors} />
                </View>

                {/* Conseil rapide IA */}
                <View style={[s.conseilRapide, { backgroundColor: `${G}12`, borderColor: `${G}25` }]}>
                  <View style={s.crHeader}>
                    <Ionicons name="analytics-outline" size={14} color={G} />
                    <Text style={[s.crTitle, { color: G }]}>Conseil IA du jour</Text>
                  </View>
                  <Text style={[s.crText, { color: colors.textSecondary }]}>
                    {meteo.pluie >= 60
                      ? `⛈️ Fortes pluies probables (${meteo.pluie}%) — reportez tous les traitements et la récolte.`
                      : meteo.humidite > 80
                      ? `💧 Humidité très élevée (${meteo.humidite}%) — risque de maladies fongiques. Surveillez vos plants.`
                      : meteo.uv >= 8
                      ? `☀️ UV très fort (${meteo.uv}) — travaillez tôt le matin, avant 9h.`
                      : `✅ Bonnes conditions pour les travaux agricoles. Profitez de cette fenêtre météo favorable.`}
                  </Text>
                </View>
              </>
            )}

            {/* ─────────── ONGLET 5 JOURS ─────────── */}
            {onglet === 'semaine' && (
              <>
                <Text style={[s.sectionLabel, { color: colors.textSecondary }]}>PRÉVISIONS 5 JOURS</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.prevScroll}>
                  {previsions.map((p, i) => (
                    <PrevisionItem key={i} p={p} colors={colors} isFirst={i === 0} />
                  ))}
                </ScrollView>

                {/* Détail par jour */}
                {previsions.map((p, i) => (
                  <View key={i} style={[s.prevDetail, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                    <View style={s.prevDetailLeft}>
                      <Ionicons name={p.icon as any} size={22} color={i === 0 ? G : colors.textSecondary} />
                      <View>
                        <Text style={[s.prevDetailJour, { color: colors.text }]}>{i === 0 ? "Demain" : p.jour}</Text>
                        <Text style={[s.prevDetailCond, { color: colors.textSecondary }]}>{p.condition}</Text>
                      </View>
                    </View>
                    <View style={s.prevDetailRight}>
                      <Text style={[s.prevDetailTemp, { color: colors.text }]}>{p.min}° – {p.max}°</Text>
                      <View style={[s.prevDetailPluie, { backgroundColor: `${p.pluie >= 50 ? colors.danger : G}15` }]}>
                        <Ionicons name="water-outline" size={10} color={p.pluie >= 50 ? colors.danger : G} />
                        <Text style={[s.prevDetailPluieText, { color: p.pluie >= 50 ? colors.danger : G }]}>{p.pluie}%</Text>
                      </View>
                    </View>
                  </View>
                ))}
              </>
            )}

            {/* ─────────── ONGLET CONSEILS IA ─────────── */}
            {onglet === 'conseils' && (
              <>
                <View style={[s.iaHeader, { backgroundColor: `${G}12`, borderColor: `${G}25` }]}>
                  <Ionicons name="sparkles" size={18} color={G} />
                  <Text style={[s.iaHeaderText, { color: G }]}>Conseils agricoles personnalisés</Text>
                </View>
                <Text style={[s.iaSub, { color: colors.textSecondary }]}>
                  Basés sur la météo actuelle de {VILLE} — Gemini 2.5 Flash
                </Text>

                {loadingIA ? (
                  <View style={s.iaLoading}>
                    <ActivityIndicator color={G} />
                    <Text style={[s.iaLoadingText, { color: colors.textSecondary }]}>Gemini analyse la météo...</Text>
                  </View>
                ) : (
                  conseils.map((c, i) => (
                    <Animated.View
                      key={i}
                      style={[s.conseilCard, { backgroundColor: colors.card, borderColor: colors.cardBorder, borderLeftColor: c.couleur, borderLeftWidth: 4 }]}
                    >
                      <Text style={s.conseilEmoji}>{c.emoji}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={[s.conseilTitre, { color: colors.text }]}>{c.titre}</Text>
                        <Text style={[s.conseilTexte, { color: colors.textSecondary }]}>{c.texte}</Text>
                        <View style={[s.conseilType, { backgroundColor: `${c.couleur}18` }]}>
                          <Text style={[s.conseilTypeText, { color: c.couleur }]}>{c.type}</Text>
                        </View>
                      </View>
                    </Animated.View>
                  ))
                )}
              </>
            )}

          </Animated.View>
        )}
        <View style={{ height: 80 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },

  header: { paddingHorizontal: Spacing.md, paddingTop: Spacing.sm, paddingBottom: 8, gap: 12 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  titre: { fontSize: 22, fontWeight: '900' },
  locRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  loc: { fontSize: 12 },
  onglets: { flexDirection: 'row', borderRadius: 12, padding: 3, gap: 2 },
  onglet: { flex: 1, borderRadius: 10, paddingVertical: 8, alignItems: 'center' },
  ongletText: { fontSize: 12 },

  content: { paddingHorizontal: Spacing.md, paddingTop: 12 },

  loadingBox: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, paddingVertical: 80 },
  loadingText: { fontSize: 14 },

  mainCard: { borderRadius: Radius.xl, padding: 18, marginBottom: 12, gap: 14 },
  mainTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  mainLeft: { flex: 1, gap: 6 },
  condRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  condText: { fontSize: 13 },
  bigTemp: { fontSize: 52, fontWeight: '900', lineHeight: 58 },
  ressenti: { fontSize: 12 },
  pluieRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  pluieLabel: { fontSize: 11, fontWeight: '600' },
  pluieBarBg: { flex: 1, height: 5, borderRadius: 3, overflow: 'hidden', maxWidth: 80 },
  pluieBarFill: { height: '100%', borderRadius: 3 },
  pluiePct: { fontSize: 12, fontWeight: '700', minWidth: 32 },
  mainRight: { alignItems: 'center' },
  bigCircle: { width: 90, height: 90, borderRadius: 45, alignItems: 'center', justifyContent: 'center' },

  soleilRow: { flexDirection: 'row', justifyContent: 'space-around', borderTopWidth: 1, paddingTop: 10 },
  soleilItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  soleilText: { fontSize: 12 },
  soleilDiv: { width: 1, alignSelf: 'stretch' },

  statsGrid: { flexDirection: 'row', borderRadius: Radius.lg, borderWidth: 1, padding: 16, marginBottom: 10 },
  statDiv: { width: 1, alignSelf: 'stretch' },

  uvCard: { borderRadius: Radius.lg, borderWidth: 1, padding: 14, marginBottom: 10, gap: 10 },

  conseilRapide: { borderRadius: Radius.lg, borderWidth: 1, padding: 14, gap: 8 },
  crHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  crTitle: { fontSize: 12, fontWeight: '800', letterSpacing: 0.5 },
  crText: { fontSize: 13, lineHeight: 20 },

  sectionLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1, marginBottom: 12 },
  sectionMini: { fontSize: 10, fontWeight: '700', letterSpacing: 1, marginBottom: 8 },
  prevScroll: { marginBottom: 16 },

  prevDetail: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderRadius: Radius.md, borderWidth: 1, padding: 14, marginBottom: 8 },
  prevDetailLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  prevDetailJour: { fontSize: 14, fontWeight: '700' },
  prevDetailCond: { fontSize: 11, marginTop: 2 },
  prevDetailRight: { alignItems: 'flex-end', gap: 4 },
  prevDetailTemp: { fontSize: 15, fontWeight: '800' },
  prevDetailPluie: { flexDirection: 'row', alignItems: 'center', gap: 3, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  prevDetailPluieText: { fontSize: 10, fontWeight: '700' },

  iaHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: Radius.lg, borderWidth: 1, padding: 14, marginBottom: 6 },
  iaHeaderText: { fontSize: 14, fontWeight: '800' },
  iaSub: { fontSize: 11, marginBottom: 16 },
  iaLoading: { alignItems: 'center', gap: 12, paddingVertical: 40 },
  iaLoadingText: { fontSize: 13 },

  conseilCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 14, borderRadius: Radius.lg, borderWidth: 1, padding: 16, marginBottom: 10 },
  conseilEmoji: { fontSize: 28 },
  conseilTitre: { fontSize: 15, fontWeight: '800', marginBottom: 4 },
  conseilTexte: { fontSize: 13, lineHeight: 19, marginBottom: 8 },
  conseilType: { alignSelf: 'flex-start', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  conseilTypeText: { fontSize: 10, fontWeight: '700', textTransform: 'capitalize' },
});