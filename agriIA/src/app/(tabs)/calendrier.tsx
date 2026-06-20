import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Modal, RefreshControl, TextInput, useColorScheme
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, Radius } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import {
  getEventsByOwner,
  createEvent,
  updateEvent,
  deleteEvent,
  CalendarEventRow,
  CalendarEventType
} from '@/services/database/calendar';

// Configuration visuelle pour chaque type de tâche agricole
const EVENT_CONFIG: Record<CalendarEventType, { label: string; icon: string; color: string }> = {
  semis: { label: 'Semis', icon: 'leaf', color: '#22c55e' },
  arrosage: { label: 'Arrosage', icon: 'water', color: '#06b6d4' },
  fertilisation: { label: 'Fertilisation', icon: 'flask', color: '#a855f7' },
  traitement: { label: 'Traitement', icon: 'shield-checkmark', color: '#eab308' },
  récolte: { label: 'Récolte', icon: 'basket', color: '#f97316' },
};

export default function CalendarScreen() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const colors = isDark ? Colors.dark : Colors.light;
  const G = colors.primary;

  const { user } = useAuth();
  const [events, setEvents] = useState<CalendarEventRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // États pour la création d'un événement
  const [modalVisible, setModalVisible] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<CalendarEventType>('semis');
  const [eventDate, setEventDate] = useState(new Date().toISOString().split('T')[0]); // YYYY-MM-DD

  useEffect(() => {
    loadEvents();
  }, [user]);

  async function loadEvents() {
    if (!user) return;
    try {
      const { data, error } = await getEventsByOwner(user.id);
      if (error) throw error;
      setEvents(data || []);
    } catch (err) {
      console.error('Erreur de chargement du calendrier:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  const handleRefresh = () => {
    setRefreshing(true);
    loadEvents();
  };

  const handleCreateEvent = async () => {
    if (!user || !title.trim()) return;

    const newEvent: Omit<CalendarEventRow, 'id'> = {
      owner_id: user.id,
      title: title.trim(),
      description: description.trim() || null,
      type,
      event_date: eventDate,
      is_completed: false,
    };

    const { data, error } = await createEvent(newEvent);
    if (!error && data) {
      setEvents((prev) => [data, ...prev].sort((a, b) => a.event_date.localeCompare(b.event_date)));
      setModalVisible(false);
      setTitle('');
      setDescription('');
      setType('semis');
    } else {
      alert("Impossible de créer l'événement.");
    }
  };

  const handleToggleComplete = async (item: CalendarEventRow) => {
    const updatedStatus = !item.is_completed;
    
    // Optimistic UI Update
    setEvents((prev) =>
      prev.map((e) => (e.id === item.id ? { ...e, is_completed: updatedStatus } : e))
    );

    const { error } = await updateEvent(item.id, { is_completed: updatedStatus });
    if (error) {
      // Rollback en cas d'erreur
      setEvents((prev) =>
        prev.map((e) => (e.id === item.id ? { ...e, is_completed: item.is_completed } : e))
      );
    }
  };

  const handleDeleteEvent = async (id: string) => {
    const { error } = await deleteEvent(id);
    if (!error) {
      setEvents((prev) => prev.filter((e) => e.id !== id));
    }
  };

  if (loading) {
    return (
      <View style={[s.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={G} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[s.root, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Top Bar */}
      <View style={s.topBar}>
        <View style={[s.topBarIcon, { backgroundColor: G }]}>
          <Ionicons name="calendar" size={16} color="#fff" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[s.topTitle, { color: colors.text }]}>Calendrier Agricole</Text>
          <Text style={[s.topSub, { color: colors.textSecondary }]}>Planifiez vos activités et suivis de parcelles</Text>
        </View>
        <TouchableOpacity style={[s.addBtn, { backgroundColor: G }]} onPress={() => setModalVisible(true)}>
          <Ionicons name="add" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={G} />}
      >
        {events.length === 0 ? (
          <View style={[s.emptyState, { borderColor: colors.cardBorder }]}>
            <View style={[s.emptyIconCircle, { backgroundColor: `${G}15` }]}>
              <Ionicons name="calendar-outline" size={42} color={G} />
            </View>
            <Text style={[s.emptyTitle, { color: colors.text }]}>Aucune tâche prévue</Text>
            <Text style={[s.emptyText, { color: colors.textSecondary }]}>
              Ajoutez vos sessions d'arrosage, de fertilisation ou de semis pour ne rien oublier.
            </Text>
          </View>
        ) : (
          events.map((item) => {
            const config = EVENT_CONFIG[item.type] || EVENT_CONFIG.semis;
            return (
              <View
                key={item.id}
                style={[s.eventCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
              >
                {/* Checkbox Status */}
                <TouchableOpacity onPress={() => handleToggleComplete(item)} style={s.checkArea}>
                  <Ionicons
                    name={item.is_completed ? 'checkmark-circle' : 'ellipse-outline'}
                    size={24}
                    color={item.is_completed ? colors.success : colors.textSecondary}
                  />
                </TouchableOpacity>

                {/* Content Area */}
                <View style={s.eventInfo}>
                  <View style={s.badgeRow}>
                    <View style={[s.typeBadge, { backgroundColor: `${config.color}15` }]}>
                      <Ionicons name={config.icon as any} size={11} color={config.color} />
                      <Text style={[s.typeBadgeText, { color: config.color }]}>{config.label}</Text>
                    </View>
                    <Text style={[s.eventDate, { color: colors.textSecondary }]}>
                      📅 {new Date(item.event_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                    </Text>
                  </View>
                  
                  <Text style={[s.eventTitle, { color: colors.text, textDecorationLine: item.is_completed ? 'line-through' : 'none', opacity: item.is_completed ? 0.6 : 1 }]}>
                    {item.title}
                  </Text>
                  {item.description && (
                    <Text style={[s.eventDesc, { color: colors.textSecondary, opacity: item.is_completed ? 0.5 : 1 }]}>
                      {item.description}
                    </Text>
                  )}
                </View>

                {/* Action Delete */}
                <TouchableOpacity onPress={() => handleDeleteEvent(item.id)} style={s.deleteBtn}>
                  <Ionicons name="trash-outline" size={16} color="#ef4444" />
                </TouchableOpacity>
              </View>
            );
          })
        )}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Modal de création d'événement */}
      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <View style={s.modalOverlay}>
          <View style={[s.modalSheet, { backgroundColor: colors.card }]}>
            <View style={[s.modalHandle, { backgroundColor: colors.cardBorder }]} />
            
            <Text style={[s.modalHeaderTitle, { color: colors.text }]}>Nouvelle Tâche</Text>

            {/* Formulaire */}
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 14, paddingTop: 10 }}>
              <Text style={[s.inputLabel, { color: colors.text }]}>Titre de l'activité</Text>
              <TextInput
                style={[s.input, { backgroundColor: colors.backgroundElement, color: colors.text, borderColor: colors.cardBorder }]}
                placeholder="Ex: Arrosage secteur Nord"
                placeholderTextColor={colors.textSecondary}
                value={title}
                onChangeText={setTitle}
              />

              <Text style={[s.inputLabel, { color: colors.text }]}>Description (Optionnel)</Text>
              <TextInput
                style={[s.input, s.textArea, { backgroundColor: colors.backgroundElement, color: colors.text, borderColor: colors.cardBorder }]}
                placeholder="Ajouter des notes importantes..."
                placeholderTextColor={colors.textSecondary}
                multiline
                numberOfLines={3}
                value={description}
                onChangeText={setDescription}
              />

              <Text style={[s.inputLabel, { color: colors.text }]}>Type d'activité</Text>
              <View style={s.typeSelectorGrid}>
                {(Object.keys(EVENT_CONFIG) as CalendarEventType[]).map((t) => {
                  const conf = EVENT_CONFIG[t];
                  const isSelected = type === t;
                  return (
                    <TouchableOpacity
                      key={t}
                      onPress={() => setType(t)}
                      style={[
                        s.selectorItem,
                        { borderColor: isSelected ? conf.color : colors.cardBorder, backgroundColor: isSelected ? `${conf.color}10` : colors.backgroundElement }
                      ]}
                    >
                      <Ionicons name={conf.icon as any} size={16} color={isSelected ? conf.color : colors.textSecondary} />
                      <Text style={[s.selectorText, { color: isSelected ? conf.color : colors.text, fontWeight: isSelected ? '700' : '400' }]}>
                        {conf.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={[s.inputLabel, { color: colors.text }]}>Date de l'événement (AAAA-MM-JJ)</Text>
              <TextInput
                style={[s.input, { backgroundColor: colors.backgroundElement, color: colors.text, borderColor: colors.cardBorder }]}
                placeholder="2026-06-19"
                placeholderTextColor={colors.textSecondary}
                value={eventDate}
                onChangeText={setEventDate}
              />

              <View style={s.modalActions}>
                <TouchableOpacity style={[s.btnSubmit, { backgroundColor: G }]} onPress={handleCreateEvent}>
                  <Text style={s.btnSubmitText}>Enregistrer l'activité</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[s.btnCancel, { borderColor: colors.cardBorder }]} onPress={() => setModalVisible(false)}>
                  <Text style={[s.btnCancelText, { color: colors.textSecondary }]}>Annuler</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  topBar: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: Spacing.md, paddingTop: Spacing.sm, paddingBottom: Spacing.md },
  topBarIcon: { borderRadius: 10, padding: 8 },
  topTitle: { fontSize: 20, fontWeight: '900' },
  topSub: { fontSize: 11, marginTop: 2 },
  addBtn: { width: 38, height: 38, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  
  scrollContent: { paddingHorizontal: Spacing.md, paddingTop: Spacing.sm },
  emptyState: { alignItems: 'center', padding: 24, gap: 12, borderStyle: 'dashed', borderWidth: 1.5, borderRadius: Radius.lg, marginTop: 20 },
  emptyIconCircle: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: 17, fontWeight: '800' },
  emptyText: { fontSize: 12, textAlign: 'center', lineHeight: 18 },

  eventCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: Radius.md, borderWidth: 1, marginBottom: 10 },
  checkArea: { alignSelf: 'flex-start', paddingTop: 2 },
  eventInfo: { flex: 1, gap: 4 },
  badgeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  typeBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  typeBadgeText: { fontSize: 10, fontWeight: '700' },
  eventDate: { fontSize: 10, fontWeight: '500' },
  eventTitle: { fontSize: 14, fontWeight: '700' },
  eventDesc: { fontSize: 12, lineHeight: 16 },
  deleteBtn: { padding: 6, alignSelf: 'flex-start' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalSheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '85%', paddingHorizontal: 20, paddingBottom: 30 },
  modalHandle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginVertical: 8 },
  modalHeaderTitle: { fontSize: 18, fontWeight: '900', marginBottom: 10 },
  inputLabel: { fontSize: 12, fontWeight: '700', marginTop: 4 },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, fontSize: 13 },
  textArea: { height: 70, textAlignVertical: 'top' },
  
  typeSelectorGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginVertical: 4 },
  selectorItem: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, minWidth: '30%' },
  selectorText: { fontSize: 11 },

  modalActions: { gap: 8, marginTop: 16 },
  btnSubmit: { borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  btnSubmitText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  btnCancel: { borderRadius: 10, borderWidth: 1, paddingVertical: 12, alignItems: 'center' },
  btnCancelText: { fontSize: 13, fontWeight: '700' },
});