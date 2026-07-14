'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { PageHeader } from '@/components/marketing/PageHeader';
import { localeHref, type Locale } from '@/lib/locale';
import { useTutorial } from '@/lib/tutorial-context';
import { useAuth } from '@/lib/auth-context';
import { en, ja, type HelpCopy } from '@/content/help';

const COPY: Record<Locale, HelpCopy> = { en, ja };

interface HelpViewProps {
  locale: Locale;
}

export default function HelpView({ locale }: HelpViewProps) {
  const copy = COPY[locale];
  const router = useRouter();
  const { start: startTutorial } = useTutorial();
  const { updateProfile, user } = useAuth();
  const [query, setQuery] = useState('');

  const handleReplayTutorial = () => {
    updateProfile({ tutorial_completed: false });
    router.push(localeHref(locale, '/dashboard'));
    // Brief delay so navigation completes before tutorial fires
    setTimeout(() => startTutorial(), 800);
  };

  const q = query.toLowerCase();
  const filtered = q
    ? copy.faqs.filter(f => f.q.toLowerCase().includes(q) || f.a.toLowerCase().includes(q))
    : copy.faqs;

  return (
    <div className="min-h-screen bg-background">
      <PageHeader locale={locale} breadcrumb={copy.breadcrumb} />

      <main className="max-w-[800px] mx-auto px-4 md:px-6 py-12">
        <div className="mb-8">
          <h1 className="text-[22px] font-semibold mb-1" style={{ color: 'var(--brand-navy)', letterSpacing: '-0.02em' }}>{copy.title}</h1>
          <p className="text-[14px] mb-5" style={{ color: 'var(--muted-text)' }}>{copy.subtitle}</p>
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-tertiary)' }}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder={copy.searchPlaceholder}
              className="w-full h-10 pl-9 pr-3 bg-background border border-border-gray rounded-lg text-[14px] focus:outline-none focus:border-accent-blue focus:ring-2 focus:ring-accent-blue/20 placeholder:text-text-tertiary transition-colors"
            />
          </div>
        </div>

        <div className="space-y-3">
          {filtered.length === 0 ? (
            <p className="text-[13px] py-8 text-center" style={{ color: 'var(--muted-text)' }}>{copy.noResultsText(query)}</p>
          ) : filtered.map((faq, i) => (
            <div key={i} className="bg-card-bg border border-border-gray rounded-lg p-5">
              <h3 className="text-[14px] font-semibold mb-2" style={{ color: 'var(--brand-navy)' }}>{faq.q}</h3>
              <p className="text-[13px] leading-relaxed" style={{ color: 'var(--muted-text)' }}>{faq.a}</p>
            </div>
          ))}
        </div>

        {user && (
          <div className="mt-10 p-6 rounded-lg border border-border-gray" style={{ background: 'var(--card-bg)' }}>
            <h2 className="text-[15px] font-semibold mb-1" style={{ color: 'var(--brand-navy)' }}>{copy.tourTitle}</h2>
            <p className="text-[13px] mb-4" style={{ color: 'var(--muted-text)' }}>{copy.tourSubtitle}</p>
            <button
              onClick={handleReplayTutorial}
              className="inline-flex items-center h-9 px-4 text-[13px] font-medium text-white rounded-md transition-colors bg-accent-blue hover:bg-accent-blue-hover"
            >
              {copy.tourCta}
            </button>
          </div>
        )}

        <div className="mt-4 p-6 rounded-lg border border-border-gray text-center" style={{ background: 'var(--card-bg)' }}>
          <h2 className="text-[15px] font-semibold mb-1" style={{ color: 'var(--brand-navy)' }}>{copy.contactTitle}</h2>
          <p className="text-[13px] mb-4" style={{ color: 'var(--muted-text)' }}>{copy.contactSubtitle}</p>
          <Link
            href={localeHref(locale, '/contact')}
            className="inline-flex items-center h-9 px-4 text-[13px] font-medium text-white rounded-md transition-colors"
            style={{ background: 'var(--accent-blue)' }}
          >
            {copy.contactCta}
          </Link>
        </div>
      </main>
    </div>
  );
}
