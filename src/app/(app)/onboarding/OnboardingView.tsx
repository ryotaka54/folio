'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTheme } from 'next-themes';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { capture } from '@/lib/analytics';
import { INTERNSHIP_STAGES, JOB_STAGES, SCHOOL_YEARS, RECRUITING_SEASONS, CAREER_LEVELS, STAGE_COLORS } from '@/lib/constants';
import { Mode } from '@/lib/types';
import { GraduationCap, Briefcase, ArrowRight } from 'lucide-react';
import { localeHref, type Locale } from '@/lib/locale';
import { en, ja } from '@/content/onboarding';

// ─────────────────────────────────────────────────────────────────────────────
// JA-only visual primitives (step dot-bar, choice chip, shared inline styles).
// The shuukatsu flow uses a distinct visual language (large pill buttons,
// Noto Sans JP, transform-on-press micro-interactions) from the EN flow's
// Tailwind card design, so these are kept as-is rather than routed through
// the shared Button component.
// ─────────────────────────────────────────────────────────────────────────────

function StepBar({ total, current }: { total: number; current: number }) {
  return (
    <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginBottom: 48 }}>
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          style={{
            height: 3,
            width: i < current ? 28 : 12,
            borderRadius: 9999,
            background: i < current ? 'var(--accent-blue)' : 'var(--border-gray)',
            transition: 'all 300ms cubic-bezier(0.23, 1, 0.32, 1)',
          }}
        />
      ))}
    </div>
  );
}

function Chip({
  label,
  selected,
  onClick,
  wide,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
  wide?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        width: wide ? '100%' : 'auto',
        minWidth: 100,
        height: 48,
        borderRadius: 10,
        border: selected
          ? '2px solid var(--accent-blue)'
          : '1.5px solid var(--border-gray)',
        background: selected ? 'var(--accent-blue)' : 'var(--surface-gray)',
        color: selected ? '#fff' : 'var(--brand-navy)',
        fontSize: 14,
        fontWeight: selected ? 600 : 500,
        letterSpacing: '0.04em',
        cursor: 'pointer',
        fontFamily: "'Noto Sans JP', sans-serif",
        padding: '0 20px',
        whiteSpace: 'nowrap',
        transition: 'background 150ms ease-out, border-color 150ms ease-out, color 150ms ease-out, transform 100ms ease-out',
      }}
      onMouseDown={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(0.97)'; }}
      onMouseUp={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}
    >
      {label}
    </button>
  );
}

const primaryBtn: React.CSSProperties = {
  width: '100%',
  height: 52,
  borderRadius: 12,
  background: 'var(--accent-blue)',
  color: '#fff',
  fontSize: 15,
  fontWeight: 600,
  letterSpacing: '0.04em',
  border: 'none',
  cursor: 'pointer',
  fontFamily: "'Noto Sans JP', sans-serif",
  transition: 'transform 100ms ease-out, opacity 150ms ease',
};

const questionStyle: React.CSSProperties = {
  fontSize: 22,
  fontWeight: 700,
  color: 'var(--brand-navy)',
  marginBottom: 28,
  letterSpacing: '-0.02em',
  lineHeight: 1.4,
};

type Industry = string;

// ─────────────────────────────────────────────────────────────────────────────
// EN flow — internship/job "pipeline mode" onboarding.
// ─────────────────────────────────────────────────────────────────────────────

