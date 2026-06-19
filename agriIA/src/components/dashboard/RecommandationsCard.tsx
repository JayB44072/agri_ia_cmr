import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// ── Types ─────────────────────────────────────────────────────────────────────
type Priorite = 'urgent' | 'important' | 'conseil';

interface Recommandation {
  id: string;
  icone: string;                // emoji grand format
  action: string;               // titre court et clair
  pourquoi: string;             // explication simple (1 phrase)
  quandFaire: string;           // timing clair
  culture: string;
  parcelle: string;
  priorite: Priorite;
  benefice: string;             // gain concret attendu
  etapes: string[];             // 2-3 étapes simples
}

// ── Mock data ─────────────────────────────────────────────────────────────────
const RECOMMANDATIONS: Recommandation[] = [
  {
    id: 'r1',
    icone: '💧',
    action: 'Arroser maintenant',
    pourquoi: "L'humidité du sol est trop basse (41%). Vos plants de piment risquent de sécher.",
    quandFaire: "Aujourd'hui avant 10h du matin",
    culture: 'Piment',
    parcelle: 'Parcelle Ouest',
    priorite: 'urgent',
    benefice: 'Évite la perte de 30% du rendement',
    etapes: ["Ouvrir le robinet d'irrigation zone Ouest", 'Arroser pendant 25 minutes', 'Vérifier que la terre est humide en enfonçant un doigt'],
  },
  {
    id: 'r2',
    icone: '🌿',
    action: 'Ajouter de l\'engrais azoté',
    pourquoi: 'Le taux d\'azote dans le sol de la Parcelle Nord est faible (12%). Le maïs a besoin d\'azote pour grandir.',
    quandFaire: 'Dans les 3 prochains jours',
    culture: 'Maïs',
    parcelle: 'Parcelle Nord',
    priorite: 'important',
    benefice: '+1.5 t/ha de rendement estimé',
    etapes: ['Acheter de l\'urée (46-0-0) au marché', 'Épandre 50 kg par hectare', 'Arroser légèrement après l\'application'],
  },
  {
    id: 'r3',
    icone: '🐛',
    action: 'Surveiller les insectes',
    pourquoi: 'La saison des pluies arrive. C\'est le moment où les parasites attaquent les feuilles de tomate.',
    quandFaire: 'Cette semaine, une fois',
    culture: 'Tomate',
    parcelle: 'Parcelle Est',
    priorite: 'conseil',
    benefice: 'Prévenir une perte de récolte',
    etapes: ['Inspecter le dessous des feuilles', 'Chercher des taches noires ou jaunes', 'Signaler via l\'appli si vous trouvez des traces'],
  },
  {
    id: 'r4',
    icone: '✂️',
    action: 'Désherber la parcelle',
    pourquoi: 'Les mauvaises herbes volent l\'eau et les nutriments de votre manioc. Il faut les retirer.',
    quandFaire: 'Dans les 5 prochains jours',
    culture: 'Manioc',
    parcelle: 'Parcelle Sud',
    priorite: 'conseil',
    benefice: 'Meilleure croissance des plants',
    etapes: ['Travailler tôt le matin (moins chaud)', 'Retirer les herbes à la racine', 'Laisser les herbes sécher au soleil'],
  },
];

// ── Config priorités ──────────────────────────────────────────────────────────
const PRIORITE_CONFIG = {
  urgent: {
    label: '🚨 Urgent',
    color: '#ef4444',
    bg: '#450a0a',
    border: '#991b1b',
    badgeBg: '#7f1d1d',
    iconBg: '#fca5a520',
    desc: 'À faire maintenant',
  },
  important: {
    label: '⚡ Important',
    color: '#f59e0b',
    bg: '#451a03',
    border: '#92400e',
    badgeBg: '#78350f',
    iconBg: '#fde68a20',
    desc: 'À faire bientôt',
  },
  conseil: {
    label: '💡 Conseil',
    color: '#22c55e',
    bg: '#052e16',
    border: '#166534',
    badgeBg: '#14532d',
    iconBg: '#bbf7d020',
    desc: 'Recommandé',
  },
};

