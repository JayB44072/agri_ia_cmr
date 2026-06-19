import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, ScrollView, useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Parcelle } from '@/components/data/parcellesData';

const MAP_H = 230;

interface Props {
  parcelles:        Parcelle[];
  selectedId?:      string | null;
  onSelect:         (p: Parcelle) => void;
  onSelectParcelle: (p: Parcelle) => void;
  expanded?:        boolean;
  onToggleExpand?:  () => void;
}

// ── PulseRing ─────────────────────────────────────────────────

function PulseRing({ color }: { color: string }) {
  const scale   = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0.7)).current;
  useEffect(() => {
    Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(scale,   { toValue: 2.2, duration: 900, useNativeDriver: true }),
          Animated.timing(scale,   { toValue: 1,   duration: 0,   useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(opacity, { toValue: 0,   duration: 900, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0.7, duration: 0,   useNativeDriver: true }),
        ]),
      ])
    ).start();
  }, []);
  return <Animated.View style={[s.pulseRing, { borderColor: color, transform: [{ scale }], opacity }]} />;
}

// ── MapMarker ─────────────────────────────────────────────────

function MapMarker({ parcelle, selected, onPress }: {
  parcelle: Parcelle; selected: boolean; onPress: () => void;
}) {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const isAlert   = parcelle.capteur.statut !== 'ok';

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: 1, delay: Math.random() * 300,
      damping: 12, stiffness: 200, useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: selected ? 1.25 : 1,
      damping: 10, stiffness: 220, useNativeDriver: true,
    }).start();
  }, [selected]);

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={[s.markerWrap, { left: `${parcelle.mapX}%` as any, top: `${parcelle.mapY}%` as any }]}
    >
      <Animated.View style={{ transform: [{ scale: scaleAnim }], alignItems: 'center' }}>
        {isAlert && <PulseRing color={parcelle.couleur} />}
        <View style={[s.dot, { backgroundColor: parcelle.couleur }, selected && s.dotSelected]}>
          <Text style={s.dotEmoji}>{parcelle.emoji}</Text>
        </View>
        {selected && (
          <View style={[s.markerLabel, { backgroundColor: parcelle.couleur }]}>
            <Text style={s.markerLabelText}>{parcelle.nom.replace('Parcelle ', '')}</Text>
          </View>
        )}
      </Animated.View>
    </TouchableOpacity>
  );
}

// ── LegendChip ────────────────────────────────────────────────

function LegendChip({ color, label, active, emoji, dark }: {
  color: string; label: string; active?: boolean; emoji?: string; dark: boolean;
}) {
  const chipBg    = dark ? '#1e293b' : '#f4f9f5';
  const labelColor= dark ? '#94a3b8' : '#4a7a55';

  return (
    <View style={[
      s.legendChip,
      { backgroundColor: chipBg, borderColor: active ? color : 'transparent' },
      active && { borderWidth: 1.5 },
    ]}>
      {emoji
        ? <Text style={{ fontSize: 11 }}>{emoji}</Text>
        : <View style={[s.legendDot, { backgroundColor: color }]} />
      }
      <Text style={[s.legendLabel, { color: labelColor }, active && { color, fontWeight: '700' }]}>
        {label}
      </Text>
    </View>
  );
}

// ── Composant principal ───────────────────────────────────────

