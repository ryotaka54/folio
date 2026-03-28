'use client';

import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useTutorial } from '@/lib/tutorial-context';
import { useAuth } from '@/lib/auth-context';

// TODO: Replace with real Chrome Web Store URL when extension is published
const EXTENSION_URL = 'https://chromewebstore.google.com/detail/applyd';

// ─── Step definitions ────────────────────────────────────────────────────────

interface TutorialStep {
  id: string;
  type: 'modal' | 'spotlight';
  fallbackId?: string;
  title: string;
  description: string;
  includeOnMobile: boolean;
}

const STEPS: TutorialStep[] = [
  {
    id: 'welcome',
    type: 'modal',
    title: 'Welcome to Applyd',
    description: '',
    includeOnMobile: true,
  },
  {
    id: 'stats-bar',
    type: 'spotlight',
    title: 'Your recruiting at a glance',
    description: 'These four cards update in real time as you add and move applications. Total shows everything you have logged. Response Rate shows how many companies have responded. Interviews tracks your active interview pipeline. Act Now highlights deadlines coming up this week so nothing slips through.',
    includeOnMobile: true,
  },
  {
    id: 'funnel-chart',
    type: 'spotlight',
    fallbackId: 'stats-bar',
    title: 'Your path to an offer',
    description: 'This chart shows how your applications are converting through each stage. As you move applications forward the bars update automatically. The goal is to see that Interviews bar grow.',
    includeOnMobile: false,
  },
  {
    id: 'view-toggle',
    type: 'spotlight',
    title: 'Two ways to see your apps',
    description: 'Pipeline view shows your applications as cards organized by stage — great for a visual overview. Table view shows everything in a sortable list — great for scanning and sorting by deadline or company name. Switch between them anytime.',
    includeOnMobile: false,
  },
  {
    id: 'pipeline-board',
    type: 'spotlight',
    title: 'Your application pipeline',
    description: 'Each column is a stage in your recruiting journey. Drag cards between columns as your status updates or click any card to edit it. The colored dots help you scan stages instantly.',
    includeOnMobile: true,
  },
  {
    id: 'first-card',
    type: 'spotlight',
    fallbackId: 'pipeline-board',
    title: 'Every application in one card',
    description: 'Each card shows the company, role, and deadline at a glance. Cards with amber badges mean a deadline is coming up soon. Red means overdue. Click any card to see full details, add notes, or store recruiter contact information.',
    includeOnMobile: false,
  },
  {
    id: 'add-button',
    type: 'spotlight',
    title: 'Log an application in seconds',
    description: 'Click here to add a new application. You only need a company name and role to get started — everything else is optional. The fastest way to stay on top of your search is to log every application the moment you submit it.',
    includeOnMobile: true,
  },
  {
    id: 'search-input',
    type: 'spotlight',
    title: 'Find anything instantly',
    description: 'Search by company name or role title to filter your applications in real time. Use this when you have a lot of applications and need to quickly find a specific one before an interview or follow up.',
    includeOnMobile: true,
  },
  {
    id: 'extension',
    type: 'modal',
    title: 'Get the Applyd extension',
    description: '',
    includeOnMobile: true,
  },
];

// ─── Spotlight rect type ──────────────────────────────────────────────────────

interface SpotRect {
  left: number;
  top: number;
  width: number;
  height: number;
  br: number;
}

// ─── Tooltip positioning ──────────────────────────────────────────────────────

function getTooltipPos(spot: SpotRect, vpW: number, vpH: number) {
  const TW = 304;
  const GAP = 20;
  const PAD = 12;

  const spaceRight = vpW - (spot.left + spot.width);
  const spaceLeft = spot.left;
  const spaceBottom = vpH - (spot.top + spot.height);

  if (spaceRight >= TW + GAP) {
    return { left: spot.left + spot.width + GAP, top: Math.max(PAD, Math.min(spot.top, vpH - 280 - PAD)) };
  }
  if (spaceLeft >= TW + GAP) {
    return { left: spot.left - TW - GAP, top: Math.max(PAD, Math.min(spot.top, vpH - 280 - PAD)) };
  }
  if (spaceBottom >= 220 + GAP) {
    return { left: Math.max(PAD, Math.min(spot.left + spot.width / 2 - TW / 2, vpW - TW - PAD)), top: spot.top + spot.height + GAP };
  }
  // Above
  return { left: Math.max(PAD, Math.min(spot.left + spot.width / 2 - TW / 2, vpW - TW - PAD)), top: Math.max(PAD, spot.top - 240 - GAP) };
}

