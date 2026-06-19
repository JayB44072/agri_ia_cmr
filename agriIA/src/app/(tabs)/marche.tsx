import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Animated, ActivityIndicator, Modal, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius } from '@/constants/theme';
import { useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// ── Types ─────────────────────────────────────────────────────────────────────
interface ProduitMarche {
  id: string;
  nom: string;
  emoji: string;
  categorie: 'cereale' | 'legume' | 'fruit' | 'tubercule' | 'cash';
  prixActuel: number;
  unite: string;
  tendance: 'hausse' | 'baisse' | 'stable';
  variation: number;
  stock: 'abondant' | 'normal' | 'rare';
  vendeurs: number;
  conseil: string;
}

interface MaListe {
  id: string;
  nom: string;
  emoji: string;
  quantite: string;
  prixUnitaire: number;
  unite: string;
  statut: 'disponible' | 'recherche' | 'vendu';
}

interface ConseilIA {
  titre: string;
  texte: string;
  action: string;
  priorite: 'haute' | 'moyenne' | 'info';
}

// ── Données de base (prix du marché camerounais) ───────────────────────────────
const PRODUITS_BASE: ProduitMarche[] = [
  { id:'p1', nom:'Maïs', emoji:'🌽', categorie:'cereale', prixActuel:180, unite:'kg', tendance:'hausse', variation:8, stock:'normal', vendeurs:12, conseil:'Bon moment pour vendre, prix en hausse.' },
  { id:'p2', nom:'Manioc', emoji:'🥔', categorie:'tubercule', prixActuel:120, unite:'kg', tendance:'stable', variation:0, stock:'abondant', vendeurs:18, conseil:'Prix stable. Stockez si possible pour la saison sèche.' },
  { id:'p3', nom:'Tomate', emoji:'🍅', categorie:'legume', prixActuel:650, unite:'kg', tendance:'baisse', variation:-12, stock:'abondant', vendeurs:25, conseil:'Surplus sur le marché. Vendez rapidement avant la dépréciation.' },
  { id:'p4', nom:'Plantain', emoji:'🍌', categorie:'fruit', prixActuel:300, unite:'régime', tendance:'hausse', variation:5, stock:'normal', vendeurs:8, conseil:'Demande forte. Excellente période pour la mise en marché.' },
  { id:'p5', nom:'Cacao', emoji:'🍫', categorie:'cash', prixActuel:2800, unite:'kg', tendance:'hausse', variation:15, stock:'rare', vendeurs:4, conseil:'Prix historiquement hauts. Vendez rapidement !' },
  { id:'p6', nom:'Arachide', emoji:'🥜', categorie:'cereale', prixActuel:900, unite:'kg', tendance:'stable', variation:2, stock:'normal', vendeurs:10, conseil:'Bonne période pour commercialiser.' },
  { id:'p7', nom:'Piment', emoji:'🌶️', categorie:'legume', prixActuel:2500, unite:'kg', tendance:'hausse', variation:20, stock:'rare', vendeurs:6, conseil:'Forte demande ! Augmentez votre production.' },
  { id:'p8', nom:'Haricot', emoji:'🫘', categorie:'cereale', prixActuel:750, unite:'kg', tendance:'baisse', variation:-5, stock:'abondant', vendeurs:14, conseil:'Prix en légère baisse. Attendez si possible.' },
  { id:'p9', nom:'Café', emoji:'☕', categorie:'cash', prixActuel:3200, unite:'kg', tendance:'stable', variation:1, stock:'normal', vendeurs:3, conseil:'Prix stables. Maintenez votre production.' },
  { id:'p10', nom:'Igname', emoji:'🍠', categorie:'tubercule', prixActuel:400, unite:'kg', tendance:'hausse', variation:10, stock:'rare', vendeurs:7, conseil:'Saison favorable. Bonne période de vente.' },
];

// ── Gemini IA integration ─────────────────────────────────────────────────────
const GEMINI_KEY = 'AIzaSyDemo_placeholder'; // À remplacer par votre clé

async function getConseilsGemini(produits: ProduitMarche[]): Promise<ConseilIA[]> {
  const top3Hausse = produits.filter(p => p.tendance === 'hausse').slice(0, 3);
  const top3Baisse = produits.filter(p => p.tendance === 'baisse').slice(0, 3);

  const prompt = `Tu es un expert en agriculture camerounaise et marchés agricoles d'Afrique centrale.
Voici les prix actuels du marché agricole de Yaoundé (FCFA/kg ou unité) :
- En hausse : ${top3Hausse.map(p => `${p.nom} à ${p.prixActuel} FCFA/${p.unite} (+${p.variation}%)`).join(', ')}
- En baisse : ${top3Baisse.map(p => `${p.nom} à ${p.prixActuel} FCFA/${p.unite} (${p.variation}%)`).join(', ')}

Donne 3 conseils pratiques et concrets pour un agriculteur camerounais.
Réponds UNIQUEMENT en JSON valide (sans markdown) avec ce format exact :
[{"titre":"...","texte":"...","action":"...","priorite":"haute|moyenne|info"}]`;

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
      }
    );
    if (!res.ok) throw new Error('API error');
    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '[]';
    const clean = text.replace(/```json|```/g, '').trim();
    return JSON.parse(clean);
  } catch {
    return [
      { titre: '🌽 Vendez votre maïs maintenant', texte: 'Le prix du maïs est en hausse de 8%. C\'est le bon moment pour commercialiser vos stocks.', action: 'Aller au marché de Mfoundi', priorite: 'haute' },
      { titre: '🍅 Tomates : vendez vite', texte: 'Surplus sur le marché. Les prix continuent de baisser. Ne stockez pas trop longtemps.', action: 'Contacter les grossistes', priorite: 'haute' },
      { titre: '🍫 Cacao à prix record', texte: 'Le cacao est à son plus haut niveau de l\'année. Excellente opportunité de vente.', action: 'Contacter la COOPAGRI', priorite: 'moyenne' },
    ];
  }
}

