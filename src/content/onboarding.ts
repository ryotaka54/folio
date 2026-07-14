// Shared copy dictionary for the onboarding flow (EN + JA).
//
// The two locales run genuinely different onboarding flows, not just
// translated copy of the same steps:
//   - EN: a 3-step "pipeline mode" flow (choose internship vs. job
//     search → personal context like school/school-year/career-level →
//     pipeline preview + confirm). Also powers a standalone "change
//     mode" mini-flow reachable after onboarding is already complete.
//   - JA: a 5-screen "shuukatsu" (Japanese job-hunting) flow (welcome →
//     grad year in Japanese cohort format, e.g. 26卒 → university type
//     → target industries (multi-select) → animated completion
//     screen). It has no "mode" concept and no post-onboarding
//     change-mode flow.
//
// Because the underlying data models differ (EN: mode/schoolYear/
// recruitingSeason/careerLevel via updateProfile; JA: gradYear/
// uniType/industries written directly to Supabase), the two are kept
// as separate, independently-shaped copy objects rather than forced
// into one generic "steps" array. OnboardingView.tsx branches on
// `locale` and renders each flow's own JSX, pulling only its own half
// of this file.

export interface ModeCardCopy {
  title: string;
  desc: string;
  tags?: string[];
}

export interface OnboardingEnCopy {
  /** "Step {n} of {total}" progress text shown above the card. */
  stepIndicator: (step: number, total: number) => string;
  /** Standalone mode-change flow, accessible after onboarding is complete
   *  (e.g. from a command palette). No JA/shuukatsu equivalent — "mode"
   *  (internship vs. job) doesn't map onto the shuukatsu data model. */
  changeMode: {
    title: string;
    subtitle: string;
    internship: ModeCardCopy;
    job: ModeCardCopy;
    cancel: string;
    save: string;
  };
  /** Step 1 — pick internship vs. job-search mode. */
  mode: {
    title: string;
    subtitle: string;
    internship: ModeCardCopy;
    job: ModeCardCopy;
    continueLabel: string;
  };
  /** Step 2 — name, school, and mode-dependent context fields. */
  personal: {
    title: string;
    subtitle: string;
    nameLabel: string;
    namePlaceholder: string;
    schoolLabel: string;
    schoolPlaceholder: string;
    schoolYearLabel: string;
    recruitingSeasonLabel: string;
    careerLevelLabel: string;
    backLabel: string;
    continueLabel: string;
  };
  /** Step 3 — mini pipeline preview + tips + final CTA. */
  confirm: {
    title: (name: string) => string;
    subtitle: string;
    tip1Bold: string;
    tip1Rest: string;
    tip2Bold: string;
    tip2Rest: string;
    backLabel: string;
    ctaLabel: string;
  };
}

export interface OnboardingJaCopy {
  welcome: {
    heading: string;
    subtitle: string;
    ctaLabel: string;
  };
  gradYear: {
    question: string;
    options: string[];
    nextLabel: string;
  };
  uniType: {
    question: string;
    options: string[];
    nextLabel: string;
  };
  industries: {
    question: string;
    helper: string;
    options: string[];
    nextLabel: string;
  };
  complete: {
    heading: string;
    subtitle: string;
    ctaLabel: string;
    savingLabel: string;
  };
}

export const en: OnboardingEnCopy = {
  stepIndicator: (step, total) => `Step ${step} of ${total}`,
  changeMode: {
    title: 'What are you applying to?',
    subtitle: 'Switch anytime — your pipeline stages update automatically.',
    internship: {
      title: "I'm applying for internships",
      desc: 'This summer, next semester, or co-op',
    },
    job: {
      title: "I'm looking for a full-time role",
      desc: 'Full-time after graduation or a career change',
    },
    cancel: 'Cancel',
    save: 'Save',
  },
  mode: {
    title: 'What are you applying to?',
    subtitle: 'Pick one to start — you can switch anytime.',
    internship: {
      title: "I'm applying for internships",
      desc: 'This summer, next semester, or co-op',
      tags: ['Summer 2026', 'OA / Screen', 'Return offer'],
    },
    job: {
      title: "I'm looking for a full-time role",
      desc: 'Full-time after graduation or a career change',
      tags: ['New Grad', 'Negotiation', 'Offer compare'],
    },
    continueLabel: 'Continue',
  },
  personal: {
    title: 'A little about you',
    subtitle: 'Applyd uses this to personalize your coaching and reminders.',
    nameLabel: 'Your name',
    namePlaceholder: 'First name',
    schoolLabel: 'School',
    schoolPlaceholder: 'e.g. UC Berkeley, MIT, Georgia Tech',
    schoolYearLabel: 'School year',
    recruitingSeasonLabel: 'Recruiting season',
    careerLevelLabel: 'Career level',
    backLabel: 'Back',
    continueLabel: 'Continue',
  },
  confirm: {
    title: (name: string) => `You're all set${name ? `, ${name}` : ''}!`,
    subtitle: "Here's your pipeline. Add your first application and the AI starts working.",
    tip1Bold: 'Paste a job URL',
    tip1Rest: ' and Applyd fills in the company, role, and location automatically. No typing needed.',
    tip2Bold: 'Drag to advance.',
    tip2Rest: ' When you hear back, drag the card to the next stage. Your AI tools activate automatically as you move forward.',
    backLabel: 'Back',
    ctaLabel: 'Start tracking',
  },
};

export const ja: OnboardingJaCopy = {
  welcome: {
    heading: '就活を、もっとシンプルに。',
    subtitle: 'エントリーから内定まで、すべての選考を一元管理。',
    ctaLabel: '始める',
  },
  gradYear: {
    question: '何卒ですか？',
    options: ['25卒', '26卒', '27卒', '28卒'],
    nextLabel: '次へ',
  },
  uniType: {
    question: '大学の種別は？',
    options: ['国立大学', '私立大学', '大学院', '海外大学'],
    nextLabel: '次へ',
  },
  industries: {
    question: '志望業界を教えてください。',
    helper: '複数選択できます（最大3つ）',
    options: ['IT・テクノロジー', '金融', 'コンサルティング', 'メーカー', '商社', 'メディア・広告', 'その他'],
    nextLabel: '次へ',
  },
  complete: {
    heading: '準備完了です',
    subtitle: 'ダッシュボードへ進みましょう',
    ctaLabel: 'ダッシュボードへ',
    savingLabel: '設定中...',
  },
};
