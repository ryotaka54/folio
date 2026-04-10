'use client';

import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { ProLogo } from '@/components/ProLogo';
import { capture } from '@/lib/analytics';

// ─── Step definitions ────────────────────────────────────────────────────────

type StepType = 'modal' | 'spotlight';

interface ProTourStep {
  id: string;
  type: StepType;
  targetId?: string;       // data-pro-tour-id on the DOM element
  fallbackId?: string;
  title: string;
  body: React.ReactNode;
  includeOnMobile: boolean;
}

// ─── Mini UI mockups used in modal steps ─────────────────────────────────────

function InterviewIntelMockup() {
  return (
    <div style={{ borderRadius: 10, border: '1px solid rgba(37,99,235,0.2)', background: 'rgba(37,99,235,0.04)', padding: '12px 14px', marginBottom: 4 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <span style={{ fontSize: 14 }}>🧠</span>
        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--brand-navy)' }}>Interview Intel</span>
        <span style={{ marginLeft: 'auto', fontSize: 10, fontWeight: 700, color: '#2563eb', background: 'rgba(37,99,235,0.1)', borderRadius: 4, padding: '2px 6px' }}>Active</span>
      </div>
      {[
        { q: 'Walk me through a time you handled ambiguity under pressure.' },
        { q: 'How do you approach system design for scale?' },
        { q: 'What draws you specifically to this role at this company?' },
      ].map((item, i) => (
        <div key={i} style={{ fontSize: 11, color: 'var(--muted-text)', padding: '6px 0', borderTop: i > 0 ? '1px solid var(--border-gray)' : undefined }}>
          {item.q}
        </div>
      ))}
    </div>
  );
}

function FollowUpMockup() {
  return (
    <div style={{ borderRadius: 10, border: '1px solid var(--border-gray)', background: 'var(--surface-gray)', padding: '12px 14px', marginBottom: 4 }}>
      <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
        {['Thank you', 'Status check', 'Negotiation', 'Withdraw'].map(label => (
          <div key={label} style={{ fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 6, background: label === 'Thank you' ? 'var(--accent-blue)' : 'var(--background)', color: label === 'Thank you' ? '#fff' : 'var(--muted-text)', border: '1px solid var(--border-gray)' }}>
            {label}
          </div>
        ))}
      </div>
      <div style={{ fontSize: 11, color: 'var(--muted-text)', lineHeight: 1.5 }}>
        <span style={{ color: 'var(--brand-navy)', fontWeight: 600 }}>Subject:</span> Thank you — Software Engineer interview at Stripe<br />
        <br />
        Hi Sarah, thank you so much for taking the time…
      </div>
      <div style={{ marginTop: 8, textAlign: 'right' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600, color: '#fff', background: 'var(--accent-blue)', borderRadius: 6, padding: '4px 10px' }}>
          Copy email
        </div>
      </div>
    </div>
  );
}

function OfferMockup() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 4 }}>
      <div style={{ borderRadius: 10, border: '1px solid rgba(22,163,74,0.25)', background: 'rgba(22,163,74,0.04)', padding: '11px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <span style={{ fontSize: 13 }}>💰</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--brand-navy)' }}>Offer Negotiation Guide</span>
        </div>
        <div style={{ fontSize: 11, color: 'var(--muted-text)', lineHeight: 1.5 }}>
          Market range for SWE at Stripe, SF: <span style={{ color: 'var(--brand-navy)', fontWeight: 600 }}>$165k–$210k</span>. Your offer of $170k sits in the 35th percentile. Counter at $195k — here's the script…
        </div>
      </div>
      <div style={{ borderRadius: 10, border: '1px solid rgba(124,58,237,0.2)', background: 'rgba(124,58,237,0.04)', padding: '11px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <span style={{ fontSize: 13 }}>📊</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--brand-navy)' }}>Strength Signal</span>
          <span style={{ marginLeft: 'auto', fontSize: 10, fontWeight: 700, color: 'var(--muted-text)' }}>on add</span>
        </div>
        <div style={{ fontSize: 11, color: 'var(--muted-text)' }}>
          Your profile is a <span style={{ color: '#7C3AED', fontWeight: 600 }}>strong match</span> — 3 of 4 required skills found, CS degree aligns. Estimated response rate: 35–45%.
        </div>
      </div>
    </div>
  );
}

