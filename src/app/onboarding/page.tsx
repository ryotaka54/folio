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
          <div className="bg-card-bg rounded-2xl p-6 md:p-8 border border-border-gray">
            <div className="w-40 h-6 rounded bg-surface-gray animate-pulse mb-2" />
            <div className="w-64 h-4 rounded bg-surface-gray animate-pulse mb-6" />
            <div className="grid grid-cols-2 gap-3">
              <div className="h-32 rounded-xl bg-surface-gray animate-pulse" />
              <div className="h-32 rounded-xl bg-surface-gray animate-pulse" />
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

        <div className="bg-card-bg rounded-2xl p-6 md:p-8 shadow-sm border border-border-gray modal-enter">
          {/* Step 1: Mode Selection */}
          {step === 1 && (
            <div>
              <h1 className="text-xl font-semibold text-brand-navy mb-1">What are you tracking?</h1>
              <p className="text-sm text-muted-text mb-6">This determines your pipeline stages. You can change it later.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <button
                  onClick={() => setMode('internship')}
                  className={`text-left p-4 rounded-xl border-2 transition-all ${
                    mode === 'internship'
                      ? 'border-accent-blue bg-light-accent'
                      : 'border-border-gray hover:border-accent-blue/30'
                  }`}
                >
                  <div className="mb-3 text-accent-blue bg-accent-blue/10 w-10 h-10 rounded-full flex items-center justify-center">
                    <GraduationCap size={20} className="stroke-[2.5px]" />
                  </div>
                  <div className="font-medium text-brand-navy text-sm">Internship applications</div>
                  <div className="text-xs text-muted-text mt-1">Track internship recruiting cycles</div>
                  <div className="flex flex-wrap gap-1 mt-3">
                    {['Summer 2026', 'OA / Screen', 'Return offer'].map(tag => (
                      <span key={tag} className="text-[10px] px-2 py-0.5 bg-surface-gray rounded-full text-muted-text">{tag}</span>
                    ))}
                  </div>
                </button>
                <button
                  onClick={() => setMode('job')}
                  className={`text-left p-4 rounded-xl border-2 transition-all ${
                    mode === 'job'
                      ? 'border-accent-blue bg-light-accent'
                      : 'border-border-gray hover:border-accent-blue/30'
                  }`}
                >
                  <div className="mb-3 text-accent-blue bg-accent-blue/10 w-10 h-10 rounded-full flex items-center justify-center">
                    <Briefcase size={20} className="stroke-[2.5px]" />
                  </div>
                  <div className="font-medium text-brand-navy text-sm">Full-time job applications</div>
                  <div className="text-xs text-muted-text mt-1">Track post-graduation job searches</div>
                  <div className="flex flex-wrap gap-1 mt-3">
                    {['New Grad', 'Negotiation', 'Offer compare'].map(tag => (
                      <span key={tag} className="text-[10px] px-2 py-0.5 bg-surface-gray rounded-full text-muted-text">{tag}</span>
                    ))}
                  </div>
                </button>
              </div>
              <button
                onClick={() => setStep(2)}
                className="w-full mt-6 py-2.5 bg-accent-blue text-white text-sm font-medium rounded-lg hover:bg-accent-blue/90 transition-colors"
              >
                Continue
              </button>
            </div>
          )}

          {/* Step 2: Personal Context */}
          {step === 2 && (
            <div>
              <h1 className="text-xl font-semibold text-brand-navy mb-1">Tell us about yourself</h1>
              <p className="text-sm text-muted-text mb-6">Just the basics — takes 30 seconds.</p>
              <div className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-body-text mb-1">Your name</label>
                  <input
                    id="name"
                    type="text"
                    autoFocus
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 border border-border-gray rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent-blue/30 focus:border-accent-blue transition-colors bg-background"
                    placeholder="First name"
                  />
                </div>
                {mode === 'internship' ? (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-body-text mb-2">School year</label>
                      <div className="flex flex-wrap gap-2">
                        {SCHOOL_YEARS.map(y => (
                          <button
                            key={y}
                            onClick={() => setSchoolYear(y)}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                              schoolYear === y
                                ? 'bg-accent-blue text-white'
                                : 'bg-surface-gray text-body-text hover:bg-border-gray'
                            }`}
                          >
                            {y}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-body-text mb-2">Recruiting season</label>
                      <div className="flex flex-wrap gap-2">
                        {RECRUITING_SEASONS.map(s => (
                          <button
                            key={s}
                            onClick={() => setRecruitingSeason(s)}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                              recruitingSeason === s
                                ? 'bg-accent-blue text-white'
                                : 'bg-surface-gray text-body-text hover:bg-border-gray'
                            }`}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-body-text mb-2">Career level</label>
                    <div className="flex flex-wrap gap-2">
                      {CAREER_LEVELS.map(l => (
                        <button
                          key={l}
                          onClick={() => setCareerLevel(l)}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                            careerLevel === l
                              ? 'bg-accent-blue text-white'
                              : 'bg-surface-gray text-body-text hover:bg-border-gray'
                          }`}
                        >
                          {l}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 py-2.5 bg-surface-gray text-body-text text-sm font-medium rounded-lg hover:bg-border-gray transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={() => setStep(3)}
                  className="flex-1 py-2.5 bg-accent-blue text-white text-sm font-medium rounded-lg hover:bg-accent-blue/90 transition-colors"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Confirmation */}
          {step === 3 && (
            <div>
              <h1 className="text-xl font-semibold text-brand-navy mb-1">You&apos;re all set{name ? `, ${name}` : ''}!</h1>
              <p className="text-sm text-muted-text mb-6">Here are the pipeline stages we&apos;ve set up for you:</p>
              <div className="space-y-2">
                {stages.map((stage, i) => (
                  <div
                    key={stage}
                    className="flex items-center gap-3 px-3 py-2 bg-surface-gray rounded-lg"
                  >
                    <span className="text-xs text-muted-text font-medium w-5">{i + 1}</span>
                    <span className="text-sm text-body-text">{stage}</span>
                  </div>
                ))}
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setStep(2)}
                  className="flex-1 py-2.5 bg-surface-gray text-body-text text-sm font-medium rounded-lg hover:bg-border-gray transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleComplete}
                  className="flex-1 py-2.5 bg-accent-blue text-white text-sm font-medium rounded-lg hover:bg-accent-blue/90 transition-colors"
                >
                  Add your first application →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
