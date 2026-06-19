import { supabase } from '@/lib/supabase';

const BUCKETS = {
  profiles: 'profiles',
  plots: 'plots',
  diagnostics: 'diagnostics',
};

export async function uploadProfileAvatar(filePath: string, fileName: string) {
  const { data, error } = await supabase.storage
    .from(BUCKETS.profiles)
    .upload(fileName, await fetch(filePath).then((r) => r.blob()), {
      cacheControl: '3600',
      upsert: true,
    });
  return { data, error };
}

export async function uploadPlotPhoto(filePath: string, fileName: string) {
  const { data, error } = await supabase.storage
    .from(BUCKETS.plots)
    .upload(fileName, await fetch(filePath).then((r) => r.blob()), {
      cacheControl: '3600',
      upsert: true,
    });
  return { data, error };
}

export async function uploadDiagnosticPhoto(filePath: string, fileName: string) {
  const { data, error } = await supabase.storage
    .from(BUCKETS.diagnostics)
    .upload(fileName, await fetch(filePath).then((r) => r.blob()), {
      cacheControl: '3600',
      upsert: true,
    });
  return { data, error };
}

export async function getPublicUrl(bucket: keyof typeof BUCKETS, path: string) {
  const { data, error } = await supabase.storage
    .from(BUCKETS[bucket])
    .getPublicUrl(path);
  return { data, error };
}
