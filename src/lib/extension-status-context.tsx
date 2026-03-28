'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useAuth } from './auth-context';
import { supabase } from './supabase';
import { capture } from './analytics';

const LS_INSTALLED = 'applyd_extension_installed';
const LS_DISMISSED = 'applyd_extension_banner_dismissed';
const LS_HINT_COUNT = 'add_modal_extension_hint_count';

interface ExtensionStatusContextType {
  isInstalled: boolean;
  isDismissed: boolean;
  hintCount: number;
  mounted: boolean;
  markInstalled: () => void;
  markDismissed: () => void;
  incrementHintCount: () => number;
  isBannerEligible: (createdAt?: string) => boolean;
}

const ExtensionStatusContext = createContext<ExtensionStatusContextType | null>(null);

export function ExtensionStatusProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [isInstalled, setIsInstalled] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [hintCount, setHintCount] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setIsInstalled(localStorage.getItem(LS_INSTALLED) === 'true');
    setIsDismissed(localStorage.getItem(LS_DISMISSED) === 'true');
    setHintCount(parseInt(localStorage.getItem(LS_HINT_COUNT) || '0', 10));
  }, []);

  const markInstalled = useCallback(() => {
    setIsInstalled(true);
    localStorage.setItem(LS_INSTALLED, 'true');
    if (user?.id) {
      supabase.from('users').update({ extension_installed: true }).eq('id', user.id).then(() => {});
    }
  }, [user?.id]);

  useEffect(() => {
    if (!mounted) return;
    const handler = (e: MessageEvent) => {
      if (e.data?.type === 'APPLYD_EXTENSION_ACTIVE') {
        capture('extension_detected');
        markInstalled();
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [mounted, markInstalled]);

  const markDismissed = useCallback(() => {
    capture('extension_banner_dismissed');
    setIsDismissed(true);
    localStorage.setItem(LS_DISMISSED, 'true');
    if (user?.id) {
      supabase.from('users').update({ extension_banner_dismissed: true }).eq('id', user.id).then(() => {});
    }
  }, [user?.id]);

  const incrementHintCount = useCallback((): number => {
    const next = hintCount + 1;
    setHintCount(next);
    localStorage.setItem(LS_HINT_COUNT, String(next));
    if (user?.id) {
      supabase.from('users').update({ extension_hint_count: next }).eq('id', user.id).then(() => {});
    }
    return next;
  }, [hintCount, user?.id]);

  const isBannerEligible = useCallback((createdAt?: string): boolean => {
    if (!createdAt) return false;
    const ageDays = (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24);
    return ageDays < 7;
  }, []);

  return (
    <ExtensionStatusContext.Provider value={{ isInstalled, isDismissed, hintCount, mounted, markInstalled, markDismissed, incrementHintCount, isBannerEligible }}>
      {children}
    </ExtensionStatusContext.Provider>
  );
}

export function useExtensionStatus() {
  const ctx = useContext(ExtensionStatusContext);
  if (!ctx) throw new Error('useExtensionStatus must be used within ExtensionStatusProvider');
  return ctx;
}
