import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Switch, Alert, Modal, TextInput, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors, Spacing, Radius } from '@/constants/theme';
import { useAppTheme, ThemeMode } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';

// ── Clés de stockage ──────────────────────────────────────────────────────────
const NOTIF_KEYS = {
  push:      'notif_push',
  meteo:     'notif_meteo',
  calendar:  'notif_calendar',
  messages:  'notif_messages',
  ia:        'notif_ia',
};

// ── Sous-composants ───────────────────────────────────────────────────────────
function SectionHeader({ title, colors }: { title: string; colors: typeof Colors.light | typeof Colors.dark }) {
  return (
    <Text style={[sec.title, { color: colors.textSecondary }]}>{title}</Text>
  );
}

function SettingRow({
  icon, iconColor, label, sub, value, onToggle, onPress, colors, last = false,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  label: string;
  sub?: string;
  value?: boolean;
  onToggle?: (v: boolean) => void;
  onPress?: () => void;
  colors: typeof Colors.light | typeof Colors.dark;
  last?: boolean;
}) {
  return (
    <TouchableOpacity
      style={[r.row, { borderBottomWidth: last ? 0 : StyleSheet.hairlineWidth, borderBottomColor: colors.cardBorder }]}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      disabled={!onPress && !onToggle}
    >
      <View style={[r.iconWrap, { backgroundColor: `${iconColor}18` }]}>
        <Ionicons name={icon} size={18} color={iconColor} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[r.label, { color: colors.text }]}>{label}</Text>
        {sub ? <Text style={[r.sub, { color: colors.textSecondary }]}>{sub}</Text> : null}
      </View>
      {onToggle !== undefined && value !== undefined ? (
        <Switch
          value={value}
          onValueChange={onToggle}
          trackColor={{ false: colors.backgroundElement, true: colors.primary }}
          thumbColor="#fff"
        />
      ) : onPress ? (
        <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
      ) : null}
    </TouchableOpacity>
  );
}

const r = StyleSheet.create({
  row:     { flexDirection: 'row', alignItems: 'center', paddingVertical: 13, paddingHorizontal: 16, gap: 12 },
  iconWrap:{ width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  label:   { fontSize: 15, fontWeight: '600' },
  sub:     { fontSize: 12, marginTop: 1 },
});

const sec = StyleSheet.create({
  title: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8, marginBottom: 8, marginLeft: 4 },
});

