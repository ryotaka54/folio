'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function LanguageToggle() {
  const router = useRouter();
  const pathname = usePathname();
  const isJa = pathname?.startsWith('/ja');
  const [hovered, setHovered] = useState(false);

  const switchTo = async (lang: 'en' | 'ja') => {
    if (lang === 'ja' && isJa) return;
    if (lang === 'en' && !isJa) return;

    // Set cookie so middleware uses this preference on every future request
    document.cookie = `preferred_language=${lang}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
    localStorage.setItem('preferred_language', lang);

    // Persist to Supabase if signed in (non-blocking)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        supabase.from('users').update({ language_preference: lang }).eq('id', session.user.id);
      }
    }).catch(() => {});

    // Determine destination
    let dest: string;
    if (lang === 'ja') {
      dest = pathname === '/dashboard' ? '/ja/dashboard'
           : pathname === '/settings'  ? '/settings'
           : '/ja';
    } else {
      dest = pathname?.startsWith('/ja')
        ? (pathname.replace(/^\/ja/, '') || '/')
        : '/';
    }

    // Fade-out overlay — covers the black flash between root layouts
    const overlay = document.createElement('div');
    overlay.style.cssText = [
      'position:fixed',
      'inset:0',
      'z-index:99999',
      'background:var(--background,#fff)',
      'opacity:0',
      'transition:opacity 180ms ease',
      'pointer-events:none',
    ].join(';');
    document.body.appendChild(overlay);

    // Trigger fade-in of overlay (covers old page)
    requestAnimationFrame(() => {
      requestAnimationFrame(() => { overlay.style.opacity = '1'; });
    });

    // Navigate after overlay is opaque, then remove it
    await new Promise<void>(resolve => setTimeout(resolve, 220));
    router.push(dest);
    // Clean up overlay after navigation settles
    setTimeout(() => overlay.remove(), 600);
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
