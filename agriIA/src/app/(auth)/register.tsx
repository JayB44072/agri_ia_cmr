import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  TextInput, StatusBar, KeyboardAvoidingView,
  Platform, ScrollView, ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, Shadows } from '@/constants/theme';
import { useUser } from '@/context/UserContext';
import { useAuth } from '@/context/AuthContext';
import { AuthBackground } from '@/components/ui/AuthBackground';
import ErrorBox from '@/components/ui/ErrorBox';

// ── Palette ───────────────────────────────────────────────────────────────────
const G      = Colors.splash.green;
const T      = '#1a3a1f';
const T2     = '#4a7a55';
const T3     = '#2d6a35';
const BG     = '#ffffff';
const BGF    = '#f4f9f5';
const BORDER = 'rgba(60,185,90,0.2)';

// ── Types ────────────────────────────────────────────────────────────────────
interface FormData {
  nom: string; email: string; password: string; confirmPassword: string;
  region: string; ville: string; zoneClimatique: string;
  cultures: string[]; superficie: string; nbParcelles: string;
  objectif: string; experience: string; defis: string[];
}

const INITIAL_FORM: FormData = {
  nom: '', email: '', password: '', confirmPassword: '',
  region: '', ville: '', zoneClimatique: '',
  cultures: [], superficie: '', nbParcelles: '',
  objectif: '', experience: '', defis: [],
};

interface VilleData { nom: string; region: string; zone: string; }

