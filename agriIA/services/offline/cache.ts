import { supabase } from '@/lib/supabase';

// Simple in-memory fallback cache representing local storage
const localCache: Record<string, any> = {};
const offlineQueue: Array<{
  id: string;
  table: string;
  type: 'insert' | 'update' | 'delete';
  payload: any;
}> = [];

export async function isOnline(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 2000);
    const res = await fetch('https://www.google.com', { method: 'HEAD', signal: controller.signal });
    clearTimeout(id);
    return res.status >= 200 && res.status < 400;
  } catch {
    return false;
  }
}

export function getCached(key: string): any | null {
  return localCache[key] || null;
}

export function setCached(key: string, data: any) {
  localCache[key] = data;
}

export function queueOfflineAction(table: string, type: 'insert' | 'update' | 'delete', payload: any) {
  const action = {
    id: `${table}_${Date.now()}_${Math.random()}`,
    table,
    type,
    payload,
  };
  offlineQueue.push(action);
  
  // Update local cache state immediately to reflect the change
  if (type === 'insert') {
    const list = localCache[table] || [];
    localCache[table] = [payload, ...list];
  } else if (type === 'update') {
    const list = localCache[table] || [];
    localCache[table] = list.map((item: any) => item.id === payload.id ? { ...item, ...payload } : item);
  } else if (type === 'delete') {
    const list = localCache[table] || [];
    localCache[table] = list.filter((item: any) => item.id !== payload.id);
  }
}

export async function syncOfflineActions(): Promise<{ success: boolean; syncedCount: number }> {
  const online = await isOnline();
  if (!online || offlineQueue.length === 0) {
    return { success: false, syncedCount: 0 };
  }

  let syncedCount = 0;
  while (offlineQueue.length > 0) {
    const action = offlineQueue[0];
    try {
      if (action.type === 'insert') {
        // Strip temporary offline IDs if necessary
        const { error } = await supabase.from(action.table).insert([action.payload]);
        if (error) throw error;
      } else if (action.type === 'update') {
        const { error } = await supabase.from(action.table).update(action.payload).eq('id', action.payload.id);
        if (error) throw error;
      } else if (action.type === 'delete') {
        const { error } = await supabase.from(action.table).delete().eq('id', action.payload.id);
        if (error) throw error;
      }
      
      // Remove successfully synced item
      offlineQueue.shift();
      syncedCount++;
    } catch (err) {
      console.error(`Offline sync failed for action: ${action.id}`, err);
      // Stop syncing queue if an item throws an error to preserve order
      return { success: false, syncedCount };
    }
  }

  return { success: true, syncedCount };
}
