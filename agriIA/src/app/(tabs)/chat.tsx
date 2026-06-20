import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity,
  ActivityIndicator, SafeAreaView, KeyboardAvoidingView, Platform, useColorScheme
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import {
  getConversationMessages,
  sendMessage,
  getUserConversations,
  MessageRow
} from '@/services/database/chat';

// On enrichit le type pour inclure les données de profil qui viennent du join Supabase
interface   FullMessage extends MessageRow {
  profiles?: { full_name: string | null; avatar_url: string | null }[] | null;
}

export default function ChatScreen() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const colors = isDark ? Colors.dark : Colors.light;
  const G = colors.primary;

  const { user } = useAuth();
  const [messages, setMessages] = useState<FullMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [inputText, setInputText] = useState('');
  const [conversationId, setConversationId] = useState<string | null>(null);
  
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    // 1. On cherche d'abord la première conversation de l'utilisateur
    initChat();
  }, [user]);

  async function initChat() {
    if (!user) return;
    const { data: convs, error } = await getUserConversations(user.id);
    if (!error && convs && convs.length > 0) {
      // Pour l'exemple, on prend la première conversation trouvée
      const firstConvId = convs[0].conversation_id;
      setConversationId(firstConvId);
      loadMessages(firstConvId);
    } else {
      setLoading(false);
    }
  }

  async function loadMessages(convId: string) {
    setLoading(true);
    const { data, error } = await getConversationMessages(convId);
    if (!error && data) {
      setMessages(data as FullMessage[]);
    }
    setLoading(false);
  }

  const handleSend = async () => {
    if (!user || !conversationId || !inputText.trim()) return;
    
    const content = inputText;
    setInputText(''); // Reset rapide (Optimistic UI)

    const { data, error } = await sendMessage(conversationId, user.id, content);
    
    if (!error && data) {
      // Recharger les messages pour avoir les infos complètes (profiles, etc.)
      loadMessages(conversationId);
    } else {
      alert("Erreur lors de l'envoi");
      setInputText(content); // Restaure le texte en cas d'erreur
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
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={90}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: Spacing.md }}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
          renderItem={({ item }) => {
            const isMyMessage = item.sender_id === user?.id;
            return (
              <View style={[
                styles.bubble, 
                isMyMessage ? [styles.myBubble, { backgroundColor: G }] : [styles.otherBubble, { backgroundColor: colors.cardBorder }]
              ]}>
                {!isMyMessage && (
                  <Text style={[styles.senderName, { color: colors.textSecondary }]}>
                    {item.profiles?.full_name || 'Expert'}
                  </Text>
                )}
                <Text style={[styles.bubbleText, { color: isMyMessage ? '#fff' : colors.text }]}>
                  {item.content}
                </Text>
              </View>
            );
          }}
        />

        <View style={[styles.inputRow, { backgroundColor: colors.card, borderTopColor: colors.cardBorder }]}>
          <TextInput
            style={[styles.input, { backgroundColor: colors.backgroundElement, color: colors.text, borderColor: colors.cardBorder }]}
            placeholder="Écrire un message..."
            placeholderTextColor={colors.textSecondary}
            value={inputText}
            onChangeText={setInputText}
          />
          <TouchableOpacity style={[styles.sendBtn, { backgroundColor: G }]} onPress={handleSend}>
            <Ionicons name="send" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  bubble: { padding: 12, borderRadius: Radius.lg, marginBottom: 10, maxWidth: '85%' },
  myBubble: { alignSelf: 'flex-end', borderBottomRightRadius: 2 },
  otherBubble: { alignSelf: 'flex-start', borderBottomLeftRadius: 2 },
  senderName: { fontSize: 10, fontWeight: '700', marginBottom: 4 },
  bubbleText: { fontSize: 14, lineHeight: 20 },
  inputRow: { flexDirection: 'row', alignItems: 'center', padding: Spacing.md, borderTopWidth: 1 },
  input: { flex: 1, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 24, borderWidth: 1, marginRight: 8, fontSize: 14 },
  sendBtn: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' }
});