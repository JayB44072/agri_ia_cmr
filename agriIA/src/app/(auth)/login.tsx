import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  TextInput, StatusBar, KeyboardAvoidingView,
  Platform, ScrollView, ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, Shadows } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';

const C = Colors.light;
const G = Colors.splash.green;

export default function Login(): React.JSX.Element {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [error, setError]       = useState('');
  const { signIn, signInWithGoogle, resetPassword } = useAuth();

  const handleLogin = async () => {
    setError('');
    if (!email || !password) { setError('Veuillez remplir tous les champs.'); return; }
    setLoading(true);
    const { error: err } = await signIn(email, password);
    setLoading(false);
    if (err) {
      setError(err.message);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);
    const { error: err } = await signInWithGoogle();
    setLoading(false);
    if (err) {
      setError(err.message);
    }
  };

  const handleForgotPassword = async () => {
    setError('');
    if (!email) {
      setError('Veuillez saisir votre adresse e-mail pour réinitialiser le mot de passe.');
      return;
    }
    setLoading(true);
    const { error: err } = await resetPassword(email);
    setLoading(false);
    if (err) {
      setError(err.message);
    } else {
      alert('Un e-mail de réinitialisation a été envoyé.');
    }
  };


  return (
    <KeyboardAvoidingView style={s.root} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      {/* ── Formes vertes en arrière-plan ── */}
      <View style={s.haloTopLeft} />
      <View style={s.haloTopRight} />
      <View style={s.haloBottomRight} />
      <View style={s.haloBottomLeft} />
      <View style={s.haloCenter} />

      <ScrollView
        contentContainerStyle={s.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Logo */}
        <View style={s.logoBlock}>
          <View style={s.logoCircle}>
            <Ionicons name="leaf" size={36} color={G} />
          </View>
          <Text style={s.appName}>AgriSmart</Text>
          <Text style={s.tagline}>AGRICULTURE INTELLIGENTE · CAMEROUN</Text>
        </View>

        {/* Card formulaire */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Connexion</Text>
          <Text style={s.cardSub}>Bienvenue ! Connectez-vous pour continuer.</Text>

          {/* Email */}
          <View style={s.fieldBlock}>
            <Text style={s.label}>Adresse e-mail</Text>
            <View style={s.inputRow}>
              <Ionicons name="mail-outline" size={18} color={G} style={s.inputIcon} />
              <TextInput
                style={s.input}
                placeholder="exemple@gmail.com"
                placeholderTextColor={C.textSecondary}
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </View>
          </View>

          {/* Mot de passe */}
          <View style={s.fieldBlock}>
            <Text style={s.label}>Mot de passe</Text>
            <View style={s.inputRow}>
              <Ionicons name="lock-closed-outline" size={18} color={G} style={s.inputIcon} />
              <TextInput
                style={s.input}
                placeholder="••••••••"
                placeholderTextColor={C.textSecondary}
                secureTextEntry={!showPass}
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity onPress={() => setShowPass(!showPass)}>
                <Ionicons name={showPass ? 'eye-off-outline' : 'eye-outline'} size={20} color={G} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Mot de passe oublié */}
          <TouchableOpacity style={s.forgotBtn} onPress={handleForgotPassword}>
            <Text style={s.forgotText}>Mot de passe oublié ?</Text>
          </TouchableOpacity>

          {/* Erreur */}
          {error !== '' && (
            <View style={s.errorBox}>
              <Ionicons name="warning-outline" size={14} color="#e74c3c" style={{ marginRight: 6 }} />
              <Text style={s.errorText}>{error}</Text>
            </View>
          )}

          {/* Bouton connexion */}
          <TouchableOpacity
            style={[s.loginBtn, loading && { opacity: 0.75 }]}
            activeOpacity={0.82}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color="#fff" /> : (
              <View style={s.btnInner}>
                <Text style={s.loginBtnText}>Se connecter</Text>
                <Ionicons name="arrow-forward" size={18} color="#fff" />
              </View>
            )}
          </TouchableOpacity>

          {/* Bouton Google */}
          <TouchableOpacity
            style={[s.googleBtn, loading && { opacity: 0.75 }]}
            activeOpacity={0.82}
            onPress={handleGoogleLogin}
            disabled={loading}
          >
            <View style={s.btnInner}>
              <Ionicons name="logo-google" size={16} color="#df4930" />
              <Text style={s.googleBtnText}>Continuer avec Google</Text>
            </View>
          </TouchableOpacity>

          {/* Divider */}
          <View style={s.dividerRow}>
            <View style={s.dividerLine} />
            <Text style={s.dividerText}>ou</Text>
            <View style={s.dividerLine} />
          </View>

          {/* Inscription */}
          <TouchableOpacity
            style={s.registerBtn}
            activeOpacity={0.82}
            onPress={() => router.push('/(auth)/register')}
          >
            <View style={s.btnInner}>
              <Ionicons name="person-add-outline" size={16} color={G} />
              <Text style={s.registerBtnText}>Créer un compte</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={s.footerRow}>
          <Ionicons name="earth-outline" size={13} color={C.textSecondary} />
          <Text style={s.footer}> Conçu pour les agriculteurs camerounais</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#ffffff' },

  // ── Halos circulaires ──────────────────────────────────────────────────────
  haloTopLeft:    {
    position: 'absolute', width: 320, height: 320, borderRadius: 160,
    backgroundColor: 'rgba(60,185,90,0.09)',
    top: -140, left: -100,
  },
  haloTopRight:   {
    position: 'absolute', width: 200, height: 200, borderRadius: 100,
    backgroundColor: 'rgba(60,185,90,0.07)',
    top: -60, right: -60,
  },
  haloBottomRight: {
    position: 'absolute', width: 260, height: 260, borderRadius: 130,
    backgroundColor: 'rgba(60,185,90,0.08)',
    bottom: -100, right: -80,
  },
  haloBottomLeft:  {
    position: 'absolute', width: 160, height: 160, borderRadius: 80,
    backgroundColor: 'rgba(60,185,90,0.06)',
    bottom: 60, left: -60,
  },
  haloCenter:     {
    position: 'absolute', width: 120, height: 120, borderRadius: 60,
    backgroundColor: 'rgba(60,185,90,0.05)',
    top: '42%', right: -30,
  },

  // ── Contenu ────────────────────────────────────────────────────────────────
  scroll: {
    flexGrow: 1, alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xxl,
    paddingBottom: Spacing.xl,
  },

  logoBlock:  { alignItems: 'center', marginBottom: Spacing.xl },
  logoCircle: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: 'rgba(60,185,90,0.10)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: Spacing.md,
    borderWidth: 1.5, borderColor: 'rgba(60,185,90,0.3)',
  },
  appName:  { fontSize: 28, fontWeight: '800', color: '#1a3a1f', letterSpacing: 1, marginBottom: 4 },
  tagline:  { fontSize: 10, color: '#4a7a55', letterSpacing: 2, textAlign: 'center' },

  card: {
    width: '100%', backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: Radius.xl, borderWidth: 1,
    borderColor: 'rgba(60,185,90,0.18)',
    padding: Spacing.lg, marginBottom: Spacing.lg,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 14, elevation: 4,
  },
  cardTitle: { fontSize: 22, fontWeight: '800', color: '#1a3a1f', marginBottom: 4 },
  cardSub:   { fontSize: 13, color: '#4a7a55', marginBottom: Spacing.lg },

  fieldBlock: { marginBottom: Spacing.md },
  label:      { fontSize: 12, fontWeight: '600', color: '#2d6a35', letterSpacing: 0.5, marginBottom: 6 },
  inputRow:   {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#f4f9f5', borderRadius: Radius.md,
    borderWidth: 1, borderColor: 'rgba(60,185,90,0.2)',
    paddingHorizontal: 12, height: 50,
  },
  inputIcon: { marginRight: 8 },
  input:     { flex: 1, color: '#1a3a1f', fontSize: 14 },

  forgotBtn:  { alignSelf: 'flex-end', marginBottom: Spacing.md },
  forgotText: { fontSize: 12, color: G, fontWeight: '600' },

  errorBox:  {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(231,76,60,0.08)', borderRadius: Radius.md,
    padding: 10, marginBottom: Spacing.md,
    borderWidth: 1, borderColor: 'rgba(231,76,60,0.25)',
  },
  errorText: { fontSize: 12, color: '#e74c3c', fontWeight: '500', flex: 1 },

  btnInner:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  loginBtn:        { backgroundColor: G, borderRadius: Radius.lg, paddingVertical: 16, alignItems: 'center', marginBottom: Spacing.md, ...Shadows.green },
  loginBtnText:    { fontSize: 16, fontWeight: '700', color: '#fff', letterSpacing: 0.5 },
  dividerRow:      { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: Spacing.md },
  dividerLine:     { flex: 1, height: 1, backgroundColor: 'rgba(60,185,90,0.15)' },
  dividerText:     { fontSize: 12, color: '#4a7a55' },
  registerBtn:     { borderWidth: 1.5, borderColor: G, borderRadius: Radius.lg, paddingVertical: 14, alignItems: 'center' },
  registerBtnText: { fontSize: 15, fontWeight: '700', color: G },
  googleBtn:       { borderWidth: 1.5, borderColor: 'rgba(0,0,0,0.12)', borderRadius: Radius.lg, paddingVertical: 14, alignItems: 'center', marginBottom: Spacing.md, backgroundColor: '#fff' },
  googleBtnText:   { fontSize: 15, fontWeight: '700', color: '#555' },

  footerRow: { flexDirection: 'row', alignItems: 'center' },
  footer:    { fontSize: 11, color: '#4a7a55' },
});