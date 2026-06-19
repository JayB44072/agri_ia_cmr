import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Animated, Modal, ActivityIndicator, Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius } from '@/constants/theme';
import { useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUser } from '@/context/UserContext';

// ── Config ────────────────────────────────────────────────────────────────────
const GEMINI_KEY = 'YOUR_GEMINI_KEY'; // Remplacez par votre clé Gemini

// ── Types ─────────────────────────────────────────────────────────────────────
interface StatFerme {
  label: string; val: string; icon: keyof typeof Ionicons.glyphMap; color: string;
}

interface AnalyseIA {
  score: number;
  pointsForts: string[];
  pointsAmeliorations: string[];
  prochainsPas: string[];
  resume: string;
}

// ── Cultures et zones disponibles ─────────────────────────────────────────────
const CULTURES_DISPO = ['Maïs','Manioc','Tomate','Cacao','Plantain','Arachide','Café','Piment','Haricot','Igname','Riz','Sorgho'];
const ZONES_CLIMATIQUES = ['Zone Forestière', 'Zone Soudano-sahélienne', 'Zone de Hauts Plateaux', 'Zone Côtière'];
const OBJECTIFS = ['Augmenter mes revenus', 'Nourrir ma famille', 'Exporter mes produits', 'Améliorer mes techniques', 'Développer ma ferme'];
const NIVEAUX_EXP = ['Débutant (< 2 ans)', 'Intermédiaire (2-5 ans)', 'Confirmé (5-10 ans)', 'Expert (> 10 ans)'];

// ── Gemini analyse profil ─────────────────────────────────────────────────────
async function analyserProfil(profile: any): Promise<AnalyseIA> {
  const prompt = `Tu es un expert en agriculture africaine et développement rural.
Voici le profil d'un agriculteur camerounais :
- Nom: ${profile.nom}
- Zone climatique: ${profile.zoneClimatique}
- Cultures: ${profile.cultures.join(', ')}
- Superficie: ${profile.superficie} ha
- Nombre de parcelles: ${profile.nbParcelles}
- Expérience: ${profile.experience}
- Objectif principal: ${profile.objectif}

Analyse ce profil et donne une évaluation agricole.
Réponds UNIQUEMENT en JSON valide (sans markdown) :
{
  "score": 75,
  "resume": "Phrase de synthèse en 1 ligne",
  "pointsForts": ["Point fort 1", "Point fort 2"],
  "pointsAmeliorations": ["Amélioration 1", "Amélioration 2"],
  "prochainsPas": ["Action concrète 1", "Action concrète 2", "Action concrète 3"]
}`;

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
      }
    );
    if (!res.ok) throw new Error('API error');
    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '{}';
    const clean = text.replace(/```json|```/g, '').trim();
    return JSON.parse(clean);
  } catch {
    return {
      score: 68,
      resume: 'Profil agriculteur équilibré avec bon potentiel de développement.',
      pointsForts: ['Diversification des cultures', 'Bonne connaissance du terrain local'],
      pointsAmeliorations: ['Adoption de techniques modernes d\'irrigation', 'Gestion des sols à améliorer'],
      prochainsPas: ['Réaliser une analyse de sol complète', 'Rejoindre une coopérative agricole', 'Explorer les marchés d\'export'],
    };
  }
}

