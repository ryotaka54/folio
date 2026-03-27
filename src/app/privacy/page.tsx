import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="border-b border-border-gray bg-background sticky top-0 z-30">
        <div className="max-w-[1200px] mx-auto px-6 flex items-center justify-between h-14">
          <Link href="/" className="flex items-center gap-2">
            <svg width="22" height="22" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="4" y="10" width="40" height="5" rx="2.5" fill="#4361EE"/>
              <rect x="4" y="22" width="28" height="5" rx="2.5" fill="#4361EE" opacity="0.6"/>
              <rect x="4" y="34" width="16" height="5" rx="2.5" fill="#4361EE" opacity="0.3"/>
            </svg>
            <span className="text-lg font-semibold text-brand-navy tracking-tight">Applyd</span>
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
          <h1 className="text-3xl font-bold text-brand-navy mb-2">Privacy Policy</h1>
          <p className="text-sm text-muted-text">Last updated: March 27, 2026</p>
          <p className="mt-4 text-sm text-body-text leading-relaxed">
            We built Applyd for students — so we&apos;ll keep this plain and simple. No legal jargon, no surprises.
            Here&apos;s exactly what we collect, why, and what we do with it.
          </p>
        </div>

        <div className="space-y-10">

          {/* Section 1 */}
          <section>
            <h2 className="text-base font-semibold text-brand-navy mb-3 pb-2 border-b border-border-gray">
              What we collect
            </h2>
            <div className="space-y-3 text-sm text-body-text leading-relaxed">
              <div className="flex gap-3">
                <span className="text-accent-blue mt-0.5 flex-shrink-0">→</span>
                <p><span className="font-medium">Account info</span> — your email address and password when you sign up.</p>
              </div>
              <div className="flex gap-3">
                <span className="text-accent-blue mt-0.5 flex-shrink-0">→</span>
                <p><span className="font-medium">Profile info</span> — your first name, school year, career level, recruiting season, and whether you&apos;re tracking internships or full-time jobs. You fill this in during onboarding and can update it anytime.</p>
              </div>
              <div className="flex gap-3">
                <span className="text-accent-blue mt-0.5 flex-shrink-0">→</span>
                <p><span className="font-medium">Application data</span> — the companies, roles, statuses, deadlines, notes, and recruiter details you add to your tracker. This is your data — we just store it for you.</p>
              </div>
              <div className="flex gap-3">
                <span className="text-accent-blue mt-0.5 flex-shrink-0">→</span>
                <p><span className="font-medium">Basic usage data</span> — how you interact with the app (e.g. which features you use) to help us improve the product. This is anonymised and never tied to your personal information.</p>
              </div>
            </div>
          </section>

          {/* Section 2 */}
          <section>
            <h2 className="text-base font-semibold text-brand-navy mb-3 pb-2 border-b border-border-gray">
              How we use it
            </h2>
            <div className="space-y-3 text-sm text-body-text leading-relaxed">
              <div className="flex gap-3">
                <span className="text-accent-blue mt-0.5 flex-shrink-0">→</span>
                <p>To run Applyd and keep your tracker working.</p>
              </div>
              <div className="flex gap-3">
                <span className="text-accent-blue mt-0.5 flex-shrink-0">→</span>
                <p>To personalise your pipeline stages and dashboard based on your mode and profile.</p>
              </div>
              <div className="flex gap-3">
                <span className="text-accent-blue mt-0.5 flex-shrink-0">→</span>
                <p>To send you transactional emails like password resets and account confirmations.</p>
              </div>
              <div className="flex gap-3">
                <span className="text-accent-blue mt-0.5 flex-shrink-0">→</span>
                <p>To send deadline reminders or product updates — only if you opt in.</p>
              </div>
              <div className="mt-4 bg-surface-gray rounded-xl px-4 py-3 text-sm text-body-text">
                <span className="font-semibold text-brand-navy">We will never sell your data</span> to third parties. We will never share your data with advertisers. Full stop.
              </div>
            </div>
          </section>

          {/* Section 3 */}
          <section>
            <h2 className="text-base font-semibold text-brand-navy mb-3 pb-2 border-b border-border-gray">
              Data storage &amp; security
            </h2>
            <div className="space-y-3 text-sm text-body-text leading-relaxed">
              <div className="flex gap-3">
                <span className="text-accent-blue mt-0.5 flex-shrink-0">→</span>
                <p>All data is stored on <a href="https://supabase.com" className="text-accent-blue hover:underline" target="_blank" rel="noopener noreferrer">Supabase</a>, which uses PostgreSQL with row-level security. That means each user can only ever access their own data — no one else can see your applications.</p>
              </div>
              <div className="flex gap-3">
                <span className="text-accent-blue mt-0.5 flex-shrink-0">→</span>
                <p>Your password is hashed and never stored in plain text.</p>
              </div>
              <div className="flex gap-3">
                <span className="text-accent-blue mt-0.5 flex-shrink-0">→</span>
                <p>All data is encrypted in transit (HTTPS) and at rest.</p>
              </div>
              <div className="flex gap-3">
                <span className="text-accent-blue mt-0.5 flex-shrink-0">→</span>
                <p>Supabase is SOC 2 Type II compliant.</p>
              </div>
            </div>
          </section>

          {/* Section 4 */}
          <section>
            <h2 className="text-base font-semibold text-brand-navy mb-3 pb-2 border-b border-border-gray">
              Third-party services
            </h2>
            <div className="space-y-3 text-sm text-body-text leading-relaxed">
              <div className="flex gap-3">
                <span className="text-accent-blue mt-0.5 flex-shrink-0">→</span>
                <p><span className="font-medium">Supabase</span> — database and authentication.</p>
              </div>
              <div className="flex gap-3">
                <span className="text-accent-blue mt-0.5 flex-shrink-0">→</span>
                <p><span className="font-medium">Vercel</span> — hosting and deployment.</p>
              </div>
              <div className="flex gap-3">
                <span className="text-accent-blue mt-0.5 flex-shrink-0">→</span>
                <p><span className="font-medium">Resend</span> — transactional email delivery.</p>
              </div>
              <div className="flex gap-3">
                <span className="text-accent-blue mt-0.5 flex-shrink-0">→</span>
                <p>We may use anonymised analytics tools to understand how users interact with the app. These tools do not receive your personal data.</p>
              </div>
            </div>
          </section>

          {/* Section 5 */}
          <section>
            <h2 className="text-base font-semibold text-brand-navy mb-3 pb-2 border-b border-border-gray">
              Your rights
            </h2>
            <div className="space-y-3 text-sm text-body-text leading-relaxed">
              <div className="flex gap-3">
                <span className="text-accent-blue mt-0.5 flex-shrink-0">→</span>
                <p>You can <span className="font-medium">delete your account</span> and all associated data at any time from your account settings.</p>
              </div>
              <div className="flex gap-3">
                <span className="text-accent-blue mt-0.5 flex-shrink-0">→</span>
                <p>You can <span className="font-medium">export your application data</span> at any time.</p>
              </div>
              <div className="flex gap-3">
                <span className="text-accent-blue mt-0.5 flex-shrink-0">→</span>
                <p>You can <span className="font-medium">update or correct</span> your profile information at any time from the dashboard.</p>
              </div>
              <div className="flex gap-3">
                <span className="text-accent-blue mt-0.5 flex-shrink-0">→</span>
                <p>To request a copy of your data or ask any privacy-related questions, email us at <a href="mailto:hello@useapplyd.com" className="text-accent-blue hover:underline">hello@useapplyd.com</a>.</p>
              </div>
            </div>
          </section>

          {/* Section 6 */}
          <section>
            <h2 className="text-base font-semibold text-brand-navy mb-3 pb-2 border-b border-border-gray">
              Cookies
            </h2>
            <div className="space-y-3 text-sm text-body-text leading-relaxed">
              <div className="flex gap-3">
                <span className="text-accent-blue mt-0.5 flex-shrink-0">→</span>
                <p>We use a single session cookie to keep you logged in. That&apos;s it.</p>
              </div>
              <div className="flex gap-3">
                <span className="text-accent-blue mt-0.5 flex-shrink-0">→</span>
                <p>We do not use advertising cookies, tracking cookies, or third-party analytics cookies.</p>
              </div>
            </div>
          </section>

          {/* Section 7 */}
          <section>
            <h2 className="text-base font-semibold text-brand-navy mb-3 pb-2 border-b border-border-gray">
              Children&apos;s privacy
            </h2>
            <p className="text-sm text-body-text leading-relaxed">
              Applyd is intended for users aged 13 and older. We do not knowingly collect personal
              information from children under 13. If you believe a child under 13 has created an account,
              please contact us at <a href="mailto:hello@useapplyd.com" className="text-accent-blue hover:underline">hello@useapplyd.com</a> and we will delete the account promptly.
            </p>
          </section>

          {/* Section 8 */}
          <section>
            <h2 className="text-base font-semibold text-brand-navy mb-3 pb-2 border-b border-border-gray">
              Changes to this policy
            </h2>
            <p className="text-sm text-body-text leading-relaxed">
              If we make significant changes to this policy, we will notify users by email or with a notice
              in the app before the changes take effect. The &quot;last updated&quot; date at the top of this page
              will always reflect when it was last changed.
            </p>
          </section>

          {/* Section 9 */}
          <section>
            <h2 className="text-base font-semibold text-brand-navy mb-3 pb-2 border-b border-border-gray">
              Contact
            </h2>
            <p className="text-sm text-body-text leading-relaxed">
              Questions, concerns, or requests? Email us at{' '}
              <a href="mailto:hello@useapplyd.com" className="text-accent-blue hover:underline">hello@useapplyd.com</a>.
              We&apos;re a small team and we actually read every email.
            </p>
          </section>

        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border-gray py-10 bg-surface-gray/30 mt-10">
        <div className="max-w-[1200px] mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 opacity-50 grayscale">
            <svg width="18" height="18" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="4" y="10" width="40" height="5" rx="2.5" fill="#4361EE"/>
              <rect x="4" y="22" width="28" height="5" rx="2.5" fill="#4361EE" opacity="0.6"/>
              <rect x="4" y="34" width="16" height="5" rx="2.5" fill="#4361EE" opacity="0.3"/>
            </svg>
            <span className="text-sm font-semibold text-brand-navy">Applyd</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/help" className="text-xs font-medium text-muted-text hover:text-accent-blue transition-colors">Help & FAQ</Link>
            <Link href="/contact" className="text-xs font-medium text-muted-text hover:text-accent-blue transition-colors">Contact Us</Link>
            <Link href="/privacy" className="text-xs font-medium text-muted-text hover:text-accent-blue transition-colors">Privacy Policy</Link>
            <span className="text-xs text-muted-text/50">© 2026 Applyd</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
