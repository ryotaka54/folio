import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { Logo } from '@/components/Logo';
import ThemeToggle from '@/components/ThemeToggle';
import { localeHref, type Locale } from '@/lib/locale';

interface PageHeaderProps {
  locale: Locale;
  /** Breadcrumb label shown after "Applyd /", e.g. "Help & FAQ". Shows a ThemeToggle on the right. */
  breadcrumb?: string;
  /** When true (and no breadcrumb), shows a "Back to home" link instead. */
  showBackLink?: boolean;
  backLabel?: string;
}

/** Shared sticky top nav for simple content pages (help, contact, privacy, terms). */
export function PageHeader({ locale, breadcrumb, showBackLink, backLabel }: PageHeaderProps) {
  return (
    <nav className="border-b border-border-gray bg-background sticky top-0 z-30 pt-[env(safe-area-inset-top)]">
      <div className="max-w-[800px] mx-auto px-4 md:px-6 flex items-center h-[52px] gap-2">
        <Link href={localeHref(locale, '/')} className="flex items-center gap-2">
          <Logo size={22} variant="dark" />
          <span className="text-[15px] font-semibold text-brand-navy" style={{ letterSpacing: '-0.02em' }}>Applyd</span>
        </Link>

        {breadcrumb && (
          <>
            <span className="text-[13px] text-border-gray">/</span>
            <span className="text-[13px] font-medium text-muted-text">{breadcrumb}</span>
          </>
        )}

        {showBackLink && !breadcrumb && (
          <Link
            href={localeHref(locale, '/')}
            className="ml-auto inline-flex items-center gap-1.5 text-sm text-muted-text hover:text-brand-navy transition-colors"
          >
            <ChevronLeft size={15} />
            {backLabel ?? (locale === 'ja' ? 'ホームに戻る' : 'Back to home')}
          </Link>
        )}

        {breadcrumb && (
          <div className="ml-auto">
            <ThemeToggle />
          </div>
        )}
      </div>
    </nav>
  );
}
