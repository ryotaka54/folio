'use client';

import { useState, useEffect, Suspense } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { localeHref, type Locale } from '@/lib/locale';
import { en, ja } from '@/content/signup';

function SignUpForm({ locale }: { locale: Locale }) {
  const copy = locale === 'ja' ? ja : en;
  const { signUp } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const refCode = searchParams.get('ref');

  // Persist referral code so onboarding can pick it up after account creation
  useEffect(() => {
    if (refCode) localStorage.setItem('applyd_ref', refCode.toLowerCase().trim());
  }, [refCode]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) { setError(copy.passwordMismatchError); return; }
    if (password.length < 6) { setError(copy.passwordTooShortError); return; }
    setLoading(true);
    try {
      const timeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error(copy.timeoutErrorMessage)), 8000)
      );
      await Promise.race([signUp(email, password), timeout]);
      router.push(localeHref(locale, '/onboarding'));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : copy.genericErrorMessage);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full opacity-20 dark:opacity-10 -z-0"
        style={{ background: 'radial-gradient(ellipse at center, var(--accent-blue) 0%, transparent 70%)' }}
      />
      <div className="w-full max-w-sm relative z-10">
        <div className="text-center mb-8">
          <Link href={localeHref(locale, '/')} className="inline-flex items-center gap-2">
            <Logo size={28} variant="dark" />
            <span className="text-[16px] font-semibold text-brand-navy tracking-[-0.02em]">Applyd</span>
          </Link>
        </div>

        {/* Referral banner */}
        {refCode && (
          <div
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg mb-4 text-[13px] text-accent-blue"
            style={{ background: 'rgba(37,99,235,0.08)', border: '1px solid rgba(37,99,235,0.2)' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg>
            <span>{copy.referralBannerText}</span>
          </div>
        )}

        <div className="bg-card-bg rounded-lg p-6 border border-border-gray">
          <h1 className="text-[15px] font-semibold mb-1 text-brand-navy tracking-[-0.01em]">{copy.title}</h1>
          <p className="text-[13px] mb-6 text-muted-text">{copy.subtitle}</p>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {error && (
              <div className="text-[13px] px-3 py-2 rounded-md border bg-error-bg text-error-text border-error-border">
                {error}
              </div>
            )}
            <div>
              <label htmlFor="email" className="block text-[13px] font-medium mb-1 text-brand-navy">{copy.emailLabel}</label>
              <input
                id="email"
                type="email"
                required
                autoFocus
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full h-9 px-3 bg-background border border-border-gray rounded-md text-sm focus:outline-none focus:border-accent-blue focus:ring-2 focus:ring-accent-blue/20 placeholder:text-text-tertiary transition-colors"
                placeholder={copy.emailPlaceholder}
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-[13px] font-medium mb-1 text-brand-navy">{copy.passwordLabel}</label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full h-9 px-3 pr-10 bg-background border border-border-gray rounded-md text-sm focus:outline-none focus:border-accent-blue focus:ring-2 focus:ring-accent-blue/20 placeholder:text-text-tertiary transition-colors"
                  placeholder={copy.passwordPlaceholder}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors text-text-tertiary"
                  aria-label={showPassword ? copy.hidePasswordAriaLabel : copy.showPasswordAriaLabel}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
            <div>
              <label htmlFor="confirm-password" className="block text-[13px] font-medium mb-1 text-brand-navy">{copy.confirmPasswordLabel}</label>
              <input
                id="confirm-password"
                type={showPassword ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                className="w-full h-9 px-3 bg-background border border-border-gray rounded-md text-sm focus:outline-none focus:border-accent-blue focus:ring-2 focus:ring-accent-blue/20 placeholder:text-text-tertiary transition-colors"
                placeholder={copy.confirmPasswordPlaceholder}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full h-9 text-[14px] font-medium text-white rounded-md transition-colors disabled:opacity-50 bg-accent-blue"
            >
              {loading ? copy.submitLoadingLabel : copy.submitLabel}
            </button>
          </form>

          <p className="text-center text-[12px] mt-3 leading-relaxed text-text-tertiary">
            {copy.consentPrefix}
            <Link href={localeHref(locale, '/terms')} className="underline underline-offset-2 hover:opacity-80 transition-opacity text-muted-text">{copy.termsLinkText}</Link>
            {copy.consentAnd}
            <Link href={localeHref(locale, '/privacy')} className="underline underline-offset-2 hover:opacity-80 transition-opacity text-muted-text">{copy.privacyLinkText}</Link>
            {copy.consentSuffix}
          </p>

          <p className="text-center text-[13px] mt-3 text-muted-text">
            {copy.alreadyHaveAccountText}
            <Link href={localeHref(locale, '/login')} className="hover:underline text-accent-blue">{copy.loginLinkText}</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export function SignupView({ locale }: { locale: Locale }) {
  return (
    <Suspense>
      <SignUpForm locale={locale} />
    </Suspense>
  );
}