// ── Couleurs tendance ─────────────────────────────────────────────────────────
function getTendanceColor(t: string, c: typeof Colors.light | typeof Colors.dark): string {
  if (t === 'hausse') return c.success;
  if (t === 'baisse') return c.danger;
  return c.textSecondary;
}

function getPrioriteColor(p: string): string {
  if (p === 'haute') return '#ef4444';
  if (p === 'moyenne') return '#f59e0b';
  return '#3498db';
}

// ── Composant carte produit ───────────────────────────────────────────────────
function ProduitCard({ produit, index, colors, onSell }: {
  produit: ProduitMarche; index: number;
  colors: typeof Colors.light | typeof Colors.dark;
  onSell: (p: ProduitMarche) => void;
}) {
  const fade = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 350, delay: index * 60, useNativeDriver: true }),
      Animated.timing(slide, { toValue: 0, duration: 350, delay: index * 60, useNativeDriver: true }),
    ]).start();
  }, []);

  const tc = getTendanceColor(produit.tendance, colors);
  const stockColor = produit.stock === 'rare' ? colors.danger : produit.stock === 'abondant' ? colors.info : colors.success;

  return (
    <Animated.View style={{ opacity: fade, transform: [{ translateY: slide }] }}>
      <TouchableOpacity
        style={[pc.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
        activeOpacity={0.85}
        onPress={() => onSell(produit)}
      >
        <View style={pc.topRow}>
          <View style={pc.leftSide}>
            <Text style={pc.emoji}>{produit.emoji}</Text>
            <View>
              <Text style={[pc.nom, { color: colors.text }]}>{produit.nom}</Text>
              <Text style={[pc.categorie, { color: colors.textSecondary }]}>{produit.categorie}</Text>
            </View>
          </View>
          <View style={pc.rightSide}>
            <Text style={[pc.prix, { color: colors.text }]}>
              {produit.prixActuel.toLocaleString()} <Text style={[pc.unite, { color: colors.textSecondary }]}>FCFA/{produit.unite}</Text>
            </Text>
            <View style={[pc.tendanceBadge, { backgroundColor: `${tc}18` }]}>
              <Ionicons
                name={produit.tendance === 'hausse' ? 'trending-up' : produit.tendance === 'baisse' ? 'trending-down' : 'remove'}
                size={11} color={tc}
              />
              <Text style={[pc.tendanceText, { color: tc }]}>
                {produit.variation > 0 ? '+' : ''}{produit.variation}%
              </Text>
            </View>
          </View>
        </View>

        <View style={pc.bottomRow}>
          <View style={[pc.stockBadge, { backgroundColor: `${stockColor}18` }]}>
            <View style={[pc.dot, { backgroundColor: stockColor }]} />
            <Text style={[pc.stockText, { color: stockColor }]}>{produit.stock}</Text>
          </View>
          <Text style={[pc.vendeurs, { color: colors.textSecondary }]}>
            <Ionicons name="people-outline" size={10} /> {produit.vendeurs} vendeurs
          </Text>
          <TouchableOpacity
            style={[pc.vendreBtn, { backgroundColor: `${colors.primary}18`, borderColor: `${colors.primary}30` }]}
            onPress={() => onSell(produit)}
          >
            <Ionicons name="storefront-outline" size={12} color={colors.primary} />
            <Text style={[pc.vendreBtnText, { color: colors.primary }]}>Vendre</Text>
          </TouchableOpacity>
        </View>

        <View style={[pc.conseilBox, { backgroundColor: colors.backgroundElement }]}>
          <Ionicons name="bulb-outline" size={11} color={colors.primary} />
          <Text style={[pc.conseilText, { color: colors.textSecondary }]}>{produit.conseil}</Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const pc = StyleSheet.create({
  card: { borderRadius: Radius.lg, borderWidth: 1, marginBottom: 10, padding: 14, gap: 10 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  leftSide: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  emoji: { fontSize: 28 },
  nom: { fontSize: 15, fontWeight: '800' },
  categorie: { fontSize: 11, textTransform: 'capitalize' },
  rightSide: { alignItems: 'flex-end', gap: 4 },
  prix: { fontSize: 16, fontWeight: '900' },
  unite: { fontSize: 11, fontWeight: '400' },
  tendanceBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, borderRadius: 8, paddingHorizontal: 7, paddingVertical: 3 },
  tendanceText: { fontSize: 11, fontWeight: '700' },
  bottomRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  stockBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  stockText: { fontSize: 10, fontWeight: '600' },
  vendeurs: { flex: 1, fontSize: 10 },
  vendreBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 8, borderWidth: 1, paddingHorizontal: 9, paddingVertical: 5 },
  vendreBtnText: { fontSize: 11, fontWeight: '700' },
  conseilBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 7 },
  conseilText: { flex: 1, fontSize: 11, lineHeight: 16 },
});

// ── Modal vente ───────────────────────────────────────────────────────────────
function VenteModal({ produit, visible, onClose, colors }: {
  produit: ProduitMarche | null; visible: boolean;
  onClose: () => void; colors: typeof Colors.light | typeof Colors.dark;
}) {
  const [quantite, setQuantite] = useState('');
  const [note, setNote] = useState('');
  const total = produit ? (parseFloat(quantite) || 0) * produit.prixActuel : 0;
  const slideAnim = useRef(new Animated.Value(300)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 80, friction: 12 }).start();
    } else {
      Animated.timing(slideAnim, { toValue: 300, duration: 200, useNativeDriver: true }).start();
    }
  }, [visible]);

  if (!produit) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={vm.overlay} activeOpacity={1} onPress={onClose}>
        <Animated.View
          style={[vm.sheet, { backgroundColor: colors.card, transform: [{ translateY: slideAnim }] }]}
        >
          <View style={[vm.handle, { backgroundColor: colors.cardBorder }]} />

          <View style={vm.header}>
            <Text style={vm.emoji}>{produit.emoji}</Text>
            <View>
              <Text style={[vm.title, { color: colors.text }]}>Publier une annonce</Text>
              <Text style={[vm.subtitle, { color: colors.textSecondary }]}>{produit.nom} · {produit.prixActuel.toLocaleString()} FCFA/{produit.unite}</Text>
            </View>
          </View>

          <View style={vm.field}>
            <Text style={[vm.label, { color: colors.textSecondary }]}>Quantité ({produit.unite})</Text>
            <TextInput
              style={[vm.input, { color: colors.text, backgroundColor: colors.backgroundElement, borderColor: colors.cardBorder }]}
              keyboardType="numeric"
              placeholder={`Ex: 50 ${produit.unite}`}
              placeholderTextColor={colors.textSecondary}
              value={quantite}
              onChangeText={setQuantite}
            />
          </View>

          <View style={vm.field}>
            <Text style={[vm.label, { color: colors.textSecondary }]}>Note (optionnel)</Text>
            <TextInput
              style={[vm.input, { color: colors.text, backgroundColor: colors.backgroundElement, borderColor: colors.cardBorder }]}
              placeholder="Description de votre produit..."
              placeholderTextColor={colors.textSecondary}
              value={note}
              onChangeText={setNote}
              multiline
            />
          </View>

          {parseFloat(quantite) > 0 && (
            <View style={[vm.totalBox, { backgroundColor: `${colors.primary}15` }]}>
              <Text style={[vm.totalLabel, { color: colors.textSecondary }]}>Revenu estimé</Text>
              <Text style={[vm.totalMontant, { color: colors.primary }]}>{total.toLocaleString()} FCFA</Text>
            </View>
          )}

          <TouchableOpacity
            style={[vm.btn, { backgroundColor: colors.primary }]}
            onPress={onClose}
            activeOpacity={0.85}
          >
            <Ionicons name="storefront" size={16} color="#fff" />
            <Text style={vm.btnText}>Publier l'annonce</Text>
          </TouchableOpacity>
        </Animated.View>
      </TouchableOpacity>
    </Modal>
  );
}

