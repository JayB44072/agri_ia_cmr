import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Modal, Animated, ScrollView, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Parcelle, Capteur } from '@/components/data/parcellesData';

const { height: SH, width: SW } = Dimensions.get('window');
const SHEET_H = SH * 0.82;

interface Props {
  parcelle: Parcelle | null;
  visible:  boolean;
  onClose:  () => void;
  onEdit:   (p: Parcelle) => void;   // ← renommé onEdit
  onDelete: (id: string) => void;
}

function LiveValue({ value, unit, label, icon, alert, flash }: {
  value: string; unit?: string; label: string;
  icon: string; alert?: boolean; flash: boolean;
}) {
  const opacity = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (flash) {
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.15, duration: 120, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1,    duration: 250, useNativeDriver: true }),
      ]).start();
    }
  }, [value, flash]);

  return (
    <View style={[d.liveCard, alert && d.liveCardAlert]}>
      <View style={[d.liveIconBox, { backgroundColor: alert ? '#7f1d1d' : '#052e16' }]}>
        <Ionicons name={icon as any} size={18} color={alert ? '#fca5a5' : '#4ade80'} />
      </View>
      <Animated.Text style={[d.liveVal, alert && { color: '#fca5a5' }, { opacity }]}>
        {value}<Text style={d.liveUnit}>{unit}</Text>
      </Animated.Text>
      <Text style={d.liveLabel}>{label}</Text>
      {alert && (
        <View style={d.alertPill}><Text style={d.alertPillText}>⚠️ Anormal</Text></View>
      )}
    </View>
  );
}

const STADES = ['Semis', 'Germination', 'Croissance', 'Floraison', 'Fructification', 'Récolte'];

function StadeBar({ stade, couleur }: { stade: string; couleur: string }) {
  const idx = STADES.indexOf(stade);
  return (
    <View>
      <View style={d.stadeRow}>
        {STADES.map((st, i) => (
          <View key={st} style={{ flex: 1, alignItems: 'center' }}>
            <View style={[d.stadeDot, i <= idx && { backgroundColor: couleur }, i === idx && d.stadeDotActive]} />
            {i < STADES.length - 1 && (
              <View style={[d.stadeLine, i < idx && { backgroundColor: couleur }]} />
            )}
          </View>
        ))}
      </View>
      <View style={d.stadeLabels}>
        {STADES.map((st, i) => (
          <Text key={st} style={[d.stadeLabel, i === idx && { color: couleur, fontWeight: '700' }]}>{st}</Text>
        ))}
      </View>
    </View>
  );
}

