'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Logo } from '@/components/Logo';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-background">
      {/* Minimal nav */}
      <nav className="border-b border-border-gray bg-background">
        <div className="max-w-[1200px] mx-auto px-4 md:px-6 flex items-center h-[52px]">
          <Link href="/" className="flex items-center gap-2">
            <Logo size={24} variant="dark" />
            <span className="text-[15px] font-semibold" style={{ color: 'var(--brand-navy)', letterSpacing: '-0.02em' }}>Applyd</span>
          </Link>
        </div>
      </nav>

      <div className="flex items-center justify-center min-h-[calc(100vh-52px)] p-4">
        <div className="text-center max-w-sm">
          <div className="w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-5" style={{ background: 'var(--error-bg)', border: '1px solid var(--error-border)' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--error-text)' }}>
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          </div>
          <h1 className="text-[16px] font-semibold mb-2" style={{ color: 'var(--brand-navy)' }}>Something went wrong</h1>
          <p className="text-[13px] mb-6 leading-relaxed" style={{ color: 'var(--muted-text)' }}>
            An unexpected error occurred. Your data is safe — try refreshing the page.
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={reset}
              className="h-9 px-4 bg-accent-blue hover:bg-accent-blue-hover text-white text-[13px] font-medium rounded-md transition-colors"
            >
              Try again
            </button>
            <Link
              href="/dashboard"
              className="h-9 px-4 text-[13px] font-medium rounded-md border border-border-gray transition-colors flex items-center"
              style={{ background: 'var(--surface-gray)', color: 'var(--muted-text)' }}
            >
              Go to dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
