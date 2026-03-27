'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { INTERNSHIP_STAGES, JOB_STAGES, SCHOOL_YEARS, RECRUITING_SEASONS, CAREER_LEVELS } from '@/lib/constants';
import { Mode } from '@/lib/types';
import { GraduationCap, Briefcase } from 'lucide-react';

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
          <div className="flex justify-center gap-2 mb-8">
            {[1, 2, 3].map(i => <div key={i} className="w-2.5 h-2.5 rounded-full bg-border-gray animate-pulse" />)}
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

  return (
    <div className="min-h-screen bg-surface-gray flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Progress dots */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`w-2.5 h-2.5 rounded-full transition-colors ${
                s === step ? 'bg-accent-blue' : s < step ? 'bg-accent-blue/40' : 'bg-border-gray'
              }`}
            />
          ))}
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
                  className="flex-1 h-9 text-[14px] font-medium text-white rounded-md transition-colors"
                  style={{ background: 'var(--accent-blue)' }}
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Confirmation */}
          {step === 3 && (
            <div>
              <h1 className="text-[15px] font-semibold mb-1" style={{ color: 'var(--brand-navy)', letterSpacing: '-0.01em' }}>You&apos;re all set{name ? `, ${name}` : ''}!</h1>
              <p className="text-[13px] mb-5" style={{ color: 'var(--muted-text)' }}>Here are your pipeline stages:</p>
              <div className="space-y-1.5">
                {stages.map((stage, i) => (
                  <div
                    key={stage}
                    className="flex items-center gap-3 px-3 py-2 rounded-md border border-border-gray"
                    style={{ background: 'var(--surface-gray)' }}
                  >
                    <span className="text-[11px] font-medium w-4" style={{ color: 'var(--text-tertiary)' }}>{i + 1}</span>
                    <span className="text-[13px]" style={{ color: 'var(--brand-navy)' }}>{stage}</span>
                  </div>
                ))}
              </div>
              <div className="flex gap-3 mt-5">
                <button
                  onClick={() => setStep(2)}
                  className="flex-1 h-9 text-[13px] font-medium rounded-md border transition-colors"
                  style={{ background: 'var(--surface-gray)', borderColor: 'var(--border-gray)', color: 'var(--muted-text)' }}
                >
                  Back
                </button>
                <button
                  onClick={handleComplete}
                  className="flex-1 h-9 text-[14px] font-medium text-white rounded-md transition-colors"
                  style={{ background: 'var(--accent-blue)' }}
                >
                  Go to dashboard →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