// ─── Steps ───────────────────────────────────────────────────────────────────

const PRO_STEPS: ProTourStep[] = [
  {
    id: 'welcome',
    type: 'modal',
    title: '',
    body: null, // handled specially
    includeOnMobile: true,
  },
  {
    id: 'weekly-coach',
    type: 'spotlight',
    targetId: 'weekly-coach',
    fallbackId: 'stats-bar',
    title: 'Your Monday morning AI coach',
    body: 'Every Monday, Applyd reads your real pipeline data and writes a personalized briefing — what\'s stalled, what to prioritize, and one concrete thing you should do this week. No prompting. It just arrives.',
    includeOnMobile: true,
  },
  {
    id: 'interview-intel',
    type: 'modal',
    title: 'Interview Intel — auto-activated',
    body: <InterviewIntelMockup />,
    includeOnMobile: true,
  },
  {
    id: 'follow-up-email',
    type: 'modal',
    title: 'Follow-Up Writer — one click',
    body: <FollowUpMockup />,
    includeOnMobile: true,
  },
  {
    id: 'offer-intel',
    type: 'modal',
    title: 'Offer Negotiation + Strength Signal',
    body: <OfferMockup />,
    includeOnMobile: true,
  },
  {
    id: 'done',
    type: 'modal',
    title: '',
    body: null, // handled specially
    includeOnMobile: true,
  },
];

// ─── Modal descriptions (for non-welcome, non-done modals) ────────────────────

const MODAL_DESCS: Record<string, string> = {
  'interview-intel': 'The moment you move an application to any interview stage, this panel appears inside the application drawer — company-specific behavioral, technical, and role questions generated automatically. No prompting needed.',
  'follow-up-email': 'From any open application, tap the Email button in the top-right corner of the drawer. Choose the type, and Applyd writes a polished, context-aware email using the company, role, and recruiter info you\'ve already saved.',
  'offer-intel': 'When an offer lands, the Offer Negotiation Guide activates with salary benchmarks and a word-for-word counter script. The Strength Signal appears the moment you add any new application — so you know how competitive you are before investing more time.',
};

// ─── Spotlight geometry helpers (same logic as TutorialOverlay) ───────────────

interface SpotRect { left: number; top: number; width: number; height: number; br: number }

function getTooltipPos(spot: SpotRect, vpW: number, vpH: number) {
  const TW = 320; const GAP = 20; const PAD = 12;
  const spaceRight  = vpW - (spot.left + spot.width);
  const spaceLeft   = spot.left;
  const spaceBottom = vpH - (spot.top  + spot.height);
  if (spaceRight >= TW + GAP) return { left: spot.left + spot.width + GAP, top: Math.max(PAD, Math.min(spot.top, vpH - 300 - PAD)) };
  if (spaceLeft  >= TW + GAP) return { left: spot.left - TW - GAP,          top: Math.max(PAD, Math.min(spot.top, vpH - 300 - PAD)) };
  if (spaceBottom >= 240 + GAP) return { left: Math.max(PAD, Math.min(spot.left + spot.width / 2 - TW / 2, vpW - TW - PAD)), top: spot.top + spot.height + GAP };
  return { left: Math.max(PAD, Math.min(spot.left + spot.width / 2 - TW / 2, vpW - TW - PAD)), top: Math.max(PAD, spot.top - 260 - GAP) };
}

// ─── Welcome modal ────────────────────────────────────────────────────────────

