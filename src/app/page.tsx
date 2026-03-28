'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { TrendingUp, Zap, MessageSquare, Clock } from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';
import ProductWalkthrough from '@/components/ProductWalkthrough';
import { Logo } from '@/components/Logo';

export default function Home() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      if (user.onboarding_complete) {
        router.push('/dashboard');
      } else {
        router.push('/onboarding');
      }
    }
  }, [user, router]);

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-6 max-w-[1200px] mx-auto h-[52px] border-b border-border-gray">
        <div className="flex items-center gap-2">
          <Logo size={28} variant="dark" />
          <span className="text-[16px] font-semibold" style={{ color: 'var(--brand-navy)', letterSpacing: '-0.02em' }}>Applyd</span>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Link
            href="/login"
            className="h-8 px-3 text-[13px] font-medium rounded-md transition-colors flex items-center"
            style={{ color: 'var(--muted-text)' }}
          >
            Log in
          </Link>
          <Link
            href="/signup"
            className="h-8 px-3 text-[13px] font-medium text-white rounded-md transition-colors flex items-center"
            style={{ background: 'var(--accent-blue)' }}
          >
            Sign up free
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <main className="max-w-[1200px] mx-auto px-6 pt-16 pb-20">
        <div className="text-center max-w-2xl mx-auto">
          <h1 className="text-[40px] md:text-[48px] font-semibold leading-[1.1]" style={{ color: 'var(--brand-navy)', letterSpacing: '-0.03em' }}>
            Track every application.
            <br />
            <span style={{ color: 'var(--accent-blue)' }}>Never miss a deadline.</span>
          </h1>
          <p className="mt-4 text-[16px] leading-relaxed" style={{ color: 'var(--muted-text)' }}>
            The simplest way for students to manage internship and job applications
            — all in one place, with zero setup required.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3">
            <Link
              href="/signup"
              className="h-10 px-5 text-[14px] font-medium text-white rounded-md transition-colors flex items-center"
              style={{ background: 'var(--accent-blue)' }}
            >
              Get started — it&apos;s free
            </Link>
            <Link
              href="/login"
              className="h-10 px-5 text-[14px] font-medium rounded-md border transition-colors flex items-center"
              style={{ borderColor: 'var(--border-gray)', color: 'var(--muted-text)' }}
            >
              Log in
            </Link>
          </div>
          <p className="mt-4 text-[12px]" style={{ color: 'var(--text-tertiary)' }}>
            Free forever · No credit card · 2-minute setup
          </p>
        </div>

        {/* Dashboard Preview */}
        <div className="mt-16 rounded-lg border border-border-gray overflow-hidden">
          <div className="bg-card-bg p-4 md:p-6">
            {/* Stats bar — matches real StatsBar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              {[
                { label: 'Total', value: '24', subtext: '+6 this week', icon: <TrendingUp size={14} />, accent: null },
                { label: 'Response Rate', value: '38%', subtext: 'of applications replied', icon: <Zap size={14} />, accent: null },
                { label: 'Interviews', value: '5', subtext: "You're on a roll", icon: <MessageSquare size={14} />, accent: 'green' as const },
                { label: 'Act Now', value: '3', subtext: 'deadlines this week', icon: <Clock size={14} />, accent: 'amber' as const },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-lg p-3 md:p-4 bg-background border border-border-gray"
                  style={stat.accent === 'green'
                    ? { borderLeft: '3px solid #16A34A' }
                    : stat.accent === 'amber'
                    ? { borderLeft: '3px solid #D97706' }
                    : undefined}
                >
                  <div className="flex items-center gap-1.5 mb-2">
                    <span style={{ color: 'var(--text-tertiary)' }}>{stat.icon}</span>
                    <span className="text-[11px] font-semibold uppercase tracking-[0.05em]" style={{ color: 'var(--muted-text)' }}>{stat.label}</span>
                  </div>
                  <div
                    className="text-[24px] font-semibold leading-none mb-1"
                    style={{
                      color: stat.accent === 'green' ? 'var(--green-success)' : stat.accent === 'amber' ? 'var(--amber-warning)' : 'var(--brand-navy)',
                      letterSpacing: '-0.02em',
                    }}
                  >{stat.value}</div>
                  <p className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>{stat.subtext}</p>
                </div>
              ))}
            </div>
            {/* Pipeline columns — matches real PipelineView */}
            <div className="flex gap-3 overflow-x-auto pb-1">
              {[
                { name: 'Wishlist', count: 6, color: '#8B5CF6', cards: [{ company: 'Google', role: 'SWE Intern' }, { company: 'Meta', role: 'PM Intern' }] },
                { name: 'Applied', count: 10, color: '#2563EB', cards: [{ company: 'Stripe', role: 'SWE Intern' }, { company: 'Airbnb', role: 'Design Intern' }] },
                { name: 'OA / Online Assessment', count: 4, color: '#06B6D4', cards: [{ company: 'Amazon', role: 'SDE Intern' }] },
                { name: 'Phone / Recruiter Screen', count: 3, color: '#F59E0B', cards: [{ company: 'Microsoft', role: 'SWE Intern' }] },
                { name: 'Offer', count: 1, color: '#1D9E75', cards: [{ company: 'Figma', role: 'Design Intern' }] },
              ].map((col) => (
                <div key={col.name} className="min-w-[176px] w-[176px] flex-shrink-0">
                  <div className="flex items-center gap-2 mb-2 px-1">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: col.color }} />
                    <span className="text-[11px] font-semibold uppercase tracking-[0.08em] truncate" style={{ color: 'var(--muted-text)' }}>{col.name}</span>
                    <span className="ml-auto text-[10px] font-medium px-1.5 py-0.5 rounded border flex-shrink-0" style={{ background: 'var(--surface-gray)', color: 'var(--text-tertiary)', borderColor: 'var(--border-gray)' }}>{col.count}</span>
                  </div>
                  <div className="space-y-1.5 rounded-lg p-1.5 border border-border-gray" style={{ background: 'var(--card-bg)', minHeight: 80 }}>
                    {col.cards.map((card) => (
                      <div key={card.company} className="bg-background border border-border-gray rounded-lg p-2.5">
                        <div className="text-[13px] font-semibold truncate" style={{ color: 'var(--brand-navy)' }}>{card.company}</div>
                        <div className="text-[12px] truncate mt-0.5" style={{ color: 'var(--muted-text)' }}>{card.role}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Product Walkthrough */}
        <div className="-mx-6">
          <ProductWalkthrough />
        </div>

        {/* Benefits Row */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-3xl mx-auto">
          {[
            {
              icon: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="16" />
                  <line x1="8" y1="12" x2="16" y2="12" />
                </svg>
              ),
              title: 'Add applications fast',
              desc: 'Paste a job URL and Applyd autofills the company, role, and location for you. Or add manually in seconds.',
            },
            {
              icon: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="7" height="7" />
                  <rect x="14" y="3" width="7" height="7" />
                  <rect x="14" y="14" width="7" height="7" />
                  <rect x="3" y="14" width="7" height="7" />
                </svg>
              ),
              title: 'Visualize your pipeline',
              desc: 'See every application\'s status at a glance with a clean kanban board.',
            },
            {
              icon: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              ),
              title: 'Never miss a deadline',
              desc: 'Upcoming deadlines are highlighted so nothing slips through the cracks.',
            },
          ].map((benefit) => (
            <div key={benefit.title} className="text-center">
              <div
                className="w-10 h-10 rounded-md border border-border-gray mx-auto flex items-center justify-center mb-3"
                style={{ background: 'var(--surface-gray)', color: 'var(--muted-text)' }}
              >
                {benefit.icon}
              </div>
              <h3 className="text-[13px] font-semibold mb-1" style={{ color: 'var(--brand-navy)' }}>{benefit.title}</h3>
              <p className="text-[12px] leading-relaxed" style={{ color: 'var(--muted-text)' }}>{benefit.desc}</p>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border-gray py-8">
        <div className="max-w-[1200px] mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2" style={{ opacity: 0.4 }}>
            <Logo size={20} variant="dark" />
            <span className="text-[13px] font-semibold" style={{ color: 'var(--brand-navy)', letterSpacing: '-0.02em' }}>Applyd</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/help" className="text-[12px] font-medium transition-colors" style={{ color: 'var(--muted-text)' }}>Help & FAQ</Link>
            <Link href="/contact" className="text-[12px] font-medium transition-colors" style={{ color: 'var(--muted-text)' }}>Contact</Link>
            <Link href="/privacy" className="text-[12px] font-medium transition-colors" style={{ color: 'var(--muted-text)' }}>Privacy</Link>
            <span className="text-[12px]" style={{ color: 'var(--text-tertiary)' }}>© {new Date().getFullYear()} Applyd</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
