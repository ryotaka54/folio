'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SignUpPage() {
  const { signUp } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [progressText, setProgressText] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    setProgressText('Contacting database...');

    try {
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Connection timed out. Check your Vercel Env Variables.')), 20000)
      );

      setProgressText('Creating user...');
      await Promise.race([
        signUp(email, password),
        timeoutPromise
      ]);

      setProgressText('Loading onboarding...');
      setLoading(false);
      router.push('/onboarding');
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
      setLoading(false);
      setProgressText('');
    }
  };

  return (
    <div className="min-h-screen bg-surface-gray flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-accent-blue flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
            </div>
            <span className="text-xl font-semibold text-brand-navy">Folio</span>
          </Link>
        </div>

        <div className="bg-card-bg rounded-2xl p-6 shadow-sm border border-border-gray">
          <h1 className="text-lg font-semibold text-brand-navy mb-1">Create your account</h1>
          <p className="text-sm text-muted-text mb-6">Start tracking your applications in seconds.</p>

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
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-border-gray rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent-blue/30 focus:border-accent-blue transition-colors"
                placeholder="you@university.edu"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-body-text mb-1">Password</label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-border-gray rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent-blue/30 focus:border-accent-blue transition-colors"
                placeholder="At least 6 characters"
              />
            </div>
            <div>
              <label htmlFor="confirm-password" className="block text-sm font-medium text-body-text mb-1">Confirm password</label>
              <input
                id="confirm-password"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 border border-border-gray rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent-blue/30 focus:border-accent-blue transition-colors"
                placeholder="Confirm your password"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-accent-blue text-white text-sm font-medium rounded-lg hover:bg-accent-blue/90 transition-colors disabled:opacity-50"
            >
              {loading ? (progressText || 'Creating account...') : 'Create account'}
            </button>
          </form>

          <p className="text-center text-sm text-muted-text mt-4">
            Already have an account?{' '}
            <Link href="/login" className="text-accent-blue hover:underline">Log in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
