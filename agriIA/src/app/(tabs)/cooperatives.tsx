import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, ActivityIndicator,
  SafeAreaView, TouchableOpacity, RefreshControl, Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius } from '@/constants/theme';
import { useAppTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { getCooperatives, joinCooperative, CooperativeRow } from '@/services/database/cooperatives';

export default function CooperativesScreen() {
  const { isDark } = useAppTheme();
  const colors = isDark ? Colors.dark : Colors.light;
  const G = colors.primary;

  const { user } = useAuth();
  const [coops, setCoops] = useState<CooperativeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [joiningId, setJoiningId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const { data, error } = await getCooperatives();
      if (error) throw error;
      setCoops(data || []);
    } catch (err) {
      console.error("Erreur chargement coopératives:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  const handleJoin = async (coopId: string) => {
    if (!user) {
      Alert.alert("Connexion requise", "Vous devez être connecté pour rejoindre une coopérative.");
      return;
    }
    setJoiningId(coopId);
    const { error } = await joinCooperative(coopId, user.id);
    setJoiningId(null);

    if (error) {
      Alert.alert("Erreur", "Impossible de rejoindre la coopérative. Veuillez réessayer.");
    } else {
      Alert.alert("Demande envoyée", "Votre demande d'adhésion a bien été transmise.");
    }
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={G} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Coopératives Partenaires</Text>
        <Text style={[styles.headerSub, { color: colors.textSecondary }]}>Rejoignez une communauté d'agriculteurs</Text>
      </View>

      <FlatList
        data={coops}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: Spacing.md }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadData} tintColor={G} />}
        renderItem={({ item }) => (
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <View style={styles.info}>
              <Text style={[styles.name, { color: colors.text }]}>{item.name}</Text>
              <Text style={[styles.desc, { color: colors.textSecondary }]} numberOfLines={2}>
                {item.description || "Aucune description disponible."}
              </Text>
            </View>
            
            <TouchableOpacity 
              style={[styles.joinButton, { backgroundColor: G, opacity: joiningId === item.id ? 0.7 : 1 }]} 
              onPress={() => handleJoin(item.id)}
              disabled={!!joiningId}
            >
              {joiningId === item.id ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="person-add-outline" size={20} color="#fff" />
              )}
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={{ color: colors.textSecondary }}>Aucune coopérative disponible pour le moment.</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { padding: Spacing.md, paddingBottom: 10 },
  headerTitle: { fontSize: 22, fontWeight: '900' },
  headerSub: { fontSize: 13, marginTop: 4 },
  card: { padding: 16, borderRadius: Radius.lg, marginBottom: 12, borderWidth: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  info: { flex: 1, marginRight: 16 },
  name: { fontSize: 16, fontWeight: '800' },
  desc: { fontSize: 13, marginTop: 4 },
  joinButton: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  emptyState: { padding: 40, alignItems: 'center' }
});