function EnOnboardingFlow({ locale }: { locale: Locale }) {
  const copy = en;
  const { user, updateProfile, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const changeMode = searchParams.get('change') === 'true';

  const [step, setStep] = useState(1);
  const [mode, setMode] = useState<Mode>('internship');
  const [name, setName] = useState('');
  const [school, setSchool] = useState('');
  const [schoolYear, setSchoolYear] = useState('');
  const [recruitingSeason, setRecruitingSeason] = useState('');
  const [careerLevel, setCareerLevel] = useState('');

  useEffect(() => {
    if (!loading && !user) {
      router.replace(localeHref(locale, '/login'));
    }
    // If already onboarded and not in change-mode flow, redirect to dashboard
    if (!loading && user?.onboarding_complete && !changeMode) {
      router.replace(localeHref(locale, '/dashboard'));
    }
    // In change-mode flow, pre-populate current mode
    if (user && changeMode) {
      setMode(user.mode ?? 'internship');
    }
  }, [user, loading, router, changeMode, locale]);

  if (loading || !user || (user.onboarding_complete && !changeMode)) {
    return (
      <div className="min-h-screen bg-surface-gray flex items-center justify-center p-4">
        <div className="w-full max-w-lg">
          <div className="flex justify-center mb-8">
            <div className="w-20 h-4 rounded bg-border-gray animate-pulse" />
          </div>
          <div className="bg-card-bg rounded-lg p-6 md:p-8 border border-border-gray">
            <div className="w-40 h-6 rounded bg-surface-gray animate-pulse mb-2" />
            <div className="w-64 h-4 rounded bg-surface-gray animate-pulse mb-6" />
            <div className="grid grid-cols-2 gap-3">
              <div className="h-32 rounded-lg bg-surface-gray animate-pulse" />
              <div className="h-32 rounded-lg bg-surface-gray animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Mode-change-only flow: just show step 1 and save
  if (changeMode) {
    const cm = copy.changeMode;
    const handleSaveMode = () => {
      capture('mode_changed', { mode });
      updateProfile({ mode });
      router.push(localeHref(locale, '/dashboard'));
    };

    return (
      <div className="min-h-screen bg-surface-gray flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-lg">
          <div className="bg-card-bg rounded-lg p-6 md:p-8 border border-border-gray modal-enter">
            <h1 className="text-[15px] font-semibold mb-1" style={{ color: 'var(--brand-navy)', letterSpacing: '-0.01em' }}>{cm.title}</h1>
            <p className="text-[13px] mb-5" style={{ color: 'var(--muted-text)' }}>{cm.subtitle}</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-5">
              <button
                onClick={() => setMode('internship')}
                className="text-left p-4 rounded-lg border transition-colors"
                style={mode === 'internship'
                  ? { borderColor: 'var(--accent-blue)', background: 'var(--accent-blue)08' }
                  : { borderColor: 'var(--border-gray)', background: 'transparent' }}
              >
                <div className="mb-3 w-9 h-9 rounded-md border border-border-gray flex items-center justify-center" style={{ background: 'var(--surface-gray)', color: 'var(--accent-blue)' }}>
                  <GraduationCap size={17} />
                </div>
                <div className="font-medium text-[13px]" style={{ color: 'var(--brand-navy)' }}>{cm.internship.title}</div>
                <div className="text-[12px] mt-0.5" style={{ color: 'var(--muted-text)' }}>{cm.internship.desc}</div>
              </button>
              <button
                onClick={() => setMode('job')}
                className="text-left p-4 rounded-lg border transition-colors"
                style={mode === 'job'
                  ? { borderColor: 'var(--accent-blue)', background: 'var(--accent-blue)08' }
                  : { borderColor: 'var(--border-gray)', background: 'transparent' }}
              >
                <div className="mb-3 w-9 h-9 rounded-md border border-border-gray flex items-center justify-center" style={{ background: 'var(--surface-gray)', color: 'var(--accent-blue)' }}>
                  <Briefcase size={17} />
                </div>
                <div className="font-medium text-[13px]" style={{ color: 'var(--brand-navy)' }}>{cm.job.title}</div>
                <div className="text-[12px] mt-0.5" style={{ color: 'var(--muted-text)' }}>{cm.job.desc}</div>
              </button>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => router.push(localeHref(locale, '/dashboard'))}
                className="flex-1 h-9 text-[13px] font-medium rounded-md border transition-colors"
                style={{ background: 'var(--surface-gray)', borderColor: 'var(--border-gray)', color: 'var(--muted-text)' }}
              >
                {cm.cancel}
              </button>
              <button
                onClick={handleSaveMode}
                className="flex-1 h-9 text-[13px] font-medium text-white rounded-md bg-accent-blue hover:bg-accent-blue-hover transition-colors"
              >
                {cm.save}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const handleComplete = async () => {
    capture('onboarding_complete', { mode, school });
    updateProfile({
      name,
      school,
      mode,
      school_year: schoolYear,
      career_level: careerLevel,
      recruiting_season: recruitingSeason,
      onboarding_complete: true,
    });

    // Fire referral confirmation if this user signed up via a referral link
    const refCode = typeof window !== 'undefined' ? localStorage.getItem('applyd_ref') : null;
    if (refCode) {
      try {
        const { supabase: sb } = await import('@/lib/supabase');
        const { data: { session } } = await sb.auth.getSession();
        if (session) {
          await fetch('/api/referral/confirm', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({ referrer_code: refCode }),
          });
        }
        localStorage.removeItem('applyd_ref');
      } catch {
        // Non-critical — don't block the user
      }
    }

    // Show referral welcome on first sign-up (not on mode-change flows)
    router.push(localeHref(locale, '/dashboard?ref_welcome=1'));
  };

  const stages = mode === 'internship' ? INTERNSHIP_STAGES : JOB_STAGES;

  const step2CanContinue = mode === 'internship'
    ? (!!schoolYear && !!recruitingSeason)
    : !!careerLevel;

  return (
    <div className="min-h-screen bg-surface-gray flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Step indicator */}
        <div className="flex items-center justify-center mb-8">
          <span className="text-[13px] font-medium" style={{ color: 'var(--muted-text)' }}>
            {copy.stepIndicator(step, 3)}
          </span>
        </div>

        <div className="bg-card-bg rounded-lg p-6 md:p-8 border border-border-gray modal-enter">
          {/* Step 1: Mode Selection */}
          {step === 1 && (
            <div>
              <h1 className="text-[15px] font-semibold mb-1" style={{ color: 'var(--brand-navy)', letterSpacing: '-0.01em' }}>{copy.mode.title}</h1>
              <p className="text-[13px] mb-5" style={{ color: 'var(--muted-text)' }}>{copy.mode.subtitle}</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <button
                  onClick={() => setMode('internship')}
                  className="text-left p-4 rounded-lg border transition-colors"
                  style={mode === 'internship'
                    ? { borderColor: 'var(--accent-blue)', background: 'var(--accent-blue)08' }
                    : { borderColor: 'var(--border-gray)', background: 'transparent' }}
                >
                  <div className="mb-3 w-9 h-9 rounded-md border border-border-gray flex items-center justify-center" style={{ background: 'var(--surface-gray)', color: 'var(--accent-blue)' }}>
                    <GraduationCap size={17} />
                  </div>
                  <div className="font-medium text-[13px]" style={{ color: 'var(--brand-navy)' }}>{copy.mode.internship.title}</div>
                  <div className="text-[12px] mt-0.5" style={{ color: 'var(--muted-text)' }}>{copy.mode.internship.desc}</div>
                  <div className="flex flex-wrap gap-1 mt-3">
                    {copy.mode.internship.tags?.map(tag => (
                      <span key={tag} className="text-[10px] px-1.5 py-0.5 border border-border-gray rounded" style={{ background: 'var(--surface-gray)', color: 'var(--text-tertiary)' }}>{tag}</span>
                    ))}
                  </div>
                </button>
                <button
                  onClick={() => setMode('job')}
                  className="text-left p-4 rounded-lg border transition-colors"
                  style={mode === 'job'
                    ? { borderColor: 'var(--accent-blue)', background: 'var(--accent-blue)08' }
                    : { borderColor: 'var(--border-gray)', background: 'transparent' }}
                >
                  <div className="mb-3 w-9 h-9 rounded-md border border-border-gray flex items-center justify-center" style={{ background: 'var(--surface-gray)', color: 'var(--accent-blue)' }}>
                    <Briefcase size={17} />
                  </div>
                  <div className="font-medium text-[13px]" style={{ color: 'var(--brand-navy)' }}>{copy.mode.job.title}</div>
                  <div className="text-[12px] mt-0.5" style={{ color: 'var(--muted-text)' }}>{copy.mode.job.desc}</div>
                  <div className="flex flex-wrap gap-1 mt-3">
                    {copy.mode.job.tags?.map(tag => (
                      <span key={tag} className="text-[10px] px-1.5 py-0.5 border border-border-gray rounded" style={{ background: 'var(--surface-gray)', color: 'var(--text-tertiary)' }}>{tag}</span>
                    ))}
                  </div>
                </button>
              </div>
              <button
                onClick={() => setStep(2)}
                className="w-full mt-5 h-9 text-[13px] font-medium text-white rounded-md bg-accent-blue hover:bg-accent-blue-hover transition-colors"
              >
                {copy.mode.continueLabel}
              </button>
            </div>
          )}

          {/* Step 2: Personal Context */}
          {step === 2 && (
            <div>
              <h1 className="text-[15px] font-semibold mb-1" style={{ color: 'var(--brand-navy)', letterSpacing: '-0.01em' }}>{copy.personal.title}</h1>
              <p className="text-[13px] mb-5" style={{ color: 'var(--muted-text)' }}>{copy.personal.subtitle}</p>
              <div className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-[13px] font-medium mb-1" style={{ color: 'var(--brand-navy)' }}>{copy.personal.nameLabel}</label>
                  <input
                    id="name"
                    type="text"
                    autoFocus
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full h-9 px-3 bg-background border border-border-gray rounded-md text-[13px] focus:outline-none focus:border-accent-blue focus:ring-2 focus:ring-accent-blue/20 placeholder:text-text-tertiary transition-colors"
                    placeholder={copy.personal.namePlaceholder}
                  />
                </div>
                <div>
                  <label htmlFor="school" className="block text-[13px] font-medium mb-1" style={{ color: 'var(--brand-navy)' }}>{copy.personal.schoolLabel}</label>
                  <input
                    id="school"
                    type="text"
                    value={school}
                    onChange={(e) => setSchool(e.target.value)}
                    className="w-full h-9 px-3 bg-background border border-border-gray rounded-md text-[13px] focus:outline-none focus:border-accent-blue focus:ring-2 focus:ring-accent-blue/20 placeholder:text-text-tertiary transition-colors"
                    placeholder={copy.personal.schoolPlaceholder}
                  />
                </div>
                {mode === 'internship' ? (
                  <>
                    <div>
                      <label className="block text-[13px] font-medium mb-2" style={{ color: 'var(--brand-navy)' }}>{copy.personal.schoolYearLabel}</label>
                      <div className="flex flex-wrap gap-2">
                        {SCHOOL_YEARS.map(y => (
                          <button
                            key={y}
                            onClick={() => setSchoolYear(y)}
                            className="px-3 h-8 rounded-md text-[12px] font-medium border transition-colors"
                            style={schoolYear === y
                              ? { background: 'var(--accent-blue)', borderColor: 'var(--accent-blue)', color: '#fff' }
                              : { background: 'var(--surface-gray)', borderColor: 'var(--border-gray)', color: 'var(--muted-text)' }}
                          >
                            {y}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-[13px] font-medium mb-2" style={{ color: 'var(--brand-navy)' }}>{copy.personal.recruitingSeasonLabel}</label>
                      <div className="flex flex-wrap gap-2">
                        {RECRUITING_SEASONS.map(s => (
                          <button
                            key={s}
                            onClick={() => setRecruitingSeason(s)}
                            className="px-3 h-8 rounded-md text-[12px] font-medium border transition-colors"
                            style={recruitingSeason === s
                              ? { background: 'var(--accent-blue)', borderColor: 'var(--accent-blue)', color: '#fff' }
                              : { background: 'var(--surface-gray)', borderColor: 'var(--border-gray)', color: 'var(--muted-text)' }}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  <div>
                    <label className="block text-[13px] font-medium mb-2" style={{ color: 'var(--brand-navy)' }}>{copy.personal.careerLevelLabel}</label>
                    <div className="flex flex-wrap gap-2">
                      {CAREER_LEVELS.map(l => (
                        <button
                          key={l}
                          onClick={() => setCareerLevel(l)}
                          className="px-3 h-8 rounded-md text-[12px] font-medium border transition-colors"
                          style={careerLevel === l
                            ? { background: 'var(--accent-blue)', borderColor: 'var(--accent-blue)', color: '#fff' }
                            : { background: 'var(--surface-gray)', borderColor: 'var(--border-gray)', color: 'var(--muted-text)' }}
                        >
                          {l}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="flex gap-3 mt-5">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 h-9 text-[13px] font-medium rounded-md border transition-colors"
                  style={{ background: 'var(--surface-gray)', borderColor: 'var(--border-gray)', color: 'var(--muted-text)' }}
                >
                  {copy.personal.backLabel}
                </button>
                <button
                  onClick={() => setStep(3)}
                  disabled={!step2CanContinue}
                  className="flex-1 h-9 text-[13px] font-medium text-white rounded-md bg-accent-blue hover:bg-accent-blue-hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {copy.personal.continueLabel}
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Confirmation — mini pipeline preview + autofill tip */}
          {step === 3 && (
            <div>
              <h1 className="text-[15px] font-semibold mb-1" style={{ color: 'var(--brand-navy)', letterSpacing: '-0.01em' }}>
                {copy.confirm.title(name)}
              </h1>
              <p className="text-[13px] mb-5" style={{ color: 'var(--muted-text)' }}>{copy.confirm.subtitle}</p>

              {/* Mini pipeline preview — scrollable with scroll indicator */}
              <div className="relative mb-4">
                <div className="flex gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
                  {stages.map((stage) => {
                    const color = STAGE_COLORS[stage] || '#6B7280';
                    return (
                      <div key={stage} className="flex flex-col items-center gap-1.5 flex-shrink-0 min-w-[64px]">
                        <div className="w-8 h-8 rounded-lg border border-border-gray flex items-center justify-center" style={{ background: 'var(--surface-gray)' }}>
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                        </div>
                        <span className="text-[10px] font-medium text-center leading-tight w-[64px]"
                          style={{ color: 'var(--muted-text)' }}>
                          {stage}
                        </span>
                      </div>
                    );
                  })}
                </div>
                {/* Fade-right scroll hint */}
                <div className="absolute right-0 top-0 bottom-2 w-8 pointer-events-none" style={{ background: 'linear-gradient(to right, transparent, var(--card-bg))' }} />
              </div>

              {/* Tips */}
              <div className="space-y-2 mb-5">
                <div className="p-3 rounded-lg border border-border-gray text-[12px]"
                  style={{ background: 'var(--surface-gray)', color: 'var(--muted-text)' }}>
                  <span className="font-semibold" style={{ color: 'var(--brand-navy)' }}>{copy.confirm.tip1Bold}</span>{copy.confirm.tip1Rest}
                </div>
                <div className="p-3 rounded-lg border border-border-gray text-[12px]"
                  style={{ background: 'var(--surface-gray)', color: 'var(--muted-text)' }}>
                  <span className="font-semibold" style={{ color: 'var(--brand-navy)' }}>{copy.confirm.tip2Bold}</span>{copy.confirm.tip2Rest}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(2)}
                  className="flex-1 h-9 text-[13px] font-medium rounded-md border transition-colors"
                  style={{ background: 'var(--surface-gray)', borderColor: 'var(--border-gray)', color: 'var(--muted-text)' }}
                >
                  {copy.confirm.backLabel}
                </button>
                <button
                  onClick={handleComplete}
                  className="flex-1 h-9 text-[13px] font-medium text-white rounded-md bg-accent-blue hover:bg-accent-blue-hover transition-colors flex items-center justify-center gap-1.5"
                >
                  {copy.confirm.ctaLabel}
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// JA flow — shuukatsu (grad year / university type / target industries).
// ─────────────────────────────────────────────────────────────────────────────

function JaOnboardingFlow({ locale }: { locale: Locale }) {
  const copy = ja;
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState(1);
  const [gradYear, setGradYear] = useState<string | null>(null);
  const [uniType, setUniType] = useState<string | null>(null);
  const [industries, setIndustries] = useState<Industry[]>([]);
  const [saving, setSaving] = useState(false);

  // Mount gate avoids a hydration mismatch for the theme-class sync below,
  // which reads resolvedTheme (only resolved client-side by next-themes).
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setMounted(true); }, []);

  // Preserve the user's theme preference in the cookie so it survives this page
  useEffect(() => {
    if (!mounted) return;
    const theme = resolvedTheme === 'dark' ? 'dark' : 'light';
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [mounted, resolvedTheme]);

  const TOTAL_STEPS = 3;

  const toggleIndustry = (ind: Industry) =>
    setIndustries(prev =>
      prev.includes(ind) ? prev.filter(i => i !== ind) : [...prev, ind].slice(0, 3),
    );

  const handleComplete = async () => {
    setSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push(localeHref(locale, '/login')); return; }

      await supabase.from('users').update({
        pipeline_type: 'shuukatsu',
        language_preference: 'ja',
        school_year: gradYear ?? '26卒',
        university_type: uniType ?? null,
        target_industries: industries.length > 0 ? industries : null,
        onboarding_complete: true,
      }).eq('id', session.user.id);

      const refCode = typeof window !== 'undefined' ? localStorage.getItem('applyd_ref') : null;
      if (refCode) {
        try {
          await fetch('/api/referral/confirm', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
            body: JSON.stringify({ referralCode: refCode }),
          });
          localStorage.removeItem('applyd_ref');
        } catch { /* non-critical */ }
      }

      router.push(localeHref(locale, '/dashboard'));
    } catch {
      setSaving(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--background)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        padding: '20vh 24px 40px',
        fontFamily: "'Noto Sans JP', sans-serif",
        transition: 'background 0.2s ease',
      }}
    >
      {/* Step bar (steps 2, 3, 4) */}
      {step > 1 && step < 5 && (
        <StepBar total={TOTAL_STEPS} current={step - 1} />
      )}

      {/* ── Screen 1: Welcome ─────────────────────────────────────────────── */}
      {step === 1 && (
        <div
          style={{ textAlign: 'center', maxWidth: 400 }}
          className="onboard-enter"
        >
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 32 }}>
            <svg width="56" height="56" viewBox="0 0 32 32" fill="none">
              <rect width="32" height="32" rx="8" fill="var(--accent-blue)" />
              <rect x="7" y="20" width="4" height="7" rx="1" fill="white" fillOpacity="0.4" />
              <rect x="14" y="13" width="4" height="14" rx="1" fill="white" fillOpacity="0.7" />
              <rect x="21" y="7" width="4" height="20" rx="1" fill="white" />
            </svg>
          </div>

          <h1 style={{ fontSize: 30, fontWeight: 700, letterSpacing: '-0.03em', color: 'var(--brand-navy)', marginBottom: 12, lineHeight: 1.3 }}>
            {copy.welcome.heading}
          </h1>
          <p style={{ fontSize: 14, color: 'var(--muted-text)', marginBottom: 40, lineHeight: 1.7, letterSpacing: '0.03em' }}>
            {copy.welcome.subtitle}
          </p>

          <button
            onClick={() => setStep(2)}
            style={primaryBtn}
            onMouseDown={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(0.97)'; }}
            onMouseUp={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}
          >
            {copy.welcome.ctaLabel}
          </button>
        </div>
      )}

      {/* ── Screen 2: Grad year ───────────────────────────────────────────── */}
      {step === 2 && (
        <div style={{ textAlign: 'center', maxWidth: 400, width: '100%' }} className="onboard-enter">
          <h2 style={questionStyle}>{copy.gradYear.question}</h2>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 48 }}>
            {copy.gradYear.options.map(y => (
              <Chip key={y} label={y} selected={gradYear === y} onClick={() => setGradYear(y)} />
            ))}
          </div>

          <button
            onClick={() => gradYear && setStep(3)}
            disabled={!gradYear}
            style={{ ...primaryBtn, opacity: gradYear ? 1 : 0.4, cursor: gradYear ? 'pointer' : 'not-allowed' }}
            onMouseDown={e => { if (gradYear) (e.currentTarget as HTMLElement).style.transform = 'scale(0.97)'; }}
            onMouseUp={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}
          >
            {copy.gradYear.nextLabel}
          </button>
        </div>
      )}

      {/* ── Screen 3: University type ─────────────────────────────────────── */}
      {step === 3 && (
        <div style={{ textAlign: 'center', maxWidth: 400, width: '100%' }} className="onboard-enter">
          <h2 style={questionStyle}>{copy.uniType.question}</h2>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 48 }}>
            {copy.uniType.options.map(u => (
              <Chip key={u} label={u} selected={uniType === u} onClick={() => setUniType(u)} />
            ))}
          </div>

          <button
            onClick={() => uniType && setStep(4)}
            disabled={!uniType}
            style={{ ...primaryBtn, opacity: uniType ? 1 : 0.4, cursor: uniType ? 'pointer' : 'not-allowed' }}
            onMouseDown={e => { if (uniType) (e.currentTarget as HTMLElement).style.transform = 'scale(0.97)'; }}
            onMouseUp={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}
          >
            {copy.uniType.nextLabel}
          </button>
        </div>
      )}

      {/* ── Screen 4: Industries ──────────────────────────────────────────── */}
      {step === 4 && (
        <div style={{ textAlign: 'center', maxWidth: 480, width: '100%' }} className="onboard-enter">
          <h2 style={questionStyle}>{copy.industries.question}</h2>
          <p style={{ fontSize: 12, color: 'var(--muted-text)', marginBottom: 32, letterSpacing: '0.05em' }}>
            {copy.industries.helper}
          </p>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 48 }}>
            {copy.industries.options.map(ind => (
              <button
                key={ind}
                onClick={() => toggleIndustry(ind)}
                style={{
                  height: 40,
                  padding: '0 16px',
                  borderRadius: 9999,
                  border: industries.includes(ind) ? '2px solid var(--accent-blue)' : '1.5px solid var(--border-gray)',
                  background: industries.includes(ind) ? 'var(--accent-blue)' : 'var(--surface-gray)',
                  color: industries.includes(ind) ? '#fff' : 'var(--brand-navy)',
                  fontSize: 13,
                  fontWeight: industries.includes(ind) ? 600 : 500,
                  letterSpacing: '0.05em',
                  cursor: 'pointer',
                  fontFamily: "'Noto Sans JP', sans-serif",
                  transition: 'all 150ms ease-out',
                }}
                onMouseDown={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(0.97)'; }}
                onMouseUp={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}
              >
                {ind}
              </button>
            ))}
          </div>

          <button
            onClick={() => setStep(5)}
            style={primaryBtn}
            onMouseDown={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(0.97)'; }}
            onMouseUp={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}
          >
            {copy.industries.nextLabel}
          </button>
        </div>
      )}

      {/* ── Screen 5: Complete ────────────────────────────────────────────── */}
      {step === 5 && (
        <div style={{ textAlign: 'center', maxWidth: 360, width: '100%' }} className="onboard-enter">
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 28 }}>
            <svg width="72" height="72" viewBox="0 0 80 80" fill="none">
              <circle cx="40" cy="40" r="30" stroke="var(--border-gray)" strokeWidth="5" />
              <circle
                cx="40" cy="40" r="30"
                stroke="var(--green-success)"
                strokeWidth="5"
                strokeLinecap="round"
                style={{ strokeDasharray: 188, strokeDashoffset: 188, animation: 'draw-circle 0.6s cubic-bezier(0.23,1,0.32,1) forwards' }}
              />
              <path
                d="M27 41l9 9 17-18"
                stroke="var(--green-success)"
                strokeWidth="5"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ strokeDasharray: 50, strokeDashoffset: 50, animation: 'draw-check 0.4s ease-out 0.5s forwards' }}
              />
            </svg>
          </div>

          <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--brand-navy)', marginBottom: 8, letterSpacing: '-0.01em' }}>
            {copy.complete.heading}
          </h2>
          <p style={{ fontSize: 13, color: 'var(--muted-text)', marginBottom: 40, letterSpacing: '0.05em', lineHeight: 1.7 }}>
            {copy.complete.subtitle}
          </p>

          <button
            onClick={handleComplete}
            disabled={saving}
            style={{ ...primaryBtn, opacity: saving ? 0.7 : 1, cursor: saving ? 'not-allowed' : 'pointer' }}
            onMouseDown={e => { if (!saving) (e.currentTarget as HTMLElement).style.transform = 'scale(0.97)'; }}
            onMouseUp={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}
          >
            {saving ? copy.complete.savingLabel : copy.complete.ctaLabel}
          </button>
        </div>
      )}

      <style>{`
        @keyframes draw-circle {
          from { stroke-dashoffset: 188; }
          to   { stroke-dashoffset: 0; }
        }
        @keyframes draw-check {
          from { stroke-dashoffset: 50; }
          to   { stroke-dashoffset: 0; }
        }
        @keyframes onboard-in {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .onboard-enter {
          animation: onboard-in 300ms cubic-bezier(0.23, 1, 0.32, 1) forwards;
        }
      `}</style>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Entry point — branches on locale into the two independently-shaped flows.
// Wrapped in Suspense because the EN flow reads useSearchParams (for the
// `?change=true` mode-change flow).
// ─────────────────────────────────────────────────────────────────────────────

function OnboardingContent({ locale }: { locale: Locale }) {
  if (locale === 'ja') return <JaOnboardingFlow locale={locale} />;
  return <EnOnboardingFlow locale={locale} />;
}

export function OnboardingView({ locale }: { locale: Locale }) {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-surface-gray flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-accent-blue border-t-transparent animate-spin" />
      </div>
    }>
      <OnboardingContent locale={locale} />
    </Suspense>
  );
}