const FEATURE_LIST = [
  { icon: '🧠', name: 'Interview Intel', when: 'Auto-activates when you advance to interviews' },
  { icon: '✉️', name: 'Follow-Up Writer', when: 'One-click from any application drawer' },
  { icon: '📊', name: 'Strength Signal',  when: 'Auto-activates when you add a new application' },
  { icon: '💰', name: 'Offer Negotiation Guide', when: 'Auto-activates when an offer arrives' },
  { icon: '📅', name: 'Weekly AI Coach', when: 'Arrives every Monday morning' },
];

function WelcomeModal({ onStart, onSkip }: { onStart: () => void; onSkip: () => void }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(6px)' }} aria-hidden />
      <div
        role="dialog" aria-modal aria-label="Welcome to Applyd Pro"
        style={{ position: 'relative', width: '100%', maxWidth: 460, background: 'var(--card-bg)', border: '1px solid var(--border-gray)', borderRadius: 18, overflow: 'hidden', boxShadow: '0 32px 80px rgba(0,0,0,0.4)', animation: 'pro-tour-in 280ms cubic-bezier(0.34,1.2,0.64,1) both' }}
      >
        <style>{`
          @keyframes pro-tour-in { from { opacity:0; transform:scale(0.94) translateY(10px) } to { opacity:1; transform:scale(1) translateY(0) } }
          @keyframes pro-tour-star { 0%{opacity:0;transform:scale(0) translateY(0)} 40%{opacity:1;transform:scale(1) translateY(-18px)} 100%{opacity:0;transform:scale(0.4) translateY(-52px)} }
        `}</style>

        {/* Header */}
        <div style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)', padding: '26px 26px 20px', position: 'relative', overflow: 'hidden' }}>
          {/* Subtle star particles */}
          {[...Array(12)].map((_, i) => (
            <div key={i} aria-hidden style={{ position: 'absolute', left: `${8 + i * 8}%`, top: `${20 + (i % 3) * 25}%`, width: 3 + (i % 2) * 2, height: 3 + (i % 2) * 2, borderRadius: '50%', background: '#C9A84C', animation: `pro-tour-star ${1.5 + (i % 4) * 0.4}s ease-out ${i * 0.12}s both` }} />
          ))}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
            <ProLogo size={44} />
          </div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#fff', letterSpacing: '-0.03em', textAlign: 'center', marginBottom: 6 }}>
            Your AI suite is live.
          </h1>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', textAlign: 'center', lineHeight: 1.5 }}>
            Five features just activated in your account. Let&apos;s take a 60-second tour so you know exactly how to use each one.
          </p>
        </div>

        {/* Feature list */}
        <div style={{ padding: '18px 22px 0' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {FEATURE_LIST.map(f => (
              <div key={f.name} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '9px 12px', borderRadius: 10, background: 'var(--surface-gray)', border: '1px solid var(--border-gray)' }}>
                <span style={{ fontSize: 17, flexShrink: 0 }}>{f.icon}</span>
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--brand-navy)', marginBottom: 1 }}>{f.name}</p>
                  <p style={{ fontSize: 11, color: 'var(--text-tertiary)', lineHeight: 1.3 }}>{f.when}</p>
                </div>
                <div style={{ marginLeft: 'auto', flexShrink: 0, width: 16, height: 16, borderRadius: '50%', background: 'rgba(22,163,74,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div style={{ padding: '16px 22px 20px', display: 'flex', gap: 10 }}>
          <button
            onClick={onStart}
            autoFocus
            style={{ flex: 1, height: 42, borderRadius: 10, background: 'linear-gradient(135deg,#1e40af,#2563eb)', color: '#fff', border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer', letterSpacing: '-0.01em' }}
          >
            Take the tour →
          </button>
          <button
            onClick={onSkip}
            style={{ height: 42, padding: '0 16px', borderRadius: 10, background: 'var(--surface-gray)', color: 'var(--muted-text)', border: '1px solid var(--border-gray)', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}
          >
            Skip
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Done modal ────────────────────────────────────────────────────────────────

function DoneModal({ onClose }: { onClose: () => void }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)' }} onClick={onClose} aria-hidden />
      <div
        role="dialog" aria-modal aria-label="Pro tour complete"
        style={{ position: 'relative', width: '100%', maxWidth: 400, background: 'var(--card-bg)', border: '1px solid var(--border-gray)', borderRadius: 18, padding: '28px 26px', boxShadow: '0 24px 64px rgba(0,0,0,0.35)', animation: 'pro-tour-in 280ms cubic-bezier(0.34,1.2,0.64,1) both', textAlign: 'center' }}
      >
        <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(22,163,74,0.1)', border: '2px solid rgba(22,163,74,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
        </div>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--brand-navy)', letterSpacing: '-0.025em', marginBottom: 8 }}>
          You&apos;re all set.
        </h2>
        <p style={{ fontSize: 13, color: 'var(--muted-text)', lineHeight: 1.6, marginBottom: 22 }}>
          The AI features activate automatically as your applications move through stages — nothing to configure. Add your first application and let Applyd go to work.
        </p>
        <button
          onClick={onClose}
          autoFocus
          style={{ width: '100%', height: 42, borderRadius: 10, background: 'var(--accent-blue)', color: '#fff', border: 'none', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}
        >
          Start tracking
        </button>
        <p style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 10 }}>
          Your first Weekly Coach briefing arrives Monday morning.
        </p>
      </div>
    </div>
  );
}

// ─── Spotlight tooltip (desktop) ──────────────────────────────────────────────

function SpotTooltip({
  step, stepIndex, totalSteps, spotRect, onNext, onPrev, onSkip, isLast,
}: {
  step: ProTourStep; stepIndex: number; totalSteps: number;
  spotRect: SpotRect; onNext: () => void; onPrev: () => void; onSkip: () => void; isLast: boolean;
}) {
  const [vpW, setVpW] = useState(0);
  const [vpH, setVpH] = useState(0);
  useEffect(() => {
    const upd = () => { setVpW(window.innerWidth); setVpH(window.innerHeight); };
    upd(); window.addEventListener('resize', upd); return () => window.removeEventListener('resize', upd);
  }, []);
  const pos = useMemo(() => vpW && vpH ? getTooltipPos(spotRect, vpW, vpH) : { left: 0, top: 0 }, [spotRect, vpW, vpH]);

  return (
    <div
      role="dialog" aria-modal aria-label={`Pro tour step ${stepIndex + 1}: ${step.title}`}
      style={{ position: 'fixed', left: pos.left, top: pos.top, width: 320, zIndex: 9302, background: 'var(--card-bg)', border: '1px solid rgba(37,99,235,0.3)', borderRadius: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.2)', padding: '16px 18px', animation: 'pro-tour-in 200ms ease' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--accent-blue)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>Pro feature · {stepIndex + 1} of {totalSteps}</span>
        <span style={{ fontSize: 9, fontWeight: 700, color: '#C9A84C', background: 'rgba(201,168,76,0.12)', border: '1px solid rgba(201,168,76,0.3)', borderRadius: 4, padding: '2px 5px', letterSpacing: '0.06em' }}>PRO</span>
      </div>
      <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--brand-navy)', letterSpacing: '-0.015em', lineHeight: 1.3, marginBottom: 8 }}>{step.title}</p>
      <p style={{ fontSize: 13, color: 'var(--muted-text)', lineHeight: 1.55, marginBottom: 16 }}>{step.body as string}</p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button onClick={onPrev} style={{ height: 32, padding: '0 12px', fontSize: 12, fontWeight: 500, borderRadius: 6, border: '1px solid var(--border-gray)', background: 'var(--surface-gray)', color: 'var(--muted-text)', cursor: 'pointer', flexShrink: 0 }}>← Back</button>
        <button onClick={onNext} autoFocus style={{ marginLeft: 'auto', height: 32, padding: '0 14px', fontSize: 12, fontWeight: 600, borderRadius: 6, background: 'var(--accent-blue)', color: '#fff', border: 'none', cursor: 'pointer', flexShrink: 0 }}>{isLast ? 'Done' : 'Next →'}</button>
      </div>
      <button onClick={onSkip} style={{ display: 'block', width: '100%', marginTop: 10, textAlign: 'center', fontSize: 11, color: 'var(--text-tertiary)', background: 'none', border: 'none', cursor: 'pointer' }}>Skip tour</button>
    </div>
  );
}

// ─── Mid-tour modal card (for in-drawer features) ─────────────────────────────

function FeatureModal({
  step, stepIndex, totalSteps, onNext, onPrev, onSkip, isLast,
}: {
  step: ProTourStep; stepIndex: number; totalSteps: number;
  onNext: () => void; onPrev: () => void; onSkip: () => void; isLast: boolean;
}) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} aria-hidden />
      <div
        role="dialog" aria-modal aria-label={`Pro tour: ${step.title}`}
        style={{ position: 'relative', width: '100%', maxWidth: 420, background: 'var(--card-bg)', border: '1px solid rgba(37,99,235,0.2)', borderRadius: 16, padding: '22px 22px 20px', boxShadow: '0 24px 60px rgba(0,0,0,0.3)', animation: 'pro-tour-in 240ms cubic-bezier(0.34,1.2,0.64,1) both' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--accent-blue)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>Pro feature · {stepIndex + 1} of {totalSteps}</span>
          <span style={{ fontSize: 9, fontWeight: 700, color: '#C9A84C', background: 'rgba(201,168,76,0.12)', border: '1px solid rgba(201,168,76,0.3)', borderRadius: 4, padding: '2px 5px', letterSpacing: '0.06em' }}>PRO</span>
        </div>
        <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--brand-navy)', letterSpacing: '-0.02em', marginBottom: 10 }}>{step.title}</p>

        {/* Mini UI mockup */}
        {step.body}

        <p style={{ fontSize: 13, color: 'var(--muted-text)', lineHeight: 1.55, marginBottom: 18 }}>
          {MODAL_DESCS[step.id]}
        </p>

        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={onPrev} style={{ height: 40, padding: '0 14px', fontSize: 13, fontWeight: 500, borderRadius: 8, border: '1px solid var(--border-gray)', background: 'var(--surface-gray)', color: 'var(--muted-text)', cursor: 'pointer' }}>← Back</button>
          <button onClick={onNext} autoFocus style={{ flex: 1, height: 40, fontSize: 13, fontWeight: 700, borderRadius: 8, background: 'var(--accent-blue)', color: '#fff', border: 'none', cursor: 'pointer' }}>{isLast ? 'Finish' : 'Next →'}</button>
        </div>
        <button onClick={onSkip} style={{ display: 'block', width: '100%', marginTop: 10, textAlign: 'center', fontSize: 11, color: 'var(--text-tertiary)', background: 'none', border: 'none', cursor: 'pointer' }}>Skip tour</button>
      </div>
    </div>
  );
}

// ─── Mobile bottom sheet ──────────────────────────────────────────────────────

function MobileSheet({
  step, stepIndex, totalSteps, onNext, onPrev, onSkip, isLast,
}: {
  step: ProTourStep; stepIndex: number; totalSteps: number;
  onNext: () => void; onPrev: () => void; onSkip: () => void; isLast: boolean;
}) {
  const isWelcome = step.id === 'welcome';
  const isDone = step.id === 'done';

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9300, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(3px)', animation: 'pro-tour-backdrop 200ms ease' }} onClick={!isWelcome ? onSkip : undefined} aria-hidden />
      <style>{`@keyframes pro-tour-backdrop{from{opacity:0}to{opacity:1}} @keyframes pro-tour-sheet{from{transform:translateY(100%)}to{transform:translateY(0)}}`}</style>
      <div
        role="dialog" aria-modal aria-label={`Pro tour: ${step.title || (isWelcome ? 'Welcome to Pro' : 'Done')}`}
        style={{ position: 'relative', background: 'var(--card-bg)', borderTop: '1px solid var(--border-gray)', borderRadius: '16px 16px 0 0', padding: '20px 20px calc(24px + env(safe-area-inset-bottom))', animation: 'pro-tour-sheet 280ms cubic-bezier(0.32, 0.72, 0, 1)', maxHeight: '90vh', overflowY: 'auto' }}
      >
        {/* Drag handle */}
        <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--border-emphasis)', margin: '0 auto 18px' }} />

        {isWelcome ? (
          <>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
              <ProLogo size={36} />
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--brand-navy)', textAlign: 'center', letterSpacing: '-0.025em', marginBottom: 6 }}>Your AI suite is live.</h2>
            <p style={{ fontSize: 13, color: 'var(--muted-text)', textAlign: 'center', lineHeight: 1.5, marginBottom: 16 }}>5 AI features just activated. Take a quick tour to see how each one works.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginBottom: 18 }}>
              {FEATURE_LIST.map(f => (
                <div key={f.name} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 10, background: 'var(--surface-gray)', border: '1px solid var(--border-gray)' }}>
                  <span style={{ fontSize: 16 }}>{f.icon}</span>
                  <div>
                    <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--brand-navy)' }}>{f.name}</p>
                    <p style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{f.when}</p>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={onNext} autoFocus style={{ flex: 1, height: 44, borderRadius: 10, background: 'linear-gradient(135deg,#1e40af,#2563eb)', color: '#fff', border: 'none', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>Take the tour →</button>
              <button onClick={onSkip} style={{ height: 44, padding: '0 16px', borderRadius: 10, background: 'var(--surface-gray)', color: 'var(--muted-text)', border: '1px solid var(--border-gray)', fontSize: 13, cursor: 'pointer' }}>Skip</button>
            </div>
          </>
        ) : isDone ? (
          <>
            <div style={{ textAlign: 'center', marginBottom: 18 }}>
              <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(22,163,74,0.1)', border: '2px solid rgba(22,163,74,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
              </div>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--brand-navy)', letterSpacing: '-0.025em', marginBottom: 8 }}>You&apos;re all set.</h2>
              <p style={{ fontSize: 13, color: 'var(--muted-text)', lineHeight: 1.6 }}>The AI activates automatically as your applications move through stages. Add your first app and let it go to work.</p>
            </div>
            <button onClick={onNext} autoFocus style={{ width: '100%', height: 44, borderRadius: 10, background: 'var(--accent-blue)', color: '#fff', border: 'none', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>Start tracking</button>
            <p style={{ fontSize: 11, color: 'var(--text-tertiary)', textAlign: 'center', marginTop: 10 }}>Your first Weekly Coach briefing arrives Monday morning.</p>
          </>
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--accent-blue)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Pro feature · {stepIndex + 1} of {totalSteps}</span>
              <span style={{ fontSize: 9, fontWeight: 700, color: '#C9A84C', background: 'rgba(201,168,76,0.12)', border: '1px solid rgba(201,168,76,0.3)', borderRadius: 4, padding: '2px 5px' }}>PRO</span>
            </div>
            <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--brand-navy)', letterSpacing: '-0.02em', marginBottom: 12 }}>{step.title}</p>
            {step.body}
            <p style={{ fontSize: 13, color: 'var(--muted-text)', lineHeight: 1.55, marginBottom: 18 }}>
              {MODAL_DESCS[step.id] ?? step.body}
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={onPrev} style={{ height: 44, padding: '0 16px', borderRadius: 10, background: 'var(--surface-gray)', color: 'var(--muted-text)', border: '1px solid var(--border-gray)', fontSize: 13, cursor: 'pointer' }}>← Back</button>
              <button onClick={onNext} autoFocus style={{ flex: 1, height: 44, borderRadius: 10, background: 'var(--accent-blue)', color: '#fff', border: 'none', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>{isLast ? 'Finish' : 'Next →'}</button>
            </div>
            <button onClick={onSkip} style={{ display: 'block', width: '100%', marginTop: 12, textAlign: 'center', fontSize: 12, color: 'var(--text-tertiary)', background: 'none', border: 'none', cursor: 'pointer' }}>Skip tour</button>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface ProTourProps {
  onDone: () => void;
}

export default function ProTour({ onDone }: ProTourProps) {
  const [step, setStep] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [spotRect, setSpotRect] = useState<SpotRect>({ left: -400, top: -400, width: 0, height: 0, br: 8 });
  const [spotVisible, setSpotVisible] = useState(false);
  const posRafRef = useRef<number | null>(null);

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check(); window.addEventListener('resize', check); return () => window.removeEventListener('resize', check);
  }, []);

  const activeSteps = useMemo(
    () => isMobile ? PRO_STEPS.filter(s => s.includeOnMobile) : PRO_STEPS,
    [isMobile]
  );

  const currentStep = activeSteps[step] ?? null;
  const totalSteps = activeSteps.length;
  const isLast = step === totalSteps - 1;

  const handleDone = useCallback(() => {
    capture('pro_tour_completed', { total_steps: totalSteps });
    localStorage.setItem('pro_tour_shown', '1');
    onDone();
  }, [onDone, totalSteps]);

  const handleSkip = useCallback(() => {
    capture('pro_tour_skipped', { at_step: step, step_id: currentStep?.id });
    localStorage.setItem('pro_tour_shown', '1');
    onDone();
  }, [onDone, step, currentStep]);

  const next = useCallback(() => {
    if (isLast || currentStep?.id === 'done') { handleDone(); return; }
    setStep(s => s + 1);
  }, [isLast, currentStep, handleDone]);

  const prev = useCallback(() => {
    setStep(s => Math.max(0, s - 1));
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleSkip();
      if (e.key === 'ArrowRight') next();
      if (e.key === 'ArrowLeft') prev();
    };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [handleSkip, next, prev]);

  // Spotlight positioning
  useEffect(() => {
    if (!mounted || !currentStep || currentStep.type !== 'spotlight') {
      setSpotVisible(false);
      return;
    }

    setSpotVisible(false);

    const find = () => {
      let el = currentStep.targetId ? document.querySelector<HTMLElement>(`[data-tutorial-id="${currentStep.targetId}"]`) : null;
      if (!el && currentStep.fallbackId) el = document.querySelector<HTMLElement>(`[data-tutorial-id="${currentStep.fallbackId}"]`);
      if (!el) { next(); return; }

      el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });

      const t = setTimeout(() => {
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const br = parseFloat(window.getComputedStyle(el).borderRadius) || 6;
        setSpotRect({ left: rect.left - 6, top: rect.top - 6, width: rect.width + 12, height: rect.height + 12, br: br + 4 });
        setSpotVisible(true);
      }, 400);

      return () => clearTimeout(t);
    };

    return find();
  }, [mounted, currentStep, step, next]);

  // Resize handler for spotlight
  useEffect(() => {
    if (!currentStep || currentStep.type !== 'spotlight') return;
    const onResize = () => {
      if (posRafRef.current) cancelAnimationFrame(posRafRef.current);
      posRafRef.current = requestAnimationFrame(() => {
        const el = currentStep.targetId ? document.querySelector<HTMLElement>(`[data-tutorial-id="${currentStep.targetId}"]`) : null;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        setSpotRect(p => ({ ...p, left: rect.left - 6, top: rect.top - 6, width: rect.width + 12, height: rect.height + 12 }));
      });
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [currentStep]);

  if (!mounted || !currentStep) return null;

  const isWelcome = currentStep.id === 'welcome';
  const isDone = currentStep.id === 'done';
  const isSpotlight = currentStep.type === 'spotlight';

  // Progress bar value (excludes welcome and done from count)
  const contentSteps = activeSteps.filter(s => s.id !== 'welcome' && s.id !== 'done');
  const contentIdx = contentSteps.findIndex(s => s.id === currentStep.id);

  return createPortal(
    <>
      <style>{`
        @keyframes pro-tour-in { from{opacity:0;transform:scale(0.94) translateY(8px)} to{opacity:1;transform:scale(1) translateY(0)} }
        @keyframes pro-tour-backdrop{from{opacity:0}to{opacity:1}}
        @keyframes pro-tour-sheet{from{transform:translateY(100%)}to{transform:translateY(0)}}
        @keyframes pro-tour-star{0%{opacity:0;transform:scale(0) translateY(0)}40%{opacity:1;transform:scale(1) translateY(-18px)}100%{opacity:0;transform:scale(0.4) translateY(-52px)}}
      `}</style>

      {/* Mobile */}
      {isMobile && (
        <MobileSheet
          step={currentStep}
          stepIndex={step}
          totalSteps={totalSteps}
          onNext={next}
          onPrev={prev}
          onSkip={handleSkip}
          isLast={isLast}
        />
      )}

      {/* Desktop welcome */}
      {!isMobile && isWelcome && <WelcomeModal onStart={next} onSkip={handleSkip} />}

      {/* Desktop done */}
      {!isMobile && isDone && <DoneModal onClose={handleDone} />}

      {/* Desktop spotlight */}
      {!isMobile && isSpotlight && (
        <>
          {/* Scrim with cutout */}
          <svg
            style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', zIndex: 9301, pointerEvents: 'none', opacity: spotVisible ? 1 : 0, transition: 'opacity 200ms ease' }}
            aria-hidden
          >
            <defs>
              <mask id="pro-tour-mask">
                <rect width="100%" height="100%" fill="white" />
                <rect
                  x={spotRect.left} y={spotRect.top}
                  width={spotRect.width} height={spotRect.height}
                  rx={spotRect.br} fill="black"
                />
              </mask>
            </defs>
            <rect width="100%" height="100%" fill="rgba(0,0,0,0.55)" mask="url(#pro-tour-mask)" />
            {/* Blue highlight ring */}
            <rect
              x={spotRect.left} y={spotRect.top}
              width={spotRect.width} height={spotRect.height}
              rx={spotRect.br} fill="none"
              stroke="#2563eb" strokeWidth="2"
              style={{ opacity: spotVisible ? 0.7 : 0 }}
            />
          </svg>

          {/* Tooltip */}
          {spotVisible && (
            <SpotTooltip
              step={currentStep}
              stepIndex={step}
              totalSteps={totalSteps}
              spotRect={spotRect}
              onNext={next}
              onPrev={prev}
              onSkip={handleSkip}
              isLast={isLast}
            />
          )}
        </>
      )}

      {/* Desktop feature modals (mid-tour) */}
      {!isMobile && !isWelcome && !isDone && !isSpotlight && (
        <FeatureModal
          step={currentStep}
          stepIndex={step}
          totalSteps={totalSteps}
          onNext={next}
          onPrev={prev}
          onSkip={handleSkip}
          isLast={isLast}
        />
      )}

      {/* Progress dots (non-welcome, non-done, desktop) */}
      {!isMobile && !isWelcome && !isDone && contentIdx >= 0 && (
        <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 9302, display: 'flex', gap: 6, pointerEvents: 'none' }}>
          {contentSteps.map((s, i) => (
            <div key={s.id} style={{ width: i === contentIdx ? 20 : 6, height: 6, borderRadius: 3, background: i === contentIdx ? 'var(--accent-blue)' : 'rgba(255,255,255,0.35)', transition: 'all 250ms ease' }} />
          ))}
        </div>
      )}
    </>,
    document.body
  );
}
