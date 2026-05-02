'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { Logo } from '@/components/Logo';
import ThemeToggle from '@/components/ThemeToggle';

interface CompanyRow {
  company: string;
  company_slug: string;
  lang: string;
  count: number;
}

export default function LeaderboardPage() {
  const { user } = useAuth();
  const [companies, setCompanies] = useState<CompanyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch('/api/leaderboard')
      .then(r => r.json())
      .then(d => { setCompanies(d.companies ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const filtered = companies.filter(c =>
    c.company.toLowerCase().includes(search.toLowerCase()),
  );
  const enCompanies = filtered.filter(c => c.lang === 'en');
  const jaCompanies = filtered.filter(c => c.lang === 'ja');

  return (
    <div style={{ minHeight: '100vh', background: 'var(--background)', fontFamily: 'inherit' }}>
      {/* Nav */}
      <nav style={{ height: 56, borderBottom: '1px solid var(--border-gray)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', background: 'var(--card-bg)', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center' }}><Logo /></Link>
          <span style={{ fontSize: 12, color: 'var(--muted-text)' }}>/</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--brand-navy)' }}>Interview Leaderboard</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <ThemeToggle />
          {user ? (
            <Link href="/dashboard" style={{ fontSize: 13, color: 'var(--accent-blue)', textDecoration: 'none', fontWeight: 500 }}>← Dashboard</Link>
          ) : (
            <Link href="/signup" style={{ fontSize: 13, fontWeight: 600, color: '#fff', background: '#2563EB', padding: '7px 16px', borderRadius: 8, textDecoration: 'none' }}>Sign up free</Link>
          )}
        </div>
      </nav>

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '48px 24px 80px' }}>
        {/* Header */}
        <div style={{ marginBottom: 40 }}>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--brand-navy)', margin: '0 0 10px', letterSpacing: '-0.02em' }}>
            Interview Leaderboard
          </h1>
          <p style={{ fontSize: 15, color: 'var(--muted-text)', margin: '0 0 24px', lineHeight: 1.6 }}>
            Real answers from real candidates, scored by AI. Browse top responses by company — or submit your own after a mock interview.
          </p>
          {!user && (
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '14px 18px', background: 'rgba(37,99,235,0.07)', border: '1px solid rgba(37,99,235,0.2)', borderRadius: 12 }}>
              <span style={{ fontSize: 14, color: 'var(--body-text)' }}>Practice a question, then post your score to compete.</span>
              <Link href="/signup" style={{ fontSize: 13, fontWeight: 600, color: '#2563EB', textDecoration: 'none', whiteSpace: 'nowrap' }}>Get started free →</Link>
            </div>
          )}
        </div>

        {/* Search */}
        <input
          type="search"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search companies…"
          style={{ width: '100%', height: 42, padding: '0 16px', borderRadius: 10, border: '1px solid var(--border-gray)', background: 'var(--surface-gray)', fontSize: 14, color: 'var(--body-text)', outline: 'none', boxSizing: 'border-box', marginBottom: 28, fontFamily: 'inherit' }}
        />

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--muted-text)', fontSize: 14 }}>Loading…</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <p style={{ color: 'var(--muted-text)', fontSize: 15 }}>No companies yet.</p>
            <p style={{ color: 'var(--muted-text)', fontSize: 13, marginTop: 8 }}>Be the first — practice a mock interview and post your score.</p>
            <Link href={user ? '/interview' : '/signup'} style={{ display: 'inline-block', marginTop: 16, fontSize: 14, fontWeight: 600, color: '#2563EB', textDecoration: 'none' }}>
              {user ? 'Practice now →' : 'Sign up free →'}
            </Link>
          </div>
        ) : (
          <>
            <CompanyList companies={enCompanies} title="English" user={user} />
            {jaCompanies.length > 0 && (
              <CompanyList companies={jaCompanies} title="日本語 (就活)" user={user} />
            )}
          </>
        )}
      </div>
    </div>
  );
}

function CompanyList({ companies, title, user }: { companies: CompanyRow[]; title: string; user: unknown }) {
  if (companies.length === 0) return null;
  return (
    <div style={{ marginBottom: 40 }}>
      <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: 'var(--muted-text)', margin: '0 0 14px', fontFamily: "'DM Mono', monospace" }}>
        {title.toUpperCase()}
      </p>
      <div style={{ borderRadius: 12, border: '1px solid var(--border-gray)', overflow: 'hidden' }}>
        {companies.map((c, i) => (
          <Link
            key={`${c.company_slug}-${c.lang}`}
            href={`/leaderboard/${c.company_slug}${c.lang === 'ja' ? '?lang=ja' : ''}`}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '14px 18px',
              borderTop: i > 0 ? '1px solid var(--border-gray)' : undefined,
              background: 'var(--card-bg)',
              textDecoration: 'none',
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = 'var(--surface-gray)')}
            onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'var(--card-bg)')}
          >
            <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--brand-navy)' }}>{c.company}</span>
            <span style={{ fontSize: 12, color: 'var(--muted-text)' }}>{c.count} answer{c.count !== 1 ? 's' : ''} →</span>
          </Link>
        ))}
      </div>
      {!user && (
        <p style={{ fontSize: 12, color: 'var(--muted-text)', marginTop: 10, textAlign: 'center' }}>
          <Link href="/signup" style={{ color: '#2563EB', textDecoration: 'none' }}>Sign up free</Link> to post your score
        </p>
      )}
    </div>
  );
}
