import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Animated, ActivityIndicator, Modal, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Spacing, Radius, useThemeColors } from '@/constants/theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/context/AuthContext';
import {
  getProducts,
  createProduct,
  deleteProduct,
  getOrCreateWallet,
  processPurchase,
  ProductRow,
  WalletRow,
} from '@/services/database/marketplace';
import { callGemini } from '@/lib/gemini';

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

interface ConseilIA {
  titre: string;
  texte: string;
  action: string;
  priorite: 'haute' | 'moyenne' | 'info';
}

// ── Données de base (prix de référence) ─────────────────────────────────────────
const PRODUITS_BASE: ProduitMarche[] = [
  { id:'p1', nom:'Maïs', emoji:'🌽', categorie:'cereale', prixActuel:180, unite:'kg', tendance:'hausse', variation:8, stock:'normal', vendeurs:12, conseil:'Bon moment pour vendre, prix en hausse.' },
  { id:'p2', nom:'Manioc', emoji:'🥔', categorie:'tubercule', prixActuel:120, unite:'kg', tendance:'stable', variation:0, stock:'abondant', vendeurs:18, conseil:'Prix stable. Stockez si possible pour la saison sèche.' },
  { id:'p3', nom:'Tomate', emoji:'🍅', categorie:'legume', prixActuel:650, unite:'kg', tendance:'baisse', variation:-12, stock:'abondant', vendeurs:25, conseil:'Surplus sur le marché. Vendez rapidement avant la dépréciation.' },
  { id:'p4', nom:'Plantain', emoji:'🍌', categorie:'fruit', prixActuel:300, unite:'régime', tendance:'hausse', variation:5, stock:'normal', vendeurs:8, conseil:'Demande forte. Excellente période pour la mise en marché.' },
  { id:'p5', nom:'Cacao', emoji:'🍫', categorie:'cash', prixActuel:2800, unite:'kg', tendance:'hausse', variation:15, stock:'rare', vendeurs:4, conseil:'Prix historiquement hauts. Vendez rapidement !' },
];

// ── Gemini IA integration ─────────────────────────────────────────────────────
const CONSEILS_FALLBACK: ConseilIA[] = [
  { titre: '🌽 Vendez votre maïs maintenant', texte: 'Le prix du maïs est en hausse de 8%. C\'est le bon moment pour commercialiser vos stocks.', action: 'Aller au marché de Mfoundi', priorite: 'haute' },
  { titre: '🍅 Tomates : vendez vite', texte: 'Surplus sur le marché. Les prix continuent de baisser. Ne stockez pas trop longtemps.', action: 'Contacter les grossistes', priorite: 'haute' },
  { titre: '🍫 Cacao à prix record', texte: 'Le cacao est à son plus haut niveau de l\'année. Excellente opportunité de vente.', action: 'Contacter la COOPAGRI', priorite: 'moyenne' },
];

async function getConseilsGemini(produits: ProduitMarche[]): Promise<ConseilIA[]> {
  const top3Hausse = produits.filter(p => p.tendance === 'hausse').slice(0, 3);
  const top3Baisse = produits.filter(p => p.tendance === 'baisse').slice(0, 3);

  const prompt = `Tu es un expert en agriculture camerounaise et marchés agricoles d'Afrique centrale.
Voici les prix actuels du marché agricole de Yaoundé (FCFA/kg ou unité) :
- En hausse : ${top3Hausse.map(p => `${p.nom} à ${p.prixActuel} FCFA/${p.unite} (+${p.variation}%)`).join(', ')}
- En baisse : ${top3Baisse.map(p => `${p.nom} à ${p.prixActuel} FCFA/${p.unite} (${p.variation}%)`).join(', ')}

Donne 3 conseils pratiques et concrets pour un agriculteur camerounais.
Réponds UNIQUEMENT en JSON valide (sans aucun markdown \`\`\`json ou texte explicatif) avec ce format exact :
[{"titre":"...","texte":"...","action":"...","priorite":"haute|moyenne|info"}]`;

  return callGemini<ConseilIA[]>(prompt, CONSEILS_FALLBACK);
}

