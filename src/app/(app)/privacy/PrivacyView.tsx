import type { ReactNode } from 'react';
import Link from 'next/link';
import { Logo } from '@/components/Logo';
import { PageHeader } from '@/components/marketing/PageHeader';
import { localeHref, type Locale } from '@/lib/locale';
import { en, ja, type LegalBullet } from '@/content/privacy';

/**
 * Parses a small inline markup so emphasis/links can live in the copy
 * dictionary instead of JSX:
 *   - `**bold text**`     -> <strong>
 *   - `[link text](href)` -> <a>
 */
function renderRich(text: string, keyPrefix: string, boldClassName = 'font-medium'): ReactNode[] {
  const pattern = /\*\*(.+?)\*\*|\[([^\]]+)\]\(([^)]+)\)/g;
  const nodes: ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let i = 0;

  while ((match = pattern.exec(text))) {
    if (match.index > lastIndex) nodes.push(text.slice(lastIndex, match.index));

    if (match[1] !== undefined) {
      nodes.push(
        <span key={`${keyPrefix}-${i++}`} className={boldClassName}>
          {match[1]}
        </span>
      );
    } else {
      const linkText = match[2];
      const href = match[3];
      const isExternal = href.startsWith('http');
      nodes.push(
        <a
          key={`${keyPrefix}-${i++}`}
          href={href}
          className="text-accent-blue hover:underline"
          {...(isExternal ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
        >
          {linkText}
        </a>
      );
    }
    lastIndex = pattern.lastIndex;
  }
  if (lastIndex < text.length) nodes.push(text.slice(lastIndex));
  return nodes;
}

function Bullet({ bullet, index }: { bullet: LegalBullet; index: number }) {
  return (
    <div className="flex gap-3">
      <span className="text-accent-blue mt-0.5 flex-shrink-0">→</span>
      <p>
        {bullet.label && <span className="font-medium">{bullet.label}</span>}
        {bullet.label && ' — '}
        {renderRich(bullet.body, `b${index}`)}
      </p>
    </div>
  );
}

export default function PrivacyView({ locale }: { locale: Locale }) {
  const copy = locale === 'ja' ? ja : en;

  return (
    <div className="min-h-screen bg-background">
      <PageHeader locale={locale} showBackLink />

      <main className="max-w-2xl mx-auto px-6 py-14">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-[22px] font-semibold mb-2 text-brand-navy" style={{ letterSpacing: '-0.02em' }}>
            {copy.title}
          </h1>
          <p className="text-sm text-muted-text">{copy.lastUpdated}</p>
          <p className="mt-4 text-sm text-body-text leading-relaxed">{copy.intro}</p>
        </div>

        <div className="space-y-10">
          {copy.sections.map((section, si) => (
            <section key={si}>
              <h2 className="text-base font-semibold text-brand-navy mb-3 pb-2 border-b border-border-gray">
                {section.heading}
              </h2>
              <div className="space-y-3 text-sm text-body-text leading-relaxed">
                {section.bullets?.map((bullet, bi) => (
                  <Bullet key={bi} bullet={bullet} index={si * 100 + bi} />
                ))}
                {section.callout && (
                  <div className="mt-4 bg-surface-gray rounded-xl px-4 py-3 text-sm text-body-text">
                    {renderRich(section.callout, `callout-${si}`, 'font-semibold text-brand-navy')}
                  </div>
                )}
                {section.paragraphs?.map((para, pi) => (
                  <p key={pi}>{renderRich(para, `p-${si}-${pi}`)}</p>
                ))}
              </div>
            </section>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border-gray py-10 bg-surface-gray/30 mt-10">
        <div className="max-w-[1200px] mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2" style={{ opacity: 0.4 }}>
            <Logo size={18} variant="dark" />
            <span className="text-[13px] font-semibold text-brand-navy" style={{ letterSpacing: '-0.02em' }}>
              Applyd
            </span>
          </div>
          <div className="flex items-center gap-6">
            {copy.footerLinks.map((link) => (
              <Link
                key={link.href}
                href={localeHref(locale, link.href)}
                className="text-xs font-medium text-muted-text hover:text-accent-blue transition-colors"
              >
                {link.label}
              </Link>
            ))}
            <span className="text-xs text-muted-text/50">© 2026 Applyd</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
