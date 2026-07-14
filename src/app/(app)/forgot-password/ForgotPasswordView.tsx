'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { Logo } from '@/components/Logo';
import { localeHref, type Locale } from '@/lib/locale';
import { en, ja } from '@/content/forgot-password';

export default function ForgotPasswordView({ locale }: { locale: Locale }) {
  const copy = locale === 'ja' ? ja : en;
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}${localeHref(locale, '/reset-password')}`,
    });
    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setSent(true);
    }
  };

  return (
    <div className="min-h-screen bg-surface-gray flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href={localeHref(locale, '/')} className="inline-flex items-center gap-2">
            <Logo size={24} variant="dark" />
            <span className="text-[16px] font-semibold text-brand-navy tracking-[-0.02em]">Applyd</span>
          </Link>
        </div>

        <div className="rounded-lg p-6 border border-border-gray bg-card-bg">
          {sent ? (
            <div className="text-center py-4">
              <div className="w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-4 bg-success-bg border border-success-border">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-success-text">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
              <h1 className="text-[15px] font-semibold mb-1 text-brand-navy">{copy.successTitle}</h1>
              <p className="text-[13px] mb-6 text-muted-text">
                {copy.successMessagePrefix}<span className="font-medium text-body-text">{email}</span>{copy.successMessageSuffix}
              </p>
              <Link href={localeHref(locale, '/login')} className="text-[13px] text-accent-blue">{copy.backToLoginText}</Link>
            </div>
          ) : (
            <>
              <h1 className="text-[15px] font-semibold mb-1 text-brand-navy tracking-[-0.01em]">{copy.title}</h1>
              <p className="text-[13px] mb-5 text-muted-text">{copy.subtitle}</p>

              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="px-3 py-2 rounded-md text-[13px] bg-error-bg text-error-text border border-error-border">
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
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full h-9 px-3 bg-background border border-border-gray rounded-md text-[13px] focus:outline-none focus:border-accent-blue focus:ring-2 focus:ring-accent-blue/20 placeholder:text-text-tertiary transition-colors"
                    placeholder={copy.emailPlaceholder}
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-9 text-[13px] font-medium text-white rounded-md bg-accent-blue hover:bg-accent-blue-hover transition-colors disabled:opacity-50"
                >
                  {loading ? copy.submitLoadingLabel : copy.submitLabel}
                </button>
              </form>

              <p className="text-center text-[13px] mt-4 text-muted-text">
                <Link href={localeHref(locale, '/login')} className="transition-colors text-accent-blue">{copy.backToLoginText}</Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
