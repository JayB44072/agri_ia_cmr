import { supabase } from '@/lib/supabase';

export type PlotRow = {
  id: string;
  owner_id: string;
  name: string;
  crop: string;
  area: number;
  soil_type: string | null;
  latitude: number | null;
  longitude: number | null;
  health_status: 'ok' | 'warning' | 'critical';
  created_at?: string;
};

export async function getPlotsByOwner(ownerId: string) {
  const { data, error } = await supabase
    .from('plots')
    .select('*')
    .eq('owner_id', ownerId)
    .order('created_at', { ascending: false });
  return { data: data as PlotRow[] | null, error };
}

export async function createPlot(plot: Omit<PlotRow, 'id'>) {
  const { data, error } = await supabase
    .from('plots')
    .insert([plot])
    .select()
    .single();
  return { data: data as PlotRow | null, error };
}

export async function updatePlot(id: string, plot: Partial<Omit<PlotRow, 'id' | 'owner_id'>>) {
  const { data, error } = await supabase
    .from('plots')
    .update(plot)
    .eq('id', id)
    .select()
    .single();
  return { data: data as PlotRow | null, error };
}

export async function deletePlot(id: string) {
  const { error } = await supabase
    .from('plots')
    .delete()
    .eq('id', id);
  return { error };
}
