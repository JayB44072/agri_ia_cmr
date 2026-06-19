import { supabase } from '@/lib/supabase';

export type DiagnosticRow = {
  id: string;
  owner_id: string;
  image_url: string | null;
  disease: string;
  confidence: number;
  causes: string[];
  treatment: string | null;
  preventive_actions: string[];
  created_at?: string;
};

export async function createDiagnostic(diagnostic: Omit<DiagnosticRow, 'id'>) {
  const { data, error } = await supabase
    .from('diagnostics')
    .insert([diagnostic])
    .select()
    .single();
  return { data: data as DiagnosticRow | null, error };
}

export async function getDiagnosticsByOwner(ownerId: string) {
  const { data, error } = await supabase
    .from('diagnostics')
    .select('*')
    .eq('owner_id', ownerId)
    .order('created_at', { ascending: false });
  return { data: data as DiagnosticRow[] | null, error };
}
