import Link from 'next/link';
import { PageHeader } from '@/components/marketing/PageHeader';
import { localeHref, type Locale } from '@/lib/locale';
import { en, ja } from '@/content/terms';

export default function TermsView({ locale }: { locale: Locale }) {
  const copy = locale === 'ja' ? ja : en;
  const supportEmail = 'support@useapplyd.com';

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

        {/* Sections */}
        <div className="space-y-10">
          {copy.sections.map((section, i) => (
            <section key={i}>
              <h2 className="text-base font-semibold text-brand-navy mb-3 pb-2 border-b border-border-gray">
                {section.heading}
              </h2>
              <div className="space-y-3 text-sm text-body-text leading-relaxed">
                {section.intro && <p>{section.intro}</p>}
                {section.paragraphs?.map((para, j) => <p key={j}>{para}</p>)}
                {section.bullets && (
                  <ul className="space-y-2.5">
                    {section.bullets.map((item, j) => (
                      <li key={j} className="flex gap-3">
                        <span className="text-accent-blue mt-0.5 flex-shrink-0">→</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </section>
          ))}
        </div>

        {/* Agreement footer */}
        <div className="mt-14 rounded-xl p-6 text-center bg-card-bg border border-border-gray">
          <p className="text-sm font-medium mb-1 text-brand-navy">{copy.agreement.statement}</p>
          <p className="text-[12px] mb-5 text-muted-text">
            {copy.agreement.questionPrefix}{' '}
            <a href={`mailto:${supportEmail}`} className="underline underline-offset-2 hover:opacity-80 transition-opacity">
              {supportEmail}
            </a>
            {copy.agreement.questionSuffix ? ` ${copy.agreement.questionSuffix}` : ''}
          </p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <Link
              href={localeHref(locale, '/signup')}
              className="inline-flex items-center h-9 px-5 rounded-lg text-[13px] font-semibold text-white transition-colors bg-accent-blue"
            >
              {copy.agreement.agreeLabel}
            </Link>
            <Link
              href={localeHref(locale, '/')}
              className="inline-flex items-center h-9 px-5 rounded-lg text-[13px] font-medium border transition-colors hover:bg-surface-gray border-border-gray text-muted-text"
            >
              {copy.agreement.disagreeLabel}
            </Link>
          </div>
        </div>

        {/* Footer links */}
        <div className="mt-10 pt-6 border-t border-border-gray flex items-center justify-between flex-wrap gap-3">
          {copy.footerLinks.map((link) => (
            <Link
              key={link.href}
              href={localeHref(locale, link.href)}
              className="text-[12px] text-muted-text hover:text-brand-navy transition-colors"
            >
              {link.label}
            </Link>
          ))}
          <p className="text-[11px] text-text-tertiary">© 2026 Applyd</p>
        </div>
      </main>
    </div>
  );
}
