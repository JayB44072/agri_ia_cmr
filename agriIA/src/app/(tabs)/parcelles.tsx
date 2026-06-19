import React, { useState, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Animated, RefreshControl, StatusBar,
} from 'react-native';
import { useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, Shadows } from '@/constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PARCELLES_INIT, Parcelle, EMOJIS_CULTURE, StatutParcelle } from '@/components/data/parcellesData';
import ParcelleHeader      from '@/components/parcelles/parcelleHeader';
import ParcelleMap         from '@/components/parcelles/parcelleMap';
import ParcelleStatsBar    from '@/components/parcelles/ParcelleStatsBar';
import ParcelleListItem    from '@/components/parcelles/ParcelleListItem';
import ParcelleDetailModal from '@/components/parcelles/ParcelleDetailModal';
import ParcelleFormModal   from '@/components/parcelles/ParcelleFormModal';
import { useAuth } from '@/context/AuthContext';
import { getPlotsByOwner, createPlot, updatePlot, deletePlot, PlotRow } from '@/services/database/plots';
import { useEffect } from 'react';

function mapPlotRowToParcelle(row: PlotRow): Parcelle {
  const healthToStatut: Record<string, StatutParcelle> = {
    ok: 'ok',
    warning: 'warning',
    critical: 'critical',
  };
  const statut = healthToStatut[row.health_status] || 'ok';
  
  const colors = {
    ok: '#22c55e',
    warning: '#f97316',
    critical: '#ef4444',
  };

  const crop = row.crop;
  const emoji = EMOJIS_CULTURE[crop] || '🌱';

  return {
    id: row.id,
    nom: row.name,
    culture: crop,
    emoji,
    surface: Number(row.area),
    stade: 'Croissance',
    sante: statut === 'ok' ? 90 : statut === 'warning' ? 70 : 45,
    rendementPrevu: 4.5,
    dernierArrosage: 'Il y a 3h',
    prochaineTache: statut === 'ok' ? 'Surveiller croissance' : 'Vérifier capteurs',
    prioriteTache: statut === 'ok' ? 'conseil' : 'urgent',
    couleur: colors[statut],
    statut,
    typeSol: row.soil_type || 'Argileux',
    localisation: {
      ville: 'Yaoundé',
      region: 'Centre',
      lat: Number(row.latitude) || 3.84,
      lng: Number(row.longitude) || 11.50,
    },
    capteur: {
      humidite: statut === 'ok' ? 68 : statut === 'warning' ? 52 : 39,
      temperature: 28.4,
      ph: 6.5,
      azote: 15,
      statut: statut === 'ok' ? 'ok' : statut === 'warning' ? 'attention' : 'critique',
    },
    mapX: 20 + Math.random() * 60,
    mapY: 20 + Math.random() * 60,
    lat: Number(row.latitude) || 3.84,
    lng: Number(row.longitude) || 11.50,
  };
}

// ← aligné sur ParcelleStatsBar
type FilterType = 'toutes' | 'ok' | 'warning' | 'critical';

