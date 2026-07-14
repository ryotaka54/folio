'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { localeHref, type Locale } from '@/lib/locale';
import { en, ja } from '@/content/reset-password';

export default function ResetPasswordView({ locale }: { locale: Locale }) {
  const copy = locale === 'ja' ? ja : en;
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError(copy.passwordMismatchError);
      return;
    }
    if (password.length < 6) {
      setError(copy.passwordTooShortError);
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push(localeHref(locale, '/dashboard'));
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
          <h1 className="text-[15px] font-semibold mb-1 text-brand-navy tracking-[-0.01em]">{copy.title}</h1>
          <p className="text-[13px] mb-5 text-muted-text">{copy.subtitle}</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="px-3 py-2 rounded-md text-[13px] bg-error-bg text-error-text border border-error-border">
                {error}
              </div>
            )}
            <div>
              <label htmlFor="password" className="block text-[13px] font-medium mb-1 text-brand-navy">{copy.passwordLabel}</label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoFocus
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-9 px-3 pr-10 bg-background border border-border-gray rounded-md text-[13px] focus:outline-none focus:border-accent-blue focus:ring-2 focus:ring-accent-blue/20 placeholder:text-text-tertiary transition-colors"
                  placeholder={copy.passwordPlaceholder}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors text-muted-text"
                  aria-label={showPassword ? copy.hidePasswordAriaLabel : copy.showPasswordAriaLabel}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
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
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full h-9 px-3 bg-background border border-border-gray rounded-md text-[13px] focus:outline-none focus:border-accent-blue focus:ring-2 focus:ring-accent-blue/20 placeholder:text-text-tertiary transition-colors"
                placeholder={copy.confirmPasswordPlaceholder}
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
        </div>
      </div>
    </div>
  );
}