const VILLES_CAMEROUN: VilleData[] = [
  { nom: 'Yaoundé',     region: 'Centre',       zone: 'Équatorial humide' },
  { nom: 'Mbalmayo',    region: 'Centre',       zone: 'Équatorial humide' },
  { nom: 'Obala',       region: 'Centre',       zone: 'Équatorial humide' },
  { nom: 'Nanga-Eboko', region: 'Centre',       zone: 'Équatorial humide' },
  { nom: 'Bafia',       region: 'Centre',       zone: 'Équatorial humide' },
  { nom: 'Monatélé',    region: 'Centre',       zone: 'Équatorial humide' },
  { nom: 'Soa',         region: 'Centre',       zone: 'Équatorial humide' },
  { nom: 'Mfou',        region: 'Centre',       zone: 'Équatorial humide' },
  { nom: 'Ayos',        region: 'Centre',       zone: 'Équatorial humide' },
  { nom: 'Douala',      region: 'Littoral',     zone: 'Équatorial humide' },
  { nom: 'Nkongsamba',  region: 'Littoral',     zone: 'Tropical humide'   },
  { nom: 'Edéa',        region: 'Littoral',     zone: 'Équatorial humide' },
  { nom: 'Loum',        region: 'Littoral',     zone: 'Tropical humide'   },
  { nom: 'Mbanga',      region: 'Littoral',     zone: 'Tropical humide'   },
  { nom: 'Melong',      region: 'Littoral',     zone: 'Tropical humide'   },
  { nom: 'Ndom',        region: 'Littoral',     zone: 'Équatorial humide' },
  { nom: 'Bafoussam',   region: 'Ouest',        zone: 'Tropical humide'   },
  { nom: 'Dschang',     region: 'Ouest',        zone: 'Montagnard'        },
  { nom: 'Mbouda',      region: 'Ouest',        zone: 'Montagnard'        },
  { nom: 'Foumban',     region: 'Ouest',        zone: 'Tropical humide'   },
  { nom: 'Bafang',      region: 'Ouest',        zone: 'Tropical humide'   },
  { nom: 'Baham',       region: 'Ouest',        zone: 'Tropical humide'   },
  { nom: 'Bangangté',   region: 'Ouest',        zone: 'Tropical humide'   },
  { nom: 'Foumbot',     region: 'Ouest',        zone: 'Tropical humide'   },
  { nom: 'Tonga',       region: 'Ouest',        zone: 'Tropical humide'   },
  { nom: 'Bamenda',     region: 'Nord-Ouest',   zone: 'Montagnard'        },
  { nom: 'Kumbo',       region: 'Nord-Ouest',   zone: 'Montagnard'        },
  { nom: 'Wum',         region: 'Nord-Ouest',   zone: 'Tropical humide'   },
  { nom: 'Nkambe',      region: 'Nord-Ouest',   zone: 'Montagnard'        },
  { nom: 'Ndop',        region: 'Nord-Ouest',   zone: 'Tropical humide'   },
  { nom: 'Fundong',     region: 'Nord-Ouest',   zone: 'Montagnard'        },
  { nom: 'Buea',        region: 'Sud-Ouest',    zone: 'Montagnard'        },
  { nom: 'Limbe',       region: 'Sud-Ouest',    zone: 'Équatorial humide' },
  { nom: 'Kumba',       region: 'Sud-Ouest',    zone: 'Tropical humide'   },
  { nom: 'Mamfe',       region: 'Sud-Ouest',    zone: 'Tropical humide'   },
  { nom: 'Muyuka',      region: 'Sud-Ouest',    zone: 'Tropical humide'   },
  { nom: 'Tiko',        region: 'Sud-Ouest',    zone: 'Équatorial humide' },
  { nom: 'Mundemba',    region: 'Sud-Ouest',    zone: 'Équatorial humide' },
  { nom: 'Ebolowa',     region: 'Sud',          zone: 'Équatorial humide' },
  { nom: 'Kribi',       region: 'Sud',          zone: 'Équatorial humide' },
  { nom: 'Sangmélima',  region: 'Sud',          zone: 'Équatorial humide' },
  { nom: 'Ambam',       region: 'Sud',          zone: 'Équatorial humide' },
  { nom: 'Djoum',       region: 'Sud',          zone: 'Équatorial humide' },
  { nom: 'Lolodorf',    region: 'Sud',          zone: 'Équatorial humide' },
  { nom: 'Bertoua',     region: 'Est',          zone: 'Équatorial humide' },
  { nom: 'Abong-Mbang', region: 'Est',          zone: 'Équatorial humide' },
  { nom: 'Batouri',     region: 'Est',          zone: 'Équatorial humide' },
  { nom: 'Yokadouma',   region: 'Est',          zone: 'Équatorial humide' },
  { nom: 'Belabo',      region: 'Est',          zone: 'Équatorial humide' },
  { nom: 'Doumé',       region: 'Est',          zone: 'Équatorial humide' },
  { nom: 'Ngaoundéré',  region: 'Adamaoua',     zone: 'Tropical sec'      },
  { nom: 'Meiganga',    region: 'Adamaoua',     zone: 'Tropical sec'      },
  { nom: 'Tibati',      region: 'Adamaoua',     zone: 'Tropical sec'      },
  { nom: 'Banyo',       region: 'Adamaoua',     zone: 'Tropical sec'      },
  { nom: 'Tignère',     region: 'Adamaoua',     zone: 'Tropical sec'      },
  { nom: 'Nganha',      region: 'Adamaoua',     zone: 'Tropical sec'      },
  { nom: 'Garoua',      region: 'Nord',         zone: 'Tropical sec'      },
  { nom: 'Guider',      region: 'Nord',         zone: 'Tropical sec'      },
  { nom: 'Figuil',      region: 'Nord',         zone: 'Tropical sec'      },
  { nom: 'Poli',        region: 'Nord',         zone: 'Tropical sec'      },
  { nom: 'Rey-Bouba',   region: 'Nord',         zone: 'Tropical sec'      },
  { nom: 'Ngong',       region: 'Nord',         zone: 'Tropical sec'      },
  { nom: 'Pitoa',       region: 'Nord',         zone: 'Tropical sec'      },
  { nom: 'Maroua',      region: 'Extrême-Nord', zone: 'Sahélien'          },
  { nom: 'Mokolo',      region: 'Extrême-Nord', zone: 'Sahélien'          },
  { nom: 'Kousseri',    region: 'Extrême-Nord', zone: 'Sahélien'          },
  { nom: 'Yagoua',      region: 'Extrême-Nord', zone: 'Sahélien'          },
  { nom: 'Mora',        region: 'Extrême-Nord', zone: 'Sahélien'          },
  { nom: 'Kaélé',       region: 'Extrême-Nord', zone: 'Sahélien'          },
  { nom: 'Waza',        region: 'Extrême-Nord', zone: 'Sahélien'          },
  { nom: 'Mindif',      region: 'Extrême-Nord', zone: 'Sahélien'          },
  { nom: 'Meri',        region: 'Extrême-Nord', zone: 'Sahélien'          },
];

