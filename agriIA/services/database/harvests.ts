import { supabase } from '@/lib/supabase';

export type HarvestRow = {
  id: string;
  owner_id: string;
  crop: string;
  quantity: number; // kg
  yield: number | null; // t/ha
  revenue: number | null; // FCFA
  harvest_date: string; // YYYY-MM-DD
  created_at?: string;
};

export async function getHarvestsByOwner(ownerId: string) {
  const { data, error } = await supabase
    .from('harvests')
    .select('*')
    .eq('owner_id', ownerId)
    .order('harvest_date', { ascending: false });
  return { data: data as HarvestRow[] | null, error };
}

export async function createHarvest(harvest: Omit<HarvestRow, 'id'>) {
  const { data, error } = await supabase
    .from('harvests')
    .insert([harvest])
    .select()
    .single();
  return { data: data as HarvestRow | null, error };
}

export async function updateHarvest(id: string, harvest: Partial<Omit<HarvestRow, 'id' | 'owner_id'>>) {
  const { data, error } = await supabase
    .from('harvests')
    .update(harvest)
    .eq('id', id)
    .select()
    .single();
  return { data: data as HarvestRow | null, error };
}

export async function deleteHarvest(id: string) {
  const { error } = await supabase
    .from('harvests')
    .delete()
    .eq('id', id);
  return { error };
}
