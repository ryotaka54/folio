'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const { signIn, user } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [progressText, setProgressText] = useState('');
  const [loginFired, setLoginFired] = useState(false);

  // Only navigate once the auth context has ACTUALLY loaded the user profile
  useEffect(() => {
    if (loginFired && user) {
      router.replace(user.onboarding_complete ? '/dashboard' : '/onboarding');
    }
  }, [loginFired, user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setProgressText('Contacting database...');

    try {
      // 20s timeout
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Connection timed out. Check that your Supabase environment variables are set correctly.')), 20000)
      );

      const form = e.currentTarget as HTMLFormElement;
      const formData = new FormData(form);
      const submitEmail = (formData.get('email') as string) || email;
      const submitPassword = (formData.get('password') as string) || password;

      setProgressText('Authenticating user...');
      await Promise.race([
        signIn(submitEmail, submitPassword),
        timeoutPromise
      ]);

      // Mark that we've fired the login — the useEffect above will handle
      // navigation once the onAuthStateChange listener finishes loading the user profile
      setProgressText('Loading dashboard...');
      setLoginFired(true);
    } catch (err: any) {
      setError(err.message || 'Invalid email or password');
      setLoading(false);
      setProgressText('');
    }
  };

  return (
    <div className="min-h-screen bg-surface-gray flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <svg width="24" height="24" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="4" y="10" width="40" height="5" rx="2.5" fill="#4361EE"/>
              <rect x="4" y="22" width="28" height="5" rx="2.5" fill="#4361EE" opacity="0.6"/>
              <rect x="4" y="34" width="16" height="5" rx="2.5" fill="#4361EE" opacity="0.3"/>
            </svg>
            <span className="text-xl font-semibold text-brand-navy">Applyd</span>
          </Link>
        </div>

        <div className="bg-card-bg rounded-2xl p-6 shadow-sm border border-border-gray">
          <h1 className="text-lg font-semibold text-brand-navy mb-1">Welcome back</h1>
          <p className="text-sm text-muted-text mb-6">Log in to continue tracking your applications.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 text-red-600 text-sm px-3 py-2 rounded-lg border border-red-100">
                {error}
              </div>
            )}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-body-text mb-1">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2.5 sm:py-2 border border-border-gray rounded-lg text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-accent-blue/30 focus:border-accent-blue transition-colors bg-background"
                placeholder="you@university.edu"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-body-text mb-1">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2.5 sm:py-2 border border-border-gray rounded-lg text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-accent-blue/30 focus:border-accent-blue transition-colors bg-background"
                placeholder="Your password"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-accent-blue text-white text-sm font-medium rounded-lg hover:bg-accent-blue/90 transition-colors disabled:opacity-50"
            >
              {loading ? (progressText || 'Logging in...') : 'Log in'}
            </button>
          </form>

          <p className="text-center text-sm text-muted-text mt-4">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="text-accent-blue hover:underline">Sign up</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
