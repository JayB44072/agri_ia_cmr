import { supabase } from '@/lib/supabase';

export type CooperativeRow = {
  id: string;
  name: string;
  description: string | null;
  creator_id: string;
  created_at?: string;
};

export type CooperativeMemberRow = {
  id: string;
  cooperative_id: string;
  user_id: string;
  role: 'member' | 'manager';
  status: 'pending' | 'approved';
  created_at?: string;
};

export type CooperativePostRow = {
  id: string;
  cooperative_id: string;
  author_id: string;
  title: string;
  content: string;
  created_at?: string;
};

export async function getCooperatives() {
  const { data, error } = await supabase
    .from('cooperatives')
    .select('*')
    .order('created_at', { ascending: false });
  return { data: data as CooperativeRow[] | null, error };
}

export async function createCooperative(coop: Omit<CooperativeRow, 'id'>) {
  const { data, error } = await supabase
    .from('cooperatives')
    .insert([coop])
    .select()
    .single();
  return { data: data as CooperativeRow | null, error };
}

export async function joinCooperative(cooperativeId: string, userId: string) {
  const { data, error } = await supabase
    .from('cooperative_members')
    .insert([{
      cooperative_id: cooperativeId,
      user_id: userId,
      role: 'member',
      status: 'pending',
    }])
    .select()
    .single();
  return { data: data as CooperativeMemberRow | null, error };
}

export async function getCooperativeMembers(cooperativeId: string) {
  const { data, error } = await supabase
    .from('cooperative_members')
    .select(`
      id,
      role,
      status,
      user_id,
      profiles (
        full_name,
        avatar_url,
        city
      )
    `)
    .eq('cooperative_id', cooperativeId);
  return { data, error };
}

export async function approveMember(memberId: string) {
  const { data, error } = await supabase
    .from('cooperative_members')
    .update({ status: 'approved' })
    .eq('id', memberId)
    .select()
    .single();
  return { data: data as CooperativeMemberRow | null, error };
}

export async function getCooperativePosts(cooperativeId: string) {
  const { data, error } = await supabase
    .from('cooperative_posts')
    .select(`
      id,
      title,
      content,
      created_at,
      author_id,
      profiles (
        full_name,
        avatar_url
      )
    `)
    .eq('cooperative_id', cooperativeId)
    .order('created_at', { ascending: false });
  return { data, error };
}

export async function createCooperativePost(post: Omit<CooperativePostRow, 'id'>) {
  const { data, error } = await supabase
    .from('cooperative_posts')
    .insert([post])
    .select()
    .single();
  return { data: data as CooperativePostRow | null, error };
}
