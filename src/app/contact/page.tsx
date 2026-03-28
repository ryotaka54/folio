'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Logo } from '@/components/Logo';

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border-gray bg-background sticky top-0 z-30 pt-[env(safe-area-inset-top)]">
        <div className="max-w-[800px] mx-auto px-4 md:px-6 flex items-center h-[52px] gap-2">
          <Link href="/" className="flex items-center gap-2">
            <Logo size={22} variant="dark" />
            <span className="text-[15px] font-semibold" style={{ color: 'var(--brand-navy)', letterSpacing: '-0.02em' }}>Applyd</span>
          </Link>
          <span className="text-[13px]" style={{ color: 'var(--border-gray)' }}>/</span>
          <span className="text-[13px] font-medium" style={{ color: 'var(--muted-text)' }}>Contact</span>
          <Link href="/" className="ml-auto flex items-center gap-1.5 text-[13px] transition-colors" style={{ color: 'var(--muted-text)' }}>
            <ArrowLeft size={14} />
            Back
          </Link>
        </div>
      </nav>

      <main className="max-w-[480px] mx-auto px-4 md:px-6 py-16">
        <h1 className="text-[22px] font-semibold mb-1" style={{ color: 'var(--brand-navy)', letterSpacing: '-0.02em' }}>Contact us</h1>
        <p className="text-[14px] mb-8" style={{ color: 'var(--muted-text)' }}>Have feedback or a question? We'd love to hear from you.</p>

        <div className="bg-card-bg border border-border-gray rounded-lg p-6">
          <p className="text-[12px] font-semibold uppercase tracking-[0.06em] mb-2" style={{ color: 'var(--text-tertiary)' }}>Email us at</p>
          <a
            href="mailto:hello@useapplyd.com"
            className="text-[18px] font-semibold transition-colors"
            style={{ color: 'var(--accent-blue)' }}
          >
            hello@useapplyd.com
          </a>
        </div>

        <p className="text-[13px] mt-6 text-center">
          <Link href="/help" className="transition-colors" style={{ color: 'var(--accent-blue)' }}>
            Visit the Help Center →
          </Link>
        </p>
      </main>
    </div>
  );
}
