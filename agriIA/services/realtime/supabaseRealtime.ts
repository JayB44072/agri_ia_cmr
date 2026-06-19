import { supabase } from '@/lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

const channels: Record<string, RealtimeChannel> = {};

export function subscribeToChannel(name: string, table: string, callback: (payload: any) => void) {
  if (channels[name]) return channels[name];

  const channel = supabase.channel(name)
    .on('postgres_changes', { event: '*', schema: 'public', table }, payload => {
      callback(payload);
    })
    .subscribe();

  channels[name] = channel;
  return channel;
}

export async function unsubscribeFromChannel(name: string) {
  const channel = channels[name];
  if (!channel) return;
  await supabase.removeChannel(channel);
  delete channels[name];
}
