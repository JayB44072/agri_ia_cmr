import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors, Spacing, Radius } from '@/constants/theme';
import { useAppTheme } from '@/context/ThemeContext';
import { useUser } from '@/context/UserContext';
import { useAuth } from '@/context/AuthContext';

// ── Types ─────────────────────────────────────────────────────────────────────
interface MenuItem {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  route: string;
  badge?: string;
}

interface MenuSection {
  title: string;
  items: MenuItem[];
}

// ── Sections ──────────────────────────────────────────────────────────────────
const SECTIONS: MenuSection[] = [
  {
    title: 'GESTION DE FERME',
    items: [
      { label: 'Calendrier agricole', icon: 'calendar-outline',   color: '#3b82f6', route: '/(tabs)/calendrier' },
      { label: 'Finances',            icon: 'bar-chart-outline',  color: '#10b981', route: '/(tabs)/finances'   },
      { label: 'Portefeuille',        icon: 'wallet-outline',     color: '#f59e0b', route: '/(tabs)/wallet'     },
      { label: 'Suivi des récoltes',  icon: 'basket-outline',     color: '#8b5cf6', route: '/(tabs)/harvests'   },
    ],
  },
  {
    title: 'COMMUNAUTÉ',
    items: [
      { label: 'Coopératives',  icon: 'people-outline',  color: '#06b6d4', route: '/(tabs)/cooperatives' },
      { label: 'Messagerie',    icon: 'chatbubble-outline', color: '#ec4899', route: '/(tabs)/chat'       },
    ],
  },
  {
    title: 'OUTILS',
    items: [
      { label: 'Capteurs IoT', icon: 'hardware-chip-outline', color: '#64748b', route: '/(tabs)/sensors' },
    ],
  },
  {
    title: 'COMPTE',
    items: [
      { label: 'Mon profil',   icon: 'person-circle-outline', color: '#2e7d32', route: '/(tabs)/profil'   },
      { label: 'Paramètres',  icon: 'settings-outline',       color: '#6b7280', route: '/(tabs)/settings' },
    ],
  },
];

// ── Row item ──────────────────────────────────────────────────────────────────
function MenuRow({ item, colors, onPress }: {
  item: MenuItem;
  colors: typeof Colors.light | typeof Colors.dark;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[row.wrap, { borderBottomColor: colors.cardBorder }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[row.iconBox, { backgroundColor: `${item.color}18` }]}>
        <Ionicons name={item.icon} size={20} color={item.color} />
      </View>
      <Text style={[row.label, { color: colors.text }]}>{item.label}</Text>
      {item.badge ? (
        <View style={row.badge}>
          <Text style={row.badgeText}>{item.badge}</Text>
        </View>
      ) : null}
      <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
    </TouchableOpacity>
  );
}

const row = StyleSheet.create({
  wrap:      { flexDirection: 'row', alignItems: 'center', paddingVertical: 13, paddingHorizontal: 16, borderBottomWidth: StyleSheet.hairlineWidth, gap: 14 },
  iconBox:   { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  label:     { flex: 1, fontSize: 15, fontWeight: '600' },
  badge:     { backgroundColor: '#ef4444', borderRadius: 10, paddingHorizontal: 7, paddingVertical: 2 },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
});

// ── Main screen ───────────────────────────────────────────────────────────────
export default function MenuScreen() {
  const { isDark } = useAppTheme();
  const colors = isDark ? Colors.dark : Colors.light;
  const { profile } = useUser();
  const { signOut } = useAuth();
  const router = useRouter();

  function navigate(route: string) {
    router.push(route as any);
  }

  return (
    <SafeAreaView style={[s.root, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>

        {/* ── Header titre ── */}
        <View style={s.pageHeader}>
          <Text style={[s.pageTitle, { color: colors.text }]}>Plus</Text>
        </View>

        {/* ── Carte profil ── */}
        <TouchableOpacity
          style={[s.profileCard, { backgroundColor: colors.primary, shadowColor: colors.primary }]}
          activeOpacity={0.88}
          onPress={() => navigate('/(tabs)/profil')}
        >
          <View style={s.profileAvatarWrap}>
            {profile?.avatarUrl ? (
              <Image source={{ uri: profile.avatarUrl }} style={s.profileAvatar} />
            ) : (
              <Text style={s.profileEmoji}>👨‍🌾</Text>
            )}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.profileName}>{profile?.nom || 'Mon profil'}</Text>
            {profile?.ville ? (
              <Text style={s.profileSub}>{profile.ville}, {profile.region}</Text>
            ) : (
              <Text style={s.profileSub}>Compléter mon profil →</Text>
            )}
          </View>
          <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.7)" />
        </TouchableOpacity>

        {/* ── Sections ── */}
        {SECTIONS.map((section) => (
          <View key={section.title} style={s.sectionWrap}>
            <Text style={[s.sectionTitle, { color: colors.textSecondary }]}>{section.title}</Text>
            <View style={[s.sectionCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
              {section.items.map((item, idx) => (
                <MenuRow
                  key={item.route}
                  item={item}
                  colors={colors}
                  onPress={() => navigate(item.route)}
                />
              ))}
            </View>
          </View>
        ))}

        {/* ── Déconnexion ── */}
        <View style={[s.sectionWrap, { marginTop: 8 }]}>
          <View style={[s.sectionCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <TouchableOpacity
              style={[row.wrap, { borderBottomWidth: 0 }]}
              onPress={() => signOut()}
              activeOpacity={0.7}
            >
              <View style={[row.iconBox, { backgroundColor: '#ef444418' }]}>
                <Ionicons name="log-out-outline" size={20} color="#ef4444" />
              </View>
              <Text style={[row.label, { color: '#ef4444' }]}>Se déconnecter</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Version ── */}
        <Text style={[s.version, { color: colors.textSecondary }]}>AgriIA v1.0.0 — Cameroun 🌱</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:        { flex: 1 },
  pageHeader:  { paddingHorizontal: Spacing.md, paddingTop: 12, paddingBottom: 8 },
  pageTitle:   { fontSize: 28, fontWeight: '900' },

  profileCard: {
    marginHorizontal: Spacing.md,
    marginBottom: 20,
    borderRadius: Radius.lg,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  profileAvatarWrap: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  profileAvatar: { width: 52, height: 52, borderRadius: 26 },
  profileEmoji:  { fontSize: 28 },
  profileName:   { color: '#fff', fontSize: 17, fontWeight: '800' },
  profileSub:    { color: 'rgba(255,255,255,0.75)', fontSize: 12, marginTop: 2 },

  sectionWrap:  { marginBottom: 16, paddingHorizontal: Spacing.md },
  sectionTitle: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8, marginBottom: 8, marginLeft: 4 },
  sectionCard:  { borderRadius: Radius.lg, borderWidth: 1, overflow: 'hidden' },

  version: { textAlign: 'center', fontSize: 11, marginTop: 8, marginBottom: 4 },
});
