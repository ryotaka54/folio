'use client';

import { useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { PageHeader } from '@/components/marketing/PageHeader';
import { localeHref, type Locale } from '@/lib/locale';
import { en, ja, type ContactCopy } from '@/content/contact';

const COPY: Record<Locale, ContactCopy> = { en, ja };

interface ContactViewProps {
  locale: Locale;
}

const inputClass =
  'w-full h-11 px-3.5 rounded-lg border border-border-gray bg-surface-gray text-[14px] text-brand-navy focus:outline-none focus:border-accent-blue focus:ring-2 focus:ring-accent-blue/20 placeholder:text-text-tertiary transition-colors';

export default function ContactView({ locale }: ContactViewProps) {
  const copy = COPY[locale];

  const [email, setEmail] = useState('');
  const [category, setCategory] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !category || !message.trim()) {
      setError(copy.errorRequiredMessage);
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      const { error: dbError } = await supabase.from('support_requests').insert({
        email,
        category,
        message,
        locale,
      });
      if (dbError) throw dbError;
      setSubmitted(true);
    } catch {
      setError(copy.errorSubmitMessage);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <PageHeader locale={locale} breadcrumb={copy.breadcrumb} />

      <main className="max-w-[480px] mx-auto px-4 md:px-6 py-16">
        <h1 className="text-[22px] font-semibold mb-1 text-brand-navy" style={{ letterSpacing: '-0.02em' }}>
          {copy.title}
        </h1>
        <p className="text-[14px] mb-6 text-muted-text leading-relaxed">{copy.subtitle}</p>

        <div className="flex flex-wrap gap-2 mb-8">
          {copy.quickLinks.map((link) => (
            <Link
              key={link.href}
              href={localeHref(locale, link.href)}
              className="text-[12px] px-3.5 py-1.5 rounded-full border border-border-gray bg-surface-gray text-muted-text transition-colors hover:text-brand-navy"
              style={{ letterSpacing: '0.02em' }}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {submitted ? (
          <div className="rounded-lg border border-border-gray bg-surface-gray p-8 text-center">
            <div className="text-[32px] mb-3">✓</div>
            <h2 className="text-[16px] font-semibold mb-2 text-brand-navy">{copy.successTitle}</h2>
            <p className="text-[14px] leading-relaxed text-muted-text">{copy.successMessage}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <Field label={copy.emailLabel}>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={copy.emailPlaceholder}
                required
                className={inputClass}
              />
            </Field>

            <Field label={copy.categoryLabel}>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                required
                className={inputClass}
              >
                <option value="">{copy.categoryPlaceholder}</option>
                {copy.categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </Field>

            <Field label={copy.messageLabel}>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value.slice(0, copy.messageMaxLength))}
                placeholder={copy.messagePlaceholder}
                rows={6}
                required
                className={`${inputClass} h-auto py-2.5 resize-y leading-relaxed`}
              />
              <div className="text-right mt-1">
                <span className="text-[11px] text-text-tertiary">
                  {message.length} / {copy.messageMaxLength}
                </span>
              </div>
            </Field>

            {error && <p className="text-[13px] m-0 text-error-text">{error}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="h-12 rounded-[10px] bg-accent-blue text-white text-[14px] font-semibold transition-opacity disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ letterSpacing: '0.02em' }}
            >
              {submitting ? copy.submitLoadingLabel : copy.submitLabel}
            </button>
          </form>
        )}

        <p className="text-[13px] mt-6 text-center text-muted-text">
          {copy.directEmailLabel}{' '}
          <a href="mailto:hello@useapplyd.com" className="text-accent-blue transition-colors">
            hello@useapplyd.com
          </a>
        </p>
      </main>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[12px] font-semibold text-muted-text" style={{ letterSpacing: '0.03em' }}>
        {label}
      </label>
      {children}
    </div>
  );
}
