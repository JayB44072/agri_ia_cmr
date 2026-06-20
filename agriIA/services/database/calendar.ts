
import { supabase } from '@/lib/supabase';

export type CalendarEventType = 'semis' | 'arrosage' | 'fertilisation' | 'traitement' | 'récolte';

export type CalendarEventRow = {
  id: string;
  owner_id: string;
  type: CalendarEventType;
  title: string;
  description: string | null;
  event_date: string; // YYYY-MM-DD
  is_completed: boolean;
  created_at?: string;
};

export async function getEventsByOwner(ownerId: string) {
  const { data, error } = await supabase
    .from('calendar_events')
    .select('*')
    .eq('owner_id', ownerId)
    .order('event_date', { ascending: true });
  return { data: data as CalendarEventRow[] | null, error };
}

export async function createEvent(event: Omit<CalendarEventRow, 'id'>) {
  const { data, error } = await supabase
    .from('calendar_events')
    .insert([event])
    .select()
    .single();
  return { data: data as CalendarEventRow | null, error };
}

export async function updateEvent(id: string, event: Partial<Omit<CalendarEventRow, 'id' | 'owner_id'>>) {
  const { data, error } = await supabase
    .from('calendar_events')
    .update(event)
    .eq('id', id)
    .select()
    .single();
  return { data: data as CalendarEventRow | null, error };
}

export async function deleteEvent(id: string) {
  const { error } = await supabase
    .from('calendar_events')
    .delete()
    .eq('id', id);
  return { error };
}
