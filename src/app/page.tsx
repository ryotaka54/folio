'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { ClipboardList, BarChart2, Target, Clock } from 'lucide-react';

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
      <nav className="flex items-center justify-between px-6 py-4 max-w-[1200px] mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-accent-blue flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
          </div>
          <span className="text-xl font-semibold text-brand-navy tracking-tight">Folio</span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="px-4 py-2 text-sm font-medium text-body-text hover:text-brand-navy transition-colors rounded-lg"
          >
            Log in
          </Link>
          <Link
            href="/signup"
            className="px-4 py-2 text-sm font-medium text-white bg-accent-blue hover:bg-accent-blue/90 transition-colors rounded-lg"
          >
            Sign up
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <main className="max-w-[1200px] mx-auto px-6 pt-16 pb-20">
        <div className="text-center max-w-2xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-semibold text-brand-navy leading-tight tracking-tight">
            Track every application.
            <br />
            <span className="text-accent-blue">Never miss a deadline.</span>
          </h1>
          <p className="mt-4 text-lg text-muted-text leading-relaxed">
            The simplest way for students to manage internship and job applications
            — all in one place, with zero setup required.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3">
            <Link
              href="/signup"
              className="px-6 py-3 text-base font-medium text-white bg-accent-blue hover:bg-accent-blue/90 transition-colors rounded-lg shadow-sm"
            >
              Get started — it&apos;s free
            </Link>
            <Link
              href="/login"
              className="px-6 py-3 text-base font-medium text-body-text bg-surface-gray hover:bg-border-gray transition-colors rounded-lg"
            >
              Log in
            </Link>
          </div>
        </div>

        {/* Dashboard Preview */}
        <div className="mt-16 rounded-2xl border border-border-gray shadow-lg overflow-hidden bg-background p-1">
          <div className="bg-card-bg rounded-xl p-4 md:p-6">
            {/* Fake stats bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              {[
                { label: 'Total Applications', value: '24', icon: <ClipboardList size={16} className="text-accent-blue" /> },
                { label: 'Response Rate', value: '38%', icon: <BarChart2 size={16} className="text-brand-navy" /> },
                { label: 'Interviews', value: '5', icon: <Target size={16} className="text-amber-warning" /> },
                { label: 'Deadlines Soon', value: '3', icon: <Clock size={16} className="text-red-500" /> },
              ].map((stat) => (
                <div key={stat.label} className="bg-surface-gray rounded-xl p-3 md:p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="flex-shrink-0">{stat.icon}</span>
                    <span className="text-xs text-muted-text font-medium">{stat.label}</span>
                  </div>
                  <span className="text-xl md:text-2xl font-semibold text-brand-navy">{stat.value}</span>
                </div>
              ))}
            </div>
            {/* Fake pipeline columns */}
            <div className="flex gap-3 overflow-x-auto pb-2">
              {[
                { name: 'Wishlist', count: 6, color: '#8B5CF6', cards: ['Google — SWE Intern', 'Meta — PM Intern'] },
                { name: 'Applied', count: 10, color: '#4361EE', cards: ['Stripe — SWE Intern', 'Airbnb — Design'] },
                { name: 'OA / Assessment', count: 4, color: '#06B6D4', cards: ['Amazon — SDE Intern'] },
                { name: 'Interviews', count: 3, color: '#F59E0B', cards: ['Microsoft — SWE'] },
                { name: 'Offer', count: 1, color: '#1D9E75', cards: ['Figma — Design Intern'] },
              ].map((col) => (
                <div key={col.name} className="min-w-[180px] md:min-w-[200px] flex-1">
                  <div className="flex items-center gap-2 mb-2 px-1">
                    <div className="w-2 h-2 rounded-full" style={{ background: col.color }} />
                    <span className="text-xs font-medium text-muted-text">{col.name}</span>
                    <span className="text-xs text-muted-text/60 ml-auto">{col.count}</span>
                  </div>
                  <div className="space-y-2">
                    {col.cards.map((card) => (
                      <div key={card} className="bg-card-bg border border-border-gray rounded-lg p-3 shadow-sm">
                        <div className="text-xs font-medium text-brand-navy">{card.split(' — ')[0]}</div>
                        <div className="text-[11px] text-muted-text mt-0.5">{card.split(' — ')[1]}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
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
              desc: 'Log a new application in under 30 seconds. Just company, role, and go.',
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
              <div className="w-12 h-12 rounded-xl bg-light-accent text-accent-blue mx-auto flex items-center justify-center mb-3">
                {benefit.icon}
              </div>
              <h3 className="text-sm font-medium text-brand-navy mb-1">{benefit.title}</h3>
              <p className="text-xs text-muted-text leading-relaxed">{benefit.desc}</p>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border-gray py-6 text-center">
        <p className="text-xs text-muted-text">© 2025 Folio. Built for students, by students.</p>
      </footer>
    </div>
  );
}
