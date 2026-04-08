import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Logo } from '@/components/Logo';

export const metadata = {
  title: 'Terms of Service | Applyd',
  description: 'Terms of Service for Applyd — the recruiting pipeline tracker for students.',
};

const SECTIONS = [
  {
    title: 'Who this is for',
    content: [
      'Applyd is a recruiting pipeline tracker built for students. By using Applyd you confirm that you are at least 13 years old and agree to these terms.',
      'If you are under 18, you represent that you have permission from a parent or legal guardian.',
    ],
  },
  {
    title: 'Your account',
    items: [
      'You are responsible for keeping your login credentials secure. Do not share your password.',
      'You are responsible for all activity that occurs under your account.',
      'Notify us immediately at support@useapplyd.com if you suspect unauthorized access.',
      'We reserve the right to suspend or terminate accounts that violate these terms.',
    ],
  },
  {
    title: 'Your data',
    content: [
      'The applications, notes, and recruiter details you add to Applyd belong to you. We store them on your behalf and do not sell them to third parties.',
      'You can export or delete your data at any time from Settings. If you delete your account, your data is permanently removed within 30 days.',
    ],
  },
  {
    title: 'Acceptable use',
    intro: 'You agree not to:',
    items: [
      'Use Applyd for any unlawful purpose or in violation of any regulations.',
      'Attempt to gain unauthorized access to any part of the service or its infrastructure.',
      'Scrape, crawl, or otherwise extract data from Applyd in an automated manner.',
      'Interfere with or disrupt the integrity or performance of the service.',
      'Impersonate another person or entity.',
      'Upload malicious code or content of any kind.',
    ],
  },
  {
    title: 'Pro subscription',
    items: [
      'Applyd Pro is a paid subscription that unlocks unlimited application tracking and additional features.',
      'Subscriptions are billed monthly or annually depending on the plan you choose.',
      'You may cancel at any time. Cancellation takes effect at the end of the current billing period — you retain Pro access until then.',
      'Refunds are handled on a case-by-case basis. Contact us at support@useapplyd.com within 7 days of a charge if you believe you were billed in error.',
      'We reserve the right to change subscription pricing with 30 days notice.',
    ],
  },
  {
    title: 'Intellectual property',
    content: [
      'Applyd and its original content, features, and design are owned by us and protected by applicable intellectual property laws.',
      'You retain ownership of any content you create — your application data, notes, and recruiter information are yours.',
    ],
  },
  {
    title: 'Disclaimers',
    content: [
      'Applyd is provided "as is" and "as available" without warranties of any kind, express or implied. We do not guarantee that the service will be uninterrupted, error-free, or that any information provided (such as recruiting benchmarks) is accurate or complete.',
      'We are not affiliated with, endorsed by, or in partnership with any employer, job board, or university mentioned within the application.',
    ],
  },
  {
    title: 'Limitation of liability',
    content: [
      'To the fullest extent permitted by law, Applyd shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the service, even if we have been advised of the possibility of such damages.',
      'Our total liability to you for any claim shall not exceed the amount you paid us in the 12 months prior to the claim.',
    ],
  },
  {
    title: 'Changes to these terms',
    content: [
      'We may update these terms from time to time. When we do, we will update the date at the top of this page and, for material changes, notify you by email or an in-app notice.',
      'Continued use of Applyd after changes take effect constitutes acceptance of the updated terms.',
    ],
  },
  {
    title: 'Contact',
    content: [
      'Questions about these terms? Email us at support@useapplyd.com and we will get back to you.',
    ],
  },
];

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="border-b border-border-gray bg-background sticky top-0 z-30">
        <div className="max-w-[1200px] mx-auto px-6 flex items-center justify-between h-14">
          <Link href="/" className="flex items-center gap-2">
            <Logo size={22} variant="dark" />
            <span className="text-[15px] font-semibold" style={{ color: 'var(--brand-navy)', letterSpacing: '-0.02em' }}>Applyd</span>
          </Link>
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-muted-text hover:text-brand-navy transition-colors">
            <ArrowLeft size={15} />
            Back
          </Link>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto px-6 py-14">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-[22px] font-semibold mb-2" style={{ color: 'var(--brand-navy)', letterSpacing: '-0.02em' }}>
            Terms of Service
          </h1>
          <p className="text-sm text-muted-text">Last updated: April 7, 2026</p>
          <p className="mt-4 text-sm leading-relaxed" style={{ color: 'var(--body-text)' }}>
            These terms govern your use of Applyd. We have written them to be as clear and straightforward as possible.
            Please read them before using the service.
          </p>
        </div>

        {/* Sections */}
        <div className="space-y-10">
          {SECTIONS.map((section, i) => (
            <section key={i}>
              <h2 className="text-base font-semibold mb-3 pb-2 border-b border-border-gray" style={{ color: 'var(--brand-navy)' }}>
                {section.title}
              </h2>
              <div className="space-y-3 text-sm leading-relaxed" style={{ color: 'var(--body-text)' }}>
                {section.intro && (
                  <p>{section.intro}</p>
                )}
                {section.content?.map((para, j) => (
                  <p key={j}>{para}</p>
                ))}
                {section.items && (
                  <ul className="space-y-2.5">
                    {section.items.map((item, j) => (
                      <li key={j} className="flex gap-3">
                        <span className="mt-0.5 flex-shrink-0" style={{ color: 'var(--accent-blue)' }}>→</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </section>
          ))}
        </div>

        {/* Agreement footer */}
        <div
          className="mt-14 rounded-xl p-6 text-center"
          style={{ background: 'var(--card-bg)', border: '1px solid var(--border-gray)' }}
        >
          <p className="text-sm font-medium mb-1" style={{ color: 'var(--brand-navy)' }}>
            By using Applyd you agree to these terms.
          </p>
          <p className="text-[12px] mb-5" style={{ color: 'var(--muted-text)' }}>
            Questions? Email us at{' '}
            <a href="mailto:support@useapplyd.com" className="underline underline-offset-2 hover:opacity-80 transition-opacity">
              support@useapplyd.com
            </a>
          </p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <Link
              href="/signup"
              className="inline-flex items-center h-9 px-5 rounded-lg text-[13px] font-semibold text-white transition-colors"
              style={{ background: 'var(--accent-blue)' }}
            >
              I agree — create my account
            </Link>
            <Link
              href="/"
              className="inline-flex items-center h-9 px-5 rounded-lg text-[13px] font-medium border transition-colors hover:bg-surface-gray"
              style={{ borderColor: 'var(--border-gray)', color: 'var(--muted-text)' }}
            >
              I disagree — go back
            </Link>
          </div>
        </div>

        {/* Footer links */}
        <div className="mt-10 pt-6 border-t border-border-gray flex items-center justify-between flex-wrap gap-3">
          <Link href="/privacy" className="text-[12px] text-muted-text hover:text-brand-navy transition-colors">
            Privacy Policy
          </Link>
          <p className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>© 2026 Applyd</p>
        </div>
      </main>
    </div>
  );
}
