'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Application } from './types';
import { supabase } from './supabase';

interface StoreContextType {
  applications: Application[];
  addApplication: (app: Omit<Application, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<Application>;
  updateApplication: (id: string, updates: Partial<Application>) => void;
  deleteApplication: (id: string) => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export function StoreProvider({ children, userId }: { children: ReactNode; userId: string }) {
  const [applications, setApplications] = useState<Application[]>([]);

  // Load applications from Supabase
  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase
        .from('applications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (data) {
        setApplications(data as Application[]);
      }
      if (error) console.error('Load applications error:', error);
    };

    load();
  }, [userId]);

  const addApplication = useCallback(async (appData: Omit<Application, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<Application> => {
    const now = new Date().toISOString();
    const newApp = {
      ...appData,
      user_id: userId,
      created_at: now,
      updated_at: now,
    };

    const { data, error } = await supabase
      .from('applications')
      .insert(newApp)
      .select()
      .single();

    if (error) {
      console.error('Add application error:', error);
      // Fallback: create with local ID
      const fallback: Application = {
        ...newApp,
        id: crypto.randomUUID(),
      } as Application;
      setApplications(prev => [fallback, ...prev]);
      return fallback;
    }

    const app = data as Application;
    setApplications(prev => [app, ...prev]);
    return app;
  }, [userId]);

  const updateApplication = useCallback((id: string, updates: Partial<Application>) => {
    const updatedFields = { ...updates, updated_at: new Date().toISOString() };

    // Optimistic update
    setApplications(prev =>
      prev.map(a => a.id === id ? { ...a, ...updatedFields } : a)
    );

    // Persist to Supabase
    supabase.from('applications')
      .update(updatedFields)
      .eq('id', id)
      .then(({ error }) => {
        if (error) console.error('Update application error:', error);
      });
  }, []);

  const deleteApplication = useCallback((id: string) => {
    // Optimistic delete
    setApplications(prev => prev.filter(a => a.id !== id));

    // Persist to Supabase
    supabase.from('applications')
      .delete()
      .eq('id', id)
      .then(({ error }) => {
        if (error) console.error('Delete application error:', error);
      });
  }, []);

  return (
    <StoreContext.Provider value={{ applications, addApplication, updateApplication, deleteApplication }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}
