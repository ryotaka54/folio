'use client';

import { usePathname } from 'next/navigation';

export default function LocaleSwitcher() {
  const pathname = usePathname() ?? '/';
  const isJa = pathname.startsWith('/ja');

  const switchLocale = () => {
    const lang = isJa ? 'en' : 'ja';
    document.cookie = `locale_preference=${lang}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
    if (isJa) {
      window.location.href = pathname.replace(/^\/ja/, '') || '/';
    } else {
      const dest = pathname === '/dashboard' ? '/ja/dashboard'
                 : pathname === '/'          ? '/ja'
                 : '/ja';
      window.location.href = dest;
    }
  };

  return (
    <button
      onClick={switchLocale}
      style={{
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        fontSize: 12,
        color: 'var(--text-tertiary)',
        padding: 0,
        fontFamily: 'inherit',
        transition: 'color 0.15s',
        textDecoration: 'none',
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--muted-text)'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-tertiary)'; }}
    >
      {isJa ? 'View in English' : '日本語で見る'}
    </button>
  );
}