// ─── Extension animation ──────────────────────────────────────────────────────

function ExtensionDemo() {
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'relative',
        height: 88,
        borderRadius: 8,
        overflow: 'hidden',
        background: 'var(--surface-gray)',
        border: '1px solid var(--border-gray)',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '0 12px',
        marginBottom: 16,
      }}
    >
      {/* Job listing card */}
      <div
        style={{
          flex: 1,
          background: 'var(--card-bg)',
          border: '1px solid var(--border-gray)',
          borderRadius: 6,
          padding: '8px 10px',
          animation: 'ext-job-card-in 3s ease-in-out infinite',
        }}
      >
        <div style={{ width: 80, height: 8, borderRadius: 4, background: 'var(--border-emphasis)', marginBottom: 5 }} />
        <div style={{ width: 120, height: 6, borderRadius: 4, background: 'var(--border-gray)' }} />
      </div>

      {/* Arrow */}
      <div
        style={{
          fontSize: 16,
          color: 'var(--accent-blue)',
          flexShrink: 0,
          animation: 'ext-arrow-pulse 3s ease-in-out infinite',
        }}
      >
        →
      </div>

      {/* Extension icon + ripple */}
      <div style={{ position: 'relative', flexShrink: 0, width: 32, height: 32 }}>
        <div
          style={{
            position: 'absolute',
            inset: -6,
            borderRadius: '50%',
            border: '2px solid var(--accent-blue)',
            animation: 'ext-ripple 3s ease-in-out infinite',
          }}
        />
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: 'var(--accent-blue)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 14,
            fontWeight: 700,
            color: '#fff',
            animation: 'ext-icon-click 3s ease-in-out infinite',
          }}
        >
          A
        </div>
      </div>

      {/* Applyd card appears */}
      <div
        style={{
          flex: 1,
          background: 'var(--card-bg)',
          border: '1px solid var(--accent-blue)',
          borderRadius: 6,
          padding: '8px 10px',
          animation: 'ext-card-appear 3s ease-in-out infinite',
        }}
      >
        <div style={{ width: 60, height: 7, borderRadius: 4, background: 'var(--accent-blue)', marginBottom: 5, opacity: 0.7 }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', flexShrink: 0 }} />
          <div style={{ width: 36, height: 6, borderRadius: 4, background: 'var(--border-gray)' }} />
        </div>
      </div>
    </div>
  );
}

// ─── Welcome modal ────────────────────────────────────────────────────────────