const vm = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, gap: 16, paddingBottom: 40 },
  handle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 8 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  emoji: { fontSize: 36 },
  title: { fontSize: 18, fontWeight: '900' },
  subtitle: { fontSize: 12, marginTop: 2 },
  field: { gap: 6 },
  label: { fontSize: 12, fontWeight: '600' },
  input: { borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14 },
  totalBox: { borderRadius: 12, padding: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { fontSize: 13, fontWeight: '600' },
  totalMontant: { fontSize: 22, fontWeight: '900' },
  btn: { borderRadius: 14, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  btnText: { color: '#fff', fontSize: 15, fontWeight: '800' },
});

// ── Écran principal ───────────────────────────────────────────────────────────
const CATEGORIES = ['Tout', 'cereale', 'legume', 'fruit', 'tubercule', 'cash'] as const;
type CatFilter = typeof CATEGORIES[number];

export default function MarcheScreen() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const colors = (isDark ? Colors.dark : Colors.light) as typeof Colors.light | typeof Colors.dark;

  const [categorie, setCategorie] = useState<CatFilter>('Tout');
  const [recherche, setRecherche] = useState('');
  const [produits] = useState<ProduitMarche[]>(PRODUITS_BASE);
  const [conseils, setConseils] = useState<ConseilIA[]>([]);
  const [loadingIA, setLoadingIA] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [produitSelectionne, setProduitSelectionne] = useState<ProduitMarche | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const headerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(headerAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
    chargerConseils();
  }, []);

  async function chargerConseils() {
    setLoadingIA(true);
    const c = await getConseilsGemini(produits);
    setConseils(c);
    setLoadingIA(false);
  }

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await chargerConseils();
    setRefreshing(false);
  }, []);

  const produitsFiltres = produits.filter(p => {
    const matchCat = categorie === 'Tout' || p.categorie === categorie;
    const matchSearch = p.nom.toLowerCase().includes(recherche.toLowerCase());
    return matchCat && matchSearch;
  });

  const nbHausse = produits.filter(p => p.tendance === 'hausse').length;
  const prixMoyen = Math.round(produits.reduce((a, p) => a + p.prixActuel, 0) / produits.length);

  function ouvrirVente(p: ProduitMarche) {
    setProduitSelectionne(p);
    setModalVisible(true);
  }

  return (
    <SafeAreaView style={[s.root, { backgroundColor: colors.background }]} edges={['top']}>
      {/* ── Header animé ── */}
      <Animated.View style={[s.header, { backgroundColor: colors.background, opacity: headerAnim, transform: [{ translateY: headerAnim.interpolate({ inputRange: [0,1], outputRange: [-20,0] }) }] }]}>
        <View style={s.headerTop}>
          <View>
            <Text style={[s.headerTitle, { color: colors.text }]}>Marché Agricole</Text>
            <Text style={[s.headerSub, { color: colors.textSecondary }]}>Yaoundé · Mis à jour maintenant</Text>
          </View>
          <View style={[s.liveBadge, { backgroundColor: `${colors.success}15` }]}>
            <View style={[s.liveDot, { backgroundColor: colors.success }]} />
            <Text style={[s.liveText, { color: colors.success }]}>LIVE</Text>
          </View>
        </View>

        {/* Stats résumé */}
        <View style={s.statsRow}>
          {[
            { label: 'Produits', val: `${produits.length}`, icon: 'leaf-outline' as const, color: colors.primary },
            { label: 'En hausse', val: `${nbHausse}`, icon: 'trending-up-outline' as const, color: colors.success },
            { label: 'Prix moy.', val: `${prixMoyen.toLocaleString()}`, icon: 'cash-outline' as const, color: '#f59e0b' },
          ].map((stat, i) => (
            <View key={i} style={[s.statBox, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
              <Ionicons name={stat.icon} size={14} color={stat.color} />
              <Text style={[s.statVal, { color: colors.text }]}>{stat.val}</Text>
              <Text style={[s.statLbl, { color: colors.textSecondary }]}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* Barre de recherche */}
        <View style={[s.searchBar, { backgroundColor: colors.backgroundElement, borderColor: colors.cardBorder }]}>
          <Ionicons name="search-outline" size={16} color={colors.textSecondary} />
          <TextInput
            style={[s.searchInput, { color: colors.text }]}
            placeholder="Rechercher un produit..."
            placeholderTextColor={colors.textSecondary}
            value={recherche}
            onChangeText={setRecherche}
          />
          {recherche.length > 0 && (
            <TouchableOpacity onPress={() => setRecherche('')}>
              <Ionicons name="close-circle" size={16} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Filtres catégorie */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.filtresScroll}>
          {CATEGORIES.map(cat => (
            <TouchableOpacity
              key={cat}
              style={[s.filtrePill, { backgroundColor: categorie === cat ? colors.primary : colors.backgroundElement }]}
              onPress={() => setCategorie(cat)}
            >
              <Text style={[s.filtrePillText, { color: categorie === cat ? '#fff' : colors.textSecondary }]}>
                {cat === 'Tout' ? 'Tout' : cat.charAt(0).toUpperCase() + cat.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </Animated.View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {/* ── Conseils IA ── */}
        <View style={[s.iaSection, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <View style={s.iaSectionHeader}>
            <View style={[s.iaIcon, { backgroundColor: `${colors.primary}20` }]}>
              <Ionicons name="sparkles" size={15} color={colors.primary} />
            </View>
            <Text style={[s.iaSectionTitle, { color: colors.text }]}>Conseils IA Gemini</Text>
            {loadingIA && <ActivityIndicator size="small" color={colors.primary} style={{ marginLeft: 'auto' }} />}
          </View>

          {loadingIA ? (
            <View style={s.iaLoading}>
              <Text style={[s.iaLoadingText, { color: colors.textSecondary }]}>Analyse des prix en cours...</Text>
            </View>
          ) : (
            conseils.map((c, i) => (
              <View key={i} style={[s.conseilItem, { borderLeftColor: getPrioriteColor(c.priorite) }]}>
                <Text style={[s.conseilTitre, { color: colors.text }]}>{c.titre}</Text>
                <Text style={[s.conseilTexte, { color: colors.textSecondary }]}>{c.texte}</Text>
                <TouchableOpacity style={[s.conseilAction, { backgroundColor: `${getPrioriteColor(c.priorite)}15` }]}>
                  <Text style={[s.conseilActionText, { color: getPrioriteColor(c.priorite) }]}>{c.action}</Text>
                  <Ionicons name="arrow-forward" size={11} color={getPrioriteColor(c.priorite)} />
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>

        {/* ── Liste produits ── */}
        <Text style={[s.sectionLabel, { color: colors.textSecondary }]}>
          PRIX DU MARCHÉ · {produitsFiltres.length} produits
        </Text>

        {produitsFiltres.map((p, i) => (
          <ProduitCard key={p.id} produit={p} index={i} colors={colors} onSell={ouvrirVente} />
        ))}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ── Bouton flottant ── */}
      <TouchableOpacity
        style={[s.fab, { backgroundColor: colors.primary }]}
        onPress={() => produitsFiltres.length > 0 && ouvrirVente(produitsFiltres[0])}
        activeOpacity={0.85}
      >
        <Ionicons name="add" size={24} color="#fff" />
        <Text style={s.fabText}>Publier</Text>
      </TouchableOpacity>

      <VenteModal
        produit={produitSelectionne}
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        colors={colors}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingHorizontal: Spacing.md, paddingTop: Spacing.sm, paddingBottom: Spacing.sm, gap: 10 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  headerTitle: { fontSize: 22, fontWeight: '900' },
  headerSub: { fontSize: 12, marginTop: 2 },
  liveBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5 },
  liveDot: { width: 6, height: 6, borderRadius: 3 },
  liveText: { fontSize: 11, fontWeight: '800', letterSpacing: 1 },

  statsRow: { flexDirection: 'row', gap: 8 },
  statBox: { flex: 1, alignItems: 'center', borderRadius: 12, borderWidth: 1, paddingVertical: 10, gap: 3 },
  statVal: { fontSize: 14, fontWeight: '900' },
  statLbl: { fontSize: 9 },

  searchBar: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 12, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 8 },
  searchInput: { flex: 1, fontSize: 13 },

  filtresScroll: { marginHorizontal: -Spacing.md, paddingHorizontal: Spacing.md },
  filtrePill: { borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7, marginRight: 7 },
  filtrePillText: { fontSize: 12, fontWeight: '700' },

  content: { paddingHorizontal: Spacing.md, paddingTop: 8 },

  iaSection: { borderRadius: Radius.lg, borderWidth: 1, padding: 14, marginBottom: 16, gap: 12 },
  iaSectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iaIcon: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  iaSectionTitle: { fontSize: 14, fontWeight: '800' },
  iaLoading: { alignItems: 'center', paddingVertical: 12 },
  iaLoadingText: { fontSize: 12 },

  conseilItem: { borderLeftWidth: 3, paddingLeft: 12, gap: 4 },
  conseilTitre: { fontSize: 13, fontWeight: '800' },
  conseilTexte: { fontSize: 12, lineHeight: 17 },
  conseilAction: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  conseilActionText: { fontSize: 11, fontWeight: '700' },

  sectionLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1, marginBottom: 10, marginTop: 4 },

  fab: { position: 'absolute', bottom: 24, right: 20, flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 28, paddingHorizontal: 20, paddingVertical: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 10, elevation: 8 },
  fabText: { color: '#fff', fontSize: 15, fontWeight: '800' },
});
