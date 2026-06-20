import React, { useEffect, useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, FlatList, ActivityIndicator,
  SafeAreaView, RefreshControl, TouchableOpacity, Modal, TextInput, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius } from '@/constants/theme';
import { useAppTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import {
  getFinancesByOwner, createFinanceTransaction, deleteFinanceTransaction,
  FinanceRow, FinanceType,
} from '@/services/database/finances';

const CATEGORIES_INCOME  = ['Vente récolte', 'Subvention', 'Prêt', 'Autre revenu'];
const CATEGORIES_EXPENSE = ['Semences', 'Engrais', 'Pesticides', 'Main d\'œuvre', 'Carburant', 'Équipement', 'Transport', 'Autre dépense'];

export default function FinancesScreen() {
  const { isDark } = useAppTheme();
  const colors = isDark ? Colors.dark : Colors.light;
  const G = colors.primary;
  const { user } = useAuth();

  const [transactions, setTransactions]   = useState<FinanceRow[]>([]);
  const [loading, setLoading]             = useState(true);
  const [refreshing, setRefreshing]       = useState(false);
  const [showModal, setShowModal]         = useState(false);
  const [saving, setSaving]               = useState(false);

  // Form
  const [type,     setType]     = useState<FinanceType>('income');
  const [amount,   setAmount]   = useState('');
  const [category, setCategory] = useState('');
  const [notes,    setNotes]    = useState('');
  const [date,     setDate]     = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => { loadFinances(); }, [user]);

  async function loadFinances() {
    if (!user) return;
    try {
      const { data, error } = await getFinancesByOwner(user.id);
      if (error) throw error;
      setTransactions(data || []);
    } catch (err) {
      console.error('Erreur finances:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  const totalBalance = useMemo(() =>
    transactions.reduce((acc, t) => t.type === 'income' ? acc + t.amount : acc - t.amount, 0),
  [transactions]);

  const totalIncome  = useMemo(() => transactions.filter(t => t.type === 'income').reduce((a, t) => a + t.amount, 0), [transactions]);
  const totalExpense = useMemo(() => transactions.filter(t => t.type === 'expense').reduce((a, t) => a + t.amount, 0), [transactions]);

  function resetForm() {
    setType('income'); setAmount(''); setCategory(''); setNotes('');
    setDate(new Date().toISOString().split('T')[0]);
  }

  async function handleCreate() {
    if (!user || !amount || !category) {
      Alert.alert('Champs requis', 'Veuillez renseigner le montant et la catégorie.');
      return;
    }
    setSaving(true);
    const { error } = await createFinanceTransaction({
      owner_id: user.id,
      type,
      amount: parseFloat(amount),
      category,
      notes: notes || null,
      transaction_date: date,
    });
    setSaving(false);
    if (error) {
      Alert.alert('Erreur', 'Impossible d\'enregistrer la transaction.');
      return;
    }
    setShowModal(false);
    resetForm();
    loadFinances();
  }

  async function handleDelete(id: string) {
    Alert.alert('Supprimer', 'Confirmer la suppression de cette transaction ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer', style: 'destructive',
        onPress: async () => {
          await deleteFinanceTransaction(id);
          setTransactions(prev => prev.filter(t => t.id !== id));
        },
      },
    ]);
  }

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={G} />
      </View>
    );
  }

  const categories = type === 'income' ? CATEGORIES_INCOME : CATEGORIES_EXPENSE;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Gestion Financière</Text>
        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: G }]}
          onPress={() => setShowModal(true)}
        >
          <Ionicons name="add" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Carte solde */}
      <View style={[styles.balanceCard, { backgroundColor: G }]}>
        <Text style={styles.balanceLabel}>Solde actuel</Text>
        <Text style={styles.balanceAmount}>{totalBalance.toLocaleString()} FCFA</Text>
        <View style={styles.balanceRow}>
          <View style={styles.balanceStat}>
            <Ionicons name="arrow-down-circle" size={14} color="rgba(255,255,255,0.8)" />
            <Text style={styles.balanceStatText}>+{totalIncome.toLocaleString()} F</Text>
          </View>
          <View style={styles.balanceStat}>
            <Ionicons name="arrow-up-circle" size={14} color="rgba(255,255,255,0.8)" />
            <Text style={styles.balanceStatText}>-{totalExpense.toLocaleString()} F</Text>
          </View>
        </View>
      </View>

      <Text style={[styles.sectionTitle, { color: colors.text }]}>Transactions</Text>

      <FlatList
        data={transactions}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: Spacing.md, paddingBottom: 20 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadFinances} tintColor={G} />}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
            onLongPress={() => handleDelete(item.id)}
            activeOpacity={0.8}
          >
            <View style={[styles.iconWrapper, { backgroundColor: item.type === 'income' ? `${colors.success}15` : `${colors.danger}15` }]}>
              <Ionicons
                name={item.type === 'income' ? 'arrow-down-circle' : 'arrow-up-circle'}
                size={22}
                color={item.type === 'income' ? colors.success : colors.danger}
              />
            </View>
            <View style={styles.details}>
              <Text style={[styles.txLabel, { color: colors.text }]}>{item.category}</Text>
              {item.notes ? <Text style={[styles.txNote, { color: colors.textSecondary }]} numberOfLines={1}>{item.notes}</Text> : null}
              <Text style={[styles.txDate, { color: colors.textSecondary }]}>
                {new Date(item.transaction_date).toLocaleDateString('fr-FR')}
              </Text>
            </View>
            <Text style={[styles.txAmount, { color: item.type === 'income' ? colors.success : colors.danger }]}>
              {item.type === 'income' ? '+' : '-'}{item.amount.toLocaleString()} F
            </Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="wallet-outline" size={56} color={colors.cardBorder} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Aucune transaction.</Text>
            <Text style={[styles.emptyHint, { color: colors.textSecondary }]}>Appuyez sur + pour en ajouter une.</Text>
          </View>
        }
      />

      {/* ── Modal ajout ── */}
      <Modal visible={showModal} transparent animationType="slide" onRequestClose={() => setShowModal(false)}>
        <View style={mod.overlay}>
          <View style={[mod.sheet, { backgroundColor: colors.card }]}>
            <View style={mod.sheetHeader}>
              <Text style={[mod.title, { color: colors.text }]}>Nouvelle transaction</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Type */}
            <View style={mod.typeRow}>
              {(['income', 'expense'] as FinanceType[]).map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[mod.typeBtn, {
                    backgroundColor: type === t
                      ? (t === 'income' ? `${colors.success}15` : `${colors.danger}15`)
                      : colors.backgroundElement,
                    borderColor: type === t
                      ? (t === 'income' ? colors.success : colors.danger)
                      : colors.cardBorder,
                  }]}
                  onPress={() => { setType(t); setCategory(''); }}
                >
                  <Ionicons
                    name={t === 'income' ? 'arrow-down-circle-outline' : 'arrow-up-circle-outline'}
                    size={16}
                    color={type === t ? (t === 'income' ? colors.success : colors.danger) : colors.textSecondary}
                  />
                  <Text style={[mod.typeBtnText, { color: type === t ? (t === 'income' ? colors.success : colors.danger) : colors.textSecondary }]}>
                    {t === 'income' ? 'Revenu' : 'Dépense'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Montant */}
            <Text style={[mod.label, { color: colors.textSecondary }]}>Montant (FCFA)</Text>
            <TextInput
              style={[mod.input, { color: colors.text, backgroundColor: colors.backgroundElement, borderColor: colors.cardBorder }]}
              placeholder="Ex: 50000"
              placeholderTextColor={colors.textSecondary}
              keyboardType="numeric"
              value={amount}
              onChangeText={setAmount}
            />

            {/* Catégorie */}
            <Text style={[mod.label, { color: colors.textSecondary }]}>Catégorie</Text>
            <View style={mod.catWrap}>
              {categories.map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[mod.catPill, {
                    backgroundColor: category === c ? G : colors.backgroundElement,
                    borderColor: category === c ? G : colors.cardBorder,
                  }]}
                  onPress={() => setCategory(c)}
                >
                  <Text style={[mod.catText, { color: category === c ? '#fff' : colors.textSecondary }]}>{c}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Notes */}
            <Text style={[mod.label, { color: colors.textSecondary }]}>Notes (optionnel)</Text>
            <TextInput
              style={[mod.input, { color: colors.text, backgroundColor: colors.backgroundElement, borderColor: colors.cardBorder }]}
              placeholder="Description, remarque..."
              placeholderTextColor={colors.textSecondary}
              value={notes}
              onChangeText={setNotes}
            />

            {/* Date */}
            <Text style={[mod.label, { color: colors.textSecondary }]}>Date (AAAA-MM-JJ)</Text>
            <TextInput
              style={[mod.input, { color: colors.text, backgroundColor: colors.backgroundElement, borderColor: colors.cardBorder }]}
              placeholder="2025-06-20"
              placeholderTextColor={colors.textSecondary}
              value={date}
              onChangeText={setDate}
            />

            <TouchableOpacity
              style={[mod.saveBtn, { backgroundColor: G }]}
              onPress={handleCreate}
            >
              {saving
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={mod.saveBtnText}>Enregistrer</Text>
              }
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1 },
  center:       { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.md },
  headerTitle:  { fontSize: 22, fontWeight: '900' },
  addBtn:       { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  balanceCard:  { marginHorizontal: Spacing.md, marginBottom: 16, padding: 20, borderRadius: Radius.lg, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 8, elevation: 5 },
  balanceLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: '500' },
  balanceAmount:{ color: '#fff', fontSize: 30, fontWeight: '800', marginTop: 4 },
  balanceRow:   { flexDirection: 'row', gap: 20, marginTop: 12 },
  balanceStat:  { flexDirection: 'row', alignItems: 'center', gap: 5 },
  balanceStatText: { color: 'rgba(255,255,255,0.85)', fontSize: 13, fontWeight: '600' },
  sectionTitle: { fontSize: 18, fontWeight: '700', paddingHorizontal: Spacing.md, marginBottom: 12 },
  card:         { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: Radius.md, borderWidth: 1, marginBottom: 10 },
  iconWrapper:  { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  details:      { flex: 1 },
  txLabel:      { fontSize: 15, fontWeight: '600' },
  txNote:       { fontSize: 11, marginTop: 1 },
  txDate:       { fontSize: 12, marginTop: 2 },
  txAmount:     { fontSize: 15, fontWeight: '700' },
  emptyContainer: { alignItems: 'center', marginTop: 60, opacity: 0.6, gap: 8 },
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
  typeRow:     { flexDirection: 'row', gap: 10, marginBottom: 4 },
  typeBtn:     { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: 10, borderWidth: 1.5, paddingVertical: 10 },
  typeBtnText: { fontSize: 14, fontWeight: '700' },
  catWrap:     { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginBottom: 4 },
  catPill:     { borderRadius: 20, borderWidth: 1, paddingHorizontal: 11, paddingVertical: 6 },
  catText:     { fontSize: 12, fontWeight: '600' },
  saveBtn:     { borderRadius: Radius.lg, paddingVertical: 15, alignItems: 'center', marginTop: 20 },
  saveBtnText: { color: '#fff', fontSize: 15, fontWeight: '800' },
});
