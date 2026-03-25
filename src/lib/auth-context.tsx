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
    localStorage.removeItem('folio-auth-token');
  } catch (e) {
    // Silent fail
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = async (userId: string) => {
    try {
      const { data } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (data) {
        setUser({
          id: data.id,
          name: data.name || '',
          mode: data.mode || 'internship',
          school_year: data.school_year || '',
          career_level: data.career_level || '',
          recruiting_season: data.recruiting_season || '',
          created_at: data.created_at,
          onboarding_complete: data.onboarding_complete || false,
        });
      } else {
        setUser({
          id: userId,
          name: '',
          mode: 'internship',
          school_year: '',
          career_level: '',
          recruiting_season: '',
          created_at: new Date().toISOString(),
          onboarding_complete: false,
        });
      }
    } catch (err) {
      console.error('Load profile error:', err);
      setUser({
        id: userId,
        name: '',
        mode: 'internship',
        school_year: '',
        career_level: '',
        recruiting_season: '',
        created_at: new Date().toISOString(),
        onboarding_complete: false,
      });
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
        console.warn('Auth loading timed out, clearing stale tokens');
        clearStaleAuthTokens();
        setLoading(false);
      }
    }, 6000);

    loadSession();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      if (event === 'TOKEN_REFRESHED' && session?.user) {
        await loadProfile(session.user.id);
      } else if (event === 'SIGNED_IN' && session?.user) {
        await loadProfile(session.user.id);
        setLoading(false);
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

    const { data, error } = await supabase.auth.signUp({ email, password });
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

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);
    if (data.user) {
      await loadProfile(data.user.id);
    }
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

      supabase.from('users')
        .update({
          name: updated.name,
          mode: updated.mode,
          school_year: updated.school_year,
          career_level: updated.career_level,
          recruiting_season: updated.recruiting_season,
          onboarding_complete: updated.onboarding_complete,
        })
        .eq('id', updated.id)
        .then(({ error }) => {
          if (error) console.error('Profile update error:', error);
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
