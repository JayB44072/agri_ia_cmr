import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User, AuthError } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { useUser, UserProfile } from '@/context/UserContext';
import { createProfileIfMissing, getProfileById, upsertProfile, ProfileRow } from '@/services/database/profiles';
import { signInWithEmail, signUpWithEmail, signInWithGoogle, signOut as authSignOut, resetPassword as authResetPassword } from '@/services/auth/supabaseAuth';

export interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  error: string | null;
  signUp: (email: string, password: string, fullName?: string, profileData?: Partial<ProfileRow>) => Promise<{ error: any | null }>;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signInWithGoogle: () => Promise<{ url?: string | null; error: AuthError | null }>;
  signOut: () => Promise<{ error: AuthError | null }>;
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

function mapProfileRowToUserProfile(row: ProfileRow): UserProfile {
  return {
    nom: row.full_name ?? '',
    ville: row.city ?? '',
    region: row.region ?? '',
    zoneClimatique: row.climate_zone ?? '',
    cultures: row.crops ?? [],
    superficie: row.superficie ?? '',
    nbParcelles: row.nb_parcelles ?? '',
    objectif: row.objectives ?? '',
    experience: row.experience ?? '',
    defis: [],
    avatarUrl: row.avatar_url,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }): React.JSX.Element {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { setProfile } = useUser();

  async function loadProfile(authUser: User | null) {
    if (!authUser) {
      setProfile(null);
      return;
    }

    const { data, error: profileError } = await getProfileById(authUser.id);
    if (profileError) {
      setError(profileError.message);
      return;
    }

    if (data) {
      setProfile(mapProfileRowToUserProfile(data));
    } else {
      const defaultProfile: Partial<ProfileRow> = {
        id: authUser.id,
        full_name: authUser.user_metadata?.full_name ?? authUser.email ?? '',
        avatar_url: authUser.user_metadata?.avatar_url ?? null,
        role: 'farmer',
        city: '',
        region: '',
        climate_zone: '',
        crops: [],
        experience: '',
        objectives: '',
        created_at: new Date().toISOString(),
      };
      const { data: created, error: createError } = await createProfileIfMissing(authUser.id, defaultProfile);
      if (createError) {
        setError(createError.message);
        return;
      }
      if (created) {
        setProfile(mapProfileRowToUserProfile(created));
      }
    }
  }

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;
    async function bootstrap() {
      setLoading(true);
      try {
        const { data } = await supabase.auth.getSession();
        const currentSession = data.session;
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        await loadProfile(currentSession?.user ?? null);
      } catch (e) {
        console.warn('Auth bootstrap failed:', e);
      } finally {
        setLoading(false);
      }

      try {
        const { data: listener } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
          setSession(newSession);
          setUser(newSession?.user ?? null);
          await loadProfile(newSession?.user ?? null);
        });
        unsubscribe = () => listener?.subscription.unsubscribe();
      } catch (e) {
        console.warn('Auth listener failed:', e);
      }
    }

    bootstrap().catch(() => setLoading(false));
    return () => { if (unsubscribe) unsubscribe(); };
  }, []);

  const signUp = async (email: string, password: string, fullName?: string, profileData?: Partial<ProfileRow>) => {
    setError(null);
    const { result, error: signUpError } = await signUpWithEmail({ email, password, fullName });
    if (signUpError) return { error: signUpError };

    const authUser = result?.user;
    if (authUser && profileData) {
      const fullProfile: Partial<ProfileRow> = {
        ...profileData,
        id: authUser.id,
        full_name: fullName || authUser.user_metadata?.full_name || authUser.email || '',
        created_at: new Date().toISOString(),
      };
      const { error: upsertError } = await upsertProfile(fullProfile);
      if (upsertError) {
        return { error: upsertError };
      }
    }
    return { error: null };
  };

  const signIn = async (email: string, password: string) => {
    setError(null);
    const { error: signInError } = await signInWithEmail({ email, password });
    return { error: signInError };
  };

  const signInWithGoogleProvider = async () => {
    setError(null);
    const { data, error: googleError } = await signInWithGoogle();
    return { url: data?.url ?? null, error: googleError };
  };

  const signOut = async () => {
    setError(null);
    const { error: signOutError } = await authSignOut();
    if (!signOutError) {
      setProfile(null);
      setSession(null);
      setUser(null);
    }
    return { error: signOutError };
  };

  const resetPassword = async (email: string) => {
    setError(null);
    const { error: resetError } = await authResetPassword(email);
    return { error: resetError };
  };

  return (
    <AuthContext.Provider value={{ session, user, loading, error, signUp, signIn, signInWithGoogle: signInWithGoogleProvider, signOut, resetPassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
