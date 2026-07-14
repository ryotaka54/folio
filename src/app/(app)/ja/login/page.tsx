'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff } from 'lucide-react';
import { Logo } from '@/components/Logo';

export default function JaLoginPage() {
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
      router.replace(user.onboarding_complete ? '/ja/dashboard' : '/ja/onboarding');
    }
  }, [loginFired, user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('接続がタイムアウトしました。もう一度お試しください。')), 8000)
      );
      const form = e.currentTarget as HTMLFormElement;
      const formData = new FormData(form);
      const submitEmail = (formData.get('email') as string) || email;
      const submitPassword = (formData.get('password') as string) || password;
      await Promise.race([signIn(submitEmail, submitPassword), timeoutPromise]);
      setLoginFired(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'メールアドレスまたはパスワードが正しくありません');
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden"
      style={{ fontFamily: "'Noto Sans JP', sans-serif" }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full opacity-20 dark:opacity-10 -z-0"
        style={{ background: 'radial-gradient(ellipse at center, var(--accent-blue) 0%, transparent 70%)' }}
      />
      <div className="w-full max-w-sm relative z-10">
        <div className="text-center mb-8">
          <Link href="/ja" className="inline-flex items-center gap-2">
            <Logo size={28} variant="dark" />
            <span className="text-[16px] font-semibold" style={{ color: 'var(--brand-navy)', letterSpacing: '-0.02em' }}>Applyd</span>
          </Link>
        </div>

        <div className="bg-card-bg rounded-lg p-6 border border-border-gray">
          <h1 className="text-[15px] font-semibold mb-1" style={{ color: 'var(--brand-navy)' }}>
            おかえりなさい
          </h1>
          <p className="text-[13px] mb-6" style={{ color: 'var(--muted-text)' }}>
            ログインして就活管理を続けましょう。
          </p>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {error && (
              <div className="text-[13px] px-3 py-2 rounded-md border bg-error-bg text-error-text border-error-border">
                {error}
              </div>
            )}
            <div>
              <label htmlFor="email" className="block text-[13px] font-medium mb-1" style={{ color: 'var(--brand-navy)' }}>
                メールアドレス
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-9 px-3 bg-background border border-border-gray rounded-md text-sm focus:outline-none focus:border-accent-blue focus:ring-2 focus:ring-accent-blue/20 placeholder:text-text-tertiary transition-colors"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="password" className="block text-[13px] font-medium" style={{ color: 'var(--brand-navy)' }}>
                  パスワード
                </label>
                <Link href="/forgot-password" className="text-[12px] transition-colors" style={{ color: 'var(--accent-blue)' }}>
                  パスワードを忘れた方
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
                  placeholder="パスワードを入力"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: 'var(--text-tertiary)' }}
                  aria-label={showPassword ? 'パスワードを非表示' : 'パスワードを表示'}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full h-9 text-[14px] font-medium text-white rounded-md transition-colors disabled:opacity-50"
              style={{ background: 'var(--accent-blue)' }}
            >
              {loading ? 'ログイン中…' : 'ログイン'}
            </button>
          </form>

          <p className="text-center text-[13px] mt-4" style={{ color: 'var(--muted-text)' }}>
            アカウントをお持ちでない方は{' '}
            <Link href="/ja/signup" className="hover:underline" style={{ color: 'var(--accent-blue)' }}>
              新規登録
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
