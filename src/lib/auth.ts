import { supabase } from './supabase';
import type { User } from '@supabase/supabase-js';

export async function signIn(email: string, password: string): Promise<{ user: User | null; error?: string }> {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { user: null, error: error.message };
  }

  return { user: data.user };
}

export async function signOut(): Promise<{ error?: string }> {
  const { error } = await supabase.auth.signOut();
  if (error) {
    return { error: error.message };
  }
  return {};
}

export async function getCurrentUser(): Promise<User | null> {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function isAuthenticated(): Promise<boolean> {
  const user = await getCurrentUser();
  return user !== null;
}