function WelcomeModal({
  onStart,
  onSkip,
}: {
  onStart: () => void;
  onSkip: () => void;
}) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        animation: 'tutorial-backdrop-in 200ms ease',
      }}
    >
      {/* Backdrop */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0,0,0,0.55)',
          backdropFilter: 'blur(2px)',
        }}
        onClick={onSkip}
        aria-hidden="true"
      />
      {/* Card */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Welcome to Applyd tutorial"
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: 420,
          background: 'var(--card-bg)',
          border: '1px solid var(--border-gray)',
          borderRadius: 12,
          padding: 28,
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          animation: 'tutorial-modal-in 220ms ease',
        }}
      >
        {/* Logo mark */}
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            background: 'var(--accent-blue)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 16,
            fontSize: 20,
            fontWeight: 800,
            color: '#fff',
          }}
        >
          A
        </div>
        <h2
          style={{
            fontSize: 18,
            fontWeight: 700,
            color: 'var(--brand-navy)',
            letterSpacing: '-0.02em',
            marginBottom: 8,
          }}
        >
          Welcome to Applyd
        </h2>
        <p style={{ fontSize: 13, color: 'var(--muted-text)', lineHeight: 1.6, marginBottom: 24 }}>
          This is your command center for internship and job recruiting. We&apos;ll show you around in about 90 seconds.
        </p>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={onStart}
            autoFocus
            style={{
              flex: 1,
              height: 38,
              borderRadius: 7,
              background: 'var(--accent-blue)',
              color: '#fff',
              fontSize: 13,
              fontWeight: 600,
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Start the tour →
          </button>
          <button
            onClick={onSkip}
            style={{
              height: 38,
              padding: '0 16px',
              borderRadius: 7,
              background: 'var(--surface-gray)',
              color: 'var(--muted-text)',
              fontSize: 13,
              fontWeight: 500,
              border: '1px solid var(--border-gray)',
              cursor: 'pointer',
            }}
          >
            Skip for now
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Extension modal ──────────────────────────────────────────────────────────

function ExtensionModal({
  onInstall,
  onSkip,
}: {
  onInstall: () => void;
  onSkip: () => void;
}) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        animation: 'tutorial-backdrop-in 200ms ease',
      }}
    >
      {/* Backdrop */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0,0,0,0.55)',
          backdropFilter: 'blur(2px)',
        }}
        aria-hidden="true"
      />
      {/* Card */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Install the Applyd browser extension"
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: 420,
          background: 'var(--card-bg)',
          border: '1px solid var(--border-gray)',
          borderRadius: 12,
          padding: 28,
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          animation: 'tutorial-modal-in 220ms ease',
        }}
      >
        <ExtensionDemo />

        <h2
          style={{
            fontSize: 17,
            fontWeight: 700,
            color: 'var(--brand-navy)',
            letterSpacing: '-0.02em',
            marginBottom: 10,
          }}
        >
          Get the Applyd extension
        </h2>
        <p style={{ fontSize: 13, color: 'var(--muted-text)', lineHeight: 1.6, marginBottom: 10 }}>
          Right now adding an application takes about 30 seconds of copying and pasting. With the Applyd extension you click once on any job posting and it&apos;s logged instantly. Works on LinkedIn, Handshake, and hundreds of company career pages.
        </p>
        <p
          style={{
            fontSize: 12,
            color: 'var(--text-tertiary)',
            marginBottom: 20,
            fontStyle: 'italic',
          }}
        >
          Join students who use the extension to log applications in one click.
        </p>

        <button
          onClick={onInstall}
          autoFocus
          style={{
            width: '100%',
            height: 40,
            borderRadius: 7,
            background: 'var(--accent-blue)',
            color: '#fff',
            fontSize: 14,
            fontWeight: 600,
            border: 'none',
            cursor: 'pointer',
            marginBottom: 12,
          }}
        >
          Install extension — it&apos;s free
        </button>

        <div style={{ textAlign: 'center' }}>
          <button
            onClick={onSkip}
            style={{
              background: 'none',
              border: 'none',
              fontSize: 12,
              color: 'var(--text-tertiary)',
              cursor: 'pointer',
            }}
          >
            I&apos;ll do this later
          </button>
        </div>

        <p
          style={{
            textAlign: 'center',
            fontSize: 11,
            color: 'var(--text-tertiary)',
            marginTop: 10,
          }}
        >
          You can always install it later from the help page.
        </p>
      </div>
    </div>
  );
}

// ─── Tooltip card ────────────────────────────────────────────────────────────