// ── Composant Sélecteur multiple ──────────────────────────────────────────────
function MultiSelect({ options, selected, onToggle, colors }: {
  options: string[]; selected: string[];
  onToggle: (v: string) => void; colors: typeof Colors.light | typeof Colors.dark;
}) {
  return (
    <View style={ms.wrap}>
      {options.map(o => {
        const sel = selected.includes(o);
        return (
          <TouchableOpacity
            key={o}
            style={[ms.pill, { backgroundColor: sel ? colors.primary : colors.backgroundElement, borderColor: sel ? colors.primary : colors.cardBorder }]}
            onPress={() => onToggle(o)}
          >
            <Text style={[ms.pillText, { color: sel ? '#fff' : colors.textSecondary }]}>{o}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const ms = StyleSheet.create({
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: { borderRadius: 20, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 6 },
  pillText: { fontSize: 12, fontWeight: '600' },
});

// ── Composant Sélecteur unique ────────────────────────────────────────────────
function SingleSelect({ options, selected, onSelect, colors }: {
  options: string[]; selected: string;
  onSelect: (v: string) => void; colors: typeof Colors.light | typeof Colors.dark;
}) {
  return (
    <View style={ss.wrap}>
      {options.map(o => {
        const sel = selected === o;
        return (
          <TouchableOpacity
            key={o}
            style={[ss.item, { backgroundColor: sel ? `${colors.primary}15` : colors.backgroundElement, borderColor: sel ? colors.primary : colors.cardBorder }]}
            onPress={() => onSelect(o)}
          >
            {sel && <Ionicons name="checkmark-circle" size={14} color={colors.primary} />}
            <Text style={[ss.itemText, { color: sel ? colors.primary : colors.textSecondary, fontWeight: sel ? '700' : '500' }]}>{o}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const ss = StyleSheet.create({
  wrap: { gap: 6 },
  item: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 10, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 10 },
  itemText: { fontSize: 13 },
});

// ── Barre de score ────────────────────────────────────────────────────────────
function ScoreBar({ score, colors }: { score: number; colors: typeof Colors.light | typeof Colors.dark }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, { toValue: score / 100, duration: 1200, useNativeDriver: false }).start();
  }, [score]);

  const color = score >= 80 ? colors.success : score >= 60 ? '#f5a623' : colors.danger;

  return (
    <View style={sb.container}>
      <View style={[sb.barBg, { backgroundColor: colors.backgroundElement }]}>
        <Animated.View style={[sb.barFill, { width: anim.interpolate({ inputRange: [0,1], outputRange: ['0%','100%'] }), backgroundColor: color }]} />
      </View>
      <Text style={[sb.score, { color }]}>{score}/100</Text>
    </View>
  );
}

const sb = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  barBg: { flex: 1, height: 12, borderRadius: 6, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 6 },
  score: { fontSize: 16, fontWeight: '900', minWidth: 55 },
});

// ── Écran principal ───────────────────────────────────────────────────────────
export default function ProfilScreen() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const colors = (isDark ? Colors.dark : Colors.light) as typeof Colors.light | typeof Colors.dark;
  const { profile, setProfile } = useUser();
  const G = colors.primary;

  // Form state
  const [nom, setNom] = useState(profile?.nom ?? '');
  const [ville, setVille] = useState(profile?.ville ?? 'Yaoundé');
  const [region, setRegion] = useState(profile?.region ?? 'Centre');
  const [zoneClimatique, setZoneClimatique] = useState(profile?.zoneClimatique ?? '');
  const [cultures, setCultures] = useState<string[]>(profile?.cultures ?? []);
  const [superficie, setSuperficie] = useState(profile?.superficie ?? '');
  const [nbParcelles, setNbParcelles] = useState(profile?.nbParcelles ?? '');
  const [objectif, setObjectif] = useState(profile?.objectif ?? '');
  const [experience, setExperience] = useState(profile?.experience ?? '');

  const [analyse, setAnalyse] = useState<AnalyseIA | null>(null);
  const [loadingIA, setLoadingIA] = useState(false);
  const [editMode, setEditMode] = useState(!profile);
  const [notifs, setNotifs] = useState(true);
  const [darkMode, setDarkMode] = useState(scheme === 'dark');

  const headerAnim = useRef(new Animated.Value(0)).current;
  const scoreAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(headerAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
    ]).start();
    if (profile) chargerAnalyse();
  }, []);

  async function chargerAnalyse() {
    if (!profile) return;
    setLoadingIA(true);
    const a = await analyserProfil(profile);
    setAnalyse(a);
    setLoadingIA(false);
  }

  function sauvegarder() {
    const newProfile = { nom, ville, region, zoneClimatique, cultures, superficie, nbParcelles, objectif, experience, defis: [] };
    setProfile(newProfile);
    setEditMode(false);
    chargerAnalyse();
  }

  function toggleCulture(c: string) {
    setCultures(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]);
  }

  const isValid = nom.trim() && cultures.length > 0 && zoneClimatique && objectif && experience;

  const stats: StatFerme[] = [
    { label: 'Superficie', val: superficie ? `${superficie} ha` : '–', icon: 'expand-outline', color: G },
    { label: 'Parcelles', val: nbParcelles || '–', icon: 'map-outline', color: '#3498db' },
    { label: 'Cultures', val: `${cultures.length}`, icon: 'leaf-outline', color: '#27ae60' },
    { label: 'Expérience', val: experience ? experience.split(' ')[0] : '–', icon: 'star-outline', color: '#f5a623' },
  ];

  return (
    <SafeAreaView style={[s.root, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.content}>

        {/* ── Header avatar ── */}
        <Animated.View style={[s.header, { opacity: headerAnim, transform: [{ translateY: headerAnim.interpolate({ inputRange: [0,1], outputRange: [-20,0] }) }] }]}>
          <View style={[s.avatar, { backgroundColor: `${G}20` }]}>
            <Text style={s.avatarEmoji}>👨‍🌾</Text>
          </View>
          <View style={s.headerInfo}>
            <Text style={[s.headerNom, { color: colors.text }]}>{nom || 'Mon Profil Agriculteur'}</Text>
            {ville && <View style={s.headerLocRow}>
              <Ionicons name="location-outline" size={12} color={G} />
              <Text style={[s.headerLoc, { color: colors.textSecondary }]}>{ville}, {region}</Text>
            </View>}
            {experience && <Text style={[s.headerExp, { color: colors.textSecondary }]}>{experience}</Text>}
          </View>
          <TouchableOpacity
            style={[s.editBtn, { backgroundColor: editMode ? `${colors.danger}15` : `${G}15`, borderColor: editMode ? `${colors.danger}30` : `${G}30` }]}
            onPress={() => setEditMode(!editMode)}
          >
            <Ionicons name={editMode ? 'close' : 'create-outline'} size={16} color={editMode ? colors.danger : G} />
            <Text style={[s.editBtnText, { color: editMode ? colors.danger : G }]}>{editMode ? 'Annuler' : 'Modifier'}</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* ── Stats ferme ── */}
        {profile && !editMode && (
          <View style={s.statsGrid}>
            {stats.map((stat, i) => (
              <View key={i} style={[s.statBox, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                <View style={[s.statIcon, { backgroundColor: `${stat.color}15` }]}>
                  <Ionicons name={stat.icon} size={16} color={stat.color} />
                </View>
                <Text style={[s.statVal, { color: colors.text }]}>{stat.val}</Text>
                <Text style={[s.statLbl, { color: colors.textSecondary }]}>{stat.label}</Text>
              </View>
            ))}
          </View>
        )}

        {/* ── Analyse IA ── */}
        {profile && !editMode && (
          <View style={[s.iaCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <View style={s.iaCardHeader}>
              <View style={[s.iaIcon, { backgroundColor: `${G}20` }]}>
                <Ionicons name="sparkles" size={15} color={G} />
              </View>
              <Text style={[s.iaCardTitle, { color: colors.text }]}>Analyse Gemini IA</Text>
              <TouchableOpacity onPress={chargerAnalyse} style={[s.refreshBtn, { backgroundColor: `${G}15` }]}>
                <Ionicons name="refresh" size={14} color={G} />
              </TouchableOpacity>
            </View>

            {loadingIA ? (
              <View style={s.iaLoading}>
                <ActivityIndicator color={G} />
                <Text style={[s.iaLoadingText, { color: colors.textSecondary }]}>Gemini analyse votre profil...</Text>
              </View>
            ) : analyse ? (
              <>
                <Text style={[s.iaResume, { color: colors.textSecondary }]}>{analyse.resume}</Text>
                <ScoreBar score={analyse.score} colors={colors} />

                <View style={s.iaSection}>
                  <Text style={[s.iaSectionTitle, { color: colors.text }]}>✅ Points forts</Text>
                  {analyse.pointsForts.map((p, i) => (
                    <View key={i} style={[s.iaItem, { backgroundColor: `${colors.success}10` }]}>
                      <Ionicons name="checkmark-circle" size={14} color={colors.success} />
                      <Text style={[s.iaItemText, { color: colors.text }]}>{p}</Text>
                    </View>
                  ))}
                </View>

                <View style={s.iaSection}>
                  <Text style={[s.iaSectionTitle, { color: colors.text }]}>⚡ À améliorer</Text>
                  {analyse.pointsAmeliorations.map((p, i) => (
                    <View key={i} style={[s.iaItem, { backgroundColor: `#f59e0b10` }]}>
                      <Ionicons name="alert-circle" size={14} color="#f59e0b" />
                      <Text style={[s.iaItemText, { color: colors.text }]}>{p}</Text>
                    </View>
                  ))}
                </View>

                <View style={[s.iaSection, { borderTopWidth: 1, borderTopColor: colors.cardBorder, paddingTop: 12 }]}>
                  <Text style={[s.iaSectionTitle, { color: colors.text }]}>🎯 Prochaines actions</Text>
                  {analyse.prochainsPas.map((p, i) => (
                    <View key={i} style={s.iaAction}>
                      <View style={[s.iaActionNum, { backgroundColor: G }]}>
                        <Text style={s.iaActionNumText}>{i + 1}</Text>
                      </View>
                      <Text style={[s.iaItemText, { color: colors.text, flex: 1 }]}>{p}</Text>
                    </View>
                  ))}
                </View>
              </>
            ) : (
              <Text style={[s.iaLoadingText, { color: colors.textSecondary }]}>Sauvegardez votre profil pour obtenir une analyse IA.</Text>
            )}
          </View>
        )}

        {/* ── Formulaire d'édition ── */}
        {editMode && (
          <View style={s.form}>
            <Text style={[s.sectionLabel, { color: colors.textSecondary }]}>INFORMATIONS PERSONNELLES</Text>

            <View style={[s.formSection, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
              <View style={s.formField}>
                <Text style={[s.fieldLabel, { color: colors.textSecondary }]}>Prénom et Nom</Text>
                <TextInput
                  style={[s.input, { color: colors.text, backgroundColor: colors.backgroundElement, borderColor: colors.cardBorder }]}
                  placeholder="Ex: Jean-Pierre Mballa"
                  placeholderTextColor={colors.textSecondary}
                  value={nom}
                  onChangeText={setNom}
                />
              </View>

              <View style={s.formFieldRow}>
                <View style={[s.formField, { flex: 1 }]}>
                  <Text style={[s.fieldLabel, { color: colors.textSecondary }]}>Ville</Text>
                  <TextInput style={[s.input, { color: colors.text, backgroundColor: colors.backgroundElement, borderColor: colors.cardBorder }]} placeholder="Yaoundé" placeholderTextColor={colors.textSecondary} value={ville} onChangeText={setVille} />
                </View>
                <View style={[s.formField, { flex: 1 }]}>
                  <Text style={[s.fieldLabel, { color: colors.textSecondary }]}>Région</Text>
                  <TextInput style={[s.input, { color: colors.text, backgroundColor: colors.backgroundElement, borderColor: colors.cardBorder }]} placeholder="Centre" placeholderTextColor={colors.textSecondary} value={region} onChangeText={setRegion} />
                </View>
              </View>
            </View>

            <Text style={[s.sectionLabel, { color: colors.textSecondary }]}>MA FERME</Text>
            <View style={[s.formSection, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
              <View style={s.formFieldRow}>
                <View style={[s.formField, { flex: 1 }]}>
                  <Text style={[s.fieldLabel, { color: colors.textSecondary }]}>Superficie (ha)</Text>
                  <TextInput style={[s.input, { color: colors.text, backgroundColor: colors.backgroundElement, borderColor: colors.cardBorder }]} placeholder="Ex: 2.5" keyboardType="numeric" placeholderTextColor={colors.textSecondary} value={superficie} onChangeText={setSuperficie} />
                </View>
                <View style={[s.formField, { flex: 1 }]}>
                  <Text style={[s.fieldLabel, { color: colors.textSecondary }]}>Nb parcelles</Text>
                  <TextInput style={[s.input, { color: colors.text, backgroundColor: colors.backgroundElement, borderColor: colors.cardBorder }]} placeholder="Ex: 3" keyboardType="numeric" placeholderTextColor={colors.textSecondary} value={nbParcelles} onChangeText={setNbParcelles} />
                </View>
              </View>

              <View style={s.formField}>
                <Text style={[s.fieldLabel, { color: colors.textSecondary }]}>Zone climatique</Text>
                <SingleSelect options={ZONES_CLIMATIQUES} selected={zoneClimatique} onSelect={setZoneClimatique} colors={colors} />
              </View>
            </View>

            <Text style={[s.sectionLabel, { color: colors.textSecondary }]}>MES CULTURES</Text>
            <View style={[s.formSection, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
              <Text style={[s.fieldLabel, { color: colors.textSecondary }]}>Sélectionnez vos cultures</Text>
              <MultiSelect options={CULTURES_DISPO} selected={cultures} onToggle={toggleCulture} colors={colors} />
            </View>

            <Text style={[s.sectionLabel, { color: colors.textSecondary }]}>MON EXPÉRIENCE</Text>
            <View style={[s.formSection, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
              <View style={s.formField}>
                <Text style={[s.fieldLabel, { color: colors.textSecondary }]}>Niveau d'expérience</Text>
                <SingleSelect options={NIVEAUX_EXP} selected={experience} onSelect={setExperience} colors={colors} />
              </View>

              <View style={s.formField}>
                <Text style={[s.fieldLabel, { color: colors.textSecondary }]}>Objectif principal</Text>
                <SingleSelect options={OBJECTIFS} selected={objectif} onSelect={setObjectif} colors={colors} />
              </View>
            </View>

            <TouchableOpacity
              style={[s.saveBtn, { backgroundColor: isValid ? G : colors.backgroundElement }]}
              onPress={isValid ? sauvegarder : undefined}
              activeOpacity={isValid ? 0.85 : 1}
            >
              <Ionicons name="checkmark-circle" size={18} color={isValid ? '#fff' : colors.textSecondary} />
              <Text style={[s.saveBtnText, { color: isValid ? '#fff' : colors.textSecondary }]}>
                {isValid ? 'Sauvegarder le profil' : 'Remplissez tous les champs'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Paramètres ── */}
        {!editMode && (
          <View style={[s.settingsCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <Text style={[s.sectionLabel, { color: colors.textSecondary }]}>PARAMÈTRES</Text>

            {[
              { label: 'Notifications push', sub: 'Alertes météo et IA', icon: 'notifications-outline' as const, value: notifs, onToggle: setNotifs, color: G },
            ].map((item, i) => (
              <View key={i} style={s.settingsRow}>
                <View style={[s.settingsIcon, { backgroundColor: `${item.color}15` }]}>
                  <Ionicons name={item.icon} size={16} color={item.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[s.settingsLabel, { color: colors.text }]}>{item.label}</Text>
                  <Text style={[s.settingsSub, { color: colors.textSecondary }]}>{item.sub}</Text>
                </View>
                <Switch value={item.value} onValueChange={item.onToggle} trackColor={{ true: G }} />
              </View>
            ))}

            <TouchableOpacity style={[s.settingsRow, s.settingsBtn]}>
              <View style={[s.settingsIcon, { backgroundColor: `${colors.info}15` }]}>
                <Ionicons name="help-circle-outline" size={16} color={colors.info} />
              </View>
              <Text style={[s.settingsLabel, { color: colors.text }]}>Aide & Support</Text>
              <Ionicons name="chevron-forward" size={14} color={colors.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity style={[s.settingsRow, s.settingsBtn]}>
              <View style={[s.settingsIcon, { backgroundColor: `${colors.danger}15` }]}>
                <Ionicons name="log-out-outline" size={16} color={colors.danger} />
              </View>
              <Text style={[s.settingsLabel, { color: colors.danger }]}>Se déconnecter</Text>
              <Ionicons name="chevron-forward" size={14} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: Spacing.md, paddingTop: 16 },

  header: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 16 },
  avatar: { width: 68, height: 68, borderRadius: 34, alignItems: 'center', justifyContent: 'center' },
  avatarEmoji: { fontSize: 36 },
  headerInfo: { flex: 1, gap: 3 },
  headerNom: { fontSize: 18, fontWeight: '900' },
  headerLocRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  headerLoc: { fontSize: 12 },
  headerExp: { fontSize: 11 },
  editBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 10, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 7 },
  editBtnText: { fontSize: 12, fontWeight: '700' },

  statsGrid: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  statBox: { flex: 1, alignItems: 'center', borderRadius: Radius.md, borderWidth: 1, paddingVertical: 12, gap: 4 },
  statIcon: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  statVal: { fontSize: 14, fontWeight: '900' },
  statLbl: { fontSize: 9 },

  iaCard: { borderRadius: Radius.lg, borderWidth: 1, padding: 16, marginBottom: 16, gap: 12 },
  iaCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iaIcon: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  iaCardTitle: { flex: 1, fontSize: 15, fontWeight: '800' },
  refreshBtn: { width: 30, height: 30, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  iaResume: { fontSize: 13, lineHeight: 19 },
  iaLoading: { alignItems: 'center', gap: 10, paddingVertical: 20 },
  iaLoadingText: { fontSize: 12 },
  iaSection: { gap: 6 },
  iaSectionTitle: { fontSize: 12, fontWeight: '800', marginBottom: 2 },
  iaItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, borderRadius: 8, padding: 8 },
  iaItemText: { flex: 1, fontSize: 12, lineHeight: 18 },
  iaAction: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  iaActionNum: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 },
  iaActionNumText: { color: '#fff', fontSize: 11, fontWeight: '800' },

  sectionLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1, marginBottom: 8, marginTop: 4 },

  form: { gap: 0 },
  formSection: { borderRadius: Radius.lg, borderWidth: 1, padding: 14, marginBottom: 12, gap: 14 },
  formField: { gap: 6 },
  formFieldRow: { flexDirection: 'row', gap: 12 },
  fieldLabel: { fontSize: 12, fontWeight: '600' },
  input: { borderRadius: 10, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10, fontSize: 13 },

  saveBtn: { borderRadius: Radius.lg, paddingVertical: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 4, marginBottom: 16 },
  saveBtnText: { fontSize: 15, fontWeight: '800' },

  settingsCard: { borderRadius: Radius.lg, borderWidth: 1, padding: 14, marginBottom: 8, gap: 4 },
  settingsRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 },
  settingsBtn: {},
  settingsIcon: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  settingsLabel: { flex: 1, fontSize: 14, fontWeight: '600' },
  settingsSub: { fontSize: 11, marginTop: 1 },
});
