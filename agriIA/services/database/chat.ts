import { supabase } from '@/lib/supabase';

export type ConversationRow = {
  id: string;
  name: string | null;
  is_group: boolean;
  created_at?: string;
};

export type MessageRow = {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at?: string;
};

export async function getUserConversations(userId: string) {
  const { data, error } = await supabase
    .from('conversation_participants')
    .select(`
      conversation_id,
      conversations (
        id,
        name,
        is_group,
        created_at
      )
    `)
    .eq('user_id', userId);
  return { data, error };
}

export async function getConversationMessages(conversationId: string) {
  const { data, error } = await supabase
    .from('messages')
    .select(`
      id,
      conversation_id,
      sender_id,
      content,
      created_at,
      profiles (
        full_name,
        avatar_url
      )
    `)
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });
  return { data, error };
}

export async function sendMessage(conversationId: string, senderId: string, content: string) {
  const { data, error } = await supabase
    .from('messages')
    .insert([{
      conversation_id: conversationId,
      sender_id: senderId,
      content,
    }])
    .select()
    .single();
  return { data: data as MessageRow | null, error };
}

export async function createConversation(creatorId: string, name: string | null, isGroup: boolean, participantIds: string[]) {
  // 1. Insert conversation
  const { data: conversation, error } = await supabase
    .from('conversations')
    .insert([{ name, is_group: isGroup }])
    .select()
    .single();

  if (error || !conversation) return { error };

  // 2. Add creator and participants
  const allParticipants = Array.from(new Set([creatorId, ...participantIds]));
  const insertions = allParticipants.map(uid => ({
    conversation_id: conversation.id,
    user_id: uid,
  }));

  const { error: partError } = await supabase
    .from('conversation_participants')
    .insert(insertions);

  if (partError) return { error: partError };

  return { data: conversation as ConversationRow, error: null };
}