const CULTURES_DISPO = [
  { label: 'Maïs' }, { label: 'Manioc' }, { label: 'Tomate' },
  { label: 'Cacao' }, { label: 'Plantain' }, { label: 'Arachide' },
  { label: 'Café' }, { label: 'Sorgho' }, { label: 'Igname' }, { label: 'Riz' },
];

const OBJECTIFS = [
  { label: 'Maximiser le rendement', icon: 'trending-up-outline' },
  { label: 'Améliorer la qualité',   icon: 'ribbon-outline'      },
  { label: 'Agriculture durable',    icon: 'earth-outline'       },
  { label: 'Réduire les coûts',      icon: 'cash-outline'        },
];

const EXPERIENCES = [
  { label: 'Débutant (< 2 ans)',      icon: 'school-outline'  },
  { label: 'Intermédiaire (2-5 ans)', icon: 'person-outline'  },
  { label: 'Expérimenté (5-10 ans)',  icon: 'star-outline'    },
  { label: 'Expert (> 10 ans)',       icon: 'trophy-outline'  },
];

const DEFIS_DISPO = [
  "Manque d'eau", 'Maladies des plantes', 'Ravageurs', 'Sol pauvre',
  'Météo imprévisible', 'Manque de ressources', 'Accès au marché', "Main d'œuvre",
];

// ── StepIndicator ─────────────────────────────────────────────────────────────
function StepIndicator({ current, total }: { current: number; total: number }): React.JSX.Element {
  return (
    <View style={si.row}>
      {Array.from({ length: total }).map((_, i) => (
        <View key={i} style={[si.dot, i < current && si.dotDone, i === current && si.dotActive]}>
          {i < current && <Ionicons name="checkmark" size={10} color="#fff" />}
        </View>
      ))}
    </View>
  );
}
const si = StyleSheet.create({
  row:       { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: Spacing.lg },
  dot:       { width: 28, height: 28, borderRadius: 14, backgroundColor: BGF, borderWidth: 1, borderColor: BORDER, alignItems: 'center', justifyContent: 'center' },
  dotActive: { backgroundColor: G, borderColor: G, width: 32, height: 32, borderRadius: 16 },
  dotDone:   { backgroundColor: 'rgba(60,185,90,0.4)', borderColor: G },
});

// ── FieldInput ────────────────────────────────────────────────────────────────
function FieldInput({ label, value, onChangeText, placeholder, icon, secureTextEntry, keyboardType, rightElement, optional }: {
  label: string; value: string; onChangeText: (v: string) => void;
  placeholder: string; icon: keyof typeof Ionicons.glyphMap;
  secureTextEntry?: boolean; keyboardType?: any;
  rightElement?: React.ReactNode; optional?: boolean;
}): React.JSX.Element {
  return (
    <View style={fi.block}>
      <View style={fi.labelRow}>
        <Text style={fi.label}>{label}</Text>
        {optional && <Text style={fi.optional}>optionnel</Text>}
      </View>
      <View style={fi.row}>
        <Ionicons name={icon} size={18} color={G} style={fi.icon} />
        <TextInput
          style={fi.input} placeholder={placeholder}
          placeholderTextColor={Colors.light.textSecondary}
          value={value} onChangeText={onChangeText}
          secureTextEntry={secureTextEntry} keyboardType={keyboardType}
          autoCapitalize="words"
        />
        {rightElement}
      </View>
    </View>
  );
}
const fi = StyleSheet.create({
  block:    { marginBottom: Spacing.md },
  labelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  label:    { fontSize: 12, fontWeight: '600', color: T3, letterSpacing: 0.5 },
  optional: { fontSize: 10, color: Colors.light.textSecondary, fontStyle: 'italic' },
  row:      { flexDirection: 'row', alignItems: 'center', backgroundColor: BGF, borderRadius: Radius.md, borderWidth: 1, borderColor: BORDER, paddingHorizontal: 12, height: 50 },
  icon:     { marginRight: 8 },
  input:    { flex: 1, color: T, fontSize: 14 },
});