export default function ParcellesScreen(): React.JSX.Element {
  const scheme = useColorScheme();
  const dark   = scheme === 'dark';
  const colors = Colors[dark ? 'dark' : 'light'];
  const insets = useSafeAreaInsets();
  const G      = Colors.splash.green;

  const { user } = useAuth();
  const [parcelles, setParcelles]       = useState<Parcelle[]>([]);
  const [filter, setFilter]             = useState<FilterType>('toutes');

  const loadPlots = useCallback(async () => {
    if (!user) return;
    setRefreshing(true);
    const { data, error } = await getPlotsByOwner(user.id);
    setRefreshing(false);
    if (error) {
      alert("Erreur de chargement des parcelles: " + error.message);
      return;
    }
    if (data) {
      setParcelles(data.map(mapPlotRowToParcelle));
    }
  }, [user]);

  useEffect(() => {
    loadPlots();
  }, [loadPlots]);
  const [search, setSearch]             = useState('');
  const [selectedParcelle, setSelected] = useState<Parcelle | null>(null);
  const [editParcelle, setEditParcelle] = useState<Parcelle | null>(null);
  const [showDetail, setShowDetail]     = useState(false);
  const [showForm, setShowForm]         = useState(false);
  const [refreshing, setRefreshing]     = useState(false);
  const [mapExpanded, setMapExpanded]   = useState(false);

  const fabAnim = useRef(new Animated.Value(1)).current;

  // ── Filtres ────────────────────────────────────────────────────────────────
  const filtered = parcelles.filter(p => {
    const matchFilter =
      filter === 'toutes'   ||
      (filter === 'ok'       && p.statut === 'ok')       ||
      (filter === 'warning'  && p.statut === 'warning')  ||
      (filter === 'critical' && p.statut === 'critical');
    const matchSearch =
      search.length === 0 ||
      p.nom.toLowerCase().includes(search.toLowerCase()) ||
      p.culture.toLowerCase().includes(search.toLowerCase()) ||
      (p.localisation?.ville ?? '').toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  // ── Stats ──────────────────────────────────────────────────────────────────
  const stats = {
    total:      parcelles.length,
    ok:         parcelles.filter(p => p.statut === 'ok').length,
    warning:    parcelles.filter(p => p.statut === 'warning').length,
    critical:   parcelles.filter(p => p.statut === 'critical').length,
    superficie: parcelles.reduce((sum, p) => sum + p.surface, 0).toFixed(1),
  };

  // Stats pour le header
  const totalSurface   = stats.superficie;
  const avgSante       = Math.round(parcelles.reduce((s, p) => s + p.sante, 0) / (parcelles.length || 1));
  const alertCount     = parcelles.filter(p => p.capteur.statut !== 'ok').length;
  const totalRendement = parcelles.reduce((s, p) => s + p.rendementPrevu * p.surface, 0).toFixed(1);

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleRefresh = useCallback(() => {
    loadPlots();
  }, [loadPlots]);

  const handleSelectParcelle = (p: Parcelle) => { setSelected(p); setShowDetail(true); };

  const handleAddParcelle = () => {
    setEditParcelle(null);
    setShowForm(true);
    Animated.sequence([
      Animated.timing(fabAnim, { toValue: 0.85, duration: 100, useNativeDriver: true }),
      Animated.spring(fabAnim, { toValue: 1, useNativeDriver: true, tension: 200, friction: 8 }),
    ]).start();
  };

  const handleEdit = (p: Parcelle) => {
    setShowDetail(false);
    setTimeout(() => { setEditParcelle(p); setShowForm(true); }, 350);
  };

  const handleSave = async (data: Partial<Parcelle>) => {
    if (!user) return;
    if (editParcelle) {
      const updatedRow = {
        name: data.nom ?? editParcelle.nom,
        crop: data.culture ?? editParcelle.culture,
        area: data.surface ?? editParcelle.surface,
        soil_type: data.typeSol ?? editParcelle.typeSol ?? 'Argileux',
        latitude: data.localisation?.lat ?? editParcelle.localisation?.lat ?? 3.84,
        longitude: data.localisation?.lng ?? editParcelle.localisation?.lng ?? 11.50,
        health_status: (data.statut ?? editParcelle.statut) as any,
      };
      const { error } = await updatePlot(editParcelle.id, updatedRow);
      if (error) {
        alert("Erreur de mise à jour: " + error.message);
        return;
      }
      loadPlots();
    } else {
      const newRow = {
        owner_id: user.id,
        name: data.nom ?? 'Nouvelle parcelle',
        crop: data.culture ?? 'Maïs',
        area: data.surface ?? 1.0,
        soil_type: data.typeSol ?? 'Argileux',
        latitude: data.localisation?.lat ?? 3.84,
        longitude: data.localisation?.lng ?? 11.50,
        health_status: 'ok' as const,
      };
      const { error } = await createPlot(newRow);
      if (error) {
        alert("Erreur d'ajout: " + error.message);
        return;
      }
      loadPlots();
    }
    setShowForm(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await deletePlot(id);
    if (error) {
      alert("Erreur de suppression: " + error.message);
      return;
    }
    loadPlots();
    setShowDetail(false);
  };

  const renderItem = useCallback(({ item, index }: { item: Parcelle; index: number }) => (
    <ParcelleListItem
      parcelle={item}
      index={index}
      onPress={() => handleSelectParcelle(item)}
      onEdit={() => handleEdit(item)}
    />
  ), [parcelles]);

  // ── Header liste (carte + stats bar + section title) ───────────────────────
  const ListHeader = (
    <View>
      <ParcelleMap
        parcelles={filtered.length > 0 ? filtered : parcelles}
        onSelect={handleSelectParcelle}
        onSelectParcelle={handleSelectParcelle}
        expanded={mapExpanded}
        onToggleExpand={() => setMapExpanded(e => !e)}
      />
      {/* ← props alignées sur la nouvelle interface ParcelleStatsBar */}
      <ParcelleStatsBar
        stats={stats}
        filter={filter}
        onFilterChange={setFilter}
        search={search}
        onSearchChange={setSearch}
      />
      <View style={s.sectionHeader}>
        <View>
          <Text style={[s.sectionTitle, { color: colors.text }]}>
            {filtered.length === parcelles.length
              ? `Toutes les parcelles (${parcelles.length})`
              : `${filtered.length} résultat${filtered.length > 1 ? 's' : ''}`}
          </Text>
          <Text style={[s.sectionSub, { color: colors.textSecondary }]}>
            {stats.superficie} ha au total
          </Text>
        </View>
        <TouchableOpacity style={[s.sortBtn, { backgroundColor: colors.backgroundElement }]} activeOpacity={0.75}>
          <Ionicons name="swap-vertical-outline" size={16} color={colors.textSecondary} />
          <Text style={[s.sortText, { color: colors.textSecondary }]}>Trier</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const EmptyState = (
    <View style={s.emptyState}>
      <Text style={s.emptyEmoji}>🌾</Text>
      <Text style={[s.emptyTitle, { color: colors.text }]}>
        {search || filter !== 'toutes' ? 'Aucune parcelle trouvée' : 'Aucune parcelle'}
      </Text>
      <Text style={[s.emptySub, { color: colors.textSecondary }]}>
        {search || filter !== 'toutes'
          ? 'Essayez de modifier vos filtres.'
          : 'Appuyez sur + pour ajouter votre première parcelle.'}
      </Text>
      {!search && filter === 'toutes' && (
        <TouchableOpacity style={[s.emptyBtn, { backgroundColor: G }]} onPress={handleAddParcelle} activeOpacity={0.82}>
          <Ionicons name="add" size={16} color="#fff" />
          <Text style={s.emptyBtnText}>Ajouter une parcelle</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={[s.root, { backgroundColor: colors.primaryBg }]}>
      <StatusBar barStyle={dark ? 'light-content' : 'dark-content'} backgroundColor={colors.primaryBg} />

      {/* ← props alignées sur la nouvelle interface ParcelleHeader */}
      <ParcelleHeader
        totalParcelles={parcelles.length}
        onAdd={handleAddParcelle}
        totalSurface={totalSurface}
        avgSante={avgSante}
        alertCount={alertCount}
        totalRendement={totalRendement}
      />

      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={EmptyState}
        contentContainerStyle={[s.listContent, { paddingBottom: insets.bottom + 80 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={G} colors={[G]} />
        }
      />

      <Animated.View style={[s.fab, Shadows.green, { bottom: insets.bottom + 16, transform: [{ scale: fabAnim }] }]}>
        <TouchableOpacity style={[s.fabBtn, { backgroundColor: G }]} onPress={handleAddParcelle} activeOpacity={0.85}>
          <Ionicons name="add" size={28} color="#fff" />
        </TouchableOpacity>
      </Animated.View>

      <ParcelleDetailModal
        visible={showDetail}
        parcelle={selectedParcelle}
        onClose={() => setShowDetail(false)}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <ParcelleFormModal
        visible={showForm}
        parcelle={editParcelle}
        onClose={() => setShowForm(false)}
        onSave={handleSave}
      />
    </View>
  );
}

const s = StyleSheet.create({
  root:         { flex: 1 },
  listContent:  { paddingHorizontal: Spacing.md, paddingTop: Spacing.sm },
  sectionHeader:{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: Spacing.md, marginBottom: Spacing.sm, paddingHorizontal: Spacing.xs },
  sectionTitle: { fontSize: 15, fontWeight: '700' },
  sectionSub:   { fontSize: 11, marginTop: 2 },
  sortBtn:      { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: Radius.md },
  sortText:     { fontSize: 12, fontWeight: '600' },
  emptyState:   { alignItems: 'center', paddingVertical: Spacing.xxl, paddingHorizontal: Spacing.xl },
  emptyEmoji:   { fontSize: 52, marginBottom: Spacing.md },
  emptyTitle:   { fontSize: 18, fontWeight: '700', marginBottom: Spacing.sm, textAlign: 'center' },
  emptySub:     { fontSize: 13, textAlign: 'center', lineHeight: 20, marginBottom: Spacing.lg },
  emptyBtn:     { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: Spacing.lg, paddingVertical: 12, borderRadius: Radius.lg },
  emptyBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },
  fab:          { position: 'absolute', right: Spacing.lg },
  fabBtn:       { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
});
