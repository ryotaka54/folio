'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { TrendingUp, Zap, MessageSquare, Clock, Menu, X, GraduationCap, Calendar, CheckCircle, Award, LayoutGrid, Brain, Target } from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';
import LocaleSwitcher from '@/components/LocaleSwitcher';
import ProductWalkthrough from '@/components/ProductWalkthrough';
import { Logo } from '@/components/Logo';
import { capture } from '@/lib/analytics';
import { AnimatedGroup } from '@/components/ui/animated-group';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { motion, useInView, useMotionValue, useSpring } from 'framer-motion';
import { TestimonialStack, type Testimonial } from '@/components/ui/glass-testimonial-swiper';
import { UniversitiesSection } from '@/components/ui/customers-section';

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
  {
    id: 5,
    initials: 'PW',
    name: 'Priya Williamson',
    role: 'Product Management, UC Berkeley',
    quote: "The weekly AI coaching brief on Mondays was genuinely useful. It told me to follow up on my Google PM application after 8 days of silence — turns out the recruiter had been waiting on me.",
    tags: [{ text: 'Product Management', type: 'featured' }, { text: 'Tech', type: 'default' }],
    stats: [{ icon: MessageSquare, text: 'Weekly AI coach' }, { icon: Award, text: 'Offer @ Google' }],
    avatarGradient: 'linear-gradient(135deg, #0ea5e9, #2563eb)',
  },
  {
    id: 6,
    initials: 'TO',
    name: 'Tyler Okafor',
    role: 'Finance Junior, Georgetown',
    quote: "I used the Strength Signal before applying to Goldman. It told me my GPA and experience were competitive but suggested I highlight a specific project. Got the callback. Coincidence? Maybe. Maybe not.",
    tags: [{ text: 'Finance', type: 'featured' }, { text: 'Banking', type: 'default' }],
    stats: [{ icon: Zap, text: 'Strength signal used' }, { icon: TrendingUp, text: 'IB Offer' }],
    avatarGradient: 'linear-gradient(135deg, #f97316, #ea580c)',
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

// ── Animated counter ──────────────────────────────────────────────────────────

function AnimatedCounter({ target, suffix = '' }: { target: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const motionVal = useMotionValue(0);
  const spring = useSpring(motionVal, { stiffness: 60, damping: 20 });
  const [display, setDisplay] = useState('0');

  useEffect(() => {
    if (inView) motionVal.set(target);
  }, [inView, target, motionVal]);

  useEffect(() => {
    return spring.on('change', v => setDisplay(Math.round(v).toLocaleString()));
  }, [spring]);

  return <span ref={ref}>{display}{suffix}</span>;
}

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
      <nav data-state={menuOpen ? 'active' : undefined} className="fixed z-20 w-full px-2 group">
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
            <div className="flex w-full justify-between lg:w-auto">
              <Link href="/" className="flex items-center gap-2">
                <Logo size={26} variant="dark" />
                <span className="text-[15px] font-semibold" style={{ color: 'var(--brand-navy)', letterSpacing: '-0.02em' }}>Applyd</span>
              </Link>
              <button
                onClick={() => setMenuOpen(v => !v)}
                aria-label={menuOpen ? 'Close menu' : 'Open menu'}
                className="relative z-20 -m-2.5 -mr-4 block cursor-pointer p-2.5 lg:hidden"
                style={{ color: 'var(--muted-text)' }}
              >
                {menuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>

            <div className="absolute inset-0 m-auto hidden size-fit lg:block">
              <ul className="flex gap-1 text-sm">
                {navLinks.map(item => (
                  <li key={item.label}>
                    <Link
                      href={item.href}
                      className="relative text-[13px] font-medium px-3 py-1.5 rounded-lg inline-block"
                      style={{ color: 'var(--muted-text)', transition: 'color 250ms ease, background 250ms ease' }}
                      onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.color = 'var(--brand-navy)'; el.style.background = 'var(--surface-gray)'; }}
                      onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.color = 'var(--muted-text)'; el.style.background = 'transparent'; }}
                      onMouseDown={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(0.97)'; }}
                      onMouseUp={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className={cn(
              'bg-background group-data-[state=active]:block lg:group-data-[state=active]:flex mb-6 hidden w-full flex-wrap items-center justify-end space-y-8 rounded-2xl border border-border-gray p-6 shadow-2xl md:flex-nowrap lg:m-0 lg:flex lg:w-fit lg:gap-3 lg:space-y-0 lg:border-transparent lg:bg-transparent lg:p-0 lg:shadow-none',
              scrolled && 'dark:bg-transparent',
            )}>
              <div className="lg:hidden w-full">
                <ul className="space-y-1 text-base">
                  {navLinks.map(item => (
                    <li key={item.label}>
                      <Link
                        href={item.href}
                        onClick={() => setMenuOpen(false)}
                        className="block text-[14px] font-medium px-3 py-2.5 rounded-xl active:scale-[0.98]"
                        style={{ color: 'var(--muted-text)', transition: 'background 220ms ease, color 220ms ease, transform 120ms ease' }}
                        onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background = 'var(--surface-gray)'; el.style.color = 'var(--brand-navy)'; }}
                        onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background = 'transparent'; el.style.color = 'var(--muted-text)'; }}
                      >
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex w-full flex-col gap-2 sm:flex-row sm:gap-2 md:w-fit">
                <ThemeToggle />
                <Button asChild variant="outline" size="sm"><Link href="/login">Log in</Link></Button>
                <Button asChild size="sm"><Link href="/signup">Sign up free</Link></Button>
              </div>
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
}

// ── Today View Preview (hero) ─────────────────────────────────────────────────

function TodayViewPreview() {
  return (
    <div className="relative -mr-6 overflow-hidden px-2 sm:mr-0 mt-16">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-10"
        style={{ background: 'linear-gradient(to bottom, transparent 40%, var(--background) 100%)' }}
      />
      <div
        className="relative mx-auto max-w-5xl overflow-hidden rounded-2xl border p-3 shadow-xl"
        style={{ background: 'var(--card-bg)', borderColor: 'var(--border-gray)' }}
      >
        {/* Browser chrome */}
        <div className="rounded-xl overflow-hidden border" style={{ background: 'var(--background)', borderColor: 'var(--border-gray)' }}>
          {/* App nav */}
          <div className="flex items-center gap-2 px-4 py-2.5 border-b" style={{ borderColor: 'var(--border-gray)', background: 'var(--card-bg)' }}>
            <Logo size={16} variant="dark" />
            <span className="text-[12px] font-semibold" style={{ color: 'var(--brand-navy)', letterSpacing: '-0.02em' }}>Applyd</span>
            <div className="flex items-center gap-0.5 ml-5">
              {['Today', 'Pipeline', 'Table', 'Calendar'].map((v, i) => (
                <div key={v} className="px-2.5 py-1 rounded-md text-[10px] font-medium transition-colors"
                  style={{ background: i === 0 ? 'var(--accent-blue)' : 'transparent', color: i === 0 ? '#fff' : 'var(--muted-text)' }}>
                  {v}
                </div>
              ))}
            </div>
            <div className="ml-auto flex items-center gap-2">
              <div className="text-[10px] px-2 py-0.5 rounded-full font-semibold" style={{ background: 'rgba(220,38,38,0.1)', color: '#DC2626' }}>3 urgent</div>
              <div className="w-6 h-6 rounded-lg text-[9px] font-bold flex items-center justify-center" style={{ background: 'var(--surface-gray)', color: 'var(--muted-text)', border: '1px solid var(--border-gray)' }}>AK</div>
            </div>
          </div>

          {/* Today content */}
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-[10px] font-medium uppercase tracking-widest mb-0.5" style={{ color: 'var(--accent-blue)' }}>TODAY · MONDAY</p>
                <p className="text-[17px] font-semibold" style={{ color: 'var(--brand-navy)', letterSpacing: '-0.02em' }}>Good morning, Alex.</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-[11px] px-3 py-1 rounded-full border font-medium" style={{ background: 'rgba(220,38,38,0.06)', borderColor: 'rgba(220,38,38,0.2)', color: '#DC2626' }}>
                  🔥 OA due tomorrow
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-3">
              {/* Next Up - hero card */}
              <div className="md:col-span-1">
                <p className="text-[9px] font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--muted-text)' }}>⚡ Next Up</p>
                <div className="rounded-xl p-3 border relative overflow-hidden" style={{ background: 'var(--card-bg)', borderColor: 'var(--border-gray)', borderLeft: '3px solid #DC2626' }}>
                  <div className="absolute top-2 right-2 text-[9px] font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(220,38,38,0.12)', color: '#DC2626' }}>Due Tomorrow</div>
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-bold mb-2" style={{ background: 'rgba(37,99,235,0.1)', color: '#2563EB' }}>G</div>
                  <p className="text-[13px] font-semibold" style={{ color: 'var(--brand-navy)' }}>Google</p>
                  <p className="text-[10px] mt-0.5" style={{ color: 'var(--muted-text)' }}>SWE Intern · OA</p>
                  <div className="mt-2.5 h-0.5 rounded-full overflow-hidden" style={{ background: 'var(--border-gray)' }}>
                    <div className="h-full rounded-full" style={{ width: '85%', background: '#DC2626' }} />
                  </div>
                  <p className="text-[9px] mt-1" style={{ color: '#DC2626' }}>1 day until deadline</p>
                </div>
              </div>

              {/* On Deck */}
              <div>
                <p className="text-[9px] font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--muted-text)' }}>On Deck</p>
                <div className="space-y-1.5">
                  {[
                    { co: 'Stripe', role: 'Backend Eng Intern', stage: 'OA', days: '5d', red: false },
                    { co: 'Microsoft', role: 'SWE Intern', stage: 'Phone Screen', days: 'Next wk', red: false },
                    { co: 'Anthropic', role: 'Research Intern', stage: 'Final Round', days: '3d', red: true },
                  ].map(item => (
                    <div key={item.co} className="flex items-center gap-2 rounded-lg px-2.5 py-2 border" style={{ background: 'var(--card-bg)', borderColor: 'var(--border-gray)' }}>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-semibold truncate" style={{ color: 'var(--brand-navy)' }}>{item.co}</p>
                        <p className="text-[9px] truncate" style={{ color: 'var(--muted-text)' }}>{item.stage}</p>
                      </div>
                      <span className="text-[8px] font-semibold px-1.5 py-0.5 rounded" style={item.red ? { background: 'rgba(220,38,38,0.1)', color: '#DC2626' } : { background: 'rgba(217,119,6,0.1)', color: '#D97706' }}>{item.days}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Follow Up + Momentum */}
              <div className="space-y-3">
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--muted-text)' }}>Follow Up</p>
                  <div className="space-y-1.5">
                    {[
                      { co: 'Amazon', days: 12 },
                      { co: 'Bloomberg', days: 9 },
                    ].map(item => (
                      <div key={item.co} className="flex items-center justify-between rounded-lg px-2.5 py-2 border" style={{ background: 'var(--card-bg)', borderColor: 'var(--border-gray)' }}>
                        <p className="text-[10px] font-semibold" style={{ color: 'var(--brand-navy)' }}>{item.co}</p>
                        <span className="text-[8px]" style={{ color: 'var(--muted-text)' }}>{item.days}d silent</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="rounded-lg p-2.5 border" style={{ background: 'rgba(22,163,74,0.05)', borderColor: 'rgba(22,163,74,0.15)' }}>
                  <p className="text-[9px] font-bold uppercase tracking-widest mb-1.5" style={{ color: '#16A34A' }}>Moving Forward</p>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold" style={{ background: 'rgba(22,163,74,0.15)', color: '#16A34A' }}>J</div>
                    <div>
                      <p className="text-[10px] font-semibold" style={{ color: 'var(--brand-navy)' }}>Jane Street</p>
                      <p className="text-[9px]" style={{ color: '#16A34A' }}>Offer received 🎉</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Company outcomes bar ──────────────────────────────────────────────────────

const OUTCOMES = [
  'Google', 'Stripe', 'McKinsey', 'Jane Street', 'Anthropic', 'Goldman Sachs',
  'Figma', 'Microsoft', 'Citadel', 'BCG', 'Meta', 'Amazon',
  'Deloitte', 'Two Sigma', 'Palantir', 'Apple', 'Blackstone', 'Bain & Company',
];

function CompanyBar() {
  const doubled = [...OUTCOMES, ...OUTCOMES];
  return (
    <div style={{ borderTop: '1px solid var(--border-gray)', borderBottom: '1px solid var(--border-gray)', background: 'var(--card-bg)', padding: '16px 0', overflow: 'hidden' }}>
      <style>{`
        @keyframes co-scroll { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        .co-track { animation: co-scroll 36s linear infinite; display: flex; align-items: center; width: max-content; }
        .co-track:hover { animation-play-state: paused; }
      `}</style>
      <p className="text-center text-[10px] font-semibold uppercase tracking-[0.1em] mb-3" style={{ color: 'var(--text-tertiary)' }}>Students have landed at</p>
      <div style={{ maskImage: 'linear-gradient(to right, transparent, black 6%, black 94%, transparent)', WebkitMaskImage: 'linear-gradient(to right, transparent, black 6%, black 94%, transparent)' }}>
        <div className="co-track">
          {doubled.map((co, i) => (
            <span key={i} className="text-[12px] font-medium flex-shrink-0" style={{ color: 'var(--muted-text)', padding: '0 32px' }}>{co}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Final CTA ─────────────────────────────────────────────────────────────────

function FinalCTA({ user }: { user: unknown }) {
  return (
    <section style={{ background: '#060810', padding: '96px 24px' }}>
      <div style={{ maxWidth: 640, margin: '0 auto', textAlign: 'center' }}>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div style={{ width: 48, height: 2, background: '#2563EB', margin: '0 auto 28px', borderRadius: 1 }} />
          <h2 style={{
            fontSize: 'clamp(28px, 4vw, 44px)',
            fontWeight: 700,
            letterSpacing: '-0.025em',
            lineHeight: 1.18,
            color: '#fff',
            margin: '0 0 18px',
          }}>
            Stop tracking in a spreadsheet.<br />
            <span style={{ color: '#3B82F6' }}>Start landing offers.</span>
          </h2>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.5)', lineHeight: 1.8, margin: '0 0 36px' }}>
            2,400+ students already have a system. Free forever, 2-minute setup.
          </p>
          <Link
            href={user ? '/dashboard' : '/signup'}
            style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              height: 52, padding: '0 48px', borderRadius: 9999,
              background: '#fff', color: '#060810',
              fontSize: 16, fontWeight: 700,
              textDecoration: 'none',
              transition: 'opacity 150ms ease, transform 100ms ease-out',
              boxShadow: '0 4px 24px rgba(255,255,255,0.15)',
            }}
            onMouseDown={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(0.97)'; }}
            onMouseUp={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}
            onClick={() => capture('landing_final_cta_click')}
          >
            {user ? 'Go to dashboard →' : 'Start free — no card needed →'}
          </Link>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)', marginTop: 14 }}>
            No credit card required · Free forever up to 15 apps
          </p>
        </motion.div>
      </div>
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
          <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 hidden lg:block overflow-hidden">
            <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[600px] rounded-full opacity-25 dark:opacity-15"
              style={{ background: 'radial-gradient(ellipse at center, var(--accent-blue) 0%, transparent 70%)' }}
            />
          </div>
          <div aria-hidden className="pointer-events-none absolute inset-0 -z-10"
            style={{ background: 'radial-gradient(125% 125% at 50% 100%, transparent 0%, var(--background) 70%)' }}
          />

          <div className="mx-auto max-w-6xl px-6">
            <AnimatedGroup
              variants={{
                container: { hidden: {}, visible: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } } },
                ...transitionVariants,
              }}
              className="flex flex-col items-center md:items-start"
            >
              {/* Eyebrow */}
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[12px] font-medium mb-6"
                style={{ background: 'rgba(37,99,235,0.06)', borderColor: 'rgba(37,99,235,0.2)', color: 'var(--accent-blue)' }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                Free for students · Pipeline + AI Mock Interviews in one place
              </div>

              <h1
                className="max-w-[640px] text-[28px] sm:text-[38px] lg:text-[56px] text-center md:text-left"
                style={{ color: 'var(--brand-navy)', letterSpacing: '-0.03em', lineHeight: 1.1, fontWeight: 700 }}
              >
                Track every application.{' '}
                <span style={{
                  textDecoration: 'underline',
                  textDecorationColor: 'var(--accent-blue)',
                  textDecorationThickness: '4px',
                  textUnderlineOffset: '8px',
                  textDecorationSkipInk: 'none',
                  color: 'var(--brand-navy)',
                }}>
                  Ace every interview.
                </span>
              </h1>

              <p className="mt-5 max-w-[480px] text-[17px] text-center md:text-left" style={{ color: 'var(--muted-text)', lineHeight: 1.65 }}>
                Juggling 30 applications across five portals and a Notion doc nobody updates? Applyd gives you one dashboard, real-time deadline alerts, and an AI interview coach that knows which company you&apos;re prepping for.
              </p>

              <div className="mt-8 flex flex-col items-center md:items-start gap-3 sm:flex-row">
                <Button asChild size="lg" style={{ borderRadius: 8, height: 46, padding: '0 24px', fontWeight: 700, fontSize: 14 }}>
                  <Link href="/signup">Start free — no card needed</Link>
                </Button>
                <Button asChild size="lg" variant="outline"
                  style={{ borderRadius: 8, height: 46, padding: '0 20px', fontWeight: 600, fontSize: 14, borderColor: 'var(--border-gray)', color: 'var(--brand-navy)', background: 'var(--surface-gray)' }}>
                  <Link href="#walkthrough">See how it works</Link>
                </Button>
              </div>

              <div className="mt-5 flex items-center gap-5 flex-wrap justify-center md:justify-start">
                <p className="text-[12px]" style={{ color: 'var(--text-tertiary)' }}>
                  Free forever · 2 min setup
                </p>
                <div className="flex items-center gap-1.5">
                  <div className="flex -space-x-1.5">
                    {['#5e6ad2','#10b981','#f59e0b','#ec4899'].map(c => (
                      <div key={c} className="w-5 h-5 rounded-full border-2 flex-shrink-0" style={{ background: c, borderColor: 'var(--background)' }} />
                    ))}
                  </div>
                  <span className="text-[12px] font-medium" style={{ color: 'var(--muted-text)' }}>
                    <AnimatedCounter target={2400} />+ students already tracking
                  </span>
                </div>
              </div>
            </AnimatedGroup>

            <AnimatedGroup
              variants={{
                container: { hidden: {}, visible: { transition: { delayChildren: 0.5 } } },
                ...transitionVariants,
              }}
            >
              <TodayViewPreview />
            </AnimatedGroup>
          </div>
        </section>

        {/* ── Universities ── */}
        <UniversitiesSection />

        {/* ── Mock Interview — HERO FEATURE ── */}
        <section style={{ background: '#080C14', padding: '96px 0 0', overflow: 'hidden' }}>
          <div className="max-w-6xl mx-auto px-6">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="flex flex-col items-center text-center mb-14"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-[11px] font-semibold mb-5"
                style={{ background: 'rgba(37,99,235,0.15)', borderColor: 'rgba(37,99,235,0.35)', color: '#60A5FA', letterSpacing: '0.08em' }}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 10a7 7 0 0 0 14 0"/><line x1="12" y1="19" x2="12" y2="22"/></svg>
                NEW — AI MOCK INTERVIEW
              </div>
              <h2 className="text-[28px] md:text-[44px] font-bold leading-tight mb-4"
                style={{ color: '#fff', letterSpacing: '-0.03em', maxWidth: 640 }}>
                Practice out loud.<br />
                <span style={{ color: '#60A5FA' }}>Get hired faster.</span>
              </h2>
              <p className="text-[16px] max-w-[500px]" style={{ color: 'rgba(255,255,255,0.5)', lineHeight: 1.7 }}>
                Pick any company from your pipeline. AI generates tailored questions, scores every answer with a STAR rubric, and tells you exactly what to fix — in seconds. Free users get one full session on the house.
              </p>
              <Link
                href={user ? '/interview' : '/signup'}
                className="mt-8 inline-flex items-center gap-2 h-12 px-7 rounded-xl text-[14px] font-semibold text-white transition-all"
                style={{ background: '#2563EB', boxShadow: '0 4px 20px rgba(37,99,235,0.4)' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 6px 28px rgba(37,99,235,0.6)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 20px rgba(37,99,235,0.4)'; }}
              >
                {user ? 'Open Interview Room →' : 'Try it free →'}
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="relative mx-auto rounded-t-2xl overflow-hidden border border-b-0"
              style={{ maxWidth: 900, borderColor: 'rgba(255,255,255,0.08)', background: '#0D1117' }}
            >
              <div className="flex items-center gap-3 px-5 py-3 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#FF5F57' }} />
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#FEBC2E' }} />
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#28C840' }} />
                <span className="ml-3 text-[11px]" style={{ color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace' }}>applyd.io/interview</span>
              </div>

              <div className="grid md:grid-cols-[2fr_3fr]">
                <div className="p-6 border-r" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center text-[14px] font-bold" style={{ background: 'rgba(37,99,235,0.2)', color: '#60A5FA' }}>G</div>
                    <div>
                      <p className="text-[13px] font-semibold" style={{ color: '#fff', margin: 0 }}>Google</p>
                      <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.4)', margin: 0 }}>SWE Intern</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-center mb-6">
                    <div className="relative w-20 h-20">
                      <svg viewBox="0 0 80 80" className="w-20 h-20" style={{ transform: 'rotate(-90deg)' }}>
                        <circle cx="40" cy="40" r="32" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="5" />
                        <circle cx="40" cy="40" r="32" fill="none" stroke="#2563EB" strokeWidth="5" strokeLinecap="round"
                          strokeDasharray={`${2 * Math.PI * 32 * 0.4} ${2 * Math.PI * 32 * 0.6}`} />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-[18px] font-bold" style={{ color: '#fff', lineHeight: 1, fontFamily: 'monospace' }}>2</span>
                        <span className="text-[9px]" style={{ color: 'rgba(255,255,255,0.4)' }}>/ 5</span>
                      </div>
                    </div>
                    <p className="text-[9px] mt-2" style={{ color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em', fontFamily: 'monospace' }}>QUESTION 2 OF 5</p>
                  </div>
                  <div className="space-y-2">
                    {[['S','Situation','Set the scene'],['T','Task','Your responsibility'],['A','Action','What you did'],['R','Result','The outcome']].map(([k,l,d]) => (
                      <div key={k} className="flex items-start gap-2.5">
                        <span className="w-5 h-5 rounded flex-shrink-0 flex items-center justify-center text-[9px] font-bold" style={{ background: 'rgba(37,99,235,0.2)', color: '#60A5FA' }}>{k}</span>
                        <div>
                          <p className="text-[11px] font-semibold" style={{ color: 'rgba(255,255,255,0.7)', margin: 0 }}>{l}</p>
                          <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.3)', margin: 0 }}>{d}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-full" style={{ background: 'rgba(37,99,235,0.18)', color: '#60A5FA', letterSpacing: '0.08em' }}>BEHAVIORAL</span>
                    <span className="text-[11px] italic" style={{ color: 'rgba(255,255,255,0.35)' }}>Common at Google L3+</span>
                  </div>
                  <div className="rounded-xl p-4 mb-4" style={{ background: 'rgba(255,255,255,0.04)', borderLeft: '2px solid #2563EB', paddingLeft: 16 }}>
                    <p className="text-[15px] font-semibold leading-relaxed" style={{ color: '#fff' }}>
                      Tell me about a time you had to meet a tight deadline while maintaining code quality. What trade-offs did you make?
                    </p>
                  </div>
                  <div className="rounded-xl p-3 border mb-4" style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(37,99,235,0.3)' }}>
                    <p className="text-[13px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.5)' }}>
                      During my last internship, our team had 3 days to ship a checkout flow before a product launch. I broke the work into parallel tracks — I owned the API layer while a teammate handled the UI...
                    </p>
                    <div className="mt-2 flex items-center gap-1">
                      <div className="h-0.5 flex-1 rounded" style={{ background: 'rgba(37,99,235,0.4)' }} />
                      <span className="text-[9px]" style={{ color: 'rgba(255,255,255,0.2)', fontFamily: 'monospace' }}>typing...</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: 'Situation', rating: 'strong', note: 'Clear timeline & stakes' },
                      { label: 'Task', rating: 'strong', note: 'Ownership well stated' },
                      { label: 'Action', rating: 'okay', note: 'Add more specifics' },
                      { label: 'Result', rating: 'missing', note: 'Quantify the outcome' },
                    ].map(s => (
                      <div key={s.label} className="rounded-lg p-2.5" style={{
                        background: s.rating === 'strong' ? 'rgba(16,185,129,0.1)' : s.rating === 'okay' ? 'rgba(245,158,11,0.1)' : 'rgba(239,68,68,0.08)',
                        border: `1px solid ${s.rating === 'strong' ? 'rgba(16,185,129,0.2)' : s.rating === 'okay' ? 'rgba(245,158,11,0.2)' : 'rgba(239,68,68,0.15)'}`,
                      }}>
                        <p className="text-[10px] font-bold mb-1" style={{ color: s.rating === 'strong' ? '#10B981' : s.rating === 'okay' ? '#F59E0B' : '#EF4444', margin: '0 0 3px' }}>{s.label}</p>
                        <p className="text-[11px]" style={{ color: s.rating === 'strong' ? '#10B981' : s.rating === 'okay' ? '#F59E0B' : '#EF4444', margin: 0, opacity: 0.8 }}>{s.note}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
          <div style={{ height: 80, background: 'linear-gradient(to bottom, #080C14, var(--background))' }} />
        </section>

        {/* ── Product Walkthrough ── */}
        <div id="walkthrough" style={{ scrollMarginTop: 72 }}>
          <ProductWalkthrough />
        </div>

        {/* ── Product metrics bridge ── */}
        <section className="max-w-6xl mx-auto px-6 pb-12">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="grid grid-cols-3 gap-4 rounded-2xl border p-6"
            style={{ background: 'var(--card-bg)', borderColor: 'var(--border-gray)' }}
          >
            {[
              { value: 2400, suffix: '+', label: 'students tracking', icon: <GraduationCap size={16} /> },
              { value: 14000, suffix: '+', label: 'applications tracked on Applyd', icon: <TrendingUp size={16} /> },
              { value: 3, suffix: 'h', label: 'saved per week vs. spreadsheet', icon: <Clock size={16} /> },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <div className="flex items-center justify-center mb-1" style={{ color: 'var(--accent-blue)' }}>{s.icon}</div>
                <div className="text-[28px] font-semibold" style={{ color: 'var(--brand-navy)', letterSpacing: '-0.03em' }}>
                  <AnimatedCounter target={s.value} suffix={s.suffix} />
                </div>
                <p className="text-[12px]" style={{ color: 'var(--muted-text)' }}>{s.label}</p>
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
              2,400+ students. Real pipelines. Real offers.
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

        {/* ── Company outcomes bar ── */}
        <CompanyBar />

        {/* ── Features ── */}
        <section id="features" className="max-w-6xl mx-auto px-6 py-20" style={{ scrollMarginTop: 72 }}>
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="text-center mb-14">
            <h2 className="text-[28px] md:text-[36px] font-semibold mb-3" style={{ color: 'var(--brand-navy)', letterSpacing: '-0.025em' }}>
              The free tier beats a spreadsheet.<br className="hidden sm:block" /> The Pro tier beats everyone else.
            </h2>
            <p className="text-[15px] max-w-lg mx-auto" style={{ color: 'var(--muted-text)' }}>
              Start free — no credit card, no catch. When you&apos;re ready to stop leaving things to chance, there&apos;s Pro.
            </p>
          </motion.div>

          {/* Free features grid */}
          <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }} className="mb-6">
            <div className="flex items-center gap-3 mb-5">
              <span className="text-[11px] font-semibold uppercase tracking-[0.08em] px-3 py-1 rounded-full" style={{ background: 'var(--surface-gray)', color: 'var(--muted-text)', border: '1px solid var(--border-gray)' }}>Free for every student</span>
              <div className="flex-1 h-px" style={{ background: 'var(--border-gray)' }} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {[
                { icon: <LayoutGrid size={15} />, title: 'Kanban pipeline', desc: 'OA, recruiter screen, final round — built for recruiting, not generic task management.' },
                { icon: <Clock size={15} />, title: 'Deadline tracking', desc: 'Amber at 7 days, red at 3. Act Now surfaces urgent items before you miss them.' },
                { icon: <TrendingUp size={15} />, title: 'Response rate', desc: 'Your exact callback rate so you know when to change your approach.' },
                { icon: <Zap size={15} />, title: 'Smart nudges', desc: 'Stalled OA? Missed follow-up? Applyd notices and reminds you so you don\'t have to.' },
                { icon: <Calendar size={15} />, title: 'Calendar view', desc: 'Every deadline and interview in one place, with Google Calendar sync.' },
                { icon: <Target size={15} />, title: 'Today view', desc: 'Next Up, On Deck, and Follow Up — your dashboard knows what needs attention right now.' },
                { icon: <Brain size={15} />, title: '1 free mock interview', desc: 'Pick any company from your pipeline and get a full AI mock interview session — no card needed.' },
              ].map((f, i) => (
                <motion.div key={f.title}
                  initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                  transition={{ duration: 0.35, delay: i * 0.06 }}
                  className="flex items-start gap-3 p-4 rounded-xl border"
                  style={{ background: 'var(--card-bg)', borderColor: 'var(--border-gray)' }}
                >
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: 'var(--surface-gray)', color: 'var(--muted-text)', border: '1px solid var(--border-gray)' }}>
                    {f.icon}
                  </div>
                  <div>
                    <p className="text-[13px] font-semibold mb-0.5" style={{ color: 'var(--brand-navy)' }}>{f.title}</p>
                    <p className="text-[12px] leading-relaxed" style={{ color: 'var(--muted-text)' }}>{f.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
            <p className="mt-4 text-[12px]" style={{ color: 'var(--text-tertiary)' }}>
              No credit card required. Free forever, up to 15 applications.
            </p>
          </motion.div>

          {/* Pro card */}
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.1 }}
            className="rounded-2xl border p-6"
            style={{ background: 'linear-gradient(160deg, rgba(37,99,235,0.06) 0%, var(--card-bg) 60%)', borderColor: 'rgba(37,99,235,0.22)', boxShadow: '0 4px 24px rgba(37,99,235,0.08)' }}
          >
            <div className="grid grid-cols-1 lg:grid-cols-[auto_1fr_auto] gap-6 items-center">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-[11px] font-bold uppercase tracking-[0.1em] px-2.5 py-1 rounded-full" style={{ background: 'linear-gradient(135deg,#1e40af,#2563eb)', color: '#fff' }}>Pro</span>
                  <span className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>AI that works for you</span>
                </div>
                <div className="mb-1">
                  <span className="text-[36px] font-semibold" style={{ color: 'var(--brand-navy)', letterSpacing: '-0.03em' }}>$4</span>
                  <span className="text-[16px]" style={{ color: 'var(--muted-text)' }}>/mo</span>
                </div>
                <p className="text-[12px]" style={{ color: 'var(--text-tertiary)' }}>$48/yr · cancel anytime</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  { icon: <Brain size={12} />, title: 'Unlimited Mock Interviews', desc: 'Unlimited sessions, any company, STAR scoring, voice input, downloadable transcript.' },
                  { icon: <MessageSquare size={12} />, title: 'Interview Intel', desc: 'AI generates the exact questions this company asks the moment you hit interview stage.' },
                  { icon: <Zap size={12} />, title: 'Follow Up Writer', desc: 'Thank you, status check, negotiation, withdrawal — one click, calibrated to your stage.' },
                  { icon: <Target size={12} />, title: 'Strength Signal', desc: 'Know how competitive you are before you invest hours on an application.' },
                  { icon: <TrendingUp size={12} />, title: 'Offer Negotiation Guide', desc: 'Market salary ranges and a word-for-word counter script, automatically.' },
                  { icon: <Calendar size={12} />, title: 'Weekly AI Coach', desc: 'Monday briefing: what\'s stalled, what to prioritize, one thing to do this week.' },
                ].map(f => (
                  <div key={f.title} className="flex items-start gap-2">
                    <div className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: 'rgba(37,99,235,0.12)', color: '#3B82F6' }}>{f.icon}</div>
                    <div>
                      <span className="text-[12px] font-semibold" style={{ color: 'var(--brand-navy)' }}>{f.title}</span>
                      <span className="text-[11px]" style={{ color: 'var(--muted-text)' }}> — {f.desc}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="lg:text-right">
                <Link
                  href={user ? '/dashboard' : '/signup'}
                  onClick={() => capture('landing_pro_cta_click')}
                  className="inline-flex items-center justify-center h-11 px-6 rounded-xl text-[14px] font-semibold text-white transition-opacity hover:opacity-90 whitespace-nowrap"
                  style={{ background: 'linear-gradient(135deg,#1e40af,#2563eb)' }}
                >
                  {user ? 'Upgrade in dashboard →' : 'Start free, upgrade anytime →'}
                </Link>
                <p className="text-[11px] mt-2" style={{ color: 'var(--text-tertiary)' }}>Unlimited apps included</p>
              </div>
            </div>
          </motion.div>
        </section>

        {/* ── How the AI works ── */}
        <section className="max-w-6xl mx-auto px-6 py-16">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="text-center mb-12">
            <h2 className="text-[28px] md:text-[36px] font-semibold mb-3" style={{ color: 'var(--brand-navy)', letterSpacing: '-0.025em' }}>
              The AI that shows up before you realize you need it.
            </h2>
            <p className="text-[15px] max-w-md mx-auto" style={{ color: 'var(--muted-text)' }}>
              You don&apos;t go searching for help. Applyd reads where you are and surfaces the right tool at the right moment.
            </p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                step: '1',
                icon: <LayoutGrid size={18} />,
                title: 'Log your applications in seconds',
                desc: 'Paste a job URL and the autofill handles company, role, and location. Or use the browser extension directly from LinkedIn or Handshake.',
                examples: [],
              },
              {
                step: '2',
                icon: <TrendingUp size={18} />,
                title: 'Move cards as your status changes',
                desc: 'Drag to OA when you get the email. Drag to Final Round when the call is scheduled. The pipeline tracks where you stand across every company at once.',
                examples: [],
              },
              {
                step: '3',
                icon: <Brain size={18} />,
                title: 'AI shows up before you think to ask',
                desc: 'No prompting, no searching. Applyd reads your pipeline and activates the right tool at the exact right moment.',
                examples: [
                  { trigger: 'Move to interviews →', result: 'Interview Intel appears' },
                  { trigger: 'Receive an offer →', result: 'Negotiation Guide activates' },
                  { trigger: 'Monday morning →', result: 'Weekly Coach arrives' },
                ],
              },
            ].map((s, i) => (
              <motion.div key={s.step}
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.12 }}
                className="rounded-xl border p-6 flex flex-col gap-4"
                style={{ background: 'var(--card-bg)', borderColor: 'var(--border-gray)' }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'var(--accent-blue)', color: '#fff' }}>{s.icon}</div>
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-[12px] font-bold" style={{ background: 'var(--surface-gray)', color: 'var(--muted-text)', border: '1px solid var(--border-gray)' }}>
                    {s.step}
                  </div>
                </div>
                <div>
                  <h3 className="text-[14px] font-semibold leading-snug mb-2" style={{ color: 'var(--brand-navy)' }}>{s.title}</h3>
                  <p className="text-[13px] leading-relaxed" style={{ color: 'var(--muted-text)' }}>{s.desc}</p>
                </div>
                {s.examples.length > 0 && (
                  <div className="space-y-2 pt-2 border-t" style={{ borderColor: 'var(--border-gray)' }}>
                    {s.examples.map(ex => (
                      <div key={ex.trigger} className="flex items-center gap-2 text-[11px]">
                        <span style={{ color: 'var(--muted-text)' }}>{ex.trigger}</span>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--accent-blue)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
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
            <div className="grid grid-cols-4 border-b" style={{ borderColor: 'var(--border-gray)', background: 'var(--surface-gray)' }}>
              <div className="p-4 text-[11px] font-semibold uppercase tracking-[0.08em]" style={{ color: 'var(--muted-text)' }}>Feature</div>
              {['Spreadsheet', 'Notion template', 'Applyd'].map((col, i) => (
                <div key={col} className="p-4 text-center border-l" style={{ borderColor: 'var(--border-gray)' }}>
                  <span className="text-[12px] font-semibold" style={{ color: i === 2 ? 'var(--accent-blue)' : 'var(--muted-text)' }}>{col}</span>
                </div>
              ))}
            </div>

            {[
              { feature: 'Recruiting-native stages (OA, Superday, Recruiter Screen)', vals: [false, false, true] },
              { feature: 'Automatic deadline alerts', vals: [false, false, true] },
              { feature: 'Today view — surfaces what needs attention right now', vals: [false, false, true] },
              { feature: 'Response rate analytics', vals: [false, false, true] },
              { feature: 'Works on mobile', vals: ['Broken', 'Barely', true] },
              { feature: 'AI mock interview (practice sessions)', vals: ['1 free', false, 'Unlimited'] },
              { feature: 'AI interview intel — auto-activated at interview stage', vals: [false, false, true] },
              { feature: 'AI follow-up email generator', vals: [false, false, true] },
              { feature: 'AI offer negotiation guide', vals: [false, false, true] },
              { feature: 'Weekly AI recruiting coach', vals: [false, false, true] },
              { feature: 'Zero setup', vals: [false, false, true] },
              { feature: 'Free to start', vals: [true, true, true] },
            ].map((row, ri) => (
              <div
                key={row.feature}
                className="grid grid-cols-4 border-b last:border-b-0"
                style={{ borderColor: 'var(--border-gray)', background: ri % 2 === 0 ? 'var(--card-bg)' : 'transparent' }}
              >
                <div className="p-4 text-[13px]" style={{ color: 'var(--brand-navy)' }}>{row.feature}</div>
                {row.vals.map((val, vi) => (
                  <div key={vi} className="p-4 flex items-center justify-center border-l" style={{ borderColor: 'var(--border-gray)' }}>
                    {val === true ? (
                      <span className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ background: vi === 2 ? 'rgba(22,163,74,0.12)' : 'rgba(22,163,74,0.08)' }}>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
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

        {/* ── Final CTA ── */}
        <FinalCTA user={user} />

        {/* ── Footer ── */}
        <footer className="border-t border-border-gray py-8" style={{ background: '#060810' }}>
          <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2" style={{ opacity: 0.4 }}>
              <Logo size={20} variant="dark" />
              <span className="text-[13px] font-semibold" style={{ color: '#fff', letterSpacing: '-0.02em' }}>Applyd</span>
            </div>
            <div className="flex items-center gap-6 flex-wrap justify-center">
              <Link href="/help" className="text-[12px] font-medium transition-colors" style={{ color: 'rgba(255,255,255,0.4)' }}>Help & FAQ</Link>
              <Link href="/contact" className="text-[12px] font-medium transition-colors" style={{ color: 'rgba(255,255,255,0.4)' }}>Contact</Link>
              <Link href="/privacy" className="text-[12px] font-medium transition-colors" style={{ color: 'rgba(255,255,255,0.4)' }}>Privacy</Link>
              <Link href="/terms" className="text-[12px] font-medium transition-colors" style={{ color: 'rgba(255,255,255,0.4)' }}>Terms</Link>
              <span className="text-[12px]" style={{ color: 'rgba(255,255,255,0.2)' }}>© {new Date().getFullYear()} Applyd</span>
              <LocaleSwitcher />
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
