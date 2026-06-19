import React from 'react';
import { ScrollView, StyleSheet, View, Text } from 'react-native';
import { Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from 'react-native';
import { useUser } from '@/context/UserContext';
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
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const { profile } = useUser();

  return (
    <View style={[s.root, { backgroundColor: colors.background }]}>
      <DashboardHeader />
      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
      >
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

  profileBanner:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: 16, borderWidth: 1, padding: 14, marginBottom: 14, gap: 10 },
  profileBannerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  profileBannerTitle:{ fontSize: 13, fontWeight: '700', marginBottom: 2 },
  profileBannerSub:  { fontSize: 11, lineHeight: 15 },
  objectifBadge:     { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, maxWidth: 90 },
  objectifText:      { fontSize: 10, fontWeight: '700', textAlign: 'center', lineHeight: 13 },
});