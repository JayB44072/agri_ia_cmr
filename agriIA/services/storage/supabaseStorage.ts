import { supabase } from '@/lib/supabase';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';

const BUCKETS = {
  profiles: 'profiles',
  plots: 'plots',
  diagnostics: 'diagnostics',
};

export async function uploadProfileAvatar(filePath: string, fileName: string) {
  const blob = await fetch(filePath).then((r) => r.blob());
  const { data, error } = await supabase.storage
    .from(BUCKETS.profiles)
    .upload(fileName, blob, {
      cacheControl: '3600',
      upsert: true,
    });
  return { data, error };
}

export async function uploadPlotPhoto(filePath: string, fileName: string) {
  const blob = await fetch(filePath).then((r) => r.blob());
  const { data, error } = await supabase.storage
    .from(BUCKETS.plots)
    .upload(fileName, blob, {
      cacheControl: '3600',
      upsert: true,
    });
  return { data, error };
}

export async function uploadDiagnosticPhoto(filePath: string, fileName: string) {
  const blob = await fetch(filePath).then((r) => r.blob());
  const { data, error } = await supabase.storage
    .from(BUCKETS.diagnostics)
    .upload(fileName, blob, {
      cacheControl: '3600',
      upsert: true,
    });
  return { data, error };
}

export async function getPublicUrl(bucket: keyof typeof BUCKETS, path: string) {
  const { data } = supabase.storage
    .from(BUCKETS[bucket])
    .getPublicUrl(path);
  return { data, error: null };
}

export async function pickAndCompressImage(): Promise<string | null> {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') {
    alert("Permission d'accès à la galerie refusée.");
    return null;
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.8,
  });

  if (result.canceled || !result.assets || result.assets.length === 0) {
    return null;
  }

  const selectedImage = result.assets[0];
  
  // Compress image to a max width of 600px with 0.7 compression ratio
  const manipulated = await ImageManipulator.manipulateAsync(
    selectedImage.uri,
    [{ resize: { width: 600 } }],
    { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
  );

  return manipulated.uri;
}

export async function takePhotoAndCompress(): Promise<string | null> {
  const { status } = await ImagePicker.requestCameraPermissionsAsync();
  if (status !== 'granted') {
    alert("Permission d'accès à la caméra refusée.");
    return null;
  }

  const result = await ImagePicker.launchCameraAsync({
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.8,
  });

  if (result.canceled || !result.assets || result.assets.length === 0) {
    return null;
  }

  const selectedImage = result.assets[0];
  
  const manipulated = await ImageManipulator.manipulateAsync(
    selectedImage.uri,
    [{ resize: { width: 600 } }],
    { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
  );

  return manipulated.uri;
}

