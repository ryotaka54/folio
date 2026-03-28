'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { UserProfile, Mode } from './types';
import { supabase } from './supabase';

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Clear any stale Supabase auth tokens from localStorage
function clearStaleAuthTokens() {
  if (typeof window === 'undefined') return;
  try {
    const keys = Object.keys(localStorage);
    for (const key of keys) {
      if (key.startsWith('sb-') && key.endsWith('-auth-token')) {
        localStorage.removeItem(key);
      }
    }
    // Also clear our custom key
    localStorage.removeItem('applyd-auth-token');
  } catch (e) {
    // Silent fail
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const defaultProfile = (userId: string): UserProfile => ({
    id: userId,
    name: '',
    mode: 'internship',
    school_year: '',
    career_level: '',
    recruiting_season: '',
    created_at: new Date().toISOString(),
    onboarding_complete: false,
    tutorial_completed: false,
  });

  const loadProfile = async (userId: string) => {
    try {
      const timeout = new Promise<null>((_, reject) =>
        setTimeout(() => reject(new Error('profile fetch timeout')), 5000)
      );
      const query = supabase.from('users').select('*').eq('id', userId).maybeSingle();
      const { data, error: fetchError } = await Promise.race([query, timeout]) as Awaited<typeof query>;

      if (fetchError) {
        console.error('Profile fetch error:', fetchError);
      }

      const localOnboarding = typeof window !== 'undefined' ? localStorage.getItem(`applyd_onboarding_${userId}`) : null;
      const localTutorial = typeof window !== 'undefined' ? localStorage.getItem(`applyd_tutorial_${userId}`) : null;

      if (data) {
        setUser({
          id: data.id,
          name: data.name || '',
          mode: data.mode || 'internship',
          school_year: data.school_year || '',
          career_level: data.career_level || '',
          recruiting_season: data.recruiting_season || '',
          created_at: data.created_at,
          onboarding_complete: data.onboarding_complete || localOnboarding === 'true',
          // localStorage wins — we don't write tutorial_completed to DB, so DB default (false) must not override it
          tutorial_completed: localTutorial === 'true' || data.tutorial_completed === true,
        });
      } else {
        // No profile row exists — auto-create one so future writes succeed
        const newProfile = {
          id: userId,
          name: '',
          mode: 'internship',
          school_year: '',
          career_level: '',
          recruiting_season: '',
          onboarding_complete: localOnboarding === 'true',
        };
        supabase.from('users').upsert(newProfile).then(({ error: upsertErr }) => {
          if (upsertErr) console.error('Auto-create profile error:', upsertErr);
        });
        setUser({ ...defaultProfile(userId), onboarding_complete: localOnboarding === 'true', tutorial_completed: localTutorial === 'true' });
      }
    } catch (err) {
      console.error('Load profile error:', err);
      const localOnboarding = typeof window !== 'undefined' ? localStorage.getItem(`applyd_onboarding_${userId}`) : null;
      setUser(prev => prev ?? { ...defaultProfile(userId), onboarding_complete: localOnboarding === 'true' });
    }
  };

  // Load session on mount
  useEffect(() => {
    let mounted = true;
    let resolved = false;

    const loadSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();

        // If session is expired, wipe it immediately rather than letting Supabase
        // try (and hang on) a dead token refresh
        if (session?.expires_at && session.expires_at * 1000 < Date.now()) {
          clearStaleAuthTokens();
          await supabase.auth.signOut().catch(() => {});
          if (mounted) setLoading(false);
          return;
        }

        if (!mounted) return;

        // If there's an error getting the session, clear stale tokens
        if (error) {
          console.warn('Session error, clearing stale tokens:', error.message);
          clearStaleAuthTokens();
          setLoading(false);
          return;
        }

        if (session?.user) {
          // Cross-device sync via Auth Metadata to bypass RLS issues on `users` table
          const metaOnboarding = session.user.user_metadata?.onboarding_complete === true;
          if (metaOnboarding && typeof window !== 'undefined') {
            localStorage.setItem(`applyd_onboarding_${session.user.id}`, 'true');
          }

          // Await full profile load before clearing the loading state so route guards read the real data
          await loadProfile(session.user.id);
        }
      } catch (err) {
        console.error('Session load error:', err);
        clearStaleAuthTokens();
      } finally {
        resolved = true;
        if (mounted) setLoading(false);
      }
    };

    // Hard timeout - only fires if loadSession never resolved
    const timeout = setTimeout(() => {
      if (mounted && !resolved) {
        console.warn('Auth loading timed out');
        setLoading(false);
      }
    }, 10000);

    loadSession();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;

      if (event === 'TOKEN_REFRESHED' && session?.user) {
        loadProfile(session.user.id).catch(console.error);
      } else if (event === 'SIGNED_IN' && session?.user) {
        loadProfile(session.user.id).finally(() => {
          if (mounted) setLoading(false);
        });
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    // Clear any stale tokens before signup
    clearStaleAuthTokens();
    const cleanEmail = email.trim();

    const { data, error } = await supabase.auth.signUp({ email: cleanEmail, password });
    if (error) throw new Error(error.message);
    if (data.user) {
      const { error: profileError } = await supabase.from('users').insert({
        id: data.user.id,
        name: '',
        mode: 'internship',
        school_year: '',
        career_level: '',
        recruiting_season: '',
        onboarding_complete: false,
        // tutorial_completed is localStorage-only — not a DB column
      });
      if (profileError) console.error('Profile creation error:', profileError);

      setUser({
        id: data.user.id,
        name: '',
        mode: 'internship',
        school_year: '',
        career_level: '',
        recruiting_season: '',
        created_at: new Date().toISOString(),
        onboarding_complete: false,
      });
    }
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    // Clear any stale tokens from localStorage before signing in
    clearStaleAuthTokens();
    const cleanEmail = email.trim();

    const { error } = await supabase.auth.signInWithPassword({ email: cleanEmail, password });
    if (error) throw new Error(error.message);
    // Profile loading is handled by the onAuthStateChange SIGNED_IN listener
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    clearStaleAuthTokens();
    setUser(null);
  }, []);

  const updateProfile = useCallback(async (updates: Partial<UserProfile>) => {
    setUser(prev => {
      if (!prev) return prev;
      const updated = { ...prev, ...updates };

      if (updated.onboarding_complete && typeof window !== 'undefined') {
        localStorage.setItem(`applyd_onboarding_${updated.id}`, 'true');

        // Push securely to Auth JWT Metadata to bypass any `users` table RLS limitations across devices
        supabase.auth.updateUser({
          data: { onboarding_complete: true }
        }).catch(err => console.error('Auth metadata update error:', err));
      }

      if (updated.tutorial_completed && typeof window !== 'undefined') {
        localStorage.setItem(`applyd_tutorial_${updated.id}`, 'true');
      }

      // Core fields — must succeed for the app to work correctly
      supabase.from('users')
        .upsert({
          id: updated.id,
          name: updated.name,
          mode: updated.mode,
          school_year: updated.school_year,
          career_level: updated.career_level,
          recruiting_season: updated.recruiting_season,
          onboarding_complete: updated.onboarding_complete,
          tutorial_completed: updated.tutorial_completed ?? false,
        })
        .then(({ error }) => {
          if (error) {
            console.error('Profile update error:', error);
            // Retry with only the absolute minimum fields so name/mode always save
            supabase.from('users')
              .upsert({ id: updated.id, name: updated.name, mode: updated.mode, onboarding_complete: updated.onboarding_complete })
              .then(({ error: retryErr }) => { if (retryErr) console.error('Profile retry error:', retryErr); });
          }
        });

      return updated;
    });
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, signUp, signIn, signOut, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
