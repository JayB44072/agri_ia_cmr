// ─────────────────────────────────────────────────────────────
//  ParcelleStatsBar.tsx
//  Barre de recherche + filtres rapides
// ─────────────────────────────────────────────────────────────
import React, { useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  TextInput, ScrollView, Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// ← aligné sur parcelles.tsx (FilterType)
export type FilterType = 'toutes' | 'ok' | 'warning' | 'critical';

interface Stats {
  total:      number;
  ok:         number;
  warning:    number;
  critical:   number;
  superficie: string;
}

interface Props {
  stats:          Stats;        // ← aligné sur parcelles.tsx
  filter:         FilterType;   // ← aligné (filter, pas filtre)
  onFilterChange: (f: FilterType) => void; // ← aligné (onFilterChange, pas onFiltre)
  search:         string;
  onSearchChange: (v: string) => void; // ← aligné (onSearchChange, pas onSearch)
}

const FILTRES: { key: FilterType; label: string; icon: string }[] = [
  { key: 'toutes',   label: 'Toutes',        icon: 'apps-outline'            },
  { key: 'ok',       label: 'En bonne santé', icon: 'checkmark-circle-outline'},
  { key: 'warning',  label: 'Attention',      icon: 'warning-outline'         },
  { key: 'critical', label: 'Critique',       icon: 'alert-circle-outline'    },
];

const FILTRE_COLORS: Record<FilterType, string> = {
  toutes:   '#22c55e',
  ok:       '#22c55e',
  warning:  '#f59e0b',
  critical: '#ef4444',
};

export default function ParcelleStatsBar({
  stats, filter, onFilterChange, search, onSearchChange,
}: Props) {
  const slideY  = useRef(new Animated.Value(10)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideY,  { toValue: 0, duration: 400, delay: 150, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 400, delay: 150, useNativeDriver: true }),
    ]).start();
  }, []);

  const counts: Record<FilterType, number | undefined> = {
    toutes:   undefined,
    ok:       stats.ok,
    warning:  stats.warning,
    critical: stats.critical,
  };

  return (
    <Animated.View style={[s.wrap, { opacity, transform: [{ translateY: slideY }] }]}>
      {/* Search bar */}
      <View style={s.searchRow}>
        <View style={s.searchBox}>
          <Ionicons name="search-outline" size={16} color="#6b7280" />
          <TextInput
            value={search}
            onChangeText={onSearchChange}
            placeholder="Chercher une parcelle…"
            placeholderTextColor="#6b7280"
            style={s.searchInput}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => onSearchChange('')}>
              <Ionicons name="close-circle" size={16} color="#6b7280" />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity style={s.sortBtn}>
          <Ionicons name="funnel-outline" size={16} color="#94a3b8" />
        </TouchableOpacity>
      </View>

      {/* Filtres */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filtres}>
        {FILTRES.map(f => {
          const active = filter === f.key;
          const color  = FILTRE_COLORS[f.key];
          const count  = counts[f.key];
          return (
            <TouchableOpacity
              key={f.key}
              onPress={() => onFilterChange(f.key)}
              activeOpacity={0.8}
              style={[s.filtreChip, active && { backgroundColor: color + '22', borderColor: color }]}
            >
              <Ionicons name={f.icon as any} size={13} color={active ? color : '#6b7280'} />
              <Text style={[s.filtreLabel, active && { color, fontWeight: '700' }]}>{f.label}</Text>
              {count !== undefined && (
                <View style={[s.filtreBadge, { backgroundColor: active ? color : '#334155' }]}>
                  <Text style={[s.filtreBadgeText, !active && { color: '#94a3b8' }]}>{count}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  wrap:        { backgroundColor: '#0f172a', paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(34,197,94,0.10)' },
  searchRow:   { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingTop: 10, paddingBottom: 10, gap: 8 },
  searchBox:   { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#1e293b', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 9, gap: 8, borderWidth: 1, borderColor: 'rgba(34,197,94,0.12)' },
  searchInput: { flex: 1, color: '#f1f5f9', fontSize: 13 },
  sortBtn:     { backgroundColor: '#1e293b', padding: 10, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  filtres:     { paddingHorizontal: 12, gap: 8, flexDirection: 'row' },
  filtreChip:  { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#1e293b', paddingHorizontal: 11, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  filtreLabel: { color: '#6b7280', fontSize: 11 },
  filtreBadge: { minWidth: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  filtreBadgeText: { color: '#fff', fontSize: 9, fontWeight: '800' },
});