function ActionBtn({ icon, label, color }: { icon: string; label: string; color: string }) {
  return (
    <TouchableOpacity style={[d.actionBtn, { borderColor: color + '40' }]} activeOpacity={0.8}>
      <View style={[d.actionIcon, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon as any} size={20} color={color} />
      </View>
      <Text style={d.actionLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

function InfoRow({ icon, label, value, color }: { icon: string; label: string; value: string; color?: string }) {
  return (
    <View style={d.infoRow}>
      <Ionicons name={icon as any} size={14} color="#6b7280" />
      <Text style={d.infoLabel}>{label}</Text>
      <Text style={[d.infoValue, color ? { color } : undefined]}>{value}</Text>
    </View>
  );
}

export default function ParcelleDetailModal({ parcelle, visible, onClose, onEdit, onDelete }: Props) {
  const slideY  = useRef(new Animated.Value(SHEET_H)).current;
  const bgOp    = useRef(new Animated.Value(0)).current;
  const [flash, setFlash]       = useState(false);
  const [liveData, setLiveData] = useState<Capteur | null>(null);

  useEffect(() => {
    if (visible) {
      setLiveData(parcelle?.capteur ?? null);
      Animated.parallel([
        Animated.spring(slideY, { toValue: 0, damping: 18, stiffness: 200, useNativeDriver: true }),
        Animated.timing(bgOp,   { toValue: 1, duration: 300, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideY, { toValue: SHEET_H, duration: 280, useNativeDriver: true }),
        Animated.timing(bgOp,   { toValue: 0,       duration: 280, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  useEffect(() => {
    if (!visible || !parcelle) return;
    const t = setInterval(() => {
      setLiveData((prev: Capteur | null) => {
        if (!prev) return prev;
        const fl = (v: number, r: number) => Math.round((v + (Math.random() - 0.5) * r * 2) * 10) / 10;
        return {
          ...prev,
          humidite:    Math.round(fl(prev.humidite, 1.5)),
          temperature: fl(prev.temperature, 0.3),
          ph:          fl(prev.ph, 0.04),
          azote:       Math.round(fl(prev.azote, 0.8)),
        };
      });
      setFlash(true);
      setTimeout(() => setFlash(false), 350);
    }, 3500);
    return () => clearInterval(t);
  }, [visible, parcelle]);

  if (!parcelle) return null;
  const cap = liveData ?? parcelle.capteur;

  const conseil = cap.humidite < 45
    ? "💧 Arrosage urgent — l'humidité est trop basse pour vos plants."
    : cap.temperature > 33
    ? '🌡️ Chaleur excessive — pensez à ombrager ou arroser en soirée.'
    : cap.ph < 6
    ? '🧪 Sol trop acide — ajoutez de la chaux agricole pour corriger.'
    : cap.azote < 10
    ? "🌿 Manque d'azote — fertilisation recommandée cette semaine."
    : '✅ Tout va bien ! Continuez à surveiller régulièrement.';

  return (
    <Modal transparent visible={visible} onRequestClose={onClose} animationType="none">
      <Animated.View style={[d.backdrop, { opacity: bgOp }]}>
        <TouchableOpacity style={{ flex: 1 }} onPress={onClose} />
      </Animated.View>

      <Animated.View style={[d.sheet, { transform: [{ translateY: slideY }] }]}>
        <View style={d.handle} />

        {/* Header */}
        <View style={[d.sheetHeader, { borderBottomColor: parcelle.couleur + '30' }]}>
          <View style={[d.emojiBox, { backgroundColor: parcelle.couleur + '25' }]}>
            <Text style={d.emoji}>{parcelle.emoji}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={d.sheetTitle}>{parcelle.nom}</Text>
            <Text style={d.sheetSub}>{parcelle.culture} · {parcelle.stade} · {parcelle.surface} ha</Text>
          </View>
          <View style={d.headerActions}>
            <TouchableOpacity onPress={() => onEdit(parcelle)} style={d.headerBtn}>
              <Ionicons name="pencil" size={16} color="#94a3b8" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => onDelete(parcelle.id)} style={d.headerBtn}>
              <Ionicons name="trash-outline" size={16} color="#ef4444" />
            </TouchableOpacity>
            <TouchableOpacity onPress={onClose} style={d.headerBtn}>
              <Ionicons name="close" size={18} color="#94a3b8" />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={d.scroll}>
          {/* Badge LIVE */}
          <View style={d.liveBadgeRow}>
            <View style={d.liveBadge}>
              <View style={d.liveDot} />
              <Text style={d.liveBadgeText}>Capteurs en direct</Text>
            </View>
            <Text style={d.liveUpdate}>Mise à jour toutes les 3s</Text>
          </View>

          {/* Grid capteurs 2×2 */}
          <View style={d.liveGrid}>
            <LiveValue icon="water"         value={`${cap.humidite}`}    unit="%" label="Humidité du sol"   alert={cap.humidite < 45}              flash={flash} />
            <LiveValue icon="thermometer"   value={`${cap.temperature}`} unit="°C" label="Température"      alert={cap.temperature > 33}           flash={flash} />
            <LiveValue icon="flask-outline" value={`pH ${cap.ph}`}       label="Acidité du sol"              alert={cap.ph < 6 || cap.ph > 7.5}    flash={flash} />
            <LiveValue icon="leaf-outline"  value={`${cap.azote}`}       unit="%" label="Azote disponible"  alert={cap.azote < 10}                 flash={flash} />
          </View>

          {/* Santé globale */}
          <View style={d.section}>
            <Text style={d.sectionTitle}>🩺 Santé de la parcelle</Text>
            <View style={d.santeBigRow}>
              <Text style={[d.santeBigVal, { color: parcelle.sante >= 80 ? '#22c55e' : parcelle.sante >= 60 ? '#f59e0b' : '#ef4444' }]}>
                {parcelle.sante}%
              </Text>
              <View style={{ flex: 1 }}>
                <View style={d.santeBigBg}>
                  <View style={[d.santeBigFill, {
                    width: `${parcelle.sante}%` as any,
                    backgroundColor: parcelle.sante >= 80 ? '#22c55e' : parcelle.sante >= 60 ? '#f59e0b' : '#ef4444',
                  }]} />
                </View>
                <Text style={d.santeExpl}>
                  {parcelle.sante >= 80 ? 'Excellente — continuez comme ça !'
                  : parcelle.sante >= 60 ? 'Correcte — quelques points à améliorer'
                  : 'Faible — action requise rapidement'}
                </Text>
              </View>
            </View>
          </View>

          {/* Stade */}
          <View style={d.section}>
            <Text style={d.sectionTitle}>🌱 Stade de croissance</Text>
            <StadeBar stade={parcelle.stade} couleur={parcelle.couleur} />
          </View>

          {/* Conseil IA */}
          <View style={[d.conseilBox, { borderLeftColor: parcelle.couleur }]}>
            <View style={d.conseilHeader}>
              <Ionicons name="sparkles" size={15} color="#4ade80" />
              <Text style={d.conseilTitre}>Conseil de l'IA AgriSmart</Text>
            </View>
            <Text style={d.conseilText}>{conseil}</Text>
          </View>

          {/* Actions rapides */}
          <View style={d.section}>
            <Text style={d.sectionTitle}>⚡ Actions rapides</Text>
            <View style={d.actionsGrid}>
              <ActionBtn icon="water-outline"  label={"Déclencher\narrosage"}   color="#60a5fa" />
              <ActionBtn icon="leaf-outline"   label={"Enregistrer\nrécolte"}   color="#4ade80" />
              <ActionBtn icon="camera-outline" label={"Photo\nde la parcelle"}  color="#f472b6" />
              <ActionBtn icon="stats-chart"    label={"Voir\nhistorique"}        color="#a78bfa" />
            </View>
          </View>

          {/* Infos pratiques */}
          <View style={d.section}>
            <Text style={d.sectionTitle}>📋 Informations pratiques</Text>
            <InfoRow icon="time-outline"        label="Dernier arrosage" value={parcelle.dernierArrosage} />
            <InfoRow icon="checkmark-circle"    label="Prochaine tâche"  value={parcelle.prochaineTache} color={parcelle.couleur} />
            <InfoRow icon="location-outline"    label="Position GPS"     value={`${parcelle.lat.toFixed(3)}°N, ${parcelle.lng.toFixed(3)}°E`} />
            <InfoRow icon="trending-up-outline" label="Rendement prévu"  value={`${parcelle.rendementPrevu} t/ha → ${(parcelle.rendementPrevu * parcelle.surface).toFixed(1)} t`} />
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </Animated.View>
    </Modal>
  );
}

const d = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.65)' },
  sheet: { position: 'absolute', bottom: 0, left: 0, right: 0, height: SHEET_H, backgroundColor: '#0f172a', borderTopLeftRadius: 24, borderTopRightRadius: 24, borderWidth: 1, borderColor: 'rgba(34,197,94,0.15)', overflow: 'hidden' },
  handle: { alignSelf: 'center', width: 40, height: 4, backgroundColor: '#334155', borderRadius: 2, marginTop: 10 },

  sheetHeader:  { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderBottomWidth: 1 },
  emojiBox:     { width: 46, height: 46, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  emoji:        { fontSize: 24 },
  sheetTitle:   { color: '#f1f5f9', fontSize: 17, fontWeight: '800' },
  sheetSub:     { color: '#6b7280', fontSize: 11, marginTop: 2 },
  headerActions:{ flexDirection: 'row', gap: 6 },
  headerBtn:    { backgroundColor: '#1e293b', padding: 8, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },

  scroll: { padding: 16, paddingBottom: 40, gap: 16 },

  liveBadgeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  liveBadge:    { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#052e16', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  liveDot:      { width: 7, height: 7, borderRadius: 4, backgroundColor: '#4ade80' },
  liveBadgeText:{ color: '#4ade80', fontSize: 11, fontWeight: '700' },
  liveUpdate:   { color: '#6b7280', fontSize: 10 },

  liveGrid:     { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  liveCard:     { width: (SW - 52) / 2, backgroundColor: '#1e293b', borderRadius: 14, padding: 12, borderWidth: 1, borderColor: 'rgba(34,197,94,0.12)', gap: 4 },
  liveCardAlert:{ backgroundColor: '#1c0a0a', borderColor: 'rgba(239,68,68,0.25)' },
  liveIconBox:  { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  liveVal:      { color: '#f1f5f9', fontSize: 22, fontWeight: '800', marginTop: 4 },
  liveUnit:     { fontSize: 13, fontWeight: '500', color: '#94a3b8' },
  liveLabel:    { color: '#6b7280', fontSize: 10 },
  alertPill:    { backgroundColor: '#7f1d1d', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 20, alignSelf: 'flex-start' },
  alertPillText:{ color: '#fca5a5', fontSize: 9, fontWeight: '700' },

  section:      { gap: 10 },
  sectionTitle: { color: '#94a3b8', fontSize: 12, fontWeight: '700', letterSpacing: 0.5 },
  santeBigRow:  { flexDirection: 'row', alignItems: 'center', gap: 14 },
  santeBigVal:  { fontSize: 36, fontWeight: '900', width: 70 },
  santeBigBg:   { height: 8, backgroundColor: '#1e293b', borderRadius: 4, overflow: 'hidden', marginBottom: 5 },
  santeBigFill: { height: '100%', borderRadius: 4 },
  santeExpl:    { color: '#6b7280', fontSize: 11 },

  stadeRow:       { flexDirection: 'row', alignItems: 'center', position: 'relative' },
  stadeDot:       { width: 12, height: 12, borderRadius: 6, backgroundColor: '#334155', borderWidth: 2, borderColor: '#1e293b' },
  stadeDotActive: { width: 16, height: 16, borderRadius: 8 },
  stadeLine:      { position: 'absolute', left: '50%', right: '-50%', height: 2, backgroundColor: '#334155', top: 5 },
  stadeLabels:    { flexDirection: 'row', marginTop: 6 },
  stadeLabel:     { flex: 1, color: '#6b7280', fontSize: 7, textAlign: 'center' },

  conseilBox:    { backgroundColor: '#0d1f0d', borderRadius: 12, padding: 12, borderLeftWidth: 3, gap: 6 },
  conseilHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  conseilTitre:  { color: '#4ade80', fontSize: 12, fontWeight: '700' },
  conseilText:   { color: '#86efac', fontSize: 12, lineHeight: 18 },

  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  actionBtn:   { width: (SW - 52) / 2, backgroundColor: '#1e293b', borderRadius: 14, padding: 12, alignItems: 'center', gap: 8, borderWidth: 1 },
  actionIcon:  { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  actionLabel: { color: '#cbd5e1', fontSize: 11, fontWeight: '600', textAlign: 'center' },

  infoRow:   { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#1e293b', borderRadius: 10, padding: 10 },
  infoLabel: { color: '#6b7280', fontSize: 11, flex: 1 },
  infoValue: { color: '#f1f5f9', fontSize: 11, fontWeight: '600', textAlign: 'right' },
});