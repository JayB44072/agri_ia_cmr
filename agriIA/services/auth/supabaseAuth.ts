import { supabase } from '@/lib/supabase';

export type AuthSignUpData = {
  email: string;
  password: string;
  fullName?: string;
};

export type AuthSignInData = {
  email: string;
  password: string;
};

export async function signUpWithEmail(data: AuthSignUpData) {
  const { data: result, error } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
  }, {
    data: {
      full_name: data.fullName,
    },
  });
  return { result, error };
}

export async function signInWithEmail(data: AuthSignInData) {
  const { data: result, error } = await supabase.auth.signInWithPassword({
    email: data.email,
    password: data.password,
  });
  return { result, error };
}

export async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  });
  return { data, error };
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  return { error };
}

export async function resetPassword(email: string) {
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: 'exp://localhost:19000',
  });
  return { data, error };
}