// ── VenteModal Component ───────────────────────────────────────────────────────
function VenteModal({ visible, onClose, onPublish, colors }: {
  visible: boolean; onClose: () => void;
  onPublish: (title: string, crop: string, price: number, unit: string, qty: number, description: string) => Promise<void>;
  colors: any;
}) {
  const [title, setTitle] = useState('');
  const [crop, setCrop] = useState('Maïs');
  const [price, setPrice] = useState('');
  const [unit, setUnit] = useState('kg');
  const [qty, setQty] = useState('');
  const [description, setDescription] = useState('');
  const [publishing, setPublishing] = useState(false);

  const handleSave = async () => {
    if (!title || !price || !qty) {
      alert("Veuillez remplir tous les champs obligatoires.");
      return;
    }
    setPublishing(true);
    await onPublish(title, crop, parseFloat(price), unit, parseFloat(qty), description);
    setPublishing(false);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={vm.overlay} activeOpacity={1} onPress={onClose}>
        <View style={[vm.sheet, { backgroundColor: colors.card }]} onStartShouldSetResponder={() => true}>
          <View style={[vm.handle, { backgroundColor: colors.cardBorder }]} />
          <Text style={[vm.title, { color: colors.text }]}>Publier un produit</Text>

          <ScrollView style={{ maxHeight: 380 }} showsVerticalScrollIndicator={false}>
            <View style={vm.field}>
              <Text style={[vm.label, { color: colors.textSecondary }]}>Titre de l'annonce *</Text>
              <TextInput
                style={[vm.input, { color: colors.text, backgroundColor: colors.backgroundElement, borderColor: colors.cardBorder }]}
                placeholder="Ex: Maïs jaune sec de qualité"
                placeholderTextColor={colors.textSecondary}
                value={title}
                onChangeText={setTitle}
              />
            </View>

            <View style={vm.field}>
              <Text style={[vm.label, { color: colors.textSecondary }]}>Culture</Text>
              <TextInput
                style={[vm.input, { color: colors.text, backgroundColor: colors.backgroundElement, borderColor: colors.cardBorder }]}
                placeholder="Ex: Maïs, Cacao, Tomate"
                placeholderTextColor={colors.textSecondary}
                value={crop}
                onChangeText={setCrop}
              />
            </View>

            <View style={s.formFieldRow}>
              <View style={[vm.field, { flex: 1 }]}>
                <Text style={[vm.label, { color: colors.textSecondary }]}>Prix (FCFA) *</Text>
                <TextInput
                  style={[vm.input, { color: colors.text, backgroundColor: colors.backgroundElement, borderColor: colors.cardBorder }]}
                  placeholder="Ex: 250"
                  keyboardType="numeric"
                  placeholderTextColor={colors.textSecondary}
                  value={price}
                  onChangeText={setPrice}
                />
              </View>
              <View style={[vm.field, { flex: 1 }]}>
                <Text style={[vm.label, { color: colors.textSecondary }]}>Unité *</Text>
                <TextInput
                  style={[vm.input, { color: colors.text, backgroundColor: colors.backgroundElement, borderColor: colors.cardBorder }]}
                  placeholder="Ex: kg, sac, régime"
                  placeholderTextColor={colors.textSecondary}
                  value={unit}
                  onChangeText={setUnit}
                />
              </View>
            </View>

            <View style={vm.field}>
              <Text style={[vm.label, { color: colors.textSecondary }]}>Quantité disponible *</Text>
              <TextInput
                style={[vm.input, { color: colors.text, backgroundColor: colors.backgroundElement, borderColor: colors.cardBorder }]}
                placeholder="Ex: 150"
                keyboardType="numeric"
                placeholderTextColor={colors.textSecondary}
                value={qty}
                onChangeText={setQty}
              />
            </View>

            <View style={vm.field}>
              <Text style={[vm.label, { color: colors.textSecondary }]}>Description</Text>
              <TextInput
                style={[vm.input, { color: colors.text, backgroundColor: colors.backgroundElement, borderColor: colors.cardBorder }]}
                placeholder="Détails du produit, qualité..."
                placeholderTextColor={colors.textSecondary}
                value={description}
                onChangeText={setDescription}
                multiline
              />
            </View>
          </ScrollView>

          <TouchableOpacity style={[vm.btn, { backgroundColor: colors.primary }]} onPress={handleSave} disabled={publishing}>
            {publishing ? <ActivityIndicator color="#fff" /> : (
              <>
                <Ionicons name="storefront" size={16} color="#fff" />
                <Text style={vm.btnText}>Publier l'annonce</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

// ── Main Screen ────────────────────────────────────────────────────────────────
export default function MarcheScreen() {
  const { colors } = useThemeColors();

  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'cours' | 'annonces'>('cours');
  const [recherche, setRecherche] = useState('');
  const [produitsMarche, setProduitsMarche] = useState<ProduitMarche[]>(PRODUITS_BASE);
  const [dbProducts, setDbProducts] = useState<ProductRow[]>([]);
  const [wallet, setWallet] = useState<WalletRow | null>(null);
  const [conseils, setConseils] = useState<ConseilIA[]>([]);
  const [loadingIA, setLoadingIA] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    chargerDonnees();
  }, [user]);

  const chargerDonnees = async () => {
    setRefreshing(true);
    // 1. Fetch wallet
    if (user) {
      const { data: w } = await getOrCreateWallet(user.id);
      if (w) setWallet(w);
    }
    // 2. Fetch products from DB
    const { data: p } = await getProducts();
    if (p) setDbProducts(p);

    // 3. Load Gemini advice
    setLoadingIA(true);
    const c = await getConseilsGemini(produitsMarche);
    setConseils(c);
    setLoadingIA(false);
    setRefreshing(false);
  };

  const handlePublish = async (title: string, crop: string, price: number, unit: string, qty: number, description: string) => {
    if (!user) return;
    const newProduct = {
      owner_id: user.id,
      title,
      crop,
      price,
      unit,
      quantity: qty,
      description,
      city: 'Yaoundé',
      region: 'Centre',
      phone: wallet?.phone || '677000000',
      image_url: null,
    };

    const { error } = await createProduct(newProduct);
    if (error) {
      alert("Erreur de publication: " + error.message);
    } else {
      chargerDonnees();
    }
  };

  const handleBuy = async (prod: ProductRow) => {
    if (!user) return;
    if (prod.owner_id === user.id) {
      alert("Vous ne pouvez pas acheter votre propre produit !");
      return;
    }

    const confirmBuy = confirm(`Voulez-vous acheter ${prod.quantity} ${prod.unit} de "${prod.title}" pour ${(prod.price * prod.quantity).toLocaleString()} FCFA ?`);
    if (!confirmBuy) return;

    setRefreshing(true);
    const { error } = await processPurchase(user.id, prod.owner_id, prod.id, prod.quantity, prod.price);
    setRefreshing(false);

    if (error) {
      alert("Échec de la transaction: " + error.message);
    } else {
      alert("Achat effectué avec succès via Mobile Money !");
      chargerDonnees();
    }
  };

  const handleDelete = async (id: string) => {
    const confirmDelete = confirm("Voulez-vous supprimer cette annonce ?");
    if (!confirmDelete) return;

    const { error } = await deleteProduct(id);
    if (error) {
      alert("Erreur de suppression: " + error.message);
    } else {
      chargerDonnees();
    }
  };

  // Filter listings
  const filteredDbProducts = dbProducts.filter(p => {
    return p.title.toLowerCase().includes(recherche.toLowerCase()) || 
           (p.crop && p.crop.toLowerCase().includes(recherche.toLowerCase()));
  });

  return (
    <SafeAreaView style={[s.root, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Wallet Card */}
      {wallet && (
        <View style={[s.walletCard, { backgroundColor: colors.primary, borderColor: colors.primary }]}>
          <View style={s.walletRow}>
            <View>
              <Text style={s.walletLabel}>Portefeuille Mobile Money ({wallet.carrier})</Text>
              <Text style={s.walletPhone}>📞 {wallet.phone}</Text>
            </View>
            <View style={s.momoBadge}>
              <Text style={s.momoBadgeText}>SIMULÉ</Text>
            </View>
          </View>
          <Text style={s.walletBalance}>{wallet.balance.toLocaleString()} FCFA</Text>
        </View>
      )}

      {/* Tabs Layout */}
      <View style={s.tabHeader}>
        <TouchableOpacity
          style={[s.tabButton, activeTab === 'cours' && s.tabButtonActive]}
          onPress={() => setActiveTab('cours')}
        >
          <Text style={[s.tabButtonText, { color: activeTab === 'cours' ? colors.primary : colors.textSecondary }]}>
            📊 Cours des Prix
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.tabButton, activeTab === 'annonces' && s.tabButtonActive]}
          onPress={() => setActiveTab('annonces')}
        >
          <Text style={[s.tabButtonText, { color: activeTab === 'annonces' ? colors.primary : colors.textSecondary }]}>
            🛒 Annonces ({dbProducts.length})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={chargerDonnees} tintColor={colors.primary} />}
      >
        {activeTab === 'cours' ? (
          <>
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
                  <View key={i} style={[s.conseilItem, { borderLeftColor: c.priorite === 'haute' ? '#ef4444' : '#f59e0b' }]}>
                    <Text style={[s.conseilTitre, { color: colors.text }]}>{c.titre}</Text>
                    <Text style={[s.conseilTexte, { color: colors.textSecondary }]}>{c.texte}</Text>
                  </View>
                ))
              )}
            </View>

            {/* List base prices */}
            {produitsMarche.map((p) => {
              const tc = p.tendance === 'hausse' ? colors.success : p.tendance === 'baisse' ? colors.danger : colors.textSecondary;
              return (
                <View key={p.id} style={[s.prodCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                  <View style={s.prodCardLeft}>
                    <Text style={s.prodEmoji}>{p.emoji}</Text>
                    <View>
                      <Text style={[s.prodTitle, { color: colors.text }]}>{p.nom}</Text>
                      <Text style={[s.prodSub, { color: colors.textSecondary }]}>Yaoundé · Moyen</Text>
                    </View>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={[s.prodPrice, { color: colors.text }]}>{p.prixActuel} FCFA/{p.unite}</Text>
                    <Text style={{ color: tc, fontSize: 11, fontWeight: '700' }}>
                      {p.tendance === 'hausse' ? '▲' : p.tendance === 'baisse' ? '▼' : '■'} {p.variation}%
                    </Text>
                  </View>
                </View>
              );
            })}
          </>
        ) : (
          <>
            {/* Search announcements */}
            <View style={[s.searchBar, { backgroundColor: colors.backgroundElement, borderColor: colors.cardBorder }]}>
              <Ionicons name="search-outline" size={16} color={colors.textSecondary} />
              <TextInput
                style={[s.searchInput, { color: colors.text }]}
                placeholder="Rechercher une annonce..."
                placeholderTextColor={colors.textSecondary}
                value={recherche}
                onChangeText={setRecherche}
              />
            </View>

            {/* List announcements */}
            {filteredDbProducts.length === 0 ? (
              <View style={s.emptyState}>
                <Text style={{ fontSize: 40, marginBottom: 10 }}>🌾</Text>
                <Text style={[s.emptyText, { color: colors.textSecondary }]}>Aucune annonce disponible.</Text>
              </View>
            ) : (
              filteredDbProducts.map((p) => {
                const isOwn = p.owner_id === user?.id;
                return (
                  <View key={p.id} style={[s.listingCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                    <View style={s.listingHeader}>
                      <View style={{ flex: 1 }}>
                        <Text style={[s.listingTitle, { color: colors.text }]}>{p.title}</Text>
                        <Text style={[s.listingCrop, { color: colors.primary }]}>🌱 {p.crop || 'Autre'}</Text>
                      </View>
                      <Text style={[s.listingPrice, { color: colors.text }]}>
                        {p.price.toLocaleString()} <Text style={{ fontSize: 10, color: colors.textSecondary }}>FCFA/{p.unit}</Text>
                      </Text>
                    </View>

                    <Text style={[s.listingDesc, { color: colors.textSecondary }]}>
                      {p.description || "Aucune description fournie."}
                    </Text>

                    <View style={s.listingFooter}>
                      <View>
                        <Text style={[s.listingStock, { color: colors.textSecondary }]}>Dispo: {p.quantity} {p.unit}</Text>
                        <Text style={[s.listingLoc, { color: colors.textSecondary }]}>📍 {p.city}, {p.region}</Text>
                      </View>

                      {isOwn ? (
                        <TouchableOpacity style={[s.deleteBtn, { backgroundColor: `${colors.danger}15` }]} onPress={() => handleDelete(p.id)}>
                          <Ionicons name="trash-outline" size={14} color={colors.danger} />
                          <Text style={{ color: colors.danger, fontSize: 12, fontWeight: '700' }}>Supprimer</Text>
                        </TouchableOpacity>
                      ) : (
                        <TouchableOpacity style={[s.buyBtn, { backgroundColor: colors.primary }]} onPress={() => handleBuy(p)}>
                          <Ionicons name="cart-outline" size={14} color="#fff" />
                          <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>Acheter</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                );
              })
            )}
          </>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Floating Action Button */}
      {activeTab === 'annonces' && (
        <TouchableOpacity style={[s.fab, { backgroundColor: colors.primary }]} onPress={() => setModalVisible(true)}>
          <Ionicons name="add" size={24} color="#fff" />
          <Text style={s.fabText}>Vendre</Text>
        </TouchableOpacity>
      )}

      <VenteModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onPublish={handlePublish}
        colors={colors}
      />
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const vm = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, gap: 14, paddingBottom: 30 },
  handle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 8 },
  title: { fontSize: 18, fontWeight: '850', marginBottom: 6 },
  field: { gap: 4, marginBottom: 12 },
  label: { fontSize: 11, fontWeight: '600' },
  input: { borderRadius: 10, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 8, fontSize: 13 },
  btn: { borderRadius: 12, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 10 },
  btnText: { color: '#fff', fontSize: 14, fontWeight: '750' },
});

const s = StyleSheet.create({
  root: { flex: 1 },
  walletCard: { margin: Spacing.md, padding: 16, borderRadius: Radius.md, gap: 8 },
  walletRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  walletLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 11, fontWeight: '600' },
  walletPhone: { color: '#fff', fontSize: 12, fontWeight: '700' },
  walletBalance: { color: '#fff', fontSize: 24, fontWeight: '900' },
  momoBadge: { backgroundColor: 'rgba(255,255,255,0.22)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  momoBadgeText: { color: '#fff', fontSize: 9, fontWeight: '800' },

  tabHeader: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.06)' },
  tabButton: { flex: 1, alignItems: 'center', paddingVertical: 14 },
  tabButtonActive: { borderBottomWidth: 2, borderBottomColor: '#22c55e' },
  tabButtonText: { fontSize: 13, fontWeight: '700' },

  content: { paddingHorizontal: Spacing.md, paddingTop: 12 },

  iaSection: { borderRadius: Radius.lg, borderWidth: 1, padding: 14, marginBottom: 16, gap: 10 },
  iaSectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iaIcon: { width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  iaSectionTitle: { fontSize: 13, fontWeight: '800' },
  iaLoading: { alignItems: 'center', paddingVertical: 10 },
  iaLoadingText: { fontSize: 11 },
  conseilItem: { borderLeftWidth: 3, paddingLeft: 10, gap: 2, marginBottom: 8 },
  conseilTitre: { fontSize: 12, fontWeight: '800' },
  conseilTexte: { fontSize: 11, lineHeight: 16 },

  prodCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderRadius: Radius.md, borderWidth: 1, padding: 14, marginBottom: 8 },
  prodCardLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  prodEmoji: { fontSize: 24 },
  prodTitle: { fontSize: 14, fontWeight: '750' },
  prodSub: { fontSize: 10 },
  prodPrice: { fontSize: 14, fontWeight: '850' },

  searchBar: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 10, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 8, marginBottom: 12 },
  searchInput: { flex: 1, fontSize: 13 },

  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 12 },

  formFieldRow: { flexDirection: 'row', gap: 10 },

  listingCard: { borderRadius: Radius.md, borderWidth: 1, padding: 14, marginBottom: 10, gap: 8 },
  listingHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  listingTitle: { fontSize: 14, fontWeight: '800' },
  listingCrop: { fontSize: 11, fontWeight: '700' },
  listingPrice: { fontSize: 15, fontWeight: '900' },
  listingDesc: { fontSize: 12, lineHeight: 17 },
  listingFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.04)', paddingTop: 8 },
  listingStock: { fontSize: 11, fontWeight: '600' },
  listingLoc: { fontSize: 10 },

  buyBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  deleteBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },

  fab: { position: 'absolute', bottom: 20, right: 20, flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 24, paddingHorizontal: 16, paddingVertical: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.2, shadowRadius: 6, elevation: 6 },
  fabText: { color: '#fff', fontSize: 13, fontWeight: '800' },
});
