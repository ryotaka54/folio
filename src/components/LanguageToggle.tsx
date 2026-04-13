'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function LanguageToggle() {
  const router = useRouter();
  const pathname = usePathname();
  const isJa = pathname?.startsWith('/ja');
  const [hovered, setHovered] = useState(false);

  const switchTo = async (lang: 'en' | 'ja') => {
    // Set cookie so middleware uses this preference on every future request
    document.cookie = `preferred_language=${lang}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;

    // Also save to localStorage as fallback
    localStorage.setItem('preferred_language', lang);

    // Persist to Supabase if signed in (non-blocking)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        supabase.from('users').update({ language_preference: lang }).eq('id', session.user.id);
      }
    }).catch(() => {});

    // Navigate — preserve the current sub-path where sensible
    if (lang === 'ja') {
      if (!pathname?.startsWith('/ja')) {
        // Map known paths; fall back to /ja root for anything unknown
        const mapped = pathname === '/dashboard' ? '/ja/dashboard'
          : pathname === '/settings'  ? '/settings'
          : '/ja';
        router.push(mapped);
      }
    } else {
      if (pathname?.startsWith('/ja')) {
        const stripped = pathname.replace(/^\/ja/, '') || '/';
        router.push(stripped);
      }
    }
  };

  return (
    <div
      title={isJa ? '言語 / Language' : 'Language / 言語'}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        width: 80,
        height: 28,
        borderRadius: 8,
        border: '1px solid var(--border-gray)',
        background: 'var(--surface-gray)',
        overflow: 'hidden',
        flexShrink: 0,
        opacity: hovered ? 1 : 0.85,
        transition: 'opacity 0.15s',
      }}
    >
      {/* EN option */}
      <button
        onClick={() => switchTo('en')}
        style={{
          flex: 1,
          height: '100%',
          border: 'none',
          cursor: 'pointer',
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: '0.03em',
          fontFamily: 'var(--font-geist), sans-serif',
          background: !isJa ? 'var(--accent-blue, #2563EB)' : 'transparent',
          color: !isJa ? '#fff' : 'var(--muted-text)',
          transition: 'background 0.15s, color 0.15s',
        }}
      >
        EN
      </button>

      {/* 日本語 option */}
      <button
        onClick={() => switchTo('ja')}
        style={{
          flex: 1,
          height: '100%',
          border: 'none',
          cursor: 'pointer',
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: '0.02em',
          fontFamily: "'Noto Sans JP', var(--font-geist), sans-serif",
          background: isJa ? 'var(--accent-blue, #2563EB)' : 'transparent',
          color: isJa ? '#fff' : 'var(--muted-text)',
          transition: 'background 0.15s, color 0.15s',
        }}
      >
        日本語
      </button>
    </div>
  );
}
