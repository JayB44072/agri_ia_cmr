import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, ActivityIndicator,
  SafeAreaView, RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius } from '@/constants/theme';
import { useAppTheme } from '@/context/ThemeContext';
import { getSensorDataForPlot, SensorDataRow } from '@/services/database/sensor';

// Configuration pour afficher chaque métrique de manière jolie
const METRICS = [
  { key: 'moisture', label: 'Humidité', icon: 'water', unit: '%', color: '#2196f3' },
  { key: 'temperature', label: 'Temp.', icon: 'thermometer', unit: '°C', color: '#ff5722' },
  { key: 'ph', label: 'pH Sol', icon: 'flask', unit: '', color: '#9c27b0' },
  { key: 'nitrogen', label: 'Azote', icon: 'leaf', unit: 'mg/kg', color: '#4caf50' },
];

export default function SensorsScreen() {
  const { isDark } = useAppTheme();
  const colors = isDark ? Colors.dark : Colors.light;
  const G = colors.primary;

  // Par défaut, nous chargerons les données d'un plot spécifique (ex: 'main_plot')
  const [data, setData] = useState<SensorDataRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadSensorData();
  }, []);

  async function loadSensorData() {
    try {
      // Remplacez 'plot_1' par l'ID de parcelle dynamique si nécessaire
      const { data: fetchedData, error } = await getSensorDataForPlot('plot_1');
      if (error) throw error;
      setData(fetchedData || []);
    } catch (err) {
      console.error("Erreur chargement capteurs:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  // On prend le relevé le plus récent pour l'affichage en haut
  const latest = data[0];

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
        <Text style={[styles.headerTitle, { color: colors.text }]}>IoT - État du sol</Text>
        <Text style={[styles.headerSub, { color: colors.textSecondary }]}>
          Données en temps réel de votre parcelle
        </Text>
      </View>

      {/* Grid des métriques du dernier relevé */}
      {latest && (
        <View style={styles.gridContainer}>
          {METRICS.map((m) => (
            <View key={m.key} style={[styles.metricCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
              <Ionicons name={m.icon as any} size={24} color={m.color} />
              <Text style={[styles.metricValue, { color: colors.text }]}>
                {latest[m.key as keyof SensorDataRow]} <Text style={styles.unit}>{m.unit}</Text>
              </Text>
              <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>{m.label}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Historique */}
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Historique des mesures</Text>
      <FlatList
        data={data}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: Spacing.md }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadSensorData} tintColor={G} />}
        renderItem={({ item }) => (
          <View style={[styles.listItem, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <Text style={[styles.dateText, { color: colors.textSecondary }]}>
              {new Date(item.recorded_at || '').toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
            </Text>
            <View style={styles.rowStats}>
              <Text style={{ color: colors.textSecondary }}>H: {item.moisture}%</Text>
              <Text style={{ color: colors.textSecondary }}>T: {item.temperature}°C</Text>
              <Text style={{ color: colors.textSecondary }}>pH: {item.ph}</Text>
            </View>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { padding: Spacing.md },
  headerTitle: { fontSize: 22, fontWeight: '900' },
  headerSub: { fontSize: 13, marginTop: 4 },
  
  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: Spacing.sm, gap: 10, marginBottom: 20 },
  metricCard: { width: '47%', padding: 16, borderRadius: Radius.lg, borderWidth: 1, alignItems: 'center', gap: 6 },
  metricValue: { fontSize: 18, fontWeight: '800' },
  metricLabel: { fontSize: 11, fontWeight: '600' },
  unit: { fontSize: 12, fontWeight: '400' },

  sectionTitle: { fontSize: 16, fontWeight: '700', paddingHorizontal: Spacing.md, marginBottom: 12 },
  listItem: { flexDirection: 'row', justifyContent: 'space-between', padding: 16, borderRadius: Radius.md, borderWidth: 1, marginBottom: 8 },
  dateText: { fontSize: 12, fontWeight: '600' },
  rowStats: { flexDirection: 'row', gap: 15 }
});