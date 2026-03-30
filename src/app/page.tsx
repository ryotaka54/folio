'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { TrendingUp, Zap, MessageSquare, Clock, ArrowRight, Menu, X } from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';
import ProductWalkthrough from '@/components/ProductWalkthrough';
import { Logo } from '@/components/Logo';
import { capture } from '@/lib/analytics';
import { AnimatedGroup } from '@/components/ui/animated-group';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

const transitionVariants = {
  item: {
    hidden: { opacity: 0, filter: 'blur(12px)', y: 12 },
    visible: {
      opacity: 1,
      filter: 'blur(0px)',
      y: 0,
      transition: { type: 'spring' as const, bounce: 0.3, duration: 1.5 },
    },
  },
};

// ── Nav ───────────────────────────────────────────────────────────────────────

const navLinks = [
  { label: 'Features', href: '#features' },
  { label: 'How it works', href: '#walkthrough' },
  { label: 'FAQ', href: '/help' },
];

function LandingNav() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header>
      <nav
        data-state={menuOpen ? 'active' : undefined}
        className="fixed z-20 w-full px-2 group"
      >
        <div
          className={cn(
            'mx-auto mt-2 max-w-6xl px-6 transition-all duration-300 lg:px-12',
            scrolled &&
              'bg-background/70 max-w-4xl rounded-2xl border border-border-gray backdrop-blur-lg lg:px-6',
          )}
        >
          <div className="relative flex flex-wrap items-center justify-between gap-6 py-3 lg:gap-0 lg:py-4">
            {/* Logo */}
            <div className="flex w-full justify-between lg:w-auto">
              <Link href="/" className="flex items-center gap-2">
                <Logo size={26} variant="dark" />
                <span
                  className="text-[15px] font-semibold"
                  style={{ color: 'var(--brand-navy)', letterSpacing: '-0.02em' }}
                >
                  Applyd
                </span>
              </Link>

              {/* Mobile hamburger */}
              <button
                onClick={() => setMenuOpen(v => !v)}
                aria-label={menuOpen ? 'Close menu' : 'Open menu'}
                className="relative z-20 -m-2.5 -mr-4 block cursor-pointer p-2.5 lg:hidden"
                style={{ color: 'var(--muted-text)' }}
              >
                {menuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>

            {/* Desktop centre links */}
            <div className="absolute inset-0 m-auto hidden size-fit lg:block">
              <ul className="flex gap-8 text-sm">
                {navLinks.map(item => (
                  <li key={item.label}>
                    <Link
                      href={item.href}
                      className="text-[13px] font-medium transition-colors"
                      style={{ color: 'var(--muted-text)' }}
                      onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = 'var(--brand-navy)')}
                      onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = 'var(--muted-text)')}
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Desktop right + mobile dropdown */}
            <div
              className={cn(
                'bg-background group-data-[state=active]:block lg:group-data-[state=active]:flex mb-6 hidden w-full flex-wrap items-center justify-end space-y-8 rounded-2xl border border-border-gray p-6 shadow-2xl md:flex-nowrap lg:m-0 lg:flex lg:w-fit lg:gap-3 lg:space-y-0 lg:border-transparent lg:bg-transparent lg:p-0 lg:shadow-none',
                scrolled && 'dark:bg-transparent',
              )}
            >
              {/* Mobile nav links */}
              <div className="lg:hidden w-full">
                <ul className="space-y-5 text-base">
                  {navLinks.map(item => (
                    <li key={item.label}>
                      <Link
                        href={item.href}
                        onClick={() => setMenuOpen(false)}
                        className="text-[14px] font-medium"
                        style={{ color: 'var(--muted-text)' }}
                      >
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex w-full flex-col gap-2 sm:flex-row sm:gap-2 md:w-fit">
                <ThemeToggle />
                <Button asChild variant="outline" size="sm">
                  <Link href="/login">Log in</Link>
                </Button>
                <Button asChild size="sm">
                  <Link href="/signup">Sign up free</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
}

// ── Home ──────────────────────────────────────────────────────────────────────

export default function Home() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.replace(user.onboarding_complete ? '/dashboard' : '/onboarding');
    }
  }, [user, router]);

  return (
    <div className="min-h-screen bg-background">
      <LandingNav />

      <main className="overflow-hidden">
        {/* ── Hero ── */}
        <section className="relative pt-32 pb-20 md:pt-44 md:pb-28">
          {/* Decorative glow blobs — desktop only */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10 hidden lg:block overflow-hidden"
          >
            <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[600px] rounded-full opacity-30 dark:opacity-20"
              style={{ background: 'radial-gradient(ellipse at center, var(--accent-blue) 0%, transparent 70%)' }}
            />
          </div>
          {/* Radial vignette */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10"
            style={{ background: 'radial-gradient(125% 125% at 50% 100%, transparent 0%, var(--background) 70%)' }}
          />

          <div className="mx-auto max-w-6xl px-6 text-center">
            <AnimatedGroup
              variants={{
                container: {
                  hidden: {},
                  visible: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
                },
                ...transitionVariants,
              }}
              className="flex flex-col items-center"
            >
              {/* Announcement pill */}
              <Link
                href="/help"
                className="group mb-8 flex w-fit items-center gap-3 rounded-full border border-border-gray px-4 py-1.5 shadow-sm transition-colors hover:bg-surface-gray"
                style={{ background: 'var(--card-bg)' }}
              >
                <span className="text-[12px] font-medium" style={{ color: 'var(--muted-text)' }}>
                  Free forever for students
                </span>
                <span className="h-3.5 w-px" style={{ background: 'var(--border-gray)' }} />
                <span className="flex size-5 items-center justify-center overflow-hidden rounded-full" style={{ background: 'var(--surface-gray)' }}>
                  <div className="flex w-10 -translate-x-1/2 transition-transform duration-300 ease-in-out group-hover:translate-x-0">
                    <ArrowRight className="size-3 flex-shrink-0" style={{ color: 'var(--muted-text)' }} />
                    <ArrowRight className="size-3 flex-shrink-0" style={{ color: 'var(--muted-text)' }} />
                  </div>
                </span>
              </Link>

              {/* Headline */}
              <h1
                className="max-w-3xl text-balance text-[2.75rem] font-semibold leading-[1.1] md:text-[3.5rem] lg:text-[4.25rem]"
                style={{ color: 'var(--brand-navy)', letterSpacing: '-0.03em' }}
              >
                Track every application.{' '}
                <span style={{ color: 'var(--accent-blue)' }}>Never miss a deadline.</span>
              </h1>

              {/* Sub */}
              <p className="mt-6 max-w-xl text-balance text-[17px] leading-relaxed" style={{ color: 'var(--muted-text)' }}>
                The simplest way for students to manage internship and job applications — all in one place, zero setup required.
              </p>

              {/* CTAs */}
              <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row">
                <div className="rounded-[14px] border border-border-gray p-0.5" style={{ background: 'var(--surface-gray)' }}>
                  <Button asChild size="lg" className="rounded-xl px-6">
                    <Link href="/signup">Get started — it&apos;s free</Link>
                  </Button>
                </div>
                <Button asChild size="lg" variant="ghost" className="rounded-xl px-6">
                  <Link href="/login">Log in</Link>
                </Button>
              </div>

              <p className="mt-4 text-[12px]" style={{ color: 'var(--text-tertiary)' }}>
                No credit card · 2-minute setup · Trusted by 500+ students
              </p>
            </AnimatedGroup>

            {/* Dashboard preview screenshot */}
            <AnimatedGroup
              variants={{
                container: {
                  hidden: {},
                  visible: { transition: { delayChildren: 0.6 } },
                },
                ...transitionVariants,
              }}
              className="mt-16"
            >
              <div className="relative -mr-6 overflow-hidden px-2 sm:mr-0">
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0 z-10"
                  style={{ background: 'linear-gradient(to bottom, transparent 40%, var(--background) 100%)' }}
                />
                <div
                  className="relative mx-auto max-w-5xl overflow-hidden rounded-2xl border p-3 shadow-xl"
                  style={{ background: 'var(--card-bg)', borderColor: 'var(--border-gray)' }}
                >
                  {/* Fake dashboard preview — reuses same card/pipeline structure */}
                  <div className="rounded-xl border" style={{ background: 'var(--background)', borderColor: 'var(--border-gray)', padding: '20px' }}>
                    {/* Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
                      {[
                        { label: 'Total', value: '24', sub: '+6 this week', icon: <TrendingUp size={13} />, accent: null },
                        { label: 'Response Rate', value: '38%', sub: 'of applications replied', icon: <Zap size={13} />, accent: null },
                        { label: 'Interviews', value: '5', sub: "You're on a roll", icon: <MessageSquare size={13} />, accent: 'green' as const },
                        { label: 'Act Now', value: '3', sub: 'deadlines this week', icon: <Clock size={13} />, accent: 'amber' as const },
                      ].map(stat => (
                        <div
                          key={stat.label}
                          className="rounded-lg p-3 border"
                          style={{
                            background: 'var(--card-bg)',
                            borderColor: 'var(--border-gray)',
                            borderLeft: stat.accent === 'green' ? '3px solid #16A34A' : stat.accent === 'amber' ? '3px solid #D97706' : undefined,
                          }}
                        >
                          <div className="flex items-center gap-1.5 mb-2">
                            <span style={{ color: 'var(--text-tertiary)' }}>{stat.icon}</span>
                            <span className="text-[10px] font-semibold uppercase tracking-[0.05em]" style={{ color: 'var(--muted-text)' }}>{stat.label}</span>
                          </div>
                          <div className="text-[22px] font-semibold leading-none mb-0.5"
                            style={{
                              color: stat.accent === 'green' ? 'var(--green-success)' : stat.accent === 'amber' ? 'var(--amber-warning)' : 'var(--brand-navy)',
                              letterSpacing: '-0.02em',
                            }}
                          >{stat.value}</div>
                          <p className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>{stat.sub}</p>
                        </div>
                      ))}
                    </div>
                    {/* Pipeline */}
                    <div className="flex gap-2.5 overflow-x-hidden">
                      {[
                        { name: 'Wishlist', count: 6, color: '#8B5CF6', cards: [{ co: 'Google', role: 'SWE Intern' }, { co: 'Meta', role: 'PM Intern' }] },
                        { name: 'Applied', count: 10, color: '#2563EB', cards: [{ co: 'Stripe', role: 'SWE Intern' }, { co: 'Airbnb', role: 'Design Intern' }] },
                        { name: 'OA', count: 4, color: '#06B6D4', cards: [{ co: 'Amazon', role: 'SDE Intern' }] },
                        { name: 'Interviews', count: 3, color: '#F59E0B', cards: [{ co: 'Microsoft', role: 'SWE Intern' }] },
                        { name: 'Offer', count: 1, color: '#1D9E75', cards: [{ co: 'Figma', role: 'Design Intern' }] },
                      ].map(col => (
                        <div key={col.name} className="min-w-[160px] w-[160px] flex-shrink-0">
                          <div className="flex items-center gap-1.5 mb-1.5 px-0.5">
                            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: col.color }} />
                            <span className="text-[10px] font-semibold uppercase tracking-[0.07em] truncate" style={{ color: 'var(--muted-text)' }}>{col.name}</span>
                            <span className="ml-auto text-[9px] font-medium px-1 py-0.5 rounded border" style={{ background: 'var(--surface-gray)', color: 'var(--text-tertiary)', borderColor: 'var(--border-gray)' }}>{col.count}</span>
                          </div>
                          <div className="space-y-1.5 rounded-lg p-1.5 border" style={{ background: 'var(--card-bg)', borderColor: 'var(--border-gray)', minHeight: 72 }}>
                            {col.cards.map(card => (
                              <div key={card.co} className="bg-background border rounded-lg p-2" style={{ borderColor: 'var(--border-gray)' }}>
                                <div className="text-[11px] font-semibold truncate" style={{ color: 'var(--brand-navy)' }}>{card.co}</div>
                                <div className="text-[10px] truncate mt-0.5" style={{ color: 'var(--muted-text)' }}>{card.role}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </AnimatedGroup>
          </div>
        </section>

        {/* ── Product Walkthrough ── */}
        <div id="walkthrough" className="-mx-0">
          <ProductWalkthrough />
        </div>

        {/* ── Benefits ── */}
        <section id="features" className="max-w-6xl mx-auto px-6 py-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-14"
          >
            <h2 className="text-[28px] md:text-[36px] font-semibold mb-3" style={{ color: 'var(--brand-navy)', letterSpacing: '-0.025em' }}>
              Everything you need. Nothing you don&apos;t.
            </h2>
            <p className="text-[15px] max-w-lg mx-auto" style={{ color: 'var(--muted-text)' }}>
              Built specifically for students navigating internship and job recruiting season.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              {
                icon: (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="16" /><line x1="8" y1="12" x2="16" y2="12" />
                  </svg>
                ),
                title: 'Add applications fast',
                desc: 'Paste a job URL and Applyd autofills the company, role, and location. Or add manually in seconds.',
              },
              {
                icon: (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
                  </svg>
                ),
                title: 'Visualize your pipeline',
                desc: "See every application's status at a glance with a clean kanban board. Drag to move stages.",
              },
              {
                icon: (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                  </svg>
                ),
                title: 'Never miss a deadline',
                desc: 'Upcoming deadlines are highlighted in amber and red so nothing slips through the cracks.',
              },
            ].map((benefit, i) => (
              <motion.div
                key={benefit.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="rounded-xl border p-6"
                style={{ background: 'var(--card-bg)', borderColor: 'var(--border-gray)' }}
              >
                <div
                  className="w-10 h-10 rounded-lg border flex items-center justify-center mb-4"
                  style={{ background: 'var(--surface-gray)', borderColor: 'var(--border-gray)', color: 'var(--accent-blue)' }}
                >
                  {benefit.icon}
                </div>
                <h3 className="text-[14px] font-semibold mb-2" style={{ color: 'var(--brand-navy)' }}>{benefit.title}</h3>
                <p className="text-[13px] leading-relaxed" style={{ color: 'var(--muted-text)' }}>{benefit.desc}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ── Buy Me a Coffee ── */}
        <section style={{ background: 'var(--bmac-bg)', borderTop: '1px solid var(--border-gray)', borderBottom: '1px solid var(--border-gray)' }}>
          <div className="max-w-[480px] mx-auto px-6 py-16 text-center">
            <div className="flex justify-center mb-5">
              <Logo size={36} variant="dark" />
            </div>
            <h2 className="text-[20px] font-semibold mb-3" style={{ color: 'var(--brand-navy)', letterSpacing: '-0.02em' }}>
              Applyd is free — and always will be for students.
            </h2>
            <p className="text-[14px] leading-relaxed mb-6" style={{ color: 'var(--muted-text)' }}>
              Building and maintaining Applyd takes time and care. If it&apos;s helped your recruiting season even a little, buying me a coffee means the world.
            </p>
            <a
              href="https://buymeacoffee.com/applyd"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => capture('support_click', { location: 'landing_page' })}
              className="inline-flex items-center gap-2 font-semibold transition-colors"
              style={{ background: '#FFDD00', color: '#000', borderRadius: 8, padding: '10px 22px', fontSize: 14 }}
              onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = '#F0D000')}
              onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = '#FFDD00')}
            >
              ☕ Buy me a coffee
            </a>
            <p className="mt-4 text-[12px]" style={{ color: 'var(--text-tertiary)' }}>
              No pressure at all — Applyd will always be free.
            </p>
          </div>
        </section>

        {/* ── Footer ── */}
        <footer className="border-t border-border-gray py-8">
          <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
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
      </main>
    </div>
  );
}
