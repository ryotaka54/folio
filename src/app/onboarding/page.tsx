'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter, useSearchParams } from 'next/navigation';
import { capture } from '@/lib/analytics';
import { INTERNSHIP_STAGES, JOB_STAGES, SCHOOL_YEARS, RECRUITING_SEASONS, CAREER_LEVELS, STAGE_COLORS } from '@/lib/constants';
import { Mode } from '@/lib/types';
import { GraduationCap, Briefcase, ArrowRight } from 'lucide-react';
import { Suspense } from 'react';

function OnboardingContent() {
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
      router.replace('/login');
    }
    // If already onboarded and not in change-mode flow, redirect to dashboard
    if (!loading && user?.onboarding_complete && !changeMode) {
      router.replace('/dashboard');
    }
    // In change-mode flow, pre-populate current mode
    if (user && changeMode) {
      setMode(user.mode ?? 'internship');
    }
  }, [user, loading, router, changeMode]);

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
    const handleSaveMode = () => {
      capture('mode_changed', { mode });
      updateProfile({ mode });
      router.push('/dashboard');
    };

    return (
      <div className="min-h-screen bg-surface-gray flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-lg">
          <div className="bg-card-bg rounded-lg p-6 md:p-8 border border-border-gray modal-enter">
            <h1 className="text-[15px] font-semibold mb-1" style={{ color: 'var(--brand-navy)', letterSpacing: '-0.01em' }}>What are you applying to?</h1>
            <p className="text-[13px] mb-5" style={{ color: 'var(--muted-text)' }}>Switch anytime — your pipeline stages update automatically.</p>
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
                <div className="font-medium text-[13px]" style={{ color: 'var(--brand-navy)' }}>I&apos;m applying for internships</div>
                <div className="text-[12px] mt-0.5" style={{ color: 'var(--muted-text)' }}>This summer, next semester, or co-op</div>
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
                <div className="font-medium text-[13px]" style={{ color: 'var(--brand-navy)' }}>I&apos;m looking for a full-time role</div>
                <div className="text-[12px] mt-0.5" style={{ color: 'var(--muted-text)' }}>Full-time after graduation or a career change</div>
              </button>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => router.push('/dashboard')}
                className="flex-1 h-9 text-[13px] font-medium rounded-md border transition-colors"
                style={{ background: 'var(--surface-gray)', borderColor: 'var(--border-gray)', color: 'var(--muted-text)' }}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveMode}
                className="flex-1 h-9 text-[13px] font-medium text-white rounded-md bg-accent-blue hover:bg-accent-blue-hover transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const handleComplete = () => {
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
    router.push('/dashboard');
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
            Step {step} of 3
          </span>
        </div>

        <div className="bg-card-bg rounded-lg p-6 md:p-8 border border-border-gray modal-enter">
          {/* Step 1: Mode Selection */}
          {step === 1 && (
            <div>
              <h1 className="text-[15px] font-semibold mb-1" style={{ color: 'var(--brand-navy)', letterSpacing: '-0.01em' }}>What are you applying to?</h1>
              <p className="text-[13px] mb-5" style={{ color: 'var(--muted-text)' }}>Pick one to start — you can switch anytime.</p>
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
                  <div className="font-medium text-[13px]" style={{ color: 'var(--brand-navy)' }}>I&apos;m applying for internships</div>
                  <div className="text-[12px] mt-0.5" style={{ color: 'var(--muted-text)' }}>This summer, next semester, or co-op</div>
                  <div className="flex flex-wrap gap-1 mt-3">
                    {['Summer 2026', 'OA / Screen', 'Return offer'].map(tag => (
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
                  <div className="font-medium text-[13px]" style={{ color: 'var(--brand-navy)' }}>I&apos;m looking for a full-time role</div>
                  <div className="text-[12px] mt-0.5" style={{ color: 'var(--muted-text)' }}>Full-time after graduation or a career change</div>
                  <div className="flex flex-wrap gap-1 mt-3">
                    {['New Grad', 'Negotiation', 'Offer compare'].map(tag => (
                      <span key={tag} className="text-[10px] px-1.5 py-0.5 border border-border-gray rounded" style={{ background: 'var(--surface-gray)', color: 'var(--text-tertiary)' }}>{tag}</span>
                    ))}
                  </div>
                </button>
              </div>
              <button
                onClick={() => setStep(2)}
                className="w-full mt-5 h-9 text-[13px] font-medium text-white rounded-md bg-accent-blue hover:bg-accent-blue-hover transition-colors"
              >
                Continue
              </button>
            </div>
          )}

          {/* Step 2: Personal Context */}
          {step === 2 && (
            <div>
              <h1 className="text-[15px] font-semibold mb-1" style={{ color: 'var(--brand-navy)', letterSpacing: '-0.01em' }}>A little about you</h1>
              <p className="text-[13px] mb-5" style={{ color: 'var(--muted-text)' }}>Applyd uses this to personalize your coaching and reminders.</p>
              <div className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-[13px] font-medium mb-1" style={{ color: 'var(--brand-navy)' }}>Your name</label>
                  <input
                    id="name"
                    type="text"
                    autoFocus
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full h-9 px-3 bg-background border border-border-gray rounded-md text-[13px] focus:outline-none focus:border-accent-blue focus:ring-2 focus:ring-accent-blue/20 placeholder:text-text-tertiary transition-colors"
                    placeholder="First name"
                  />
                </div>
                <div>
                  <label htmlFor="school" className="block text-[13px] font-medium mb-1" style={{ color: 'var(--brand-navy)' }}>School</label>
                  <input
                    id="school"
                    type="text"
                    value={school}
                    onChange={(e) => setSchool(e.target.value)}
                    className="w-full h-9 px-3 bg-background border border-border-gray rounded-md text-[13px] focus:outline-none focus:border-accent-blue focus:ring-2 focus:ring-accent-blue/20 placeholder:text-text-tertiary transition-colors"
                    placeholder="e.g. UC Berkeley, MIT, Georgia Tech"
                  />
                </div>
                {mode === 'internship' ? (
                  <>
                    <div>
                      <label className="block text-[13px] font-medium mb-2" style={{ color: 'var(--brand-navy)' }}>School year</label>
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
                      <label className="block text-[13px] font-medium mb-2" style={{ color: 'var(--brand-navy)' }}>Recruiting season</label>
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
                    <label className="block text-[13px] font-medium mb-2" style={{ color: 'var(--brand-navy)' }}>Career level</label>
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
                  Back
                </button>
                <button
                  onClick={() => setStep(3)}
                  disabled={!step2CanContinue}
                  className="flex-1 h-9 text-[13px] font-medium text-white rounded-md bg-accent-blue hover:bg-accent-blue-hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Confirmation — mini pipeline preview + autofill tip */}
          {step === 3 && (
            <div>
              <h1 className="text-[15px] font-semibold mb-1" style={{ color: 'var(--brand-navy)', letterSpacing: '-0.01em' }}>
                You&apos;re all set{name ? `, ${name}` : ''}!
              </h1>
              <p className="text-[13px] mb-5" style={{ color: 'var(--muted-text)' }}>Here&apos;s your pipeline. Add your first application and the AI starts working.</p>

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
                  <span className="font-semibold" style={{ color: 'var(--brand-navy)' }}>Paste a job URL</span>{' '}
                  and Applyd fills in the company, role, and location automatically. No typing needed.
                </div>
                <div className="p-3 rounded-lg border border-border-gray text-[12px]"
                  style={{ background: 'var(--surface-gray)', color: 'var(--muted-text)' }}>
                  <span className="font-semibold" style={{ color: 'var(--brand-navy)' }}>Drag to advance.</span>{' '}
                  When you hear back, drag the card to the next stage. Your AI tools activate automatically as you move forward.
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(2)}
                  className="flex-1 h-9 text-[13px] font-medium rounded-md border transition-colors"
                  style={{ background: 'var(--surface-gray)', borderColor: 'var(--border-gray)', color: 'var(--muted-text)' }}
                >
                  Back
                </button>
                <button
                  onClick={handleComplete}
                  className="flex-1 h-9 text-[13px] font-medium text-white rounded-md bg-accent-blue hover:bg-accent-blue-hover transition-colors flex items-center justify-center gap-1.5"
                >
                  Start tracking
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

export default function OnboardingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-surface-gray flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-accent-blue border-t-transparent animate-spin" />
      </div>
    }>
      <OnboardingContent />
    </Suspense>
  );
}