// ── Animated Card ─────────────────────────────────────────────────────────────
function RecommandationItem({
  item,
  index,
}: {
  item: Recommandation;
  index: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const slideY = useRef(new Animated.Value(30)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const expandAnim = useRef(new Animated.Value(0)).current;
  const cfg = PRIORITE_CONFIG[item.priorite];

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideY, {
        toValue: 0,
        duration: 400,
        delay: index * 100,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 400,
        delay: index * 100,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  useEffect(() => {
    Animated.timing(expandAnim, {
      toValue: expanded ? 1 : 0,
      duration: 250,
      useNativeDriver: false,
    }).start();
  }, [expanded]);

  return (
    <Animated.View style={{ opacity, transform: [{ translateY: slideY }] }}>
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => setExpanded(!expanded)}
        style={[
          s.card,
          {
            backgroundColor: cfg.bg,
            borderColor: cfg.border,
          },
        ]}
      >
        {/* Top strip */}
        <View style={[s.topStrip, { backgroundColor: cfg.border + '60' }]}>
          <View style={[s.prioriteBadge, { backgroundColor: cfg.badgeBg }]}>
            <Text style={[s.prioriteLabel, { color: cfg.color }]}>{cfg.label}</Text>
          </View>
          <View style={s.metaRight}>
            <Text style={s.parcelleName}>📍 {item.parcelle}</Text>
            <Text style={[s.cultureTag, { color: cfg.color }]}>🌱 {item.culture}</Text>
          </View>
        </View>

        {/* Main content */}
        <View style={s.mainContent}>
          {/* Big emoji */}
          <View style={[s.bigIconBox, { backgroundColor: cfg.iconBg }]}>
            <Text style={s.bigIcon}>{item.icone}</Text>
          </View>

          <View style={s.textBlock}>
            {/* Action title — très lisible */}
            <Text style={s.actionTitle}>{item.action}</Text>

            {/* Pourquoi — explication simple */}
            <Text style={s.pourquoi}>{item.pourquoi}</Text>

            {/* Quand faire — timing clair */}
            <View style={[s.quandRow, { backgroundColor: cfg.border + '50' }]}>
              <Ionicons name="time-outline" size={13} color={cfg.color} />
              <Text style={[s.quandText, { color: cfg.color }]}>{item.quandFaire}</Text>
            </View>
          </View>
        </View>

        {/* Bénéfice */}
        <View style={[s.beneficeRow, { borderTopColor: cfg.border }]}>
          <Ionicons name="trending-up" size={13} color={cfg.color} />
          <Text style={[s.beneficeText, { color: cfg.color }]}>{item.benefice}</Text>
          <Ionicons
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={14}
            color="#6b7280"
          />
        </View>

        {/* Étapes (accordéon) */}
        {expanded && (
          <View style={[s.etapesBox, { borderTopColor: cfg.border }]}>
            <Text style={[s.etapesTitle, { color: cfg.color }]}>
              Comment faire ?
            </Text>
            {item.etapes.map((etape, i) => (
              <View key={i} style={s.etapeRow}>
                <View style={[s.etapeNum, { backgroundColor: cfg.color }]}>
                  <Text style={s.etapeNumText}>{i + 1}</Text>
                </View>
                <Text style={s.etapeText}>{etape}</Text>
              </View>
            ))}
            <TouchableOpacity style={[s.doneBtn, { backgroundColor: cfg.color }]}>
              <Ionicons name="checkmark-circle" size={15} color="#fff" />
              <Text style={s.doneBtnText}>Marquer comme fait</Text>
            </TouchableOpacity>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function RecommandationCard() {
  const urgent = RECOMMANDATIONS.filter((r) => r.priorite === 'urgent').length;
  const important = RECOMMANDATIONS.filter((r) => r.priorite === 'important').length;

  return (
    <View style={s.wrapper}>
      {/* Header */}
      <View style={s.header}>
        <View style={s.headerLeft}>
          <View style={s.headerIcon}>
            <Ionicons name="bulb" size={18} color="#fff" />
          </View>
          <View>
            <Text style={s.headerTitle}>Recommandations IA</Text>
            <Text style={s.headerSub}>Ce que vous devez faire sur votre ferme</Text>
          </View>
        </View>
        <View style={s.headerBadges}>
          {urgent > 0 && (
            <View style={[s.countBadge, { backgroundColor: '#7f1d1d' }]}>
              <Text style={[s.countText, { color: '#ef4444' }]}>{urgent} urgent{urgent > 1 ? 's' : ''}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Hint */}
      <View style={s.hintBox}>
        <Ionicons name="finger-print" size={13} color="#4ade80" />
        <Text style={s.hintText}>Appuyez sur une carte pour voir les étapes à suivre</Text>
      </View>

      {/* Cards */}
      <ScrollView showsVerticalScrollIndicator={false}>
        {RECOMMANDATIONS.map((item, idx) => (
          <RecommandationItem key={item.id} item={item} index={idx} />
        ))}
      </ScrollView>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  wrapper: {
    backgroundColor: '#0f172a',
    borderRadius: 20,
    padding: 16,
    margin: 12,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerIcon: {
    backgroundColor: '#16a34a',
    borderRadius: 10,
    padding: 8,
  },
  headerTitle: { color: '#f1f5f9', fontSize: 16, fontWeight: '800' },
  headerSub: { color: '#6b7280', fontSize: 11, marginTop: 1 },
  headerBadges: { gap: 4 },
  countBadge: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 20,
  },
  countText: { fontSize: 11, fontWeight: '700' },

  // Hint
  hintBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#052e16',
    borderRadius: 8,
    padding: 8,
    marginBottom: 14,
    borderLeftWidth: 2,
    borderLeftColor: '#22c55e',
  },
  hintText: { color: '#86efac', fontSize: 11 },

  // Card
  card: {
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
    overflow: 'hidden',
  },

  // Top strip
  topStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  prioriteBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
  },
  prioriteLabel: { fontSize: 11, fontWeight: '800' },
  metaRight: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  parcelleName: { color: '#9ca3af', fontSize: 10 },
  cultureTag: { fontSize: 10, fontWeight: '700' },

  // Main
  mainContent: {
    flexDirection: 'row',
    gap: 12,
    padding: 14,
    alignItems: 'flex-start',
  },
  bigIconBox: {
    width: 58,
    height: 58,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  bigIcon: { fontSize: 30 },
  textBlock: { flex: 1 },
  actionTitle: {
    color: '#f8fafc',
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 5,
    lineHeight: 22,
  },
  pourquoi: {
    color: '#cbd5e1',
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 8,
  },
  quandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  quandText: { fontSize: 11, fontWeight: '700' },

  // Bénéfice
  beneficeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderTopWidth: 1,
  },
  beneficeText: { flex: 1, fontSize: 12, fontWeight: '600' },

  // Étapes
  etapesBox: {
    borderTopWidth: 1,
    padding: 14,
    gap: 10,
  },
  etapesTitle: { fontSize: 13, fontWeight: '800', marginBottom: 4 },
  etapeRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  etapeNum: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 1,
  },
  etapeNumText: { color: '#fff', fontSize: 11, fontWeight: '800' },
  etapeText: { color: '#e2e8f0', fontSize: 13, flex: 1, lineHeight: 19 },
  doneBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 6,
  },
  doneBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
});