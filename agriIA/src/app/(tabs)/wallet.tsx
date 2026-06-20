import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Modal, RefreshControl, TextInput, useColorScheme
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, Radius } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { getOrCreateWallet, WalletRow } from '@/services/database/marketplace';
import { supabase } from '@/lib/supabase';

interface WalletTransaction {
  id: string;
  wallet_id: string;
  type: 'deposit' | 'withdrawal' | 'payment' | 'receive';
  amount: number;
  description: string | null;
  reference: string | null;
  status: 'pending' | 'completed' | 'failed';
  created_at: string;
}

const TRANSACTION_CONFIG = {
  deposit: { label: 'Dépôt', icon: 'arrow-down-circle', color: '#22c55e' },
  withdrawal: { label: 'Retrait', icon: 'arrow-up-circle', color: '#ef4444' },
  payment: { label: 'Paiement', icon: 'card', color: '#f59e0b' },
  receive: { label: 'Reçu', icon: 'cash', color: '#22c55e' },
};

export default function WalletScreen() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const colors = isDark ? Colors.dark : Colors.light;
  const G = colors.primary;

  const { user } = useAuth();
  const [wallet, setWallet] = useState<WalletRow | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [rechargeAmount, setRechargeAmount] = useState('');

  useEffect(() => {
    loadWalletData();
  }, [user]);

  async function loadWalletData() {
    if (!user) return;
    setRefreshing(true);
    
    try {
      // 1. Load wallet
      const { data: w, error: wError } = await getOrCreateWallet(user.id);
      if (wError) throw wError;
      setWallet(w);

      // 2. Load transactions
      if (w) {
        const { data: txs, error: txError } = await supabase
          .from('wallet_transactions')
          .select('*')
          .eq('wallet_id', w.id)
          .order('created_at', { ascending: false })
          .limit(50);

        if (!txError && txs) {
          setTransactions(txs as WalletTransaction[]);
        }
      }
    } catch (err) {
      console.error('Erreur wallet:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  const handleRecharge = async () => {
    if (!wallet || !rechargeAmount) return;
    
    const amount = parseFloat(rechargeAmount);
    if (isNaN(amount) || amount <= 0) {
      alert('Montant invalide');
      return;
    }

    setRefreshing(true);

    try {
      // 1. Update wallet balance
      const newBalance = wallet.balance + amount;
      const { error: updateError } = await supabase
        .from('wallets')
        .update({ balance: newBalance })
        .eq('id', wallet.id);

      if (updateError) throw updateError;

      // 2. Log transaction
      const { error: txError } = await supabase
        .from('wallet_transactions')
        .insert([{
          wallet_id: wallet.id,
          type: 'deposit',
          amount,
          description: 'Recharge Mobile Money (Simulation)',
          reference: `DEP-${Date.now()}`,
          status: 'completed',
        }]);

      if (txError) throw txError;

      setModalVisible(false);
      setRechargeAmount('');
      loadWalletData();
      alert(`Recharge de ${amount.toLocaleString()} FCFA effectuée avec succès !`);
    } catch (err: any) {
      alert('Erreur de recharge: ' + err.message);
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <View style={[s.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={G} />
      </View>
    );
  }

  if (!wallet) {
    return (
      <View style={[s.center, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.textSecondary }}>Impossible de charger le portefeuille</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={[s.root, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Top Bar */}
      <View style={s.topBar}>
        <View style={[s.topBarIcon, { backgroundColor: G }]}>
          <Ionicons name="wallet" size={16} color="#fff" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[s.topTitle, { color: colors.text }]}>Mon Portefeuille</Text>
          <Text style={[s.topSub, { color: colors.textSecondary }]}>Mobile Money {wallet.carrier}</Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadWalletData} tintColor={G} />}
      >
        {/* Wallet Balance Card */}
        <View style={[s.balanceCard, { backgroundColor: G }]}>
          <View style={s.balanceHeader}>
            <View>
              <Text style={s.balanceLabel}>Solde disponible</Text>
              <Text style={s.balancePhone}>📞 {wallet.phone}</Text>
            </View>
            <View style={s.carrierBadge}>
              <Text style={s.carrierText}>{wallet.carrier}</Text>
            </View>
          </View>
          
          <Text style={s.balanceAmount}>{wallet.balance.toLocaleString()} FCFA</Text>
          
          <View style={s.simulBadge}>
            <Ionicons name="information-circle" size={12} color="#fff" />
            <Text style={s.simulText}>Mode Simulation</Text>
          </View>

          <TouchableOpacity style={s.rechargeBtn} onPress={() => setModalVisible(true)}>
            <Ionicons name="add-circle" size={18} color={G} />
            <Text style={s.rechargeBtnText}>Recharger</Text>
          </TouchableOpacity>
        </View>

        {/* Transactions History */}
        <Text style={[s.sectionTitle, { color: colors.text }]}>
          Historique des transactions ({transactions.length})
        </Text>

        {transactions.length === 0 ? (
          <View style={[s.emptyState, { borderColor: colors.cardBorder }]}>
            <Ionicons name="receipt-outline" size={42} color={colors.textSecondary} />
            <Text style={[s.emptyText, { color: colors.textSecondary }]}>
              Aucune transaction enregistrée
            </Text>
          </View>
        ) : (
          transactions.map((tx) => {
            const config = TRANSACTION_CONFIG[tx.type];
            const isPositive = tx.type === 'deposit' || tx.type === 'receive';
            
            return (
              <View
                key={tx.id}
                style={[s.txCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
              >
                <View style={[s.txIcon, { backgroundColor: `${config.color}15` }]}>
                  <Ionicons name={config.icon as any} size={20} color={config.color} />
                </View>

                <View style={s.txInfo}>
                  <Text style={[s.txLabel, { color: colors.text }]}>{config.label}</Text>
                  <Text style={[s.txDesc, { color: colors.textSecondary }]} numberOfLines={1}>
                    {tx.description || 'Transaction'}
                  </Text>
                  <Text style={[s.txDate, { color: colors.textSecondary }]}>
                    {new Date(tx.created_at).toLocaleDateString('fr-FR', { 
                      day: 'numeric', 
                      month: 'short', 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </Text>
                </View>

                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={[s.txAmount, { color: isPositive ? colors.success : colors.danger }]}>
                    {isPositive ? '+' : '-'} {tx.amount.toLocaleString()}
                  </Text>
                  <View style={[s.statusBadge, { 
                    backgroundColor: tx.status === 'completed' ? `${colors.success}15` : 
                                     tx.status === 'pending' ? `${colors.warning}15` : 
                                     `${colors.danger}15` 
                  }]}>
                    <Text style={[s.statusText, { 
                      color: tx.status === 'completed' ? colors.success : 
                             tx.status === 'pending' ? colors.warning : 
                             colors.danger 
                    }]}>
                      {tx.status === 'completed' ? '✓' : tx.status === 'pending' ? '⏳' : '✗'}
                    </Text>
                  </View>
                </View>
              </View>
            );
          })
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Recharge Modal */}
      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <View style={s.modalOverlay}>
          <View style={[s.modalSheet, { backgroundColor: colors.card }]}>
            <View style={[s.modalHandle, { backgroundColor: colors.cardBorder }]} />
            
            <Text style={[s.modalTitle, { color: colors.text }]}>Recharger le portefeuille</Text>
            <Text style={[s.modalSub, { color: colors.textSecondary }]}>
              Mode simulation - Aucun paiement réel
            </Text>

            <View style={s.quickAmounts}>
              {[5000, 10000, 25000, 50000].map((amt) => (
                <TouchableOpacity
                  key={amt}
                  style={[s.quickBtn, { backgroundColor: colors.backgroundElement, borderColor: colors.cardBorder }]}
                  onPress={() => setRechargeAmount(amt.toString())}
                >
                  <Text style={[s.quickBtnText, { color: colors.text }]}>
                    {(amt / 1000).toFixed(0)}k
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[s.inputLabel, { color: colors.text }]}>Montant personnalisé (FCFA)</Text>
            <TextInput
              style={[s.input, { backgroundColor: colors.backgroundElement, color: colors.text, borderColor: colors.cardBorder }]}
              placeholder="Ex: 15000"
              placeholderTextColor={colors.textSecondary}
              keyboardType="numeric"
              value={rechargeAmount}
              onChangeText={setRechargeAmount}
            />

            <View style={s.modalActions}>
              <TouchableOpacity 
                style={[s.btnSubmit, { backgroundColor: G }]} 
                onPress={handleRecharge}
                disabled={!rechargeAmount}
              >
                <Ionicons name="checkmark-circle" size={16} color="#fff" />
                <Text style={s.btnSubmitText}>Confirmer la recharge</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[s.btnCancel, { borderColor: colors.cardBorder }]} 
                onPress={() => setModalVisible(false)}
              >
                <Text style={[s.btnCancelText, { color: colors.textSecondary }]}>Annuler</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  topBar: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: Spacing.md, paddingTop: Spacing.sm, paddingBottom: Spacing.md },
  topBarIcon: { borderRadius: 10, padding: 8 },
  topTitle: { fontSize: 20, fontWeight: '900' },
  topSub: { fontSize: 11, marginTop: 2 },

  scrollContent: { paddingHorizontal: Spacing.md, paddingTop: Spacing.sm },
  
  balanceCard: { borderRadius: Radius.lg, padding: 20, marginBottom: 20, gap: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 6 },
  balanceHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  balanceLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: '600' },
  balancePhone: { color: '#fff', fontSize: 11, fontWeight: '700', marginTop: 2 },
  carrierBadge: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  carrierText: { color: '#fff', fontSize: 11, fontWeight: '800' },
  balanceAmount: { color: '#fff', fontSize: 36, fontWeight: '900', marginTop: 4 },
  simulBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.15)', alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  simulText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  rechargeBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#fff', borderRadius: 10, paddingVertical: 12, marginTop: 8 },
  rechargeBtnText: { fontSize: 14, fontWeight: '800' },

  sectionTitle: { fontSize: 16, fontWeight: '800', marginBottom: 12 },
  
  emptyState: { alignItems: 'center', padding: 40, borderStyle: 'dashed', borderWidth: 1.5, borderRadius: Radius.lg, marginTop: 10 },
  emptyText: { fontSize: 12, marginTop: 8 },

  txCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: Radius.md, borderWidth: 1, marginBottom: 10 },
  txIcon: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  txInfo: { flex: 1, gap: 2 },
  txLabel: { fontSize: 14, fontWeight: '700' },
  txDesc: { fontSize: 11 },
  txDate: { fontSize: 10 },
  txAmount: { fontSize: 16, fontWeight: '900', marginBottom: 4 },
  statusBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  statusText: { fontSize: 10, fontWeight: '700' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalSheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 30 },
  modalHandle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 12 },
  modalTitle: { fontSize: 18, fontWeight: '900', marginBottom: 4 },
  modalSub: { fontSize: 12, marginBottom: 16 },
  
  quickAmounts: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  quickBtn: { flex: 1, borderWidth: 1, borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  quickBtnText: { fontSize: 13, fontWeight: '700' },
  
  inputLabel: { fontSize: 12, fontWeight: '700', marginBottom: 6 },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, marginBottom: 16 },
  
  modalActions: { gap: 8 },
  btnSubmit: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: 10, paddingVertical: 12 },
  btnSubmitText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  btnCancel: { borderRadius: 10, borderWidth: 1, paddingVertical: 12, alignItems: 'center' },
  btnCancelText: { fontSize: 14, fontWeight: '700' },
});