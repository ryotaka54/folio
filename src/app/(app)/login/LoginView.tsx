'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { localeHref, type Locale } from '@/lib/locale';
import { en, ja } from '@/content/login';

export default function LoginView({ locale }: { locale: Locale }) {
  const copy = locale === 'ja' ? ja : en;
  const { signIn, user } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [loginFired, setLoginFired] = useState(false);

  useEffect(() => {
    if (loginFired && user) {
      const destination = user.onboarding_complete ? '/dashboard' : '/onboarding';
      router.replace(localeHref(locale, destination));
    }
  }, [loginFired, user, router, locale]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error(copy.timeoutErrorMessage)), 8000)
      );

      const form = e.currentTarget as HTMLFormElement;
      const formData = new FormData(form);
      const submitEmail = (formData.get('email') as string) || email;
      const submitPassword = (formData.get('password') as string) || password;

      await Promise.race([
        signIn(submitEmail, submitPassword),
        timeoutPromise,
      ]);

      setLoginFired(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : copy.invalidCredentialsMessage);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Subtle glow — matches landing page */}
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
                name="email"
                type="email"
                required
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-9 px-3 bg-background border border-border-gray rounded-md text-sm focus:outline-none focus:border-accent-blue focus:ring-2 focus:ring-accent-blue/20 placeholder:text-text-tertiary transition-colors"
                placeholder={copy.emailPlaceholder}
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="password" className="block text-[13px] font-medium text-brand-navy">{copy.passwordLabel}</label>
                <Link href={localeHref(locale, '/forgot-password')} className="text-[12px] transition-colors text-accent-blue">
                  {copy.forgotPasswordText}
                </Link>
              </div>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-9 px-3 pr-10 bg-background border border-border-gray rounded-md text-sm focus:outline-none focus:border-accent-blue focus:ring-2 focus:ring-accent-blue/20 placeholder:text-text-tertiary transition-colors"
                  placeholder={copy.passwordPlaceholder}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors text-text-tertiary"
                  aria-label={showPassword ? copy.hidePasswordAriaLabel : copy.showPasswordAriaLabel}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full h-9 text-[14px] font-medium text-white rounded-md transition-colors disabled:opacity-50 bg-accent-blue"
            >
              {loading ? copy.submitLoadingLabel : copy.submitLabel}
            </button>
          </form>

          <p className="text-center text-[13px] mt-4 text-muted-text">
            {copy.noAccountText}{' '}
            <Link href={localeHref(locale, '/signup')} className="hover:underline text-accent-blue">{copy.signupLinkText}</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
