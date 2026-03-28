'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { Application } from './types';
import { supabase } from './supabase';

interface StoreContextType {
  applications: Application[];
  loading: boolean;
  storeError: string | null;
  clearStoreError: () => void;
  retryLoad: () => void;
  addApplication: (app: Omit<Application, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<Application>;
  updateApplication: (id: string, updates: Partial<Application>) => Promise<void>;
  deleteApplication: (id: string) => Promise<void>;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export function StoreProvider({ children, userId }: { children: ReactNode; userId: string }) {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [storeError, setStoreError] = useState<string | null>(null);
  const loadingRef = useRef(false);

  const loadApplications = useCallback(async () => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    try {
      const { data, error } = await supabase
        .from('applications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (data) setApplications(data as Application[]);
      if (error) {
        console.error('Load applications error:', error);
        setStoreError('Could not load your applications. Check your connection and refresh.');
      }
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadApplications();
  }, [loadApplications]);

  // Real-time sync — keeps all open tabs in sync
  useEffect(() => {
    const channel = supabase
      .channel(`applications_${userId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'applications', filter: `user_id=eq.${userId}` }, (payload) => {
        if (payload.eventType === 'INSERT') {
          const incoming = payload.new as Application;
          setApplications(prev => prev.some(a => a.id === incoming.id) ? prev : [incoming, ...prev]);
        } else if (payload.eventType === 'UPDATE') {
          const incoming = payload.new as Application;
          setApplications(prev => prev.map(a => a.id === incoming.id ? incoming : a));
        } else if (payload.eventType === 'DELETE') {
          const gone = (payload.old as Partial<Application>).id;
          setApplications(prev => prev.filter(a => a.id !== gone));
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [userId]);

  const addApplication = useCallback(async (
    appData: Omit<Application, 'id' | 'user_id' | 'created_at' | 'updated_at'>
  ): Promise<Application> => {
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('applications')
      .insert({ ...appData, user_id: userId, created_at: now, updated_at: now })
      .select()
      .single();

    if (error) throw new Error(error.message || 'Failed to save application');

    const app = data as Application;
    setApplications(prev => [app, ...prev]);
    return app;
  }, [userId]);

  const updateApplication = useCallback(async (id: string, updates: Partial<Application>): Promise<void> => {
    const updatedFields = { ...updates, updated_at: new Date().toISOString() };

    // Optimistic update — capture snapshot for rollback
    let snapshot: Application[] = [];
    setApplications(prev => {
      snapshot = prev;
      return prev.map(a => a.id === id ? { ...a, ...updatedFields } : a);
    });

    const { error } = await supabase
      .from('applications')
      .update(updatedFields)
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      setApplications(snapshot);
      const msg = 'Failed to update. Changes not saved.';
      setStoreError(msg);
      throw new Error(msg);
    }
  }, [userId]);

  const deleteApplication = useCallback(async (id: string): Promise<void> => {
    // Optimistic delete — capture snapshot for rollback
    let snapshot: Application[] = [];
    setApplications(prev => {
      snapshot = prev;
      return prev.filter(a => a.id !== id);
    });

    const { error } = await supabase
      .from('applications')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      setApplications(snapshot);
      const msg = 'Failed to delete. Please try again.';
      setStoreError(msg);
      throw new Error(msg);
    }
  }, [userId]);

  const clearStoreError = useCallback(() => setStoreError(null), []);

  const retryLoad = useCallback(() => {
    loadingRef.current = false;
    setStoreError(null);
    loadApplications();
  }, [loadApplications]);

  return (
    <StoreContext.Provider value={{ applications, loading, storeError, clearStoreError, retryLoad, addApplication, updateApplication, deleteApplication }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}
