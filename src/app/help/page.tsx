'use client';

import Link from 'next/link';
import ThemeToggle from '@/components/ThemeToggle';
import { Logo } from '@/components/Logo';

const FAQS = [
  {
    q: "What is Applyd?",
    a: "Applyd is a job tracker built for students. Add applications in seconds, move them through your pipeline as things progress, and never lose track of a deadline.",
  },
  {
    q: "How do I track a new application?",
    a: "Click \"Add Application\" on your dashboard. Paste a job link and click Autofill to pull in the company, role, and location automatically — or fill it in manually. Takes about 15 seconds.",
  },
  {
    q: "What are the pipeline stages?",
    a: "Internship mode: Wishlist → Applied → OA / Online Assessment → Phone / Recruiter Screen → Final Round Interviews → Offer → Rejected. Job mode: Wishlist → Applied → Recruiter Screen → Technical / Case Interview → Final Round → Offer. You pick your mode during onboarding and can change it anytime from the command palette (⌘K).",
  },
  {
    q: "Is my data private?",
    a: "Yes. Your applications are stored with row-level security on Supabase — only your account can read them. We don't sell your data and we don't share it with anyone.",
  },
  {
    q: "How do I edit or delete an application?",
    a: "Click any card in the pipeline to open its detail panel. You can update every field there, including notes and recruiter info. Scroll to the bottom of the panel to delete it.",
  },
  {
    q: "Is Applyd free?",
    a: "Yes, completely free. No trial, no credit card, no paywall. Built for students.",
  },
];

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border-gray bg-background sticky top-0 z-30 pt-[env(safe-area-inset-top)]">
        <div className="max-w-[800px] mx-auto px-4 md:px-6 flex items-center h-[52px] gap-2">
          <Link href="/" className="flex items-center gap-2">
            <Logo size={22} variant="dark" />
            <span className="text-[15px] font-semibold" style={{ color: 'var(--brand-navy)', letterSpacing: '-0.02em' }}>Applyd</span>
          </Link>
          <span className="text-[13px]" style={{ color: 'var(--border-gray)' }}>/</span>
          <span className="text-[13px] font-medium" style={{ color: 'var(--muted-text)' }}>Help & FAQ</span>
          <div className="ml-auto">
            <ThemeToggle />
          </div>
        </div>
      </nav>

      <main className="max-w-[800px] mx-auto px-4 md:px-6 py-12">
        <div className="mb-10">
          <h1 className="text-[22px] font-semibold mb-1" style={{ color: 'var(--brand-navy)', letterSpacing: '-0.02em' }}>Help Center</h1>
          <p className="text-[14px]" style={{ color: 'var(--muted-text)' }}>Everything you need to know about Applyd.</p>
        </div>

        <div className="space-y-3">
          {FAQS.map((faq, i) => (
            <div key={i} className="bg-card-bg border border-border-gray rounded-lg p-5">
              <h3 className="text-[14px] font-semibold mb-2" style={{ color: 'var(--brand-navy)' }}>{faq.q}</h3>
              <p className="text-[13px] leading-relaxed" style={{ color: 'var(--muted-text)' }}>{faq.a}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 p-6 rounded-lg border border-border-gray text-center" style={{ background: 'var(--card-bg)' }}>
          <h2 className="text-[15px] font-semibold mb-1" style={{ color: 'var(--brand-navy)' }}>Still have questions?</h2>
          <p className="text-[13px] mb-4" style={{ color: 'var(--muted-text)' }}>We read every email.</p>
          <Link
            href="/contact"
            className="inline-flex items-center h-9 px-4 text-[13px] font-medium text-white rounded-md transition-colors"
            style={{ background: 'var(--accent-blue)' }}
          >
            Contact us
          </Link>
        </div>
      </main>
    </div>
  );
}