export default function ParcelleMap({
  parcelles, selectedId, onSelect, onSelectParcelle, expanded, onToggleExpand,
}: Props) {
  const scheme        = useColorScheme();
  const dark          = scheme === 'dark';

  // Couleurs adaptatives
  const containerBg   = dark ? '#0f172a'                    : '#ffffff';
  const containerBord = dark ? 'rgba(34,197,94,0.12)'       : 'rgba(60,185,90,0.12)';
  const headerTitle   = dark ? '#94a3b8'                    : '#4a7a55';
  const expandColor   = dark ? '#94a3b8'                    : '#4a7a55';
  const terrainBg     = dark ? '#1a2e1a'                    : '#e8f5e9';  // vert très pâle en clair
  const mapBorder     = dark ? 'rgba(34,197,94,0.25)'       : 'rgba(60,185,90,0.3)';
  const gridColor     = dark ? 'rgba(34,197,94,0.08)'       : 'rgba(60,185,90,0.12)';
  const vegColor      = dark ? 'rgba(34,197,94,0.06)'       : 'rgba(60,185,90,0.10)';
  const roadColor     = dark ? 'rgba(148,163,184,0.12)'     : 'rgba(100,130,100,0.15)';
  const riverColor    = dark ? 'rgba(96,165,250,0.18)'      : 'rgba(96,165,250,0.30)';
  const compassColor  = dark ? 'rgba(255,255,255,0.7)'      : 'rgba(0,0,0,0.35)';
  const liveBadgeBg   = dark ? 'rgba(15,23,42,0.75)'        : 'rgba(255,255,255,0.88)';
  const liveDotColor  = '#22c55e';
  const liveTextColor = dark ? '#4ade80'                    : '#16a34a';
  const scaleLineColor= dark ? 'rgba(255,255,255,0.4)'      : 'rgba(0,0,0,0.25)';
  const scaleTextColor= dark ? 'rgba(255,255,255,0.5)'      : 'rgba(0,0,0,0.35)';
  const zoomBg        = dark ? 'rgba(15,23,42,0.85)'        : 'rgba(255,255,255,0.90)';
  const zoomBorder    = dark ? 'rgba(255,255,255,0.1)'      : 'rgba(60,185,90,0.2)';
  const zoomIconColor = dark ? '#fff'                       : '#1a2e1d';
  const legendBorder  = dark ? 'rgba(34,197,94,0.10)'       : 'rgba(60,185,90,0.12)';
  const legendSepColor= dark ? 'rgba(255,255,255,0.12)'     : 'rgba(60,185,90,0.2)';

  const [localSelected, setLocalSelected] = useState<string | null>(selectedId ?? null);
  const mapOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(mapOpacity, { toValue: 1, duration: 600, useNativeDriver: true }).start();
  }, []);

  const handleSelect = (p: Parcelle) => {
    setLocalSelected(p.id);
    onSelect?.(p);
    onSelectParcelle?.(p);
  };

  const activeId = selectedId ?? localSelected;

  return (
    <Animated.View style={[
      s.container,
      { backgroundColor: containerBg, borderColor: containerBord },
      { opacity: mapOpacity },
    ]}>
      {/* Header carte */}
      <View style={s.mapHeader}>
        <View style={s.mapHeaderLeft}>
          <Ionicons name="map" size={14} color="#3cb95a" />
          <Text style={[s.mapHeaderTitle, { color: headerTitle }]}>Carte des parcelles</Text>
        </View>
        {onToggleExpand && (
          <TouchableOpacity onPress={onToggleExpand} style={s.expandBtn}>
            <Ionicons name={expanded ? 'contract-outline' : 'expand-outline'} size={16} color={expandColor} />
          </TouchableOpacity>
        )}
      </View>

      {/* Zone carte */}
      <View style={[s.mapArea, { borderColor: mapBorder }, expanded && { height: 340 }]}>
        <View style={[s.terrain, { backgroundColor: terrainBg }]}>
          {[0.25, 0.5, 0.75].map(v => (
            <React.Fragment key={v}>
              <View style={[s.gridH, { top: `${v * 100}%` as any, backgroundColor: gridColor }]} />
              <View style={[s.gridV, { left: `${v * 100}%` as any, backgroundColor: gridColor }]} />
            </React.Fragment>
          ))}
          <View style={[s.vegZone,  { backgroundColor: vegColor   }]} />
          <View style={[s.road,     { backgroundColor: roadColor  }]} />
          <View style={[s.river,    { backgroundColor: riverColor }]} />

          {parcelles.map(p => (
            <MapMarker
              key={p.id}
              parcelle={p}
              selected={activeId === p.id}
              onPress={() => handleSelect(p)}
            />
          ))}

          <View style={s.compass}>
            <Ionicons name="compass" size={22} color={compassColor} />
          </View>

          <View style={[s.liveBadge, { backgroundColor: liveBadgeBg }]}>
            <View style={[s.liveDot, { backgroundColor: liveDotColor }]} />
            <Text style={[s.liveText, { color: liveTextColor }]}>GPS LIVE</Text>
          </View>

          <View style={s.scaleBar}>
            <View style={[s.scaleLine, { backgroundColor: scaleLineColor }]} />
            <Text style={[s.scaleText, { color: scaleTextColor }]}>~ 500 m</Text>
          </View>
        </View>

        <View style={[s.zoomControls, { backgroundColor: zoomBg, borderColor: zoomBorder }]}>
          <TouchableOpacity style={s.zoomBtn}>
            <Ionicons name="add" size={18} color={zoomIconColor} />
          </TouchableOpacity>
          <View style={[s.zoomDivider, { backgroundColor: zoomBorder }]} />
          <TouchableOpacity style={s.zoomBtn}>
            <Ionicons name="remove" size={18} color={zoomIconColor} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Légende */}
      <View style={[s.legendWrap, { borderTopColor: legendBorder }]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.legendContent}
        >
          <LegendChip color="#22c55e" label="Capteur OK" dark={dark} />
          <LegendChip color="#f59e0b" label="Attention"  dark={dark} />
          <LegendChip color="#ef4444" label="Critique"   dark={dark} />
          <View style={[s.legendSep, { backgroundColor: legendSepColor }]} />
          {parcelles.map(p => (
            <TouchableOpacity key={p.id} onPress={() => handleSelect(p)}>
              <LegendChip
                color={p.couleur}
                label={p.nom}
                active={activeId === p.id}
                emoji={p.emoji}
                dark={dark}
              />
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </Animated.View>
  );
}

// ── Styles ────────────────────────────────────────────────────

const s = StyleSheet.create({
  container:     { borderRadius: 16, marginBottom: 12, overflow: 'hidden', borderWidth: 1 },
  mapHeader:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 10 },
  mapHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  mapHeaderTitle:{ fontSize: 12, fontWeight: '600' },
  expandBtn:     { padding: 4 },

  mapArea:  { height: MAP_H, marginHorizontal: 12, marginBottom: 0, borderRadius: 14, overflow: 'hidden', borderWidth: 1 },
  terrain:  { flex: 1, position: 'relative', overflow: 'hidden' },

  gridH:   { position: 'absolute', left: 0, right: 0, height: 1 },
  gridV:   { position: 'absolute', top: 0, bottom: 0, width: 1 },
  vegZone: { position: 'absolute', left: '20%', top: '30%', width: '45%', height: '40%', borderRadius: 40 },
  road:    { position: 'absolute', left: 0, right: 0, top: '55%', height: 6, transform: [{ rotate: '-6deg' }] },
  river:   { position: 'absolute', left: '60%', top: 0, bottom: 0, width: 5, transform: [{ rotate: '5deg' }] },

  markerWrap:      { position: 'absolute', alignItems: 'center', transform: [{ translateX: -16 }, { translateY: -16 }] },
  pulseRing:       { position: 'absolute', width: 32, height: 32, borderRadius: 16, borderWidth: 2 },
  dot:             { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.4, shadowRadius: 6, elevation: 6 },
  dotSelected:     { width: 38, height: 38, borderRadius: 19, borderWidth: 3, borderColor: '#fff' },
  dotEmoji:        { fontSize: 16 },
  markerLabel:     { marginTop: 4, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 },
  markerLabelText: { color: '#fff', fontSize: 9, fontWeight: '700' },

  compass:   { position: 'absolute', top: 10, right: 10 },
  liveBadge: { position: 'absolute', top: 10, left: 10, flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20 },
  liveDot:   { width: 6, height: 6, borderRadius: 3 },
  liveText:  { fontSize: 9, fontWeight: '700', letterSpacing: 1 },
  scaleBar:  { position: 'absolute', bottom: 10, left: 12, alignItems: 'center' },
  scaleLine: { width: 48, height: 2, marginBottom: 2 },
  scaleText: { fontSize: 8 },

  zoomControls: { position: 'absolute', right: 10, bottom: 10, borderRadius: 10, overflow: 'hidden', borderWidth: 1 },
  zoomBtn:      { padding: 8, alignItems: 'center' },
  zoomDivider:  { height: 1 },

  legendWrap:    { borderTopWidth: 1 },
  legendContent: { paddingHorizontal: 12, paddingVertical: 10, gap: 6, flexDirection: 'row', alignItems: 'center' },
  legendSep:     { width: 1, height: 16, marginHorizontal: 4 },
  legendChip:    { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 9, paddingVertical: 5, borderRadius: 20, borderWidth: 1 },
  legendDot:     { width: 8, height: 8, borderRadius: 4 },
  legendLabel:   { fontSize: 10 },
});