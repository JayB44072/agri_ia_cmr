import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  ScrollView, Modal, Animated, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, Shadows } from '@/constants/theme';
import { useColorScheme } from 'react-native';
import { Parcelle, EMOJIS_CULTURE } from '@/components/data/parcellesData';

interface ParcelleFormModalProps {
  visible:  boolean;
  parcelle: Parcelle | null;
  onClose:  () => void;
  onSave:   (data: Partial<Parcelle>) => void;
}

interface FormState {
  nom:     string;
  culture: string;
  surface: string;  // ← surface (pas superficie)
  ville:   string;
  region:  string;
  sol:     string;
}

const CULTURES_DISPO = [
  { label: 'Maïs',     icon: '🌽' }, { label: 'Manioc',   icon: '🥬' },
  { label: 'Tomate',   icon: '🍅' }, { label: 'Cacao',    icon: '🍫' },
  { label: 'Plantain', icon: '🍌' }, { label: 'Arachide', icon: '🥜' },
  { label: 'Café',     icon: '☕' }, { label: 'Sorgho',   icon: '🌾' },
  { label: 'Igname',   icon: '🥔' }, { label: 'Riz',      icon: '🌾' },
];

const TYPES_SOL = ['Argileux', 'Limoneux', 'Sableux', 'Humifère', 'Latéritique'];