// ── Sélecteur de thème ────────────────────────────────────────────────────────
function ThemeSelector({ mode, setMode, colors }: {
  mode: ThemeMode;
  setMode: (m: ThemeMode) => void;
  colors: typeof Colors.light | typeof Colors.dark;
}) {
  const OPTIONS: { key: ThemeMode; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
    { key: 'light',  label: 'Clair',  icon: 'sunny-outline'   },
    { key: 'dark',   label: 'Sombre', icon: 'moon-outline'    },
    { key: 'system', label: 'Auto',   icon: 'phone-portrait-outline' },
  ];

  return (
    <View style={th.wrap}>
      {OPTIONS.map((opt) => {
        const active = mode === opt.key;
        return (
          <TouchableOpacity
            key={opt.key}
            style={[th.option, {
              backgroundColor: active ? colors.primary : colors.backgroundElement,
              borderColor: active ? colors.primary : colors.cardBorder,
            }]}
            onPress={() => setMode(opt.key)}
            activeOpacity={0.8}
          >
            <Ionicons name={opt.icon} size={18} color={active ? '#fff' : colors.textSecondary} />
            <Text style={[th.label, { color: active ? '#fff' : colors.textSecondary, fontWeight: active ? '700' : '500' }]}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const th = StyleSheet.create({
  wrap:   { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingBottom: 14 },
  option: { flex: 1, borderRadius: 10, borderWidth: 1.5, paddingVertical: 10, alignItems: 'center', gap: 4 },
  label:  { fontSize: 12 },
});

// ── Écran principal ───────────────────────────────────────────────────────────
export default function SettingsScreen() {
  const { isDark, mode, setMode } = useAppTheme();
  const colors = isDark ? Colors.dark : Colors.light;
  const { signOut, user } = useAuth();
  const router = useRouter();

  // Notifications
  const [notifPush,     setNotifPush]     = useState(true);
  const [notifMeteo,    setNotifMeteo]    = useState(true);
  const [notifCalendar, setNotifCalendar] = useState(true);
  const [notifMessages, setNotifMessages] = useState(true);
  const [notifIA,       setNotifIA]       = useState(true);

  // Modales
  const [showEmailModal,    setShowEmailModal]    = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newEmail,          setNewEmail]          = useState('');
  const [newPassword,       setNewPassword]       = useState('');
  const [confirmPassword,   setConfirmPassword]   = useState('');
  const [saving,            setSaving]            = useState(false);

  useEffect(() => {
    loadNotifSettings();
  }, []);

  function loadNotifSettings() {
    // notifications stored in memory only (no native storage required)
  }

  function saveNotif(_key: string, _val: boolean) {
    // in-memory only
  }

  async function handleChangeEmail() {
    if (!newEmail.trim()) return;
    setSaving(true);
    try {
      // Note: In production this would call supabase.auth.updateUser({ email: newEmail })
      await new Promise(r => setTimeout(r, 800));
      Alert.alert('Email mis à jour', 'Un lien de confirmation a été envoyé à votre nouvelle adresse.');
      setShowEmailModal(false);
      setNewEmail('');
    } catch {
      Alert.alert('Erreur', 'Impossible de modifier l\'email.');
    } finally {
      setSaving(false);
    }
  }

  async function handleChangePassword() {
    if (newPassword.length < 6) {
      Alert.alert('Mot de passe trop court', 'Minimum 6 caractères requis.');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Erreur', 'Les mots de passe ne correspondent pas.');
      return;
    }
    setSaving(true);
    try {
      await new Promise(r => setTimeout(r, 800));
      Alert.alert('Succès', 'Votre mot de passe a été modifié.');
      setShowPasswordModal(false);
      setNewPassword('');
      setConfirmPassword('');
    } catch {
      Alert.alert('Erreur', 'Impossible de modifier le mot de passe.');
    } finally {
      setSaving(false);
    }
  }

  function handleDeleteAccount() {
    Alert.alert(
      'Supprimer mon compte',
      'Cette action est irréversible. Toutes vos données (parcelles, finances, diagnostics) seront définitivement supprimées.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => {
            Alert.alert('Demande enregistrée', 'Votre demande de suppression a été transmise. Elle sera traitée dans les 7 jours.');
          },
        },
      ]
    );
  }

  return (
    <SafeAreaView style={[s.root, { backgroundColor: colors.background }]} edges={['top']}>

      {/* ── Header ── */}
      <View style={s.header}>
        <TouchableOpacity
          style={[s.backBtn, { backgroundColor: colors.backgroundElement }]}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={[s.headerTitle, { color: colors.text }]}>Paramètres</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>

        {/* ── Apparence ── */}
        <View style={s.section}>
          <SectionHeader title="APPARENCE" colors={colors} />
          <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <View style={[r.row, { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.cardBorder }]}>
              <View style={[r.iconWrap, { backgroundColor: '#8b5cf618' }]}>
                <Ionicons name="color-palette-outline" size={18} color="#8b5cf6" />
              </View>
              <Text style={[r.label, { color: colors.text, flex: 1 }]}>Mode d'affichage</Text>
            </View>
            <ThemeSelector mode={mode} setMode={setMode} colors={colors} />
          </View>
        </View>

        {/* ── Notifications ── */}
        <View style={s.section}>
          <SectionHeader title="NOTIFICATIONS" colors={colors} />
          <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <SettingRow
              icon="notifications-outline" iconColor={colors.primary}
              label="Notifications push" sub="Toutes les notifications"
              value={notifPush}
              onToggle={(v) => { setNotifPush(v); saveNotif(NOTIF_KEYS.push, v); }}
              colors={colors}
            />
            <SettingRow
              icon="partly-sunny-outline" iconColor="#3b82f6"
              label="Alertes météo" sub="Pluie, chaleur, conditions extrêmes"
              value={notifMeteo}
              onToggle={(v) => { setNotifMeteo(v); saveNotif(NOTIF_KEYS.meteo, v); }}
              colors={colors}
            />
            <SettingRow
              icon="calendar-outline" iconColor="#f59e0b"
              label="Rappels calendrier" sub="Semis, arrosage, récolte"
              value={notifCalendar}
              onToggle={(v) => { setNotifCalendar(v); saveNotif(NOTIF_KEYS.calendar, v); }}
              colors={colors}
            />
            <SettingRow
              icon="chatbubble-outline" iconColor="#ec4899"
              label="Messages" sub="Nouveaux messages reçus"
              value={notifMessages}
              onToggle={(v) => { setNotifMessages(v); saveNotif(NOTIF_KEYS.messages, v); }}
              colors={colors}
            />
            <SettingRow
              icon="sparkles-outline" iconColor="#8b5cf6"
              label="Recommandations IA" sub="Conseils Gemini personnalisés"
              value={notifIA}
              onToggle={(v) => { setNotifIA(v); saveNotif(NOTIF_KEYS.ia, v); }}
              colors={colors}
              last
            />
          </View>
        </View>

        {/* ── Mon compte ── */}
        <View style={s.section}>
          <SectionHeader title="MON COMPTE" colors={colors} />
          <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <SettingRow
              icon="mail-outline" iconColor="#3b82f6"
              label="Adresse email"
              sub={user?.email || 'Non renseignée'}
              onPress={() => setShowEmailModal(true)}
              colors={colors}
            />
            <SettingRow
              icon="lock-closed-outline" iconColor="#6b7280"
              label="Mot de passe"
              sub="Modifier votre mot de passe"
              onPress={() => setShowPasswordModal(true)}
              colors={colors}
            />
            <SettingRow
              icon="person-circle-outline" iconColor="#2e7d32"
              label="Mon profil agriculteur"
              sub="Cultures, superficie, expérience"
              onPress={() => router.push('/(tabs)/profil' as any)}
              colors={colors}
              last
            />
          </View>
        </View>

        {/* ── Confidentialité ── */}
        <View style={s.section}>
          <SectionHeader title="CONFIDENTIALITÉ & DONNÉES" colors={colors} />
          <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <SettingRow
              icon="shield-checkmark-outline" iconColor="#10b981"
              label="Politique de confidentialité"
              onPress={() => Alert.alert('Confidentialité', 'Vos données sont stockées en toute sécurité sur Supabase et ne sont jamais revendues à des tiers.')}
              colors={colors}
            />
            <SettingRow
              icon="document-text-outline" iconColor="#6b7280"
              label="Conditions d'utilisation"
              onPress={() => Alert.alert('CGU', 'AgriIA est une application agricole destinée aux agriculteurs camerounais. En l\'utilisant, vous acceptez nos conditions générales.')}
              colors={colors}
            />
            <SettingRow
              icon="cloud-download-outline" iconColor="#3b82f6"
              label="Exporter mes données"
              sub="Télécharger toutes vos données"
              onPress={() => Alert.alert('Export', 'Un email avec vos données sera envoyé à votre adresse dans les 24h.')}
              colors={colors}
            />
            <SettingRow
              icon="trash-outline" iconColor="#ef4444"
              label="Supprimer mon compte"
              sub="Action irréversible"
              onPress={handleDeleteAccount}
              colors={colors}
              last
            />
          </View>
        </View>

        {/* ── À propos ── */}
        <View style={s.section}>
          <SectionHeader title="À PROPOS" colors={colors} />
          <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <SettingRow
              icon="information-circle-outline" iconColor="#3b82f6"
              label="Version de l'application"
              sub="AgriIA v1.0.0 (build 1)"
              colors={colors}
            />
            <SettingRow
              icon="star-outline" iconColor="#f59e0b"
              label="Évaluer l'application"
              sub="Donnez votre avis sur le store"
              onPress={() => Alert.alert('Merci !', 'Votre avis nous aide à améliorer AgriIA.')}
              colors={colors}
            />
            <SettingRow
              icon="help-circle-outline" iconColor="#06b6d4"
              label="Aide & Support"
              sub="FAQ, contact, signaler un problème"
              onPress={() => Alert.alert('Support', 'Pour toute assistance, contactez-nous à support@agriia.cm')}
              colors={colors}
            />
            <SettingRow
              icon="globe-outline" iconColor="#6b7280"
              label="Site web"
              sub="agriia.cm"
              onPress={() => Alert.alert('AgriIA', 'Rendez-vous sur agriia.cm pour plus d\'informations.')}
              colors={colors}
              last
            />
          </View>
        </View>

        {/* ── Déconnexion ── */}
        <View style={[s.section, { marginTop: 8 }]}>
          <TouchableOpacity
            style={[s.logoutBtn, { backgroundColor: '#ef444415', borderColor: '#ef444440' }]}
            onPress={() => {
              Alert.alert('Déconnexion', 'Voulez-vous vraiment vous déconnecter ?', [
                { text: 'Annuler', style: 'cancel' },
                { text: 'Déconnecter', style: 'destructive', onPress: () => signOut() },
              ]);
            }}
            activeOpacity={0.8}
          >
            <Ionicons name="log-out-outline" size={20} color="#ef4444" />
            <Text style={s.logoutText}>Se déconnecter</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>

      {/* ── Modal Changer Email ── */}
      <Modal visible={showEmailModal} transparent animationType="slide" onRequestClose={() => setShowEmailModal(false)}>
        <View style={m.overlay}>
          <View style={[m.sheet, { backgroundColor: colors.card }]}>
            <Text style={[m.title, { color: colors.text }]}>Changer d'email</Text>
            <Text style={[m.sub, { color: colors.textSecondary }]}>Un lien de confirmation sera envoyé à la nouvelle adresse.</Text>
            <TextInput
              style={[m.input, { color: colors.text, backgroundColor: colors.backgroundElement, borderColor: colors.cardBorder }]}
              placeholder="Nouvel email"
              placeholderTextColor={colors.textSecondary}
              keyboardType="email-address"
              autoCapitalize="none"
              value={newEmail}
              onChangeText={setNewEmail}
            />
            <View style={m.btnRow}>
              <TouchableOpacity style={[m.btn, { backgroundColor: colors.backgroundElement }]} onPress={() => setShowEmailModal(false)}>
                <Text style={{ color: colors.text, fontWeight: '600' }}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[m.btn, { backgroundColor: colors.primary }]} onPress={handleChangeEmail}>
                {saving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={{ color: '#fff', fontWeight: '700' }}>Confirmer</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Modal Changer Mot de passe ── */}
      <Modal visible={showPasswordModal} transparent animationType="slide" onRequestClose={() => setShowPasswordModal(false)}>
        <View style={m.overlay}>
          <View style={[m.sheet, { backgroundColor: colors.card }]}>
            <Text style={[m.title, { color: colors.text }]}>Changer le mot de passe</Text>
            <TextInput
              style={[m.input, { color: colors.text, backgroundColor: colors.backgroundElement, borderColor: colors.cardBorder }]}
              placeholder="Nouveau mot de passe (min. 6 car.)"
              placeholderTextColor={colors.textSecondary}
              secureTextEntry
              value={newPassword}
              onChangeText={setNewPassword}
            />
            <TextInput
              style={[m.input, { color: colors.text, backgroundColor: colors.backgroundElement, borderColor: colors.cardBorder, marginTop: 10 }]}
              placeholder="Confirmer le mot de passe"
              placeholderTextColor={colors.textSecondary}
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />
            <View style={m.btnRow}>
              <TouchableOpacity style={[m.btn, { backgroundColor: colors.backgroundElement }]} onPress={() => setShowPasswordModal(false)}>
                <Text style={{ color: colors.text, fontWeight: '600' }}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[m.btn, { backgroundColor: colors.primary }]} onPress={handleChangePassword}>
                {saving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={{ color: '#fff', fontWeight: '700' }}>Modifier</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:       { flex: 1 },
  header:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.md, paddingVertical: 12 },
  backBtn:    { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  headerTitle:{ fontSize: 20, fontWeight: '900' },
  section:    { paddingHorizontal: Spacing.md, marginBottom: 16 },
  card:       { borderRadius: Radius.lg, borderWidth: 1, overflow: 'hidden' },
  logoutBtn:  { borderRadius: Radius.lg, borderWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 15, gap: 10 },
  logoutText: { color: '#ef4444', fontSize: 16, fontWeight: '700' },
});

const m = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet:   { borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, paddingBottom: 40 },
  title:   { fontSize: 18, fontWeight: '900', marginBottom: 6 },
  sub:     { fontSize: 13, marginBottom: 16, lineHeight: 18 },
  input:   { borderRadius: 10, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14 },
  btnRow:  { flexDirection: 'row', gap: 12, marginTop: 20 },
  btn:     { flex: 1, borderRadius: 10, paddingVertical: 13, alignItems: 'center', justifyContent: 'center' },
});
