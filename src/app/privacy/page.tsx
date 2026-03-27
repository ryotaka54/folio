import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-6 py-16">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-text hover:text-brand-navy transition-colors mb-10">
          <ArrowLeft size={16} />
          Back to home
        </Link>

        <h1 className="text-3xl font-bold text-brand-navy mb-2">Privacy Policy</h1>
        <p className="text-sm text-muted-text mb-10">Last updated: March 27, 2026</p>

        <div className="space-y-8 text-sm text-body-text leading-relaxed">

          <section>
            <h2 className="text-base font-semibold text-brand-navy mb-2">Overview</h2>
            <p>
              Applyd (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) is a job and internship application tracker for students.
              We take your privacy seriously. This policy explains what data we collect, why we collect it,
              and how it is stored and protected.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-brand-navy mb-2">What We Collect</h2>
            <p className="mb-3">We collect only what is necessary to provide the service:</p>
            <ul className="list-disc list-inside space-y-1.5 text-muted-text">
              <li><span className="text-body-text font-medium">Account information</span> — your email address and password (stored securely via Supabase Auth)</li>
              <li><span className="text-body-text font-medium">Profile information</span> — your first name, school year, career level, and recruiting season (all optional)</li>
              <li><span className="text-body-text font-medium">Application data</span> — company names, roles, locations, statuses, deadlines, notes, and job links you manually enter or autofill</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-brand-navy mb-2">What We Do Not Collect</h2>
            <ul className="list-disc list-inside space-y-1.5 text-muted-text">
              <li>We do not collect payment information (Applyd is free)</li>
              <li>We do not sell your data to third parties</li>
              <li>We do not use your data for advertising</li>
              <li>We do not track your browsing activity outside of Applyd</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-brand-navy mb-2">How We Use Your Data</h2>
            <ul className="list-disc list-inside space-y-1.5 text-muted-text">
              <li>To provide and maintain your account and application tracker</li>
              <li>To send transactional emails (password resets, account confirmations)</li>
              <li>To improve the product based on aggregate, anonymised usage patterns</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-brand-navy mb-2">Data Storage</h2>
            <p>
              Your data is stored securely on <a href="https://supabase.com" className="text-accent-blue hover:underline" target="_blank" rel="noopener noreferrer">Supabase</a>,
              a hosted Postgres database platform. Data is encrypted at rest and in transit.
              Supabase is SOC 2 Type II compliant. We do not store your password in plain text —
              it is hashed using bcrypt before storage.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-brand-navy mb-2">Chrome Extension</h2>
            <p>
              The Applyd Chrome extension reads job posting pages only when you actively open the
              extension popup on a supported page. It does not run in the background, does not
              track your browsing history, and only sends data (company, role, location) to your
              own Applyd account when you click &quot;Save to Applyd&quot;.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-brand-navy mb-2">Cookies &amp; Sessions</h2>
            <p>
              We use a single session cookie to keep you logged in. No third-party tracking
              cookies or analytics cookies are used.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-brand-navy mb-2">Your Rights</h2>
            <p className="mb-3">You have the right to:</p>
            <ul className="list-disc list-inside space-y-1.5 text-muted-text">
              <li>Access all data we hold about you</li>
              <li>Request deletion of your account and all associated data</li>
              <li>Export your application data at any time</li>
            </ul>
            <p className="mt-3">
              To exercise any of these rights, email us at{' '}
              <a href="mailto:hello@useapplyd.com" className="text-accent-blue hover:underline">hello@useapplyd.com</a>.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-brand-navy mb-2">Changes to This Policy</h2>
            <p>
              If we make material changes to this policy, we will update the date at the top of this page.
              Continued use of Applyd after changes constitutes acceptance of the updated policy.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-brand-navy mb-2">Contact</h2>
            <p>
              Questions about this policy? Email us at{' '}
              <a href="mailto:hello@useapplyd.com" className="text-accent-blue hover:underline">hello@useapplyd.com</a>.
            </p>
          </section>

        </div>
      </div>
    </div>
  );
}
