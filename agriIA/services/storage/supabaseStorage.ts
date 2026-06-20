import { supabase } from '@/lib/supabase';

let ImagePicker: typeof import('expo-image-picker') | null = null;
let ImageManipulator: typeof import('expo-image-manipulator') | null = null;

try { ImagePicker = require('expo-image-picker'); } catch {}
try { ImageManipulator = require('expo-image-manipulator'); } catch {}

const BUCKETS = {
  profiles: 'profiles',
  plots: 'plots',
  diagnostics: 'diagnostics',
};

export async function uploadProfileAvatar(filePath: string, fileName: string) {
  const blob = await fetch(filePath).then((r) => r.blob());
  return supabase.storage.from(BUCKETS.profiles).upload(fileName, blob, { cacheControl: '3600', upsert: true });
}

export async function uploadPlotPhoto(filePath: string, fileName: string) {
  const blob = await fetch(filePath).then((r) => r.blob());
  return supabase.storage.from(BUCKETS.plots).upload(fileName, blob, { cacheControl: '3600', upsert: true });
}

export async function uploadDiagnosticPhoto(filePath: string, fileName: string) {
  const blob = await fetch(filePath).then((r) => r.blob());
  return supabase.storage.from(BUCKETS.diagnostics).upload(fileName, blob, { cacheControl: '3600', upsert: true });
}

export async function getPublicUrl(bucket: keyof typeof BUCKETS, path: string) {
  const { data, error } = await supabase.storage.from(BUCKETS[bucket]).createSignedUrl(path, 3600);
  if (error) return { data: null, error };
  return { data: { publicUrl: data.signedUrl }, error: null };
}

export async function pickAndCompressImage(): Promise<string | null> {
  if (!ImagePicker) { alert("Fonctionnalité non disponible dans cette version."); return null; }

  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') { alert("Permission d'accès à la galerie refusée."); return null; }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.8,
  });

  if (result.canceled || !result.assets?.length) return null;

  if (!ImageManipulator) return result.assets[0].uri;

  const manipulated = await ImageManipulator.manipulateAsync(
    result.assets[0].uri,
    [{ resize: { width: 600 } }],
    { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
  );
  return manipulated.uri;
}

export async function takePhotoAndCompress(): Promise<string | null> {
  if (!ImagePicker) { alert("Fonctionnalité non disponible dans cette version."); return null; }

  const { status } = await ImagePicker.requestCameraPermissionsAsync();
  if (status !== 'granted') { alert("Permission d'accès à la caméra refusée."); return null; }

  const result = await ImagePicker.launchCameraAsync({
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.8,
  });

  if (result.canceled || !result.assets?.length) return null;

  if (!ImageManipulator) return result.assets[0].uri;

  const manipulated = await ImageManipulator.manipulateAsync(
    result.assets[0].uri,
    [{ resize: { width: 600 } }],
    { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
  );
  return manipulated.uri;
}
