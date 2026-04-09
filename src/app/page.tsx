'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { TrendingUp, Zap, MessageSquare, Clock, Menu, X, GraduationCap, Calendar, CheckCircle, Award } from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';
import ProductWalkthrough from '@/components/ProductWalkthrough';
import { Logo } from '@/components/Logo';
import { capture } from '@/lib/analytics';
import { AnimatedGroup } from '@/components/ui/animated-group';
import { Button } from '@/components/ui/button';
import {
  cn
} from '@/lib/utils';
import { motion } from 'framer-motion';
import { TestimonialStack, type Testimonial } from '@/components/ui/glass-testimonial-swiper';
import { UniversitiesSection } from '@/components/ui/customers-section';
import { getChallengeDay } from '@/lib/community';

const TESTIMONIALS: Testimonial[] = [
  {
    id: 1,
    initials: 'AK',
    name: 'Aisha Khan',
    role: 'CS Junior, University of Michigan',
    quote: "I had 40+ applications across Greenhouse, Workday, and random portals. Applyd finally gave me one place to see everything. The autofill saved me so much time — paste the link, done.",
    tags: [{ text: 'Internship Recruiting', type: 'featured' }, { text: 'Engineering', type: 'default' }],
    stats: [{ icon: CheckCircle, text: '43 apps tracked' }, { icon: Award, text: 'Offer @ Stripe' }],
    avatarGradient: 'linear-gradient(135deg, #5e6ad2, #8b5cf6)',
  },
  {
    id: 2,
    initials: 'JL',
    name: 'James Liu',
    role: 'Finance Senior, NYU Stern',
    quote: "Recruiting season is brutal. Having a kanban board for my applications sounds silly until you're managing 30 first-round interviews. The deadline alerts alone saved me from missing a superday.",
    tags: [{ text: 'Finance Recruiting', type: 'featured' }, { text: 'IB & PE', type: 'default' }],
    stats: [{ icon: Calendar, text: '31 interviews tracked' }, { icon: TrendingUp, text: '3 offers' }],
    avatarGradient: 'linear-gradient(135deg, #10b981, #059669)',
  },
  {
    id: 3,
    initials: 'MR',
    name: 'Maya Rodriguez',
    role: 'MBA Candidate, Wharton',
    quote: "I switched from a Notion template I'd been maintaining for two years. Applyd is just cleaner. The recruiting funnel showed me I had a 40% callback rate — I never would've calculated that manually.",
    tags: [{ text: 'Full-time Recruiting', type: 'default' }, { text: 'Consulting', type: 'default' }],
    stats: [{ icon: GraduationCap, text: 'MBA recruiting' }, { icon: Clock, text: 'Saved 3h/week' }],
    avatarGradient: 'linear-gradient(135deg, #f59e0b, #d97706)',
  },
  {
    id: 4,
    initials: 'DS',
    name: 'Dev Shah',
    role: 'SWE Intern Alum, now at Figma',
    quote: "Used Applyd during my junior year internship search. The pipeline view made it obvious which companies I was ghosting and which were ghosting me. Got 4 offers, took Figma.",
    tags: [{ text: 'SWE Intern', type: 'featured' }, { text: 'Design Tools', type: 'default' }],
    stats: [{ icon: CheckCircle, text: '4 offers received' }, { icon: Award, text: 'Now @ Figma' }],
    avatarGradient: 'linear-gradient(135deg, #ec4899, #d946ef)',
  },
];

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
          className="mx-auto mt-2 max-w-6xl px-6 rounded-2xl transition-all duration-500 lg:px-12"
          style={{
            maxWidth: scrolled ? '56rem' : '72rem',
            background: scrolled ? 'var(--background)' : 'transparent',
            backdropFilter: scrolled ? 'blur(12px)' : 'none',
            WebkitBackdropFilter: scrolled ? 'blur(12px)' : 'none',
            borderWidth: 1,
            borderStyle: 'solid',
            borderColor: scrolled ? 'var(--border-gray)' : 'transparent',
            paddingLeft: scrolled ? '1.5rem' : undefined,
            paddingRight: scrolled ? '1.5rem' : undefined,
          }}
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
              <ul className="flex gap-1 text-sm">
                {navLinks.map(item => (
                  <li key={item.label}>
                    <Link
                      href={item.href}
                      className="relative text-[13px] font-medium px-3 py-1.5 rounded-lg inline-block"
                      style={{
                        color: 'var(--muted-text)',
                        transition: 'color 250ms ease, background 250ms ease',
                      }}
                      onMouseEnter={e => {
                        const el = e.currentTarget as HTMLElement;
                        el.style.color = 'var(--brand-navy)';
                        el.style.background = 'var(--surface-gray)';
                      }}
                      onMouseLeave={e => {
                        const el = e.currentTarget as HTMLElement;
                        el.style.color = 'var(--muted-text)';
                        el.style.background = 'transparent';
                      }}
                      onMouseDown={e => {
                        (e.currentTarget as HTMLElement).style.transform = 'scale(0.97)';
                      }}
                      onMouseUp={e => {
                        (e.currentTarget as HTMLElement).style.transform = 'scale(1)';
                      }}
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
                <ul className="space-y-1 text-base">
                  {navLinks.map(item => (
                    <li key={item.label}>
                      <Link
                        href={item.href}
                        onClick={() => setMenuOpen(false)}
                        className="block text-[14px] font-medium px-3 py-2.5 rounded-xl active:scale-[0.98]"
                        style={{
                          color: 'var(--muted-text)',
                          transition: 'background 220ms ease, color 220ms ease, transform 120ms ease',
                        }}
                        onMouseEnter={e => {
                          const el = e.currentTarget as HTMLElement;
                          el.style.background = 'var(--surface-gray)';
                          el.style.color = 'var(--brand-navy)';
                        }}
                        onMouseLeave={e => {
                          const el = e.currentTarget as HTMLElement;
                          el.style.background = 'transparent';
                          el.style.color = 'var(--muted-text)';
                        }}
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

// ── Community teaser ──────────────────────────────────────────────────────────

function CommunityTeaser() {
  const day = getChallengeDay();
  return (
    <section className="max-w-6xl mx-auto px-6 py-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="rounded-2xl border overflow-hidden flex flex-col md:flex-row items-center gap-0"
        style={{ background: 'var(--card-bg)', borderColor: 'var(--border-gray)' }}
      >
        {/* Blue left panel */}
        <div
          className="w-full md:w-auto md:flex-shrink-0 px-8 py-8 flex flex-col items-center justify-center text-center md:text-left"
          style={{ background: 'linear-gradient(135deg, #1D4ED8, #3B82F6)', minWidth: 180 }}
        >
          <div className="text-[11px] font-semibold uppercase tracking-[0.1em] mb-1" style={{ color: 'rgba(255,255,255,0.7)' }}>
            Day
          </div>
          <div className="text-[56px] font-semibold leading-none" style={{ color: '#fff', letterSpacing: '-0.04em' }}>
            {day}
          </div>
          <div className="text-[11px] mt-1" style={{ color: 'rgba(255,255,255,0.7)' }}>of 100</div>
        </div>

        {/* Content */}
        <div className="flex-1 px-7 py-7">
          <p className="text-[12px] font-semibold uppercase tracking-[0.08em] mb-2" style={{ color: 'var(--accent-blue)' }}>
            100-day student challenge
          </p>
          <h3 className="text-[18px] font-semibold mb-2 leading-snug" style={{ color: 'var(--brand-navy)', letterSpacing: '-0.02em' }}>
            Students are building this app — one feature a day.
          </h3>
          <p className="text-[13px] leading-relaxed mb-4" style={{ color: 'var(--muted-text)' }}>
            The most-voted idea from the community gets shipped the next day. Every single day for 100 days.
          </p>
          <div className="flex items-center gap-3 flex-wrap">
            <Link
              href="/community"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-[13px] font-medium transition-all"
              style={{ background: 'var(--accent-blue)', color: '#fff' }}
            >
              See what students are building
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden><polyline points="9 18 15 12 9 6" /></svg>
            </Link>
            <span
              className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
              style={{ background: 'rgba(22,163,74,0.12)', color: '#16A34A' }}
            >
              ✓ Deadline Pill Badges — live today
            </span>
          </div>
        </div>
      </motion.div>
    </section>
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

          <div className="mx-auto max-w-6xl px-6">
            <AnimatedGroup
              variants={{
                container: {
                  hidden: {},
                  visible: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
                },
                ...transitionVariants,
              }}
              className="flex flex-col items-center md:items-start"
            >
              {/* Eyebrow */}
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[12px] font-medium mb-6"
                style={{ background: 'rgba(37,99,235,0.06)', borderColor: 'rgba(37,99,235,0.2)', color: 'var(--accent-blue)' }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                AI-powered recruiting, built for students
              </div>

              {/* Headline */}
              <h1
                className="max-w-[640px] text-[28px] sm:text-[36px] lg:text-[56px] text-center md:text-left"
                style={{
                  color: 'var(--brand-navy)',
                  letterSpacing: '-0.03em',
                  lineHeight: 1.15,
                  fontWeight: 700,
                }}
              >
                Every application.{' '}
                Every stage.{' '}
                <span
                  style={{
                    textDecoration: 'underline',
                    textDecorationColor: 'var(--accent-blue)',
                    textDecorationThickness: '4px',
                    textUnderlineOffset: '6px',
                    textDecorationSkipInk: 'none',
                  }}
                >
                  One place.
                </span>
              </h1>

              {/* Sub */}
              <p
                className="mt-5 max-w-[480px] text-[16px] md:text-[18px] text-center md:text-left"
                style={{ color: 'var(--muted-text)', lineHeight: 1.6 }}
              >
                Track every application. Get AI-powered interview prep, follow-up emails, and offer negotiation — automatically, the moment you need them. Free for students.
              </p>

              {/* CTAs */}
              <div className="mt-8 flex flex-col items-center md:items-start gap-3 sm:flex-row">
                <Button
                  asChild
                  size="lg"
                  style={{ borderRadius: 8, height: 44, padding: '0 20px', fontWeight: 600 }}
                >
                  <Link href="/signup">Get started free</Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="ghost"
                  style={{ borderRadius: 8, height: 44, padding: '0 20px', fontWeight: 600, color: 'var(--accent-blue)' }}
                >
                  <Link href="#walkthrough">See how it works</Link>
                </Button>
              </div>

              <p className="mt-4 text-[12px] text-center md:text-left" style={{ color: 'var(--text-tertiary)' }}>
                Free to start · 2 minutes to set up · 500+ students already tracking
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
                        {
                          name: 'Applied', count: 12, color: '#2563EB',
                          cards: [
                            { co: 'Stripe', role: 'SWE Intern', badge: null },
                            { co: 'Airbnb', role: 'Design Intern', badge: { label: '2d left', type: 'red' } },
                          ],
                        },
                        {
                          name: 'OA / Online Assessment', count: 4, color: '#06B6D4',
                          cards: [
                            { co: 'Amazon', role: 'SDE Intern', badge: { label: 'Today', type: 'red' } },
                            { co: 'Bloomberg', role: 'SWE Intern', badge: { label: '5d left', type: 'amber' } },
                          ],
                        },
                        {
                          name: 'Phone / Recruiter Screen', count: 3, color: '#F59E0B',
                          cards: [
                            { co: 'Microsoft', role: 'SWE Intern', badge: null },
                          ],
                        },
                        {
                          name: 'Final Round', count: 2, color: '#8B5CF6',
                          cards: [
                            { co: 'Google', role: 'SWE Intern', badge: { label: '3d left', type: 'red' } },
                          ],
                        },
                        {
                          name: 'Offer', count: 1, color: '#1D9E75',
                          cards: [
                            { co: 'Figma', role: 'Design Intern', badge: null },
                          ],
                        },
                      ].map(col => (
                        <div key={col.name} className="min-w-[160px] w-[160px] flex-shrink-0">
                          <div className="flex items-center gap-1.5 mb-1.5 px-0.5">
                            <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: col.color }} />
                            <span className="text-[10px] font-semibold uppercase tracking-[0.07em] truncate" style={{ color: 'var(--muted-text)' }}>{col.name}</span>
                            <span className="ml-auto text-[9px] font-medium px-1 py-0.5 rounded border flex-shrink-0" style={{ background: 'var(--surface-gray)', color: 'var(--text-tertiary)', borderColor: 'var(--border-gray)' }}>{col.count}</span>
                          </div>
                          <div className="space-y-1.5 rounded-lg p-1.5 border" style={{ background: 'var(--card-bg)', borderColor: 'var(--border-gray)', minHeight: 80 }}>
                            {col.cards.map(card => (
                              <div key={card.co} className="bg-background border rounded-lg p-2 relative" style={{ borderColor: 'var(--border-gray)' }}>
                                <div className="text-[11px] font-semibold truncate" style={{ color: 'var(--brand-navy)' }}>{card.co}</div>
                                <div className="text-[10px] truncate mt-0.5" style={{ color: 'var(--muted-text)' }}>{card.role}</div>
                                {card.badge && (
                                  <span
                                    className="absolute bottom-1.5 right-1.5 text-[9px] font-semibold px-1.5 py-0.5 rounded-full"
                                    style={card.badge.type === 'red'
                                      ? { background: 'rgba(220,38,38,0.12)', color: '#DC2626' }
                                      : { background: 'rgba(217,119,6,0.12)', color: '#D97706' }
                                    }
                                  >
                                    {card.badge.label}
                                  </span>
                                )}
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

        {/* ── Universities ── */}
        <UniversitiesSection />

        {/* ── Community challenge teaser ── */}
        <CommunityTeaser />

        {/* ── Product Walkthrough ── */}
        <div id="walkthrough" className="-mx-0" style={{ scrollMarginTop: 72 }}>
          <ProductWalkthrough />
        </div>

        {/* ── Features ── */}
        <section id="features" className="max-w-6xl mx-auto px-6 py-20" style={{ scrollMarginTop: 72 }}>
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="text-center mb-14">
            <h2 className="text-[28px] md:text-[36px] font-semibold mb-3" style={{ color: 'var(--brand-navy)', letterSpacing: '-0.025em' }}>
              The free tier beats a spreadsheet. The Pro tier beats everyone else.
            </h2>
            <p className="text-[15px] max-w-lg mx-auto" style={{ color: 'var(--muted-text)' }}>
              Start free — no credit card, no catch. When you&apos;re ready to stop leaving things to chance, there&apos;s Pro.
            </p>
          </motion.div>

          {/* Free tier */}
          <div className="mb-10">
            <div className="flex items-center gap-3 mb-5">
              <span className="text-[12px] font-semibold uppercase tracking-[0.08em] px-3 py-1 rounded-full" style={{ background: 'var(--surface-gray)', color: 'var(--muted-text)', border: '1px solid var(--border-gray)' }}>Free for every student</span>
              <div className="flex-1 h-px" style={{ background: 'var(--border-gray)' }} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {[
                { icon: '🗂', title: 'Kanban pipeline view', desc: 'See every application at a glance across recruiting-native stages: OA, Recruiter Screen, Final Round, and more.' },
                { icon: '⏰', title: 'Deadline tracking', desc: 'Deadlines turn amber at 7 days, red at 3, and surface automatically in your Act Now card.' },
                { icon: '📈', title: 'Response rate analytics', desc: 'See your callback rate automatically — a number most students never know but every recruiter does.' },
                { icon: '💡', title: 'Smart nudges', desc: 'Applyd tells you when applications have gone quiet and prompts action before opportunities slip away.' },
                { icon: '📅', title: 'Calendar view', desc: 'Every deadline and interview in one calendar. Sync to Google Calendar in one click.' },
                { icon: '⚡', title: 'Browser extension', desc: 'Log any job from LinkedIn, Handshake, or any job board in one click. No copy-pasting.' },
              ].map((f, i) => (
                <motion.div key={f.title} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4, delay: i * 0.06 }}
                  className="rounded-xl border p-5 flex flex-col gap-2"
                  style={{ background: 'var(--card-bg)', borderColor: 'var(--border-gray)' }}>
                  <span className="text-2xl">{f.icon}</span>
                  <h3 className="text-[13px] font-semibold" style={{ color: 'var(--brand-navy)' }}>{f.title}</h3>
                  <p className="text-[12px] leading-relaxed" style={{ color: 'var(--muted-text)' }}>{f.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Pro tier */}
          <div>
            <div className="flex items-center gap-3 mb-5">
              <span className="text-[12px] font-semibold uppercase tracking-[0.08em] px-3 py-1 rounded-full" style={{ background: 'linear-gradient(135deg,#1e40af,#2563eb)', color: '#fff' }}>Pro — AI that works for you</span>
              <div className="flex-1 h-px" style={{ background: 'var(--border-gray)' }} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {[
                { icon: '🧠', title: 'Interview Intel', desc: 'Walk into every interview knowing what this company actually asks. Activates automatically when you enter any interview stage.' },
                { icon: '✉️', title: 'Follow Up Writer', desc: 'One click generates a perfect professional email — thank you, status check, negotiation, withdrawal — calibrated to your exact situation.' },
                { icon: '📊', title: 'Strength Signal', desc: 'Know how competitive your application is before you invest more time. Appears automatically when you add a new application.' },
                { icon: '💰', title: 'Offer Negotiation Guide', desc: 'Compensation benchmarks and a word-for-word negotiation script, waiting for you the moment an offer arrives.' },
                { icon: '📅', title: 'Weekly AI Coach', desc: 'A personalized Monday morning briefing built from your actual pipeline data. Specific actions for the week ahead, every week.' },
                { icon: '∞', title: 'Unlimited applications', desc: 'Apply broadly. Track everything. The more your pipeline grows, the smarter the AI gets about your patterns.' },
              ].map((f, i) => (
                <motion.div key={f.title} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4, delay: i * 0.06 }}
                  className="rounded-xl border p-5 flex flex-col gap-2 relative"
                  style={{ background: 'linear-gradient(135deg, rgba(37,99,235,0.04) 0%, var(--card-bg) 100%)', borderColor: 'rgba(37,99,235,0.2)', boxShadow: '0 2px 12px rgba(37,99,235,0.06)' }}>
                  <span className="absolute top-3 right-3 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
                    style={{ background: 'linear-gradient(135deg,#1e40af,#2563eb)', color: '#fff' }}>Pro</span>
                  <span className="text-2xl">{f.icon}</span>
                  <h3 className="text-[13px] font-semibold" style={{ color: 'var(--brand-navy)' }}>{f.title}</h3>
                  <p className="text-[12px] leading-relaxed" style={{ color: 'var(--muted-text)' }}>{f.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── How the AI works ── */}
        <section className="max-w-6xl mx-auto px-6 py-16">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="text-center mb-12">
            <h2 className="text-[28px] md:text-[36px] font-semibold mb-3" style={{ color: 'var(--brand-navy)', letterSpacing: '-0.025em' }}>
              The AI that shows up before you realize you need it.
            </h2>
            <p className="text-[15px] max-w-md mx-auto" style={{ color: 'var(--muted-text)' }}>
              You don&apos;t go searching for help. Applyd reads where you are and surfaces the right tool at the right moment — without you asking.
            </p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                step: '1',
                title: 'You track your applications as normal',
                desc: 'Add applications with the kanban board or the browser extension. Takes seconds.',
                examples: [],
              },
              {
                step: '2',
                title: 'Applyd detects where you are in the process',
                desc: 'The pipeline watches every status change, deadline, and stage transition automatically.',
                examples: [],
              },
              {
                step: '3',
                title: 'The right AI feature activates at the right moment',
                desc: 'No prompting. No searching. Before you think to ask, it&apos;s already there.',
                examples: [
                  { trigger: 'Move to interviews →', result: 'Interview Intel appears' },
                  { trigger: 'Receive an offer →', result: 'Negotiation Guide activates' },
                  { trigger: 'Monday morning →', result: 'Weekly Coach arrives' },
                ],
              },
            ].map((s, i) => (
              <motion.div key={s.step} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.12 }}
                className="rounded-xl border p-6 flex flex-col gap-3"
                style={{ background: 'var(--card-bg)', borderColor: 'var(--border-gray)' }}>
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-bold" style={{ background: 'var(--accent-blue)', color: '#fff' }}>{s.step}</div>
                <h3 className="text-[14px] font-semibold leading-snug" style={{ color: 'var(--brand-navy)' }}>{s.title}</h3>
                <p className="text-[13px] leading-relaxed" style={{ color: 'var(--muted-text)' }}>{s.desc}</p>
                {s.examples.length > 0 && (
                  <div className="space-y-1.5 mt-1">
                    {s.examples.map(ex => (
                      <div key={ex.trigger} className="flex items-center gap-2 text-[11px]">
                        <span style={{ color: 'var(--muted-text)' }}>{ex.trigger}</span>
                        <span className="font-semibold" style={{ color: 'var(--accent-blue)' }}>{ex.result}</span>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </section>

        {/* ── Comparison ── */}
        <section className="max-w-6xl mx-auto px-6 py-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-[28px] md:text-[36px] font-semibold mb-3" style={{ color: 'var(--brand-navy)', letterSpacing: '-0.025em' }}>
              Why not just use a spreadsheet?
            </h2>
            <p className="text-[15px] max-w-lg mx-auto" style={{ color: 'var(--muted-text)' }}>
              You could. Most students do. Here&apos;s what they&apos;re missing.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="overflow-hidden rounded-xl border"
            style={{ borderColor: 'var(--border-gray)' }}
          >
            {/* Header row */}
            <div className="grid grid-cols-4 border-b" style={{ borderColor: 'var(--border-gray)', background: 'var(--surface-gray)' }}>
              <div className="p-4 text-[11px] font-semibold uppercase tracking-[0.08em]" style={{ color: 'var(--muted-text)' }}>Feature</div>
              {['Spreadsheet', 'Notion template', 'Applyd'].map((col, i) => (
                <div key={col} className="p-4 text-center border-l" style={{ borderColor: 'var(--border-gray)' }}>
                  <span
                    className="text-[12px] font-semibold"
                    style={{ color: i === 2 ? 'var(--accent-blue)' : 'var(--muted-text)' }}
                  >
                    {col}
                  </span>
                </div>
              ))}
            </div>

            {/* Data rows */}
            {[
              { feature: 'Recruiting-native stages (OA, Superday, Recruiter Screen)', vals: [false, false, true] },
              { feature: 'Automatic deadline alerts', vals: [false, false, true] },
              { feature: 'Response rate analytics', vals: [false, false, true] },
              { feature: 'Real-time pipeline view', vals: [false, 'Manual', true] },
              { feature: 'Works on mobile', vals: ['Broken', 'Barely', true] },
              { feature: 'AI interview prep — auto-activated', vals: [false, false, true] },
              { feature: 'AI follow-up email generator', vals: [false, false, true] },
              { feature: 'AI offer negotiation guide', vals: [false, false, true] },
              { feature: 'Weekly AI recruiting coach', vals: [false, false, true] },
              { feature: 'Zero setup', vals: [false, false, true] },
              { feature: 'Free to start', vals: [true, true, true] },
            ].map((row, ri) => (
              <div
                key={row.feature}
                className="grid grid-cols-4 border-b last:border-b-0 transition-colors"
                style={{ borderColor: 'var(--border-gray)', background: ri % 2 === 0 ? 'var(--card-bg)' : 'transparent' }}
              >
                <div className="p-4 text-[13px]" style={{ color: 'var(--brand-navy)' }}>{row.feature}</div>
                {row.vals.map((val, vi) => (
                  <div key={vi} className="p-4 flex items-center justify-center border-l" style={{ borderColor: 'var(--border-gray)' }}>
                    {val === true ? (
                      <span className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ background: vi === 2 ? 'rgba(22,163,74,0.12)' : 'rgba(22,163,74,0.08)' }}>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={vi === 2 ? '#16A34A' : '#16A34A'} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                      </span>
                    ) : val === false ? (
                      <span className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ background: 'rgba(220,38,38,0.08)' }}>
                        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                      </span>
                    ) : (
                      <span className="text-[11px] font-medium" style={{ color: 'var(--muted-text)' }}>{val}</span>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </motion.div>
        </section>

        {/* ── Testimonials ── */}
        <section className="max-w-6xl mx-auto px-6 py-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-14"
          >
            <h2 className="text-[28px] md:text-[36px] font-semibold mb-3" style={{ color: 'var(--brand-navy)', letterSpacing: '-0.025em' }}>
              What changes when students stop guessing.
            </h2>
            <p className="text-[15px] max-w-lg mx-auto" style={{ color: 'var(--muted-text)' }}>
              500+ students. Real pipelines. Real offers.
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="relative"
            style={{ minHeight: 320 }}
          >
            <TestimonialStack testimonials={TESTIMONIALS} visibleBehind={2} />
          </motion.div>
        </section>

        {/* ── Buy Me a Coffee ── */}
        <section style={{ background: 'var(--bmac-bg)', borderTop: '1px solid var(--border-gray)', borderBottom: '1px solid var(--border-gray)' }}>
          <div className="max-w-[480px] mx-auto px-6 py-16 text-center">
            <div className="flex justify-center mb-5">
              <Logo size={36} variant="dark" />
            </div>
            <h2 className="text-[20px] font-semibold mb-3" style={{ color: 'var(--brand-navy)', letterSpacing: '-0.02em' }}>
              Built in the same recruiting chaos you&apos;re in.
            </h2>
            <p className="text-[14px] leading-relaxed mb-6" style={{ color: 'var(--muted-text)' }}>
              This started as a tool I needed and couldn&apos;t find. If it&apos;s shaved even one hour off your recruiting season, a coffee is the kindest thing you could do.
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
              No pressure. No paywall.
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
              <Link href="/terms" className="text-[12px] font-medium transition-colors" style={{ color: 'var(--muted-text)' }}>Terms</Link>
              <span className="text-[12px]" style={{ color: 'var(--text-tertiary)' }}>© {new Date().getFullYear()} Applyd</span>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