function TooltipCard({
  step,
  stepIndex,
  totalSteps,
  spotRect,
  onNext,
  onPrev,
  onSkip,
  isFirst,
  isLast,
}: {
  step: TutorialStep;
  stepIndex: number;
  totalSteps: number;
  spotRect: SpotRect;
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
  isFirst: boolean;
  isLast: boolean;
}) {
  const [vpW, setVpW] = useState(0);
  const [vpH, setVpH] = useState(0);

  useEffect(() => {
    const update = () => { setVpW(window.innerWidth); setVpH(window.innerHeight); };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  const pos = useMemo(
    () => (vpW && vpH ? getTooltipPos(spotRect, vpW, vpH) : { left: 0, top: 0 }),
    [spotRect, vpW, vpH]
  );

  return (
    <div
      key={step.id}
      role="dialog"
      aria-modal="true"
      aria-label={`Tutorial step ${stepIndex + 1} of ${totalSteps}: ${step.title}`}
      style={{
        position: 'fixed',
        left: pos.left,
        top: pos.top,
        width: 304,
        zIndex: 9992,
        background: 'var(--card-bg)',
        border: '1px solid var(--border-gray)',
        borderRadius: 10,
        boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
        padding: '16px 18px',
        animation: 'tutorial-tooltip-in 200ms ease',
      }}
    >
      <p style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-tertiary)', marginBottom: 7 }}>
        Step {stepIndex + 1} of {totalSteps}
      </p>
      <p
        style={{
          fontSize: 14,
          fontWeight: 700,
          color: 'var(--brand-navy)',
          letterSpacing: '-0.015em',
          marginBottom: 7,
          lineHeight: 1.3,
        }}
      >
        {step.title}
      </p>
      <p style={{ fontSize: 13, color: 'var(--muted-text)', lineHeight: 1.55, marginBottom: 16 }}>
        {step.description}
      </p>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {!isFirst && (
          <button
            onClick={onPrev}
            aria-label="Previous step"
            style={{
              height: 32,
              padding: '0 12px',
              fontSize: 12,
              fontWeight: 500,
              borderRadius: 6,
              border: '1px solid var(--border-gray)',
              background: 'var(--surface-gray)',
              color: 'var(--muted-text)',
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            ← Prev
          </button>
        )}
        <button
          onClick={onNext}
          autoFocus
          aria-label={isLast ? 'Finish tutorial' : 'Next step'}
          style={{
            marginLeft: 'auto',
            height: 32,
            padding: '0 14px',
            fontSize: 12,
            fontWeight: 600,
            borderRadius: 6,
            background: 'var(--accent-blue)',
            color: '#fff',
            border: 'none',
            cursor: 'pointer',
            flexShrink: 0,
          }}
        >
          {isLast ? 'Done' : 'Next →'}
        </button>
      </div>

      <button
        onClick={onSkip}
        aria-label="Skip tutorial"
        style={{
          display: 'block',
          width: '100%',
          marginTop: 10,
          textAlign: 'center',
          fontSize: 11,
          color: 'var(--text-tertiary)',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: 0,
        }}
      >
        Skip tour
      </button>
    </div>
  );
}

// ─── Mobile bottom sheet ──────────────────────────────────────────────────────

function MobileSheet({
  step,
  stepIndex,
  totalSteps,
  onNext,
  onPrev,
  onSkip,
  isFirst,
  isLast,
  onInstall,
}: {
  step: TutorialStep;
  stepIndex: number;
  totalSteps: number;
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
  isFirst: boolean;
  isLast: boolean;
  onInstall: () => void;
}) {
  const isExtension = step.id === 'extension';
  const isWelcome = step.id === 'welcome';

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
      }}
    >
      {/* Tap-outside dismiss */}
      <div
        style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(1px)', animation: 'tutorial-backdrop-in 200ms ease' }}
        onClick={!isWelcome ? onSkip : undefined}
        aria-hidden="true"
      />
      {/* Sheet */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Tutorial step ${stepIndex + 1}: ${step.title}`}
        style={{
          position: 'relative',
          background: 'var(--card-bg)',
          borderTop: '1px solid var(--border-gray)',
          borderRadius: '14px 14px 0 0',
          padding: '20px 20px calc(20px + env(safe-area-inset-bottom))',
          animation: 'tutorial-sheet-in 260ms cubic-bezier(0.32, 0.72, 0, 1)',
          maxHeight: '85vh',
          overflowY: 'auto',
        }}
      >
        {/* Drag handle */}
        <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--border-emphasis)', margin: '0 auto 18px' }} />

        {/* Step counter (not on welcome) */}
        {!isWelcome && (
          <p style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-tertiary)', marginBottom: 8 }}>
            Step {stepIndex + 1} of {totalSteps}
          </p>
        )}

        {isExtension && <ExtensionDemo />}

        {/* Logo mark on welcome */}
        {isWelcome && (
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: 'var(--accent-blue)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 14,
              fontSize: 20,
              fontWeight: 800,
              color: '#fff',
            }}
          >
            A
          </div>
        )}

        <h2
          style={{
            fontSize: 17,
            fontWeight: 700,
            color: 'var(--brand-navy)',
            letterSpacing: '-0.02em',
            marginBottom: 8,
          }}
        >
          {step.title}
        </h2>

        <p style={{ fontSize: 14, color: 'var(--muted-text)', lineHeight: 1.6, marginBottom: 16 }}>
          {isWelcome
            ? "This is your command center for internship and job recruiting. We'll show you around in about 90 seconds."
            : isExtension
            ? "Right now adding an application takes about 30 seconds of copying and pasting. With the Applyd extension you click once on any job posting and it's logged instantly. Works on LinkedIn, Handshake, and hundreds of company career pages."
            : step.description}
        </p>

        {isExtension && (
          <p style={{ fontSize: 12, color: 'var(--text-tertiary)', fontStyle: 'italic', marginBottom: 20 }}>
            Join students who use the extension to log applications in one click.
          </p>
        )}

        {/* Buttons */}
        {isWelcome ? (
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={onNext}
              autoFocus
              style={{ flex: 1, height: 42, borderRadius: 8, background: 'var(--accent-blue)', color: '#fff', fontSize: 14, fontWeight: 600, border: 'none', cursor: 'pointer' }}
            >
              Start the tour →
            </button>
            <button
              onClick={onSkip}
              style={{ height: 42, padding: '0 16px', borderRadius: 8, background: 'var(--surface-gray)', color: 'var(--muted-text)', fontSize: 13, fontWeight: 500, border: '1px solid var(--border-gray)', cursor: 'pointer' }}
            >
              Skip
            </button>
          </div>
        ) : isExtension ? (
          <>
            <button
              onClick={onInstall}
              autoFocus
              style={{ width: '100%', height: 42, borderRadius: 8, background: 'var(--accent-blue)', color: '#fff', fontSize: 14, fontWeight: 600, border: 'none', cursor: 'pointer', marginBottom: 12 }}
            >
              Install extension — it&apos;s free
            </button>
            <div style={{ textAlign: 'center' }}>
              <button onClick={onSkip} style={{ background: 'none', border: 'none', fontSize: 13, color: 'var(--text-tertiary)', cursor: 'pointer' }}>
                I&apos;ll do this later
              </button>
            </div>
          </>
        ) : (
          <div style={{ display: 'flex', gap: 10 }}>
            {!isFirst && (
              <button
                onClick={onPrev}
                style={{ height: 42, padding: '0 16px', borderRadius: 8, background: 'var(--surface-gray)', color: 'var(--muted-text)', fontSize: 13, fontWeight: 500, border: '1px solid var(--border-gray)', cursor: 'pointer' }}
              >
                ← Prev
              </button>
            )}
            <button
              onClick={onNext}
              autoFocus
              style={{ flex: 1, height: 42, borderRadius: 8, background: 'var(--accent-blue)', color: '#fff', fontSize: 14, fontWeight: 600, border: 'none', cursor: 'pointer' }}
            >
              {isLast ? 'Done' : 'Next →'}
            </button>
          </div>
        )}

        {!isWelcome && !isExtension && (
          <button
            onClick={onSkip}
            style={{ display: 'block', width: '100%', marginTop: 12, textAlign: 'center', fontSize: 12, color: 'var(--text-tertiary)', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            Skip tour
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Main overlay ─────────────────────────────────────────────────────────────

export default function TutorialOverlay() {
  const { isActive, currentStep, next, prev, skip } = useTutorial();
  const { updateProfile } = useAuth();

  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [spotRect, setSpotRect] = useState<SpotRect>({ left: -200, top: -200, width: 0, height: 0, br: 8 });
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const positionRafRef = useRef<number | null>(null);

  useEffect(() => { setMounted(true); }, []);

  // Mobile detection
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const activeSteps = useMemo(
    () => (isMobile ? STEPS.filter(s => s.includeOnMobile) : STEPS),
    [isMobile]
  );

  const step = activeSteps[currentStep] ?? null;
  const isFirst = currentStep === 0;
  const isLast = currentStep === activeSteps.length - 1;

  // Completion handler
  const handleComplete = useCallback(() => {
    skip();
    updateProfile({ tutorial_completed: true });
  }, [skip, updateProfile]);

  // Skip handler (same outcome — marks tutorial done)
  const handleSkip = useCallback(() => {
    skip();
    updateProfile({ tutorial_completed: true });
  }, [skip, updateProfile]);

  // Install extension handler — open store, complete tutorial
  const handleInstall = useCallback(() => {
    window.open(EXTENSION_URL, '_blank', 'noopener,noreferrer');
    handleComplete();
  }, [handleComplete]);

  // Update spotlight position when step changes
  useEffect(() => {
    if (!isActive || !mounted || !step || step.type === 'modal') {
      setTooltipVisible(false);
      return;
    }

    setTooltipVisible(false);

    const findAndPosition = () => {
      let el = document.querySelector<HTMLElement>(`[data-tutorial-id="${step.id}"]`);
      if (!el && step.fallbackId) {
        el = document.querySelector<HTMLElement>(`[data-tutorial-id="${step.fallbackId}"]`);
      }
      if (!el) {
        // Element not in DOM — skip this step
        next();
        return;
      }

      el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });

      // Wait for scroll to settle before measuring
      const timeout = setTimeout(() => {
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const style = window.getComputedStyle(el);
        const brRaw = parseFloat(style.borderRadius) || 6;
        setSpotRect({
          left: rect.left - 4,
          top: rect.top - 4,
          width: rect.width + 8,
          height: rect.height + 8,
          br: brRaw + 3,
        });
        setTooltipVisible(true);
      }, 380);

      return () => clearTimeout(timeout);
    };

    const cleanup = findAndPosition();
    return cleanup;
  }, [isActive, mounted, step, currentStep, next]);

  // Resize: re-measure spotlight
  useEffect(() => {
    if (!isActive || !step || step.type === 'modal') return;

    const handleResize = () => {
      if (positionRafRef.current) cancelAnimationFrame(positionRafRef.current);
      positionRafRef.current = requestAnimationFrame(() => {
        const el = document.querySelector<HTMLElement>(`[data-tutorial-id="${step.id}"]`)
          ?? (step.fallbackId ? document.querySelector<HTMLElement>(`[data-tutorial-id="${step.fallbackId}"]`) : null);
        if (!el) return;
        const rect = el.getBoundingClientRect();
        setSpotRect(prev => ({ ...prev, left: rect.left - 4, top: rect.top - 4, width: rect.width + 8, height: rect.height + 8 }));
      });
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      if (positionRafRef.current) cancelAnimationFrame(positionRafRef.current);
    };
  }, [isActive, step]);

  // Keyboard navigation
  useEffect(() => {
    if (!isActive) return;

    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLButtonElement || e.target instanceof HTMLInputElement) return;
      if (e.key === 'ArrowRight' || e.key === 'Enter') {
        e.preventDefault();
        isLast ? handleComplete() : next();
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        prev();
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        handleSkip();
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isActive, isLast, next, prev, handleComplete, handleSkip]);

  if (!isActive || !mounted || !step) return null;

  // ── Mobile: bottom sheet for everything ──────────────────────────────────
  if (isMobile) {
    return createPortal(
      <MobileSheet
        step={step}
        stepIndex={currentStep}
        totalSteps={activeSteps.length}
        onNext={isLast ? handleComplete : next}
        onPrev={prev}
        onSkip={handleSkip}
        isFirst={isFirst}
        isLast={isLast}
        onInstall={handleInstall}
      />,
      document.body
    );
  }

  // ── Desktop: welcome modal ────────────────────────────────────────────────
  if (step.id === 'welcome') {
    return createPortal(
      <WelcomeModal onStart={next} onSkip={handleSkip} />,
      document.body
    );
  }

  // ── Desktop: extension modal ──────────────────────────────────────────────
  if (step.id === 'extension') {
    return createPortal(
      <ExtensionModal onInstall={handleInstall} onSkip={handleComplete} />,
      document.body
    );
  }

  // ── Desktop: spotlight + tooltip ─────────────────────────────────────────
  return createPortal(
    <>
      {/* Click-blocking backdrop */}
      <div
        aria-hidden="true"
        style={{ position: 'fixed', inset: 0, zIndex: 9990 }}
      />

      {/* Spotlight cutout via box-shadow */}
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          left: spotRect.left,
          top: spotRect.top,
          width: spotRect.width,
          height: spotRect.height,
          borderRadius: spotRect.br,
          boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.55)',
          outline: '2px solid rgba(255,255,255,0.14)',
          outlineOffset: 1,
          transition: 'left 300ms ease, top 300ms ease, width 300ms ease, height 300ms ease, border-radius 300ms ease',
          zIndex: 9991,
          pointerEvents: 'none',
        }}
      />

      {/* Tooltip */}
      {tooltipVisible && (
        <TooltipCard
          step={step}
          stepIndex={currentStep}
          totalSteps={activeSteps.length}
          spotRect={spotRect}
          onNext={isLast ? handleComplete : next}
          onPrev={prev}
          onSkip={handleSkip}
          isFirst={isFirst}
          isLast={isLast}
        />
      )}
    </>,
    document.body
  );
}
