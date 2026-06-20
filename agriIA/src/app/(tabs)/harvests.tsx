import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, ActivityIndicator,
  SafeAreaView, RefreshControl, TouchableOpacity, Modal, TextInput, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius } from '@/constants/theme';
import { useAppTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import {
  getHarvestsByOwner, createHarvest, deleteHarvest, HarvestRow,
} from '@/services/database/harvests';

const CULTURES = ['Maïs', 'Manioc', 'Tomate', 'Cacao', 'Plantain', 'Arachide', 'Café', 'Piment', 'Haricot', 'Riz', 'Sorgho'];

export default function HarvestsScreen() {
  const { isDark } = useAppTheme();
  const colors = isDark ? Colors.dark : Colors.light;
  const G = colors.primary;
  const { user } = useAuth();

  const [harvests, setHarvests]     = useState<HarvestRow[]>([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal]   = useState(false);
  const [saving, setSaving]         = useState(false);

  // Form
  const [crop,        setCrop]        = useState('');
  const [quantity,    setQuantity]    = useState('');
  const [revenue,     setRevenue]     = useState('');
  const [harvestDate, setHarvestDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => { loadHarvests(); }, [user]);

  async function loadHarvests() {
    if (!user) return;
    try {
      const { data, error } = await getHarvestsByOwner(user.id);
      if (error) throw error;
      setHarvests(data || []);
    } catch (err) {
      console.error('Erreur récoltes:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  function resetForm() {
    setCrop(''); setQuantity(''); setRevenue('');
    setHarvestDate(new Date().toISOString().split('T')[0]);
  }

  async function handleCreate() {
    if (!user || !crop || !quantity) {
      Alert.alert('Champs requis', 'Veuillez sélectionner une culture et indiquer la quantité.');
      return;
    }
    setSaving(true);
    const { error } = await createHarvest({
      owner_id:     user.id,
      crop,
      quantity:     parseFloat(quantity),
      revenue:      revenue ? parseFloat(revenue) : null,
      yield:        null,
      harvest_date: harvestDate,
    });
    setSaving(false);
    if (error) {
      Alert.alert('Erreur', 'Impossible d\'enregistrer la récolte.');
      return;
    }
    setShowModal(false);
    resetForm();
    loadHarvests();
  }

  async function handleDelete(id: string) {
    Alert.alert('Supprimer', 'Confirmer la suppression de cette récolte ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer', style: 'destructive',
        onPress: async () => {
          await deleteHarvest(id);
          setHarvests(prev => prev.filter(h => h.id !== id));
        },
      },
    ]);
  }

  // Stats totales
  const totalKg = harvests.reduce((a, h) => a + h.quantity, 0);
  const totalRev = harvests.reduce((a, h) => a + (h.revenue || 0), 0);

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={G} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Suivi des Récoltes</Text>
          <Text style={[styles.headerSub, { color: colors.textSecondary }]}>Historique de vos productions</Text>
        </View>
        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: G }]}
          onPress={() => setShowModal(true)}
        >
          <Ionicons name="add" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Stats */}
      {harvests.length > 0 && (
        <View style={[styles.statsRow, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <View style={styles.stat}>
            <Text style={[styles.statVal, { color: G }]}>{totalKg.toLocaleString()} kg</Text>
            <Text style={[styles.statLbl, { color: colors.textSecondary }]}>Total récolté</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.cardBorder }]} />
          <View style={styles.stat}>
            <Text style={[styles.statVal, { color: colors.success }]}>{totalRev.toLocaleString()} F</Text>
            <Text style={[styles.statLbl, { color: colors.textSecondary }]}>Revenus totaux</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.cardBorder }]} />
          <View style={styles.stat}>
            <Text style={[styles.statVal, { color: colors.text }]}>{harvests.length}</Text>
            <Text style={[styles.statLbl, { color: colors.textSecondary }]}>Récoltes</Text>
          </View>
        </View>
      )}

      <FlatList
        data={harvests}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: Spacing.md, paddingBottom: 20 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadHarvests} tintColor={G} />}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
            onLongPress={() => handleDelete(item.id)}
            activeOpacity={0.8}
          >
            <View style={styles.cardHeader}>
              <View style={[styles.iconBox, { backgroundColor: `${G}15` }]}>
                <Ionicons name="leaf" size={20} color={G} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.cropTitle, { color: colors.text }]}>{item.crop}</Text>
                <Text style={[styles.dateText, { color: colors.textSecondary }]}>
                  {new Date(item.harvest_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                </Text>
              </View>
            </View>

            <View style={[styles.statsRow2, { borderTopColor: colors.cardBorder }]}>
              <View style={styles.statItem}>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Quantité</Text>
                <Text style={[styles.statValue, { color: colors.text }]}>{item.quantity.toLocaleString()} kg</Text>
              </View>
              {item.revenue ? (
                <View style={styles.statItem}>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Revenu</Text>
                  <Text style={[styles.statValue, { color: colors.success }]}>{item.revenue.toLocaleString()} F</Text>
                </View>
              ) : null}
              {item.yield ? (
                <View style={styles.statItem}>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Rendement</Text>
                  <Text style={[styles.statValue, { color: colors.text }]}>{item.yield} t/ha</Text>
                </View>
              ) : null}
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="basket-outline" size={64} color={colors.cardBorder} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Aucune récolte enregistrée.</Text>
            <Text style={[styles.emptyHint, { color: colors.textSecondary }]}>Appuyez sur + pour en ajouter une.</Text>
          </View>
        }
      />

      {/* ── Modal ajout ── */}
      <Modal visible={showModal} transparent animationType="slide" onRequestClose={() => setShowModal(false)}>
        <View style={mod.overlay}>
          <View style={[mod.sheet, { backgroundColor: colors.card }]}>
            <View style={mod.sheetHeader}>
              <Text style={[mod.title, { color: colors.text }]}>Nouvelle récolte</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Culture */}
            <Text style={[mod.label, { color: colors.textSecondary }]}>Culture *</Text>
            <View style={mod.catWrap}>
              {CULTURES.map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[mod.catPill, {
                    backgroundColor: crop === c ? G : colors.backgroundElement,
                    borderColor: crop === c ? G : colors.cardBorder,
                  }]}
                  onPress={() => setCrop(c)}
                >
                  <Text style={[mod.catText, { color: crop === c ? '#fff' : colors.textSecondary }]}>{c}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Quantité */}
            <Text style={[mod.label, { color: colors.textSecondary }]}>Quantité (kg) *</Text>
            <TextInput
              style={[mod.input, { color: colors.text, backgroundColor: colors.backgroundElement, borderColor: colors.cardBorder }]}
              placeholder="Ex: 250"
              placeholderTextColor={colors.textSecondary}
              keyboardType="numeric"
              value={quantity}
              onChangeText={setQuantity}
            />

            {/* Revenu */}
            <Text style={[mod.label, { color: colors.textSecondary }]}>Revenu obtenu (FCFA, optionnel)</Text>
            <TextInput
              style={[mod.input, { color: colors.text, backgroundColor: colors.backgroundElement, borderColor: colors.cardBorder }]}
              placeholder="Ex: 75000"
              placeholderTextColor={colors.textSecondary}
              keyboardType="numeric"
              value={revenue}
              onChangeText={setRevenue}
            />

            {/* Date */}
            <Text style={[mod.label, { color: colors.textSecondary }]}>Date de récolte (AAAA-MM-JJ) *</Text>
            <TextInput
              style={[mod.input, { color: colors.text, backgroundColor: colors.backgroundElement, borderColor: colors.cardBorder }]}
              placeholder="2025-06-20"
              placeholderTextColor={colors.textSecondary}
              value={harvestDate}
              onChangeText={setHarvestDate}
            />

            <TouchableOpacity
              style={[mod.saveBtn, { backgroundColor: G }]}
              onPress={handleCreate}
            >
              {saving
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={mod.saveBtnText}>Enregistrer la récolte</Text>
              }
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:   { flex: 1 },
  center:      { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.md, marginBottom: 8 },
  headerTitle: { fontSize: 22, fontWeight: '900' },
  headerSub:   { fontSize: 13, marginTop: 3 },
  addBtn:      { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },

  statsRow:     { marginHorizontal: Spacing.md, marginBottom: 16, flexDirection: 'row', borderRadius: Radius.lg, borderWidth: 1, paddingVertical: 14 },
  stat:         { flex: 1, alignItems: 'center' },
  statVal:      { fontSize: 16, fontWeight: '800' },
  statLbl:      { fontSize: 10, marginTop: 3 },
  statDivider:  { width: 1, height: '80%', alignSelf: 'center' },

  card:         { padding: 16, borderRadius: Radius.lg, marginBottom: 12, borderWidth: 1 },
  cardHeader:   { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  iconBox:      { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  cropTitle:    { fontSize: 16, fontWeight: '800' },
  dateText:     { fontSize: 11, marginTop: 2 },
  statsRow2:    { flexDirection: 'row', gap: 20, borderTopWidth: 0.5, paddingTop: 12 },
  statItem:     { flex: 1 },
  statLabel:    { fontSize: 10, fontWeight: '600', textTransform: 'uppercase' },
  statValue:    { fontSize: 14, fontWeight: '700', marginTop: 2 },

  emptyContainer: { alignItems: 'center', marginTop: 80, gap: 8 },
  emptyText:    { fontSize: 16 },
  emptyHint:    { fontSize: 13 },
});

const mod = StyleSheet.create({
  overlay:     { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet:       { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 40 },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title:       { fontSize: 18, fontWeight: '900' },
  label:       { fontSize: 12, fontWeight: '600', marginBottom: 6, marginTop: 12 },
  input:       { borderRadius: 10, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 11, fontSize: 14 },
  catWrap:     { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginBottom: 4 },
  catPill:     { borderRadius: 20, borderWidth: 1, paddingHorizontal: 11, paddingVertical: 6 },
  catText:     { fontSize: 12, fontWeight: '600' },
  saveBtn:     { borderRadius: Radius.lg, paddingVertical: 15, alignItems: 'center', marginTop: 20 },
  saveBtnText: { color: '#fff', fontSize: 15, fontWeight: '800' },
});