export default function ParcelleFormModal({ visible, parcelle, onClose, onSave }: ParcelleFormModalProps): React.JSX.Element {
  const scheme = useColorScheme();
  const dark   = scheme === 'dark';
  const colors = Colors[dark ? 'dark' : 'light'];
  const G      = Colors.splash.green;
  const BORDER = colors.primaryBorder; // ← utilise primaryBorder du theme

  const slideAnim = useRef(new Animated.Value(600)).current;
  const fadeAnim  = useRef(new Animated.Value(0)).current;

  const [form, setForm]       = useState<FormState>({ nom: '', culture: '', surface: '', ville: '', region: '', sol: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  useEffect(() => {
    if (parcelle) {
      setForm({
        nom:     parcelle.nom,
        culture: parcelle.culture,
        surface: String(parcelle.surface),  // ← surface
        ville:   parcelle.localisation?.ville  ?? '',
        region:  parcelle.localisation?.region ?? '',
        sol:     parcelle.typeSol ?? '',
      });
    } else {
      setForm({ nom: '', culture: '', surface: '', ville: '', region: '', sol: '' });
    }
    setError('');
  }, [parcelle, visible]);

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideAnim, { toValue: 0,   useNativeDriver: true, tension: 65, friction: 11 }),
        Animated.timing(fadeAnim,  { toValue: 1,   duration: 250, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: 600, duration: 280, useNativeDriver: true }),
        Animated.timing(fadeAnim,  { toValue: 0,   duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  const update = (key: keyof FormState, val: string) => setForm(p => ({ ...p, [key]: val }));

  const validate = (): boolean => {
    if (!form.nom.trim())       { setError('Le nom de la parcelle est requis.');   return false; }
    if (!form.culture)          { setError('Veuillez choisir une culture.');       return false; }
    if (!form.surface.trim())   { setError('La superficie est requise.');          return false; }
    if (isNaN(Number(form.surface))) { setError('La superficie doit être un nombre.'); return false; }
    return true;
  };

  const handleSave = () => {
    setError('');
    if (!validate()) return;
    setLoading(true);
    // TODO: replace with real API call
    setTimeout(() => {
      try {
        onSave({
          nom:         form.nom.trim(),
          culture:     form.culture,
          emoji:       EMOJIS_CULTURE[form.culture] ?? '🌱',
          surface:     Number(form.surface),
          typeSol:     form.sol || 'Argileux',
          localisation: {
            ville:  form.ville,
            region: form.region,
            lat:    3.8 + Math.random() * 0.5,
            lng:    11.5 + Math.random() * 0.5,
          },
        });
        onClose();
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Erreur inconnue';
        console.warn('[ParcelleForm] Échec de la sauvegarde :', msg);
        setError('Erreur lors de la sauvegarde. Veuillez réessayer.');
      } finally {
        setLoading(false);
      }
    }, 1200);
  };

  const isEdit = !!parcelle;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <KeyboardAvoidingView style={s.overlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Animated.View style={[s.backdrop, { opacity: fadeAnim }]}>
          <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} activeOpacity={1} />
        </Animated.View>

        <Animated.View style={[s.sheet, { backgroundColor: colors.background, transform: [{ translateY: slideAnim }] }]}>
          <View style={[s.handle, { backgroundColor: colors.backgroundElement }]} />

          {/* Header */}
          <View style={[s.header, { borderBottomColor: colors.cardBorder }]}>
            <TouchableOpacity onPress={onClose} style={[s.closeBtn, { backgroundColor: colors.backgroundElement }]}>
              <Ionicons name="close" size={20} color={colors.text} />
            </TouchableOpacity>
            <Text style={[s.headerTitle, { color: colors.text }]}>
              {isEdit ? 'Modifier la parcelle' : 'Nouvelle parcelle'}
            </Text>
            <View style={{ width: 36 }} />
          </View>

          <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

            {/* Nom */}
            <View style={s.fieldBlock}>
              <Text style={[s.label, { color: colors.primary }]}>Nom de la parcelle *</Text>
              <View style={[s.inputRow, { backgroundColor: colors.backgroundElement, borderColor: BORDER }]}>
                <Ionicons name="leaf-outline" size={16} color={G} style={{ marginRight: 8 }} />
                <TextInput style={[s.input, { color: colors.text }]} placeholder="Ex: Parcelle Nord-Est" placeholderTextColor={colors.textSecondary} value={form.nom} onChangeText={v => update('nom', v)} />
              </View>
            </View>

            {/* Culture */}
            <View style={s.fieldBlock}>
              <Text style={[s.label, { color: colors.primary }]}>Culture principale *</Text>
              <View style={s.cultureGrid}>
                {CULTURES_DISPO.map(c => (
                  <TouchableOpacity
                    key={c.label}
                    style={[s.cultureChip, { backgroundColor: colors.backgroundElement, borderColor: BORDER }, form.culture === c.label && { backgroundColor: 'rgba(60,185,90,0.12)', borderColor: G }]}
                    onPress={() => update('culture', c.label)} activeOpacity={0.75}
                  >
                    <Text style={s.cultureIcon}>{c.icon}</Text>
                    <Text style={[s.cultureLabel, { color: form.culture === c.label ? G : colors.textSecondary }, form.culture === c.label && { fontWeight: '700' }]}>{c.label}</Text>
                    {form.culture === c.label && <View style={s.cultureCheck}><Ionicons name="checkmark" size={8} color="#fff" /></View>}
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Surface */}
            <View style={s.fieldBlock}>
              <Text style={[s.label, { color: colors.primary }]}>Superficie (hectares) *</Text>
              <View style={[s.inputRow, { backgroundColor: colors.backgroundElement, borderColor: BORDER }]}>
                <Ionicons name="resize-outline" size={16} color={G} style={{ marginRight: 8 }} />
                <TextInput style={[s.input, { color: colors.text }]} placeholder="Ex: 2.5" placeholderTextColor={colors.textSecondary} keyboardType="decimal-pad" value={form.surface} onChangeText={v => update('surface', v)} />
                <Text style={[s.unit, { color: colors.textSecondary }]}>ha</Text>
              </View>
            </View>

            {/* Localisation */}
            <View style={s.fieldBlock}>
              <Text style={[s.label, { color: colors.primary }]}>Localisation</Text>
              <View style={s.twoCol}>
                <View style={[s.inputRow, s.flex1, { backgroundColor: colors.backgroundElement, borderColor: BORDER }]}>
                  <Ionicons name="location-outline" size={16} color={G} style={{ marginRight: 6 }} />
                  <TextInput style={[s.input, { color: colors.text }]} placeholder="Ville" placeholderTextColor={colors.textSecondary} value={form.ville} onChangeText={v => update('ville', v)} />
                </View>
                <View style={[s.inputRow, s.flex1, { backgroundColor: colors.backgroundElement, borderColor: BORDER }]}>
                  <Ionicons name="map-outline" size={16} color={G} style={{ marginRight: 6 }} />
                  <TextInput style={[s.input, { color: colors.text }]} placeholder="Région" placeholderTextColor={colors.textSecondary} value={form.region} onChangeText={v => update('region', v)} />
                </View>
              </View>
            </View>

            {/* Type de sol */}
            <View style={s.fieldBlock}>
              <Text style={[s.label, { color: colors.primary }]}>Type de sol</Text>
              <View style={s.solRow}>
                {TYPES_SOL.map(t => (
                  <TouchableOpacity key={t} style={[s.solChip, { backgroundColor: colors.backgroundElement, borderColor: BORDER }, form.sol === t && { backgroundColor: 'rgba(60,185,90,0.12)', borderColor: G }]} onPress={() => update('sol', t)} activeOpacity={0.75}>
                    <Text style={[s.solLabel, { color: form.sol === t ? G : colors.textSecondary }, form.sol === t && { fontWeight: '700' }]}>{t}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Info capteurs */}
            <View style={[s.infoBox, { backgroundColor: 'rgba(60,185,90,0.07)', borderColor: 'rgba(60,185,90,0.2)' }]}>
              <Ionicons name="hardware-chip-outline" size={16} color={G} />
              <Text style={[s.infoText, { color: colors.textSecondary }]}>
                Les capteurs IoT (pH, humidité, température) seront simulés automatiquement après création.
              </Text>
            </View>

            {/* Erreur */}
            {error !== '' && (
              <View style={s.errorBox}>
                <Ionicons name="warning-outline" size={14} color="#e74c3c" />
                <Text style={s.errorText}>{error}</Text>
              </View>
            )}

            {/* Boutons */}
            <View style={s.btnRow}>
              <TouchableOpacity style={[s.cancelBtn, { borderColor: BORDER, backgroundColor: colors.backgroundElement }]} onPress={onClose} activeOpacity={0.75}>
                <Text style={[s.cancelText, { color: colors.textSecondary }]}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.saveBtn, loading && { opacity: 0.75 }, Shadows.green]} onPress={handleSave} activeOpacity={0.82} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff" size="small" /> : (
                  <View style={s.saveBtnInner}>
                    <Ionicons name={isEdit ? 'save-outline' : 'add-circle-outline'} size={16} color="#fff" />
                    <Text style={s.saveText}>{isEdit ? 'Enregistrer' : 'Créer la parcelle'}</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
            <View style={{ height: Spacing.xxl }} />
          </ScrollView>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const G = Colors.splash.green;

const s = StyleSheet.create({
  overlay:      { flex: 1, justifyContent: 'flex-end' },
  backdrop:     { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet:        { borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: '92%', paddingBottom: Platform.OS === 'ios' ? 34 : 0 },
  handle:       { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginTop: 12, marginBottom: 4 },
  header:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, borderBottomWidth: 1 },
  closeBtn:     { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  headerTitle:  { fontSize: 17, fontWeight: '700' },
  scroll:       { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md },
  fieldBlock:   { marginBottom: Spacing.lg },
  label:        { fontSize: 12, fontWeight: '700', letterSpacing: 0.5, marginBottom: 8, textTransform: 'uppercase' },
  inputRow:     { flexDirection: 'row', alignItems: 'center', borderRadius: Radius.md, borderWidth: 1, paddingHorizontal: 12, height: 50 },
  input:        { flex: 1, fontSize: 14 },
  unit:         { fontSize: 12, fontWeight: '600', marginLeft: 4 },
  twoCol:       { flexDirection: 'row', gap: 10 },
  flex1:        { flex: 1 },
  cultureGrid:  { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  cultureChip:  { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 8, borderRadius: Radius.md, borderWidth: 1, gap: 5, position: 'relative' },
  cultureIcon:  { fontSize: 14 },
  cultureLabel: { fontSize: 12 },
  cultureCheck: { position: 'absolute', top: -4, right: -4, width: 14, height: 14, borderRadius: 7, backgroundColor: G, alignItems: 'center', justifyContent: 'center' },
  solRow:       { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  solChip:      { paddingHorizontal: 14, paddingVertical: 8, borderRadius: Radius.full, borderWidth: 1 },
  solLabel:     { fontSize: 12 },
  infoBox:      { flexDirection: 'row', alignItems: 'flex-start', gap: 8, borderRadius: Radius.md, borderWidth: 1, padding: 12, marginBottom: Spacing.md },
  infoText:     { fontSize: 11, flex: 1, lineHeight: 16 },
  errorBox:     { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(231,76,60,0.08)', borderRadius: Radius.md, borderWidth: 1, borderColor: 'rgba(231,76,60,0.25)', padding: 10, marginBottom: Spacing.md },
  errorText:    { fontSize: 12, color: '#e74c3c', fontWeight: '500', flex: 1 },
  btnRow:       { flexDirection: 'row', gap: 12, marginTop: Spacing.sm },
  cancelBtn:    { flex: 1, borderWidth: 1, borderRadius: Radius.lg, paddingVertical: 14, alignItems: 'center' },
  cancelText:   { fontSize: 14, fontWeight: '600' },
  saveBtn:      { flex: 2, backgroundColor: G, borderRadius: Radius.lg, paddingVertical: 14, alignItems: 'center' },
  saveBtnInner: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  saveText:     { fontSize: 14, fontWeight: '700', color: '#fff' },
});