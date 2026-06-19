import { supabase } from '@/lib/supabase';

export type SensorDataRow = {
  id: string;
  plot_id: string;
  moisture: number;
  temperature: number;
  ph: number;
  nitrogen: number;
  recorded_at?: string;
};

export async function logSensorData(data: Omit<SensorDataRow, 'id'>) {
  const { data: logged, error } = await supabase
    .from('sensor_data')
    .insert([data])
    .select()
    .single();
  return { data: logged as SensorDataRow | null, error };
}

export async function getSensorDataForPlot(plotId: string, limit: number = 20) {
  const { data, error } = await supabase
    .from('sensor_data')
    .select('*')
    .eq('plot_id', plotId)
    .order('recorded_at', { ascending: false })
    .limit(limit);
  return { data: data as SensorDataRow[] | null, error };
}
