import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Image, ActivityIndicator, Modal, RefreshControl, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, Radius } from '@/constants/theme';
import { useColorScheme } from 'react-native';
import { useAuth } from '@/context/AuthContext';
import {
  pickAndCompressImage,
  takePhotoAndCompress,
  uploadDiagnosticPhoto,
  getPublicUrl,
} from '@/services/storage/supabaseStorage';
import {
  createDiagnostic,
  getDiagnosticsByOwner,
  DiagnosticRow,
} from '@/services/database/diagnostics';

const SCREEN_W = Dimensions.get('window').width;

const GEMINI_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || 'AIzaSyDemo_placeholder';

interface GeminiAnalysisResult {
  disease: string;
  confidence: number;
  causes: string[];
  treatment: string;
  preventive_actions: string[];
}

const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.readAsDataURL(blob);
  });
};

const uriToBase64 = async (uri: string): Promise<string> => {
  const response = await fetch(uri);
  const blob = await response.blob();
  return await blobToBase64(blob);
};

export default function DiagnosticScreen() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const colors = isDark ? Colors.dark : Colors.light;
  const G = colors.primary;
  
  const { user } = useAuth();
  const [history, setHistory] = useState<DiagnosticRow[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<GeminiAnalysisResult | null>(null);
  const [selectedHistory, setSelectedHistory] = useState<DiagnosticRow | null>(null);

  useEffect(() => {
    loadHistory();
  }, [user]);

  async function loadHistory() {
    if (!user) return;
    setRefreshing(true);
    const { data, error } = await getDiagnosticsByOwner(user.id);
    setRefreshing(false);
    if (!error && data) {
      setHistory(data);
    }
  }

  const handlePick = async (useCamera: boolean) => {
    const uri = useCamera ? await takePhotoAndCompress() : await pickAndCompressImage();
    if (uri) {
      setImageUri(uri);
      setAnalysisResult(null);
    }
  };

  const startAnalysis = async () => {
    if (!imageUri || !user) return;
    setLoading(true);

    try {
      // 1. Convert image to base64 for Gemini
      const base64Data = await uriToBase64(imageUri);

      // 2. Query Gemini Vision API
      const prompt = `Tu es un expert agronome africain spécialisé dans les maladies des cultures tropicales au Cameroun.
Analyse cette image de plante malade et diagnostique le problème.
Réponds UNIQUEMENT en JSON valide (sans aucun markdown \`\`\`json ou texte explicatif) avec ce format exact :
{
  "disease": "Nom précis de la maladie (Français)",
  "confidence": 92,
  "causes": ["Cause principale 1", "Cause 2"],
  "treatment": "Description claire et concise du traitement recommandé (organique ou chimique adapté au Cameroun)",
  "preventive_actions": ["Action préventive 1", "Action préventive 2"]
}`;

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  { text: prompt },
                  {
                    inlineData: {
                      mimeType: 'image/jpeg',
                      data: base64Data,
                    },
                  },
                ],
              },
            ],
          }),
        }
      );

      if (!res.ok) throw new Error('Erreur de communication avec l\'IA');

      const data = await res.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '{}';
      const clean = text.replace(/```json|```/g, '').trim();
      const parsedResult: GeminiAnalysisResult = JSON.parse(clean);

      // 3. Upload photo to Supabase Storage
      const fileName = `${user.id}_diag_${Date.now()}.jpg`;
      const { error: uploadError } = await uploadDiagnosticPhoto(imageUri, fileName);
      let storagePublicUrl = '';
      if (!uploadError) {
        const { data: urlData } = await getPublicUrl('diagnostics', fileName);
        storagePublicUrl = urlData?.publicUrl || '';
      }

      // 4. Save to public.diagnostics table
      const diagData = {
        owner_id: user.id,
        image_url: storagePublicUrl || imageUri,
        disease: parsedResult.disease || 'Inconnue',
        confidence: parsedResult.confidence || 0,
        causes: parsedResult.causes || [],
        treatment: parsedResult.treatment || '',
        preventive_actions: parsedResult.preventive_actions || [],
      };

      const { error: dbError } = await createDiagnostic(diagData);
      if (dbError) {
        console.error('Failed to log to DB:', dbError.message);
      }

      setAnalysisResult(parsedResult);
      loadHistory();
    } catch (e: any) {
      alert("Erreur lors de l'analyse : " + e.message);
    } finally {
      setLoading(false);
    }
  };

  const resetDiagnostic = () => {
    setImageUri(null);
    setAnalysisResult(null);
  };

  return (
    <SafeAreaView style={[s.root, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={s.topBar}>
        <View style={s.topBarIcon}>
          <Ionicons name="sparkles" size={16} color="#fff" />
        </View>
        <View>
          <Text style={[s.topTitle, { color: colors.text }]}>Diagnostic IA</Text>
          <Text style={[s.topSub, { color: colors.textSecondary }]}>Détectez les maladies de vos cultures par photo</Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadHistory} tintColor={G} />}
      >
        {/* Main interactive area */}
        <View style={[s.mainCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          {!imageUri ? (
            <View style={s.emptyState}>
              <View style={[s.emptyIconCircle, { backgroundColor: `${G}15` }]}>
                <Ionicons name="camera-outline" size={42} color={G} />
              </View>
              <Text style={[s.emptyTitle, { color: colors.text }]}>Analyser une feuille malade</Text>
              <Text style={[s.emptyText, { color: colors.textSecondary }]}>
                Prenez une photo de près ou choisissez-en une dans votre galerie pour identifier la maladie de votre plante.
              </Text>
              
              <View style={s.actionBtnRow}>
                <TouchableOpacity style={[s.actionBtn, { backgroundColor: G }]} onPress={() => handlePick(true)}>
                  <Ionicons name="camera" size={18} color="#fff" />
                  <Text style={s.actionBtnText}>Prendre Photo</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[s.actionBtn, { backgroundColor: colors.backgroundElement, borderWidth: 1, borderColor: colors.cardBorder }]} onPress={() => handlePick(false)}>
                  <Ionicons name="images-outline" size={18} color={colors.textSecondary} />
                  <Text style={[s.actionBtnText, { color: colors.textSecondary }]}>Galerie</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={s.imageSelectedArea}>
              <Image source={{ uri: imageUri }} style={s.selectedImage} />
              
              {loading ? (
                <View style={s.loadingBox}>
                  <ActivityIndicator size="large" color={G} />
                  <Text style={[s.loadingText, { color: colors.text }]}>Analyse par l'IA AgriSmart en cours...</Text>
                  <Text style={[s.loadingSub, { color: colors.textSecondary }]}>Nous détectons les agents pathogènes...</Text>
                </View>
              ) : analysisResult ? (
                <View style={s.resultBox}>
                  <View style={s.resultHeader}>
                    <Ionicons name="checkmark-circle" size={26} color={colors.success} />
                    <View style={{ flex: 1 }}>
                      <Text style={[s.resultTitle, { color: colors.text }]}>{analysisResult.disease}</Text>
                      <Text style={[s.resultConf, { color: colors.textSecondary }]}>Confiance : {analysisResult.confidence}%</Text>
                    </View>
                    <View style={[s.confBadge, { backgroundColor: `${colors.success}18` }]}>
                      <Text style={[s.confBadgeText, { color: colors.success }]}>Actif</Text>
                    </View>
                  </View>

                  <View style={s.resultSection}>
                    <Text style={[s.sectionTitle, { color: colors.text }]}>⚠️ Causes probables</Text>
                    {analysisResult.causes.map((c, i) => (
                      <Text key={i} style={[s.bulletText, { color: colors.textSecondary }]}>• {c}</Text>
                    ))}
                  </View>

                  <View style={[s.resultSection, s.treatmentBox, { backgroundColor: `${G}08`, borderColor: `${G}20` }]}>
                    <Text style={[s.sectionTitle, { color: G }]}>🧪 Traitement recommandé</Text>
                    <Text style={[s.treatmentTextContent, { color: colors.text }]}>{analysisResult.treatment}</Text>
                  </View>

                  <View style={s.resultSection}>
                    <Text style={[s.sectionTitle, { color: colors.text }]}>🛡️ Actions préventives</Text>
                    {analysisResult.preventive_actions.map((act, i) => (
                      <Text key={i} style={[s.bulletText, { color: colors.textSecondary }]}>• {act}</Text>
                    ))}
                  </View>

                  <TouchableOpacity style={[s.resetBtn, { backgroundColor: G }]} onPress={resetDiagnostic}>
                    <Text style={s.resetBtnText}>Nouveau diagnostic</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={s.actionRow}>
                  <TouchableOpacity style={[s.analyseBtn, { backgroundColor: G }]} onPress={startAnalysis}>
                    <Ionicons name="sparkles" size={16} color="#fff" />
                    <Text style={s.analyseBtnText}>Lancer l'analyse IA</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[s.cancelBtn, { borderColor: colors.cardBorder }]} onPress={resetDiagnostic}>
                    <Text style={[s.cancelBtnText, { color: colors.textSecondary }]}>Annuler</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
        </View>

        {/* History list */}
        <Text style={[s.historyLabel, { color: colors.textSecondary }]}>
          HISTORIQUE DES DIAGNOSTICS ({history.length})
        </Text>

        {history.length === 0 ? (
          <View style={[s.historyEmpty, { borderColor: colors.cardBorder }]}>
            <Text style={{ fontSize: 24, marginBottom: 8 }}>📋</Text>
            <Text style={[s.historyEmptyText, { color: colors.textSecondary }]}>Aucun diagnostic historique trouvé.</Text>
          </View>
        ) : (
          history.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[s.historyItem, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
              onPress={() => setSelectedHistory(item)}
              activeOpacity={0.82}
            >
              {item.image_url ? (
                <Image source={{ uri: item.image_url }} style={s.historyThumb} />
              ) : (
                <View style={[s.historyThumbEmpty, { backgroundColor: colors.backgroundElement }]}>
                  <Ionicons name="leaf-outline" size={18} color={colors.textSecondary} />
                </View>
              )}
              <View style={s.historyInfo}>
                <Text style={[s.historyDisease, { color: colors.text }]}>{item.disease}</Text>
                <Text style={[s.historyDate, { color: colors.textSecondary }]}>
                  Confiance : {item.confidence}% · {item.created_at ? new Date(item.created_at).toLocaleDateString() : ''}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
            </TouchableOpacity>
          ))
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* History detail modal */}
      <Modal visible={!!selectedHistory} transparent animationType="slide" onRequestClose={() => setSelectedHistory(null)}>
        <View style={s.modalOverlay}>
          <View style={[s.modalSheet, { backgroundColor: colors.card }]}>
            <View style={[s.modalHandle, { backgroundColor: colors.cardBorder }]} />
            
            {selectedHistory && (
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.modalScroll}>
                <View style={s.modalHeader}>
                  <Text style={[s.modalTitle, { color: colors.text }]}>{selectedHistory.disease}</Text>
                  <Text style={[s.modalSub, { color: colors.textSecondary }]}>
                    Diagnostiqué le {selectedHistory.created_at ? new Date(selectedHistory.created_at).toLocaleDateString() : ''}
                  </Text>
                </View>

                {selectedHistory.image_url && (
                  <Image source={{ uri: selectedHistory.image_url }} style={s.modalImage} />
                )}

                <View style={s.resultSection}>
                  <Text style={[s.sectionTitle, { color: colors.text }]}>⚠️ Causes détectées</Text>
                  {selectedHistory.causes.map((c, i) => (
                    <Text key={i} style={[s.bulletText, { color: colors.textSecondary }]}>• {c}</Text>
                  ))}
                </View>

                <View style={[s.resultSection, s.treatmentBox, { backgroundColor: `${G}08`, borderColor: `${G}20` }]}>
                  <Text style={[s.sectionTitle, { color: G }]}>🧪 Traitement recommandé</Text>
                  <Text style={[s.treatmentTextContent, { color: colors.text }]}>{selectedHistory.treatment}</Text>
                </View>

                <View style={s.resultSection}>
                  <Text style={[s.sectionTitle, { color: colors.text }]}>🛡️ Actions préventives</Text>
                  {selectedHistory.preventive_actions.map((act, i) => (
                    <Text key={i} style={[s.bulletText, { color: colors.textSecondary }]}>• {act}</Text>
                  ))}
                </View>

                <TouchableOpacity style={[s.modalCloseBtn, { backgroundColor: G }]} onPress={() => setSelectedHistory(null)}>
                  <Text style={s.modalCloseText}>Fermer</Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  topBar: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: Spacing.md, paddingTop: Spacing.sm, paddingBottom: Spacing.md },
  topBarIcon: { backgroundColor: '#22c55e', borderRadius: 10, padding: 8 },
  topTitle: { fontSize: 20, fontWeight: '900' },
  topSub: { fontSize: 11, marginTop: 2 },
  
  scrollContent: { paddingHorizontal: Spacing.md, paddingTop: Spacing.sm },
  mainCard: { borderRadius: Radius.lg, borderWidth: 1, overflow: 'hidden', marginBottom: 20 },
  emptyState: { alignItems: 'center', padding: 24, gap: 12 },
  emptyIconCircle: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: 17, fontWeight: '800' },
  emptyText: { fontSize: 12, textAlign: 'center', lineHeight: 18 },
  actionBtnRow: { flexDirection: 'row', gap: 10, marginTop: 6 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 11, borderRadius: 10 },
  actionBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  
  imageSelectedArea: { padding: 14, gap: 14 },
  selectedImage: { width: '100%', height: 220, borderRadius: 12, backgroundColor: '#000' },
  
  loadingBox: { alignItems: 'center', paddingVertical: 20, gap: 8 },
  loadingText: { fontSize: 14, fontWeight: '700' },
  loadingSub: { fontSize: 11 },
  
  resultBox: { gap: 14 },
  resultHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.06)', paddingBottom: 10 },
  resultTitle: { fontSize: 16, fontWeight: '800' },
  resultConf: { fontSize: 11 },
  confBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  confBadgeText: { fontSize: 10, fontWeight: '700' },
  
  resultSection: { gap: 4 },
  sectionTitle: { fontSize: 13, fontWeight: '800', marginBottom: 2 },
  bulletText: { fontSize: 12, lineHeight: 18, marginLeft: 4 },
  treatmentBox: { borderRadius: 10, borderWidth: 1, padding: 12 },
  treatmentTextContent: { fontSize: 12, lineHeight: 18 },
  
  resetBtn: { borderRadius: 10, paddingVertical: 12, alignItems: 'center', marginTop: 10 },
  resetBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  
  actionRow: { flexDirection: 'row', gap: 10 },
  analyseBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 10, paddingVertical: 12 },
  analyseBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  cancelBtn: { flex: 1, borderRadius: 10, borderWidth: 1, paddingVertical: 12, alignItems: 'center' },
  cancelBtnText: { fontSize: 13, fontWeight: '700' },
  
  historyLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1, marginBottom: 10 },
  historyEmpty: { alignItems: 'center', paddingVertical: 30, borderStyle: 'dashed', borderWidth: 1.5, borderRadius: Radius.md },
  historyEmptyText: { fontSize: 11 },
  
  historyItem: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: Radius.md, borderWidth: 1, padding: 10, marginBottom: 8 },
  historyThumb: { width: 44, height: 44, borderRadius: 8 },
  historyThumbEmpty: { width: 44, height: 44, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  historyInfo: { flex: 1, gap: 3 },
  historyDisease: { fontSize: 13, fontWeight: '700' },
  historyDate: { fontSize: 10 },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalSheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '85%', paddingHorizontal: 20, paddingBottom: 30 },
  modalHandle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginVertical: 8 },
  modalScroll: { gap: 16, paddingTop: 6 },
  modalHeader: { gap: 4 },
  modalTitle: { fontSize: 18, fontWeight: '850' },
  modalSub: { fontSize: 11 },
  modalImage: { width: '100%', height: 240, borderRadius: 12 },
  modalCloseBtn: { borderRadius: 10, paddingVertical: 12, alignItems: 'center', marginTop: 16 },
  modalCloseText: { color: '#fff', fontSize: 13, fontWeight: '700' },
});
