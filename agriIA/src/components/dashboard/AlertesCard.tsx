import React, { useRef, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Animated, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { useColorScheme } from 'react-native';
import { ALERTES, Alerte, AlerteNiveau } from '@/components/data/mockData';
import Card from '@/components/ui/Card';

const G = Colors.splash.green;

// ── Config par niveau ─────────────────────────────────────────────────────────
const NIVEAU_CONFIG: Record<AlerteNiveau, {
  color: string; bg: string; icon: keyof typeof Ionicons.glyphMap; label: string;
}> = {
  danger:  { color: '#e74c3c', bg: 'rgba(231,76,60,0.10)',  icon: 'alert-circle-outline',       label: 'Critique' },
  warning: { color: '#f5a623', bg: 'rgba(245,166,35,0.10)', icon: 'warning-outline',             label: 'Attention' },
  info:    { color: '#3498db', bg: 'rgba(52,152,219,0.10)', icon: 'information-circle-outline',  label: 'Info' },
};

// ── Simulation : nouvelle alerte aléatoire toutes les 12s ─────────────────────
const NOUVELLES_ALERTES: Omit<Alerte, 'id'>[] = [
  { titre: 'Capteur déconnecté',    message: 'Le capteur D4 (Jardin Est) ne répond plus.',           niveau: 'danger',  culture: 'Cacao',   heure: "à l'instant", parcelle: 'p4', lu: false, icone: 'wifi-outline' },
  { titre: 'Température sol élevée',message: 'Température à 32°C sur Parcelle Nord — stress hydrique probable.', niveau: 'warning', culture: 'Maïs',   heure: "à l'instant", parcelle: 'p1', lu: false, icone: 'thermometer-outline' },
  { titre: 'Récolte recommandée',   message: 'Maturité optimale atteinte sur Zone Ouest (94%).',     niveau: 'info',    culture: 'Manioc',  heure: "à l'instant", parcelle: 'p3', lu: false, icone: 'calendar-outline' },
  { titre: 'Batterie faible',       message: 'Capteur E5 — batterie à 12%, rechargement nécessaire.',niveau: 'warning', culture: 'Plantain',heure: "à l'instant", parcelle: 'p5', lu: false, icone: 'battery-dead-outline' },
];

let alerteCounter = 100;

function useAlertes(interval = 12000) {
  const [alertes, setAlertes] = useState<Alerte[]>(ALERTES);

  useEffect(() => {
    const id = setInterval(() => {
      const template = NOUVELLES_ALERTES[Math.floor(Math.random() * NOUVELLES_ALERTES.length)];
      const newAlerte: Alerte = {
        ...template,
        id: `a${++alerteCounter}`,
      };
      setAlertes(prev => [newAlerte, ...prev.slice(0, 7)]); // max 8 alertes
    }, interval);
    return () => clearInterval(id);
  }, [interval]);

  return { alertes, setAlertes };
}

// ── Animation d'entrée pour chaque item ──────────────────────────────────────
function AlerteItem({
  alerte, onMarkRead, index,
}: {
  alerte: Alerte;
  onMarkRead: (id: string) => void;
  index: number;
}): React.JSX.Element {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const cfg    = NIVEAU_CONFIG[alerte.niveau];

  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 350, delay: index * 60, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 350, delay: index * 60, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateX: slideAnim }] }}>
      <TouchableOpacity
        style={[
          ai.item,
          { backgroundColor: alerte.lu ? 'transparent' : cfg.bg },
          { borderLeftColor: cfg.color, borderLeftWidth: alerte.lu ? 2 : 3 },
        ]}
        onPress={() => onMarkRead(alerte.id)}
        activeOpacity={0.75}
      >
        {/* Icône niveau */}
        <View style={[ai.iconBox, { backgroundColor: `${cfg.color}18` }]}>
          <Ionicons name={alerte.icone as keyof typeof Ionicons.glyphMap ?? cfg.icon} size={18} color={cfg.color} />
          {!alerte.lu && <View style={[ai.unreadDot, { backgroundColor: cfg.color }]} />}
        </View>

        {/* Contenu */}
        <View style={ai.content}>
          <View style={ai.topRow}>
            <Text style={[ai.titre, { color: colors.text, opacity: alerte.lu ? 0.7 : 1 }]} numberOfLines={1}>
              {alerte.titre}
            </Text>
            <View style={[ai.niveauBadge, { backgroundColor: `${cfg.color}15` }]}>
              <Text style={[ai.niveauText, { color: cfg.color }]}>{cfg.label}</Text>
            </View>
          </View>

          <Text style={[ai.message, { color: colors.textSecondary, opacity: alerte.lu ? 0.7 : 1 }]} numberOfLines={2}>
            {alerte.message}
          </Text>

          <View style={ai.bottomRow}>
            <View style={ai.cultureRow}>
              <Ionicons name="leaf-outline" size={10} color={G} />
              <Text style={[ai.culture, { color: G }]}>{alerte.culture}</Text>
            </View>
            <View style={ai.timeRow}>
              <Ionicons name="time-outline" size={10} color={colors.textSecondary} />
              <Text style={[ai.heure, { color: colors.textSecondary }]}>{alerte.heure}</Text>
            </View>
            {!alerte.lu && (
              <Text style={[ai.tapToRead, { color: colors.textSecondary }]}>Appuyer pour lire</Text>
            )}
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const ai = StyleSheet.create({
  item:       { flexDirection: 'row', gap: 10, paddingVertical: 11, paddingHorizontal: 10, borderRadius: Radius.md, marginBottom: 6 },
  iconBox:    { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  unreadDot:  { position: 'absolute', top: -2, right: -2, width: 8, height: 8, borderRadius: 4, borderWidth: 1.5, borderColor: '#fff' },
  content:    { flex: 1, gap: 3 },
  topRow:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  titre:      { fontSize: 13, fontWeight: '700', flex: 1, marginRight: 8 },
  niveauBadge:{ borderRadius: Radius.full, paddingHorizontal: 7, paddingVertical: 2 },
  niveauText: { fontSize: 9, fontWeight: '800' },
  message:    { fontSize: 11, lineHeight: 16 },
  bottomRow:  { flexDirection: 'row', alignItems: 'center', gap: 10 },
  cultureRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  culture:    { fontSize: 10, fontWeight: '600' },
  timeRow:    { flexDirection: 'row', alignItems: 'center', gap: 3 },
  heure:      { fontSize: 10 },
  tapToRead:  { fontSize: 9, marginLeft: 'auto' },
});

// ── Filtre tab ────────────────────────────────────────────────────────────────
function FilterTab({ label, count, active, color, onPress }: {
  label: string; count: number; active: boolean; color: string; onPress: () => void;
}): React.JSX.Element {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  return (
    <TouchableOpacity
      style={[ft.tab, active && { borderBottomColor: color, borderBottomWidth: 2 }]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <Text style={[ft.label, { color: active ? color : colors.textSecondary }]}>{label}</Text>
      {count > 0 && (
        <View style={[ft.badge, { backgroundColor: active ? color : colors.backgroundElement }]}>
          <Text style={[ft.badgeText, { color: active ? '#fff' : colors.textSecondary }]}>{count}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}
const ft = StyleSheet.create({
  tab:       { flexDirection: 'row', alignItems: 'center', gap: 5, paddingBottom: 8, paddingHorizontal: 4 },
  label:     { fontSize: 11, fontWeight: '700' },
  badge:     { borderRadius: 8, paddingHorizontal: 5, paddingVertical: 1 },
  badgeText: { fontSize: 9, fontWeight: '800' },
});

// ── Composant principal ───────────────────────────────────────────────────────
type FilterType = 'all' | 'danger' | 'warning' | 'info';

export default function AlertesCard(): React.JSX.Element {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const { alertes, setAlertes } = useAlertes(12000);
  const [filter, setFilter] = useState<FilterType>('all');

  const markRead = (id: string) => {
    setAlertes(prev => prev.map(a => a.id === id ? { ...a, lu: true } : a));
  };

  const markAllRead = () => {
    setAlertes(prev => prev.map(a => ({ ...a, lu: true })));
  };

  const nonLues     = alertes.filter(a => !a.lu).length;
  const filtered    = filter === 'all' ? alertes : alertes.filter(a => a.niveau === filter);

  const counts = {
    all:     alertes.length,
    danger:  alertes.filter(a => a.niveau === 'danger').length,
    warning: alertes.filter(a => a.niveau === 'warning').length,
    info:    alertes.filter(a => a.niveau === 'info').length,
  };

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

        {/* ── En-tête ── */}
        <View style={s.header}>
          <View style={s.headerLeft}>
            <View style={[s.headerIcon, { backgroundColor: 'rgba(231,76,60,0.12)' }]}>
              <Ionicons name="notifications-outline" size={18} color="#e74c3c" />
              {nonLues > 0 && (
                <View style={s.headerBadge}>
                  <Text style={s.headerBadgeText}>{nonLues}</Text>
                </View>
              )}
            </View>
            <View>
              <Text style={[s.headerTitle, { color: colors.text }]}>Alertes IA</Text>
              <Text style={[s.headerSub, { color: colors.textSecondary }]}>
                {nonLues > 0 ? `${nonLues} non lue${nonLues > 1 ? 's' : ''}` : 'Tout lu'}
              </Text>
            </View>
          </View>
          <View style={s.headerRight}>
            <View style={s.livePill}>
              <View style={s.liveDot} />
              <Text style={s.liveText}>LIVE</Text>
            </View>
            {nonLues > 0 && (
              <TouchableOpacity onPress={markAllRead} style={s.readAllBtn}>
                <Ionicons name="checkmark-done-outline" size={14} color={G} />
                <Text style={[s.readAllText, { color: G }]}>Tout lire</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* ── Filtres ── */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.filtersScroll}>
          <View style={[s.filtersRow, { borderBottomColor: colors.cardBorder }]}>
            <FilterTab label="Toutes"   count={counts.all}     active={filter === 'all'}     color={G}        onPress={() => setFilter('all')} />
            <FilterTab label="Critiques" count={counts.danger}  active={filter === 'danger'}  color="#e74c3c"  onPress={() => setFilter('danger')} />
            <FilterTab label="Attention" count={counts.warning} active={filter === 'warning'} color="#f5a623"  onPress={() => setFilter('warning')} />
            <FilterTab label="Infos"    count={counts.info}    active={filter === 'info'}    color="#3498db"  onPress={() => setFilter('info')} />
          </View>
        </ScrollView>

        {/* ── Liste alertes ── */}
        <View style={s.list}>
          {filtered.length === 0 ? (
            <View style={s.emptyState}>
              <Ionicons name="checkmark-circle-outline" size={32} color={G} />
              <Text style={[s.emptyText, { color: colors.textSecondary }]}>Aucune alerte dans cette catégorie</Text>
            </View>
          ) : (
            filtered.slice(0, 5).map((alerte, index) => (
              <AlerteItem
                key={alerte.id}
                alerte={alerte}
                onMarkRead={markRead}
                index={index}
              />
            ))
          )}
        </View>

        {/* ── Footer stats ── */}
        <View style={[s.footer, { backgroundColor: colors.backgroundElement }]}>
          {(['danger', 'warning', 'info'] as AlerteNiveau[]).map(niveau => {
            const cfg = NIVEAU_CONFIG[niveau];
            const count = alertes.filter(a => a.niveau === niveau).length;
            return (
              <View key={niveau} style={s.footerStat}>
                <Ionicons name={cfg.icon} size={14} color={cfg.color} />
                <Text style={[s.footerCount, { color: cfg.color }]}>{count}</Text>
                <Text style={[s.footerLabel, { color: colors.textSecondary }]}>{cfg.label}</Text>
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

  header:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  headerLeft:   { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerIcon:   { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  headerBadge:  { position: 'absolute', top: -3, right: -3, width: 16, height: 16, borderRadius: 8, backgroundColor: '#e74c3c', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: '#fff' },
  headerBadgeText: { fontSize: 8, fontWeight: '900', color: '#fff' },
  headerTitle:  { fontSize: 14, fontWeight: '800' },
  headerSub:    { fontSize: 10, marginTop: 1 },
  headerRight:  { flexDirection: 'row', alignItems: 'center', gap: 8 },

  livePill:    { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: 'rgba(60,185,90,0.12)', borderRadius: 8, paddingHorizontal: 7, paddingVertical: 3 },
  liveDot:     { width: 5, height: 5, borderRadius: 2.5, backgroundColor: G },
  liveText:    { fontSize: 9, fontWeight: '800', color: G, letterSpacing: 0.8 },

  readAllBtn:   { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(60,185,90,0.10)', borderRadius: Radius.md, paddingHorizontal: 8, paddingVertical: 4 },
  readAllText:  { fontSize: 10, fontWeight: '700' },

  filtersScroll: { marginBottom: 12 },
  filtersRow:    { flexDirection: 'row', gap: 4, borderBottomWidth: 1, paddingBottom: 0 },

  list: { gap: 0 },

  emptyState: { alignItems: 'center', paddingVertical: 20, gap: 8 },
  emptyText:  { fontSize: 12 },

  footer:      { flexDirection: 'row', justifyContent: 'space-around', borderRadius: Radius.md, padding: 10, marginTop: 12 },
  footerStat:  { flexDirection: 'row', alignItems: 'center', gap: 5 },
  footerCount: { fontSize: 14, fontWeight: '900' },
  footerLabel: { fontSize: 10 },
});