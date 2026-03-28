'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { INTERNSHIP_STAGES, JOB_STAGES, SCHOOL_YEARS, RECRUITING_SEASONS, CAREER_LEVELS, STAGE_COLORS } from '@/lib/constants';
import { Mode } from '@/lib/types';
import { GraduationCap, Briefcase, ArrowRight } from 'lucide-react';

export default function OnboardingPage() {
  const { user, updateProfile, loading } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [mode, setMode] = useState<Mode>('internship');
  const [name, setName] = useState('');
  const [schoolYear, setSchoolYear] = useState('');
  const [recruitingSeason, setRecruitingSeason] = useState('');
  const [careerLevel, setCareerLevel] = useState('');

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
    if (!loading && user?.onboarding_complete) {
      router.replace('/dashboard');
    }
  }, [user, loading, router]);

  if (loading || !user || user.onboarding_complete) {
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

  const handleComplete = () => {
    updateProfile({
      name,
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
              <h1 className="text-[15px] font-semibold mb-1" style={{ color: 'var(--brand-navy)', letterSpacing: '-0.01em' }}>What are you tracking?</h1>
              <p className="text-[13px] mb-5" style={{ color: 'var(--muted-text)' }}>This determines your pipeline stages. You can change it later.</p>
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
                  <div className="font-medium text-[13px]" style={{ color: 'var(--brand-navy)' }}>Internship applications</div>
                  <div className="text-[12px] mt-0.5" style={{ color: 'var(--muted-text)' }}>Track internship recruiting cycles</div>
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
                  <div className="font-medium text-[13px]" style={{ color: 'var(--brand-navy)' }}>Full-time job applications</div>
                  <div className="text-[12px] mt-0.5" style={{ color: 'var(--muted-text)' }}>Track post-graduation job searches</div>
                  <div className="flex flex-wrap gap-1 mt-3">
                    {['New Grad', 'Negotiation', 'Offer compare'].map(tag => (
                      <span key={tag} className="text-[10px] px-1.5 py-0.5 border border-border-gray rounded" style={{ background: 'var(--surface-gray)', color: 'var(--text-tertiary)' }}>{tag}</span>
                    ))}
                  </div>
                </button>
              </div>
              <button
                onClick={() => setStep(2)}
                className="w-full mt-5 h-9 text-[14px] font-medium text-white rounded-md transition-colors"
                style={{ background: 'var(--accent-blue)' }}
              >
                Continue
              </button>
            </div>
          )}

          {/* Step 2: Personal Context */}
          {step === 2 && (
            <div>
              <h1 className="text-[15px] font-semibold mb-1" style={{ color: 'var(--brand-navy)', letterSpacing: '-0.01em' }}>Tell us about yourself</h1>
              <p className="text-[13px] mb-5" style={{ color: 'var(--muted-text)' }}>Just the basics — takes 30 seconds.</p>
              <div className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-[13px] font-medium mb-1" style={{ color: 'var(--brand-navy)' }}>Your name</label>
                  <input
                    id="name"
                    type="text"
                    autoFocus
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full h-9 px-3 bg-background border border-border-gray rounded-md text-sm focus:outline-none focus:border-accent-blue focus:ring-2 focus:ring-accent-blue/20 placeholder:text-text-tertiary transition-colors"
                    placeholder="First name"
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
                  className="flex-1 h-9 text-[14px] font-medium text-white rounded-md transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ background: 'var(--accent-blue)' }}
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
              <p className="text-[13px] mb-5" style={{ color: 'var(--muted-text)' }}>Your pipeline is ready to go.</p>

              {/* Mini pipeline preview */}
              <div className="flex gap-3 overflow-x-auto pb-2 mb-4" style={{ scrollbarWidth: 'none' }}>
                {stages.map((stage) => {
                  const color = STAGE_COLORS[stage] || '#6B7280';
                  return (
                    <div key={stage} className="flex flex-col items-center gap-1.5 flex-shrink-0 min-w-[56px]">
                      <div className="w-8 h-8 rounded-lg border border-border-gray flex items-center justify-center" style={{ background: 'var(--surface-gray)' }}>
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                      </div>
                      <span className="text-[10px] font-medium text-center leading-tight max-w-[60px]"
                        style={{ color: 'var(--muted-text)' }}>
                        {stage}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Autofill tip */}
              <div className="p-3 rounded-lg border border-border-gray text-[12px] mb-5"
                style={{ background: 'var(--surface-gray)', color: 'var(--muted-text)' }}>
                <span className="font-semibold" style={{ color: 'var(--brand-navy)' }}>Tip:</span>{' '}
                Paste any job URL when adding an application — Applyd will autofill the company, role, and location for you.
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
                  className="flex-1 h-9 text-[14px] font-medium text-white rounded-md transition-colors flex items-center justify-center gap-1.5"
                  style={{ background: 'var(--accent-blue)' }}
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