// ── VilleSearch ───────────────────────────────────────────────────────────────
function VilleSearch({ value, onChange }: { value: string; onChange: (v: VilleData) => void }): React.JSX.Element {
  const [query, setQuery]         = useState(value);
  const [open, setOpen]           = useState(false);
  const [validated, setValidated] = useState(!!value);

  const suggestions = useMemo(() => {
    if (query.length < 2) return [];
    const q = query.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return VILLES_CAMEROUN.filter(v => {
      const nom = v.nom.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      return nom.startsWith(q) || nom.includes(q);
    }).slice(0, 6);
  }, [query]);

  const select = (v: VilleData) => { setQuery(v.nom); setOpen(false); setValidated(true); onChange(v); };
  const handleChange = (text: string) => { setQuery(text); setValidated(false); setOpen(true); };

  return (
    <View style={vs.block}>
      <View style={vs.labelRow}>
        <Text style={vs.label}>Ville</Text>
        {validated && (
          <View style={vs.validBadge}>
            <Ionicons name="checkmark-circle" size={12} color={G} />
            <Text style={vs.validText}>Ville reconnue</Text>
          </View>
        )}
      </View>
      <View style={[vs.inputRow, validated && vs.inputRowValid]}>
        <Ionicons name="location-outline" size={18} color={validated ? G : T3} style={vs.icon} />
        <TextInput
          style={vs.input} placeholder="Ex: Bafoussam, Douala..."
          placeholderTextColor={Colors.light.textSecondary}
          value={query} onChangeText={handleChange}
          autoCapitalize="words"
          onFocus={() => query.length >= 2 && setOpen(true)}
        />
        {query.length > 0 && !validated && (
          <TouchableOpacity onPress={() => { setQuery(''); setOpen(false); setValidated(false); }}>
            <Ionicons name="close-circle" size={18} color={Colors.light.textSecondary} />
          </TouchableOpacity>
        )}
        {validated && <Ionicons name="checkmark-circle" size={18} color={G} />}
      </View>
      {open && suggestions.length > 0 && (
        <View style={vs.dropdown}>
          {suggestions.map((v, i) => (
            <TouchableOpacity
              key={v.nom + v.region}
              style={[vs.suggestion, i < suggestions.length - 1 && vs.suggestionBorder]}
              onPress={() => select(v)} activeOpacity={0.75}
            >
              <View style={vs.suggestionLeft}>
                <Ionicons name="location" size={14} color={G} style={{ marginRight: 8 }} />
                <Text style={vs.suggestionNom}>{v.nom}</Text>
              </View>
              <View style={vs.suggestionRight}>
                <Text style={vs.suggestionRegion}>{v.region}</Text>
                <View style={vs.zoneBadge}>
                  <Text style={vs.zoneText}>{v.zone.split(' ')[0]}</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}
      {open && query.length >= 2 && suggestions.length === 0 && !validated && (
        <View style={vs.noResult}>
          <Ionicons name="search-outline" size={14} color={Colors.light.textSecondary} />
          <Text style={vs.noResultText}>Ville non trouvée. Vérifiez l'orthographe ou complétez manuellement ci-dessous.</Text>
        </View>
      )}
    </View>
  );
}
const vs = StyleSheet.create({
  block:            { marginBottom: Spacing.md },
  labelRow:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  label:            { fontSize: 12, fontWeight: '600', color: T3, letterSpacing: 0.5 },
  validBadge:       { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(60,185,90,0.1)', borderRadius: Radius.full, paddingHorizontal: 8, paddingVertical: 2 },
  validText:        { fontSize: 10, color: G, fontWeight: '600' },
  inputRow:         { flexDirection: 'row', alignItems: 'center', backgroundColor: BGF, borderRadius: Radius.md, borderWidth: 1, borderColor: BORDER, paddingHorizontal: 12, height: 50 },
  inputRowValid:    { borderColor: G, backgroundColor: 'rgba(60,185,90,0.06)' },
  icon:             { marginRight: 8 },
  input:            { flex: 1, color: T, fontSize: 14 },
  dropdown:         { backgroundColor: '#ffffff', borderRadius: Radius.md, borderWidth: 1, borderColor: 'rgba(60,185,90,0.25)', marginTop: 4, overflow: 'hidden',
                      shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 4 },
  suggestion:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 12 },
  suggestionBorder: { borderBottomWidth: 1, borderBottomColor: 'rgba(60,185,90,0.1)' },
  suggestionLeft:   { flexDirection: 'row', alignItems: 'center', flex: 1 },
  suggestionNom:    { fontSize: 14, color: T, fontWeight: '600' },
  suggestionRight:  { flexDirection: 'row', alignItems: 'center', gap: 6 },
  suggestionRegion: { fontSize: 11, color: T2 },
  zoneBadge:        { backgroundColor: 'rgba(60,185,90,0.12)', borderRadius: Radius.full, paddingHorizontal: 6, paddingVertical: 2 },
  zoneText:         { fontSize: 9, color: G, fontWeight: '600' },
  noResult:         { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: BGF, borderRadius: Radius.md, padding: 12, marginTop: 4, borderWidth: 1, borderColor: BORDER },
  noResultText:     { fontSize: 11, color: T2, flex: 1, lineHeight: 16 },
});

// ── SelectGrid ────────────────────────────────────────────────────────────────
function SelectGrid({ label, options, selected, onToggle, multi = false }: {
  label: string; options: string[]; selected: string | string[];
  onToggle: (val: string) => void; multi?: boolean;
}): React.JSX.Element {
  const isSelected = (val: string) => multi ? (selected as string[]).includes(val) : selected === val;
  return (
    <View style={sg.block}>
      <Text style={sg.label}>{label}</Text>
      <View style={sg.grid}>
        {options.map((opt) => (
          <TouchableOpacity key={opt} style={[sg.chip, isSelected(opt) && sg.chipActive]} onPress={() => onToggle(opt)} activeOpacity={0.75}>
            {isSelected(opt) && <Ionicons name="checkmark-circle" size={14} color={G} style={{ marginRight: 4 }} />}
            <Text style={[sg.chipText, isSelected(opt) && sg.chipTextActive]}>{opt}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}
const sg = StyleSheet.create({
  block:          { marginBottom: Spacing.md },
  label:          { fontSize: 12, fontWeight: '600', color: T3, letterSpacing: 0.5, marginBottom: 8 },
  grid:           { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip:           { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: Radius.full, borderWidth: 1, borderColor: BORDER, backgroundColor: BGF },
  chipActive:     { borderColor: G, backgroundColor: 'rgba(60,185,90,0.12)' },
  chipText:       { fontSize: 12, color: T2 },
  chipTextActive: { color: T, fontWeight: '600' },
});

// ── OptionCard ────────────────────────────────────────────────────────────────
function OptionCard({ label, icon, selected, onPress }: {
  label: string; icon: keyof typeof Ionicons.glyphMap; selected: boolean; onPress: () => void;
}): React.JSX.Element {
  return (
    <TouchableOpacity style={[oc.card, selected && oc.cardActive]} onPress={onPress} activeOpacity={0.75}>
      <Ionicons name={icon} size={22} color={selected ? G : T2} style={{ marginBottom: 6 }} />
      <Text style={[oc.label, selected && oc.labelActive]}>{label}</Text>
      {selected && <View style={oc.check}><Ionicons name="checkmark" size={10} color="#fff" /></View>}
    </TouchableOpacity>
  );
}
const oc = StyleSheet.create({
  card:        { width: '47%', backgroundColor: BGF, borderRadius: Radius.lg, borderWidth: 1, borderColor: BORDER, padding: 14, alignItems: 'center', position: 'relative' },
  cardActive:  { borderColor: G, backgroundColor: 'rgba(60,185,90,0.10)' },
  label:       { fontSize: 12, color: T2, textAlign: 'center' },
  labelActive: { color: T, fontWeight: '600' },
  check:       { position: 'absolute', top: 8, right: 8, width: 16, height: 16, borderRadius: 8, backgroundColor: G, alignItems: 'center', justifyContent: 'center' },
});

// ── Composant principal ───────────────────────────────────────────────────────
export default function Register(): React.JSX.Element {
  const { setProfile } = useUser();
  const { signUp } = useAuth();
  const [step, setStep]         = useState(0);
  const [form, setForm]         = useState<FormData>(INITIAL_FORM);
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const TOTAL_STEPS = 5;

  const update = (key: keyof FormData, value: any) => setForm(prev => ({ ...prev, [key]: value }));
  const toggleArray = (key: keyof FormData, val: string) => {
    const arr = form[key] as string[];
    update(key, arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val]);
  };
  const handleVilleSelect = (v: VilleData) => {
    update('ville', v.nom); update('region', v.region); update('zoneClimatique', v.zone);
  };

  const validateStep = (): boolean => {
    setError('');
    if (step === 0) {
      if (!form.nom || !form.email || !form.password || !form.confirmPassword) { setError('Veuillez remplir tous les champs.'); return false; }
      if (form.password !== form.confirmPassword) { setError('Les mots de passe ne correspondent pas.'); return false; }
      if (form.password.length < 6) { setError('Le mot de passe doit contenir au moins 6 caractères.'); return false; }
    }
    if (step === 1) {
      if (!form.ville)          { setError('Veuillez sélectionner votre ville.');           return false; }
      if (!form.region)         { setError('Veuillez sélectionner votre région.');          return false; }
      if (!form.zoneClimatique) { setError('Veuillez sélectionner votre zone climatique.'); return false; }
    }
    if (step === 2 && form.cultures.length === 0) { setError('Veuillez sélectionner au moins une culture.'); return false; }
    if (step === 3 && (!form.objectif || !form.experience)) { setError('Veuillez sélectionner votre objectif et votre expérience.'); return false; }
    return true;
  };

  const nextStep = () => { if (!validateStep()) return; if (step < TOTAL_STEPS - 1) setStep(s => s + 1); };
  const prevStep = () => { setError(''); if (step > 0) setStep(s => s - 1); };

  const handleSubmit = async () => {
    setError('');
    setLoading(true);

    const profileData = {
      city: form.ville,
      region: form.region,
      climate_zone: form.zoneClimatique,
      crops: form.cultures,
      superficie: form.superficie,
      nb_parcelles: form.nbParcelles,
      experience: form.experience,
      objectives: form.objectif,
      role: 'farmer' as const,
    };

    const { error: signUpError } = await signUp(form.email, form.password, form.nom, profileData);
    setLoading(false);
    if (signUpError) {
      setError(signUpError.message);
      return;
    }

    router.replace('/(tabs)');
  };

  const STEP_TITLES = [
    { title: 'Créer un compte',    sub: 'Vos informations de connexion'          },
    { title: 'Votre localisation', sub: 'Tapez votre ville pour la détecter'     },
    { title: 'Votre exploitation', sub: 'Cultures et superficie'                 },
    { title: 'Vos objectifs',      sub: 'Pour personnaliser vos recommandations' },
    { title: 'Confirmation',       sub: 'Votre profil IA est prêt !'             },
  ];

  return (
    <KeyboardAvoidingView style={s.root} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      <AuthBackground variant="register" />

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={step === 0 ? () => router.back() : prevStep} style={s.backBtn}>
          <Ionicons name="arrow-back" size={22} color={T} />
        </TouchableOpacity>
        <Text style={s.headerStep}>Étape {step + 1}/{TOTAL_STEPS}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={s.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <StepIndicator current={step} total={TOTAL_STEPS} />

        <View style={s.titleBlock}>
          <Text style={s.title}>{STEP_TITLES[step].title}</Text>
          <Text style={s.sub}>{STEP_TITLES[step].sub}</Text>
        </View>

        {/* Étape 1 : Compte */}
        {step === 0 && (
          <View style={s.card}>
            <FieldInput label="Nom complet" value={form.nom} onChangeText={v => update('nom', v)} placeholder="Entrez votre nom" icon="person-outline" />
            <FieldInput label="Adresse e-mail" value={form.email} onChangeText={v => update('email', v)} placeholder="exemple@gmail.com" icon="mail-outline" keyboardType="email-address" />
            <FieldInput label="Mot de passe" value={form.password} onChangeText={v => update('password', v)} placeholder="••••••••" icon="lock-closed-outline" secureTextEntry={!showPass}
              rightElement={
                <TouchableOpacity onPress={() => setShowPass(!showPass)}>
                  <Ionicons name={showPass ? 'eye-off-outline' : 'eye-outline'} size={20} color={G} />
                </TouchableOpacity>
              }
            />
            <FieldInput label="Confirmer le mot de passe" value={form.confirmPassword} onChangeText={v => update('confirmPassword', v)} placeholder="••••••••" icon="lock-closed-outline" secureTextEntry={!showPass} />
          </View>
        )}

        {/* Étape 2 : Localisation */}
        {step === 1 && (
          <View style={s.card}>
            <View style={s.infoBox}>
              <Ionicons name="bulb-outline" size={16} color={G} />
              <Text style={s.infoText}>Tapez les premières lettres de votre ville — la région et la zone climatique seront remplies automatiquement.</Text>
            </View>
            <VilleSearch value={form.ville} onChange={handleVilleSelect} />
            {form.ville && form.region && (
              <View style={s.autoFilled}>
                <View style={s.autoFilledRow}>
                  <Ionicons name="map-outline" size={14} color={G} />
                  <Text style={s.autoFilledLabel}>Région détectée</Text>
                  <Text style={s.autoFilledValue}>{form.region}</Text>
                </View>
                <View style={s.autoFilledRow}>
                  <Ionicons name="partly-sunny-outline" size={14} color={G} />
                  <Text style={s.autoFilledLabel}>Zone climatique</Text>
                  <Text style={s.autoFilledValue}>{form.zoneClimatique}</Text>
                </View>
              </View>
            )}
            {form.ville && !form.region && (
              <>
                <View style={s.dividerRow}>
                  <View style={s.dividerLine} />
                  <Text style={s.dividerText}>Complétez manuellement</Text>
                  <View style={s.dividerLine} />
                </View>
                <SelectGrid label="Région" options={['Adamaoua','Centre','Est','Extrême-Nord','Littoral','Nord','Nord-Ouest','Ouest','Sud','Sud-Ouest']} selected={form.region} onToggle={v => update('region', v)} />
                <SelectGrid label="Zone climatique" options={['Équatorial humide','Tropical humide','Tropical sec','Sahélien','Montagnard']} selected={form.zoneClimatique} onToggle={v => update('zoneClimatique', v)} />
              </>
            )}
          </View>
        )}

        {/* Étape 3 : Exploitation */}
        {step === 2 && (
          <View style={s.card}>
            <SelectGrid label="Cultures pratiquées (plusieurs possibles)" options={CULTURES_DISPO.map(c => c.label)} selected={form.cultures} onToggle={v => toggleArray('cultures', v)} multi />
            <FieldInput label="Superficie totale (hectares)" value={form.superficie} onChangeText={v => update('superficie', v)} placeholder="Ex: 3.5" icon="resize-outline" keyboardType="decimal-pad" optional />
            <FieldInput label="Nombre de parcelles" value={form.nbParcelles} onChangeText={v => update('nbParcelles', v)} placeholder="Ex: 4" icon="grid-outline" keyboardType="number-pad" optional />
          </View>
        )}

        {/* Étape 4 : Objectifs */}
        {step === 3 && (
          <View style={s.card}>
            <Text style={sg.label}>Objectif principal</Text>
            <View style={s.optionGrid}>
              {OBJECTIFS.map(o => (
                <OptionCard key={o.label} label={o.label} icon={o.icon as keyof typeof Ionicons.glyphMap} selected={form.objectif === o.label} onPress={() => update('objectif', o.label)} />
              ))}
            </View>
            <Text style={[sg.label, { marginTop: Spacing.md }]}>Niveau d'expérience</Text>
            <View style={s.optionGrid}>
              {EXPERIENCES.map(e => (
                <OptionCard key={e.label} label={e.label} icon={e.icon as keyof typeof Ionicons.glyphMap} selected={form.experience === e.label} onPress={() => update('experience', e.label)} />
              ))}
            </View>
            <SelectGrid label="Défis principaux (plusieurs possibles)" options={DEFIS_DISPO} selected={form.defis} onToggle={v => toggleArray('defis', v)} multi />
          </View>
        )}

        {/* Étape 5 : Confirmation */}
        {step === 4 && (
          <View style={s.card}>
            <View style={s.confirmHeader}>
              <View style={s.confirmIcon}>
                <Ionicons name="checkmark-circle" size={48} color={G} />
              </View>
              <Text style={s.confirmTitle}>Profil IA créé !</Text>
              <Text style={s.confirmSub}>Votre profil personnalisé est prêt. L'IA AgriSmart va adapter toutes ses recommandations à votre exploitation.</Text>
            </View>
            {[
              { icon: 'person-outline'       as const, label: 'Nom',          value: form.nom },
              { icon: 'location-outline'     as const, label: 'Localisation', value: `${form.ville}, ${form.region}` },
              { icon: 'partly-sunny-outline' as const, label: 'Climat',       value: form.zoneClimatique || '—' },
              { icon: 'leaf-outline'         as const, label: 'Cultures',     value: form.cultures.join(', ') || '—' },
              { icon: 'resize-outline'       as const, label: 'Superficie',   value: form.superficie ? `${form.superficie} ha` : '—' },
              { icon: 'trending-up-outline'  as const, label: 'Objectif',     value: form.objectif || '—' },
              { icon: 'star-outline'         as const, label: 'Expérience',   value: form.experience || '—' },
            ].map(item => (
              <View key={item.label} style={s.summaryRow}>
                <Ionicons name={item.icon} size={16} color={G} style={{ marginRight: 10 }} />
                <Text style={s.summaryLabel}>{item.label}</Text>
                <Text style={s.summaryValue} numberOfLines={1}>{item.value}</Text>
              </View>
            ))}
          </View>
        )}

        <ErrorBox message={error} />

        {step < TOTAL_STEPS - 1 ? (
          <TouchableOpacity style={s.nextBtn} onPress={nextStep} activeOpacity={0.82}>
            <View style={s.btnInner}>
              <Text style={s.nextBtnText}>Continuer</Text>
              <Ionicons name="arrow-forward" size={18} color="#fff" />
            </View>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={[s.nextBtn, loading && { opacity: 0.75 }]} onPress={handleSubmit} activeOpacity={0.82} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : (
              <View style={s.btnInner}>
                <Ionicons name="rocket-outline" size={18} color="#fff" />
                <Text style={s.nextBtnText}>Lancer AgriSmart</Text>
              </View>
            )}
          </TouchableOpacity>
        )}

        <View style={{ height: Spacing.xxl }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },

  // ── Layout ─────────────────────────────────────────────────────────────────
  header:     {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Platform.OS === 'android' ? Spacing.xl : Spacing.xxl,
    paddingBottom: Spacing.md,
    backgroundColor: 'transparent',
  },
  backBtn:    {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(244,249,245,0.9)',
    borderWidth: 1, borderColor: BORDER,
    alignItems: 'center', justifyContent: 'center',
  },
  headerStep: { fontSize: 13, fontWeight: '600', color: T2 },

  scroll:     { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, paddingBottom: Spacing.xl },
  titleBlock: { marginBottom: Spacing.lg },
  title:      { fontSize: 24, fontWeight: '800', color: T, marginBottom: 4 },
  sub:        { fontSize: 13, color: T2 },

  card: {
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: Radius.xl, borderWidth: 1,
    borderColor: 'rgba(60,185,90,0.15)',
    padding: Spacing.lg, marginBottom: Spacing.md,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 10, elevation: 2,
  },
  optionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: Spacing.md },

  infoBox:  {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    backgroundColor: 'rgba(60,185,90,0.07)', borderRadius: Radius.md,
    borderWidth: 1, borderColor: 'rgba(60,185,90,0.18)',
    padding: 12, marginBottom: Spacing.md,
  },
  infoText: { fontSize: 12, color: T2, flex: 1, lineHeight: 17 },

  autoFilled:      {
    backgroundColor: 'rgba(60,185,90,0.06)', borderRadius: Radius.md,
    borderWidth: 1, borderColor: 'rgba(60,185,90,0.2)',
    padding: 12, marginBottom: Spacing.md,
  },
  autoFilledRow:   { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 },
  autoFilledLabel: { fontSize: 12, color: T2, flex: 1 },
  autoFilledValue: { fontSize: 12, color: T, fontWeight: '700' },

  dividerRow:  { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: Spacing.md },
  dividerLine: { flex: 1, height: 1, backgroundColor: 'rgba(60,185,90,0.15)' },
  dividerText: { fontSize: 11, color: T2 },

  confirmHeader: { alignItems: 'center', marginBottom: Spacing.lg },
  confirmIcon:   {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: 'rgba(60,185,90,0.10)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: Spacing.md,
    borderWidth: 1.5, borderColor: 'rgba(60,185,90,0.3)',
  },
  confirmTitle:  { fontSize: 20, fontWeight: '800', color: T, marginBottom: 6 },
  confirmSub:    { fontSize: 13, color: T2, textAlign: 'center', lineHeight: 20 },
  summaryRow:    { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(60,185,90,0.1)' },
  summaryLabel:  { fontSize: 12, color: T2, width: 90 },
  summaryValue:  { fontSize: 13, color: T, fontWeight: '600', flex: 1 },

  btnInner:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  nextBtn:     { backgroundColor: G, borderRadius: Radius.lg, paddingVertical: 16, alignItems: 'center', ...Shadows.green },
  nextBtnText: { fontSize: 16, fontWeight: '700', color: '#fff', letterSpacing: 0.5 },
});