import { supabase } from '@/lib/supabase';

export type ProfileRow = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  role: 'farmer' | 'agronomist' | 'cooperative_manager' | 'admin';
  city: string;
  region: string;
  climate_zone: string;
  crops: string[];
  experience: string;
  objectives: string;
  superficie?: string;
  nb_parcelles?: string;
  created_at: string;
};

export async function getProfileById(id: string) {
  const { data, error } = await supabase
    .from<ProfileRow>('profiles')
    .select('*')
    .eq('id', id)
    .single();
  return { data, error }; 
}

export async function upsertProfile(profile: Partial<ProfileRow>) {
  const { data, error } = await supabase
    .from<ProfileRow>('profiles')
    .upsert(profile, { onConflict: 'id' })
    .select();
  return { data, error };
}

export async function createProfileIfMissing(id: string, profile: Partial<ProfileRow>) {
  const existing = await getProfileById(id);
  if (existing.data) {
    return { data: existing.data, error: existing.error };
  }
  const { data, error } = await supabase
    .from<ProfileRow>('profiles')
    .insert([profile])
    .select()
    .single();
  return { data, error };
}
