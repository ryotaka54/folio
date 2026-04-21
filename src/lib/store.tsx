'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { Application } from './types';
import { supabase } from './supabase';
import { FREE_TIER_LIMIT } from './pro';

// Best-effort Google Calendar sync — never throws, never blocks the user
async function syncGCal(
  action: 'create' | 'update' | 'delete',
  app: Pick<Application, 'id' | 'user_id' | 'company' | 'role' | 'deadline' | 'status'> & { google_calendar_event_id?: string | null }
): Promise<void> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) return;
  try {
    await fetch(`${url}/functions/v1/sync-google-calendar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, application: app }),
    });
  } catch {
    // silently ignored — calendar sync is best-effort
  }
}

/** Thrown when a free-tier user tries to exceed the application cap. */
export class CapExceededError extends Error {
  constructor() { super('cap_exceeded'); this.name = 'CapExceededError'; }
}

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

export function StoreProvider({ children, userId, isPro = false }: { children: ReactNode; userId: string; isPro?: boolean }) {
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
    if (!isPro) {
      const { count } = await supabase
        .from('applications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);
      if ((count ?? 0) >= FREE_TIER_LIMIT) throw new CapExceededError();
    }

    const now = new Date().toISOString();
    const payload = { ...appData, user_id: userId, created_at: now, updated_at: now };
    // Temporarily omit interview_steps until it is created in the production database
    delete (payload as any).interview_steps;

    const { data, error } = await supabase
      .from('applications')
      .insert(payload)
      .select()
      .single();

    if (error) throw new Error(error.message || 'Failed to save application');

    const app = data as Application;
    setApplications(prev => [app, ...prev]);

    // Trigger GCal sync if the new app has a deadline
    if (app.deadline) {
      syncGCal('create', {
        id: app.id, user_id: userId,
        company: app.company, role: app.role,
        deadline: app.deadline, status: app.status,
        google_calendar_event_id: null,
      });
    }

    return app;
  }, [userId]);

  const updateApplication = useCallback(async (id: string, updates: Partial<Application>): Promise<void> => {
    const updatedFields = { ...updates, updated_at: new Date().toISOString() };
    delete (updatedFields as any).interview_steps; // Temp fix until db column exists

    // Optimistic update — capture snapshot for rollback
    let snapshot: Application[] = [];
    let prevApp: Application | undefined;
    setApplications(prev => {
      snapshot = prev;
      prevApp = prev.find(a => a.id === id);
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

    // GCal sync when deadline or status changes
    if (prevApp && ('deadline' in updates || 'status' in updates)) {
      const merged = { ...prevApp, ...updatedFields };
      syncGCal('update', {
        id, user_id: userId,
        company: merged.company, role: merged.role,
        deadline: merged.deadline, status: merged.status,
        google_calendar_event_id: merged.google_calendar_event_id ?? null,
      });
    }
  }, [userId]);

  const deleteApplication = useCallback(async (id: string): Promise<void> => {
    // Capture app before removing for GCal cleanup
    let snapshot: Application[] = [];
    let deletedApp: Application | undefined;
    setApplications(prev => {
      snapshot = prev;
      deletedApp = prev.find(a => a.id === id);
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

    // Clean up GCal event if app had a deadline
    if (deletedApp?.deadline) {
      syncGCal('delete', {
        id, user_id: userId,
        company: deletedApp.company, role: deletedApp.role,
        deadline: deletedApp.deadline, status: deletedApp.status,
        google_calendar_event_id: deletedApp.google_calendar_event_id ?? null,
      });
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
