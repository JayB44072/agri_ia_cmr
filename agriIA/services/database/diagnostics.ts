import { supabase } from '@/lib/supabase'; // Ajuste le chemin si ton client Supabase est ailleurs

// Définition de l'interface correspondant à la structure de la table public.diagnostics
export interface DiagnosticRow {
  id: string;
  owner_id: string;
  image_url: string | null;
  disease: string;
  confidence: number;
  causes: string[];
  treatment: string;
  preventive_actions: string[];
  created_at?: string;
}

// Type partiel utilisé lors de l'insertion d'un nouveau diagnostic
export interface CreateDiagnosticInput {
  owner_id: string;
  image_url: string | null;
  disease: string;
  confidence: number;
  causes: string[];
  treatment: string;
  preventive_actions: string[];
}

/**
 * Enregistre un nouveau diagnostic généré par l'IA dans la table PostgreSQL.
 * Soumis à la règle RLS de vérification de l'owner_id.
 */
export async function createDiagnostic(input: CreateDiagnosticInput) {
  try {
    const { data, error } = await supabase
      .from('diagnostics')
      .insert([input])
      .select()
      .single();

    return { data: data as DiagnosticRow, error };
  } catch (error: any) {
    console.error('Erreur inattendue lors de la création du diagnostic:', error);
    return { data: null, error };
  }
}

/**
 * Récupère l'historique complet des diagnostics d'un utilisateur spécifique.
 * Trié du plus récent au plus ancien.
 */
export async function getDiagnosticsByOwner(ownerId: string) {
  try {
    const { data, error } = await supabase
      .from('diagnostics')
      .select('*')
      .eq('owner_id', ownerId)
      .order('created_at', { ascending: false });

    return { data: data as DiagnosticRow[], error };
  } catch (error: any) {
    console.error('Erreur inattendue lors de la récupération des diagnostics:', error);
    return { data: null, error };
  }
}