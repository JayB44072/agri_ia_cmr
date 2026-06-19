import React, { useState, useEffect, useCallback } from 'react';
import { ScrollView, StyleSheet, View, Text, ActivityIndicator } from 'react-native';
import { Spacing, useThemeColors } from '@/constants/theme';
import { useUser } from '@/context/UserContext';
import { useAuth } from '@/context/AuthContext';
import { getPlotsByOwner } from '@/services/database/plots';
import { getFinancesByOwner } from '@/services/database/finances';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import MeteoCard from '@/components/dashboard/MeteoCard';
import SolCard from '@/components/dashboard/SolCard';
import AlertesCard from '@/components/dashboard/AlertesCard';
import ParcellesCard from '@/components/dashboard/ParcellesCard';
import RecommandationsCard from '@/components/dashboard/RecommandationsCard';
import EvolutionChart from '@/components/dashboard/EvolutionChart';
import SectionTitle from '@/components/ui/SectionTitle';
import { Ionicons } from '@expo/vector-icons';

export default function Dashboard(): React.JSX.Element {
  const { colors } = useThemeColors();
  const { profile } = useUser();
  const { user } = useAuth();

  const [plotCount, setPlotCount] = useState(0);
  const [avgHealth, setAvgHealth] = useState(85); // fallback default
  const [balance, setBalance] = useState(0);
  const [agricultureScore, setAgricultureScore] = useState(80);
  const [loading, setLoading] = useState(false);

  const fetchDashboardStats = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    try {
      // 1. Fetch plots
      const { data: plots } = await getPlotsByOwner(user.id);
      if (plots && plots.length > 0) {
        setPlotCount(plots.length);
        const totalHealth = plots.reduce((sum, p) => {
          const val = p.health_status === 'ok' ? 95 : p.health_status === 'warning' ? 70 : 40;
          return sum + val;
        }, 0);
        const calculatedHealth = Math.round(totalHealth / plots.length);
        setAvgHealth(calculatedHealth);
        
        // Dynamic agricultural score formulation
        setAgricultureScore(Math.round(calculatedHealth * 0.8 + Math.min(plots.length * 4, 20)));
      } else {
        setPlotCount(0);
        setAvgHealth(0);
        setAgricultureScore(50);
      }

      // 2. Fetch finances
      const { data: finances } = await getFinancesByOwner(user.id);
      if (finances) {
        const net = finances.reduce((sum, f) => {
          return sum + (f.type === 'income' ? Number(f.amount) : -Number(f.amount));
        }, 0);
        setBalance(net);
      }
    } catch (e) {
      console.error("Dashboard statistics calculation failed:", e);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchDashboardStats();
  }, [fetchDashboardStats]);

  return (
    <View style={[s.root, { backgroundColor: colors.background }]}>
      <DashboardHeader />
      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Premium Dashboard Metrics Panel */}
        <View style={[s.premiumStatsCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <View style={s.premiumHeader}>
            <Ionicons name="shield-checkmark" size={18} color={colors.primary} />
            <Text style={[s.premiumTitle, { color: colors.text }]}>AgriSmart Premium Bilan</Text>
            {loading && <ActivityIndicator size="small" color={colors.primary} style={{ marginLeft: 'auto' }} />}
          </View>

          <View style={s.statsContainer}>
            <View style={s.statBox}>
              <Text style={[s.statVal, { color: colors.primary }]}>{agricultureScore}/100</Text>
              <Text style={[s.statLbl, { color: colors.textSecondary }]}>Score IA Agricole</Text>
            </View>

            <View style={[s.statBox, { borderLeftWidth: 1, borderRightWidth: 1, borderColor: colors.cardBorder }]}>
              <Text style={[s.statVal, { color: avgHealth > 75 ? colors.success : avgHealth > 50 ? '#f5a623' : colors.danger }]}>
                {plotCount > 0 ? `${avgHealth}%` : '—'}
              </Text>
              <Text style={[s.statLbl, { color: colors.textSecondary }]}>Santé des Sols</Text>
            </View>

            <View style={s.statBox}>
              <Text style={[s.statVal, { color: balance >= 0 ? colors.success : colors.danger }]} numberOfLines={1}>
                {balance.toLocaleString()}
              </Text>
              <Text style={[s.statLbl, { color: colors.textSecondary }]}>Bilan (FCFA)</Text>
            </View>
          </View>
        </View>

        {/* Bannière profil IA si profil disponible */}
        {profile && (
          <View style={[s.profileBanner, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <View style={s.profileBannerLeft}>
              <Ionicons name="analytics-outline" size={20} color={colors.primary} />
              <View style={{ flex: 1 }}>
                <Text style={[s.profileBannerTitle, { color: colors.text }]}>
                  IA calibrée pour votre profil
                </Text>
                <Text style={[s.profileBannerSub, { color: colors.textSecondary }]}>
                  {profile.cultures.slice(0, 3).join(', ')}
                  {profile.cultures.length > 3 ? ` +${profile.cultures.length - 3}` : ''} · {profile.zoneClimatique}
                </Text>
              </View>
            </View>
            <View style={[s.objectifBadge, { backgroundColor: `${colors.primary}20` }]}>
              <Text style={[s.objectifText, { color: colors.primary }]} numberOfLines={2}>
                {profile.objectif?.split(' ').slice(0, 2).join(' ')}
              </Text>
            </View>
          </View>
        )}

        <SectionTitle title="🌦️ Météo du jour" />
        <MeteoCard />

        <SectionTitle title="🌱 État du sol" />
        <SolCard />

        <SectionTitle title="📈 Évolution des cultures" />
        <EvolutionChart />

        <SectionTitle
          title="🔔 Alertes IA"
          actionLabel="Tout voir"
          onAction={() => {}}
        />
        <AlertesCard />

        <SectionTitle
          title="🗺️ Mes parcelles"
          actionLabel="Tout voir"
          onAction={() => {}}
        />
        <ParcellesCard />

        <SectionTitle
          title="🤖 Recommandations IA"
          actionLabel="Tout voir"
          onAction={() => {}}
        />
        <RecommandationsCard />

        <View style={{ height: Spacing.xxl }} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root:    { flex: 1 },
  scroll:  { flex: 1 },
  content: { paddingHorizontal: Spacing.md, paddingTop: Spacing.md },

  premiumStatsCard: { borderRadius: 16, borderWidth: 1, padding: 14, marginBottom: 14, gap: 12 },
  premiumHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  premiumTitle: { fontSize: 13, fontWeight: '800' },
  statsContainer: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', paddingTop: 6 },
  statBox: { flex: 1, alignItems: 'center', gap: 2, paddingHorizontal: 4 },
  statVal: { fontSize: 18, fontWeight: '900' },
  statLbl: { fontSize: 10, textAlign: 'center' },

  profileBanner:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: 16, borderWidth: 1, padding: 14, marginBottom: 14, gap: 10 },
  profileBannerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  profileBannerTitle:{ fontSize: 13, fontWeight: '700', marginBottom: 2 },
  profileBannerSub:  { fontSize: 11, lineHeight: 15 },
  objectifBadge:     { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, maxWidth: 90 },
  objectifText:      { fontSize: 10, fontWeight: '700', textAlign: 'center', lineHeight: 13 },
});