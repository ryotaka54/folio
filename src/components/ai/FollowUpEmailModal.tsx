'use client';

import { useState, useEffect } from 'react';
import { X, Copy, Check, Sparkles, RotateCcw } from 'lucide-react';
import ProGate from '@/components/ProGate';
import { authFetch } from '@/lib/auth-fetch';
import { AILoadingState } from '@/components/ui/ai-loading-state';

const EMAIL_TYPES = [
  { id: 'thank-you', label: 'Thank You' },
  { id: 'status-check', label: 'Status Check' },
  { id: 'withdraw', label: 'Withdraw' },
  { id: 'negotiate', label: 'Negotiate' },
  { id: 'referral', label: 'Ask for Referral' },
];

const TONES = [
  { id: 'warmer', label: 'Warmer' },
  { id: 'formal', label: 'More formal' },
  { id: 'concise', label: 'More concise' },
];

interface EmailResult {
  subject: string;
  body: string;
}

interface FollowUpEmailModalProps {
  company: string;
  role: string;
  stage: string;
  recruiterName?: string;
  recruiterEmail?: string;
  notes?: string;
  isPro: boolean;
  onUpgrade: () => void;
  onClose: () => void;
}

// Editable document-style output, not a chat bubble — a labeled subject
// field and a real textarea for the body, so the draft can be tweaked in
// place before copying, per the brief.
function EmailDraft({ result }: { result: EmailResult }) {
  const [subject, setSubject] = useState(result.subject);
  const [body, setBody] = useState(result.body);
  const [copied, setCopied] = useState(false);

  // A fresh generation (including a tone regenerate) replaces the draft —
  // in-place edits are local until then.
  useEffect(() => { setSubject(result.subject); setBody(result.body); }, [result]);

  const copyAll = () => {
    navigator.clipboard.writeText(`Subject: ${subject}\n\n${body}`).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-[11px] font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--muted-text)' }}>
          Subject
        </label>
        <input
          value={subject}
          onChange={e => setSubject(e.target.value)}
          className="w-full text-[13px] font-medium rounded-md border border-border-gray px-2.5 py-1.5 focus:outline-none focus:border-accent-blue"
          style={{ color: 'var(--brand-navy)', background: 'var(--background)' }}
        />
      </div>
      <div>
        <label className="block text-[11px] font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--muted-text)' }}>
          Body
        </label>
        <textarea
          value={body}
          onChange={e => setBody(e.target.value)}
          rows={8}
          className="w-full text-[13px] leading-relaxed rounded-md border border-border-gray px-2.5 py-2 focus:outline-none focus:border-accent-blue resize-y"
          style={{ color: 'var(--brand-navy)', background: 'var(--background)', fontFamily: 'inherit' }}
        />
      </div>
      <button
        onClick={copyAll}
        className="flex items-center gap-1.5 text-[12px] font-medium px-3 py-1.5 rounded-md border border-border-gray transition-colors hover:bg-surface-gray"
        style={{ color: 'var(--brand-navy)' }}
      >
        {copied ? <Check size={12} style={{ color: 'var(--green-success)' }} /> : <Copy size={12} />}
        {copied ? 'Copied!' : 'Copy email'}
      </button>
    </div>
  );
}

export default function FollowUpEmailModal({
  company, role, stage, recruiterName, recruiterEmail, notes, isPro, onUpgrade, onClose,
}: FollowUpEmailModalProps) {
  const [emailType, setEmailType] = useState('thank-you');
  const [result, setResult] = useState<EmailResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const generate = async (tone?: string) => {
    setLoading(true);
    setError('');
    try {
      const res = await authFetch('/api/ai/follow-up-email', {
        method: 'POST',
        body: JSON.stringify({ company, role, stage, recruiterName, recruiterEmail, notes, emailType, tone }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Failed');
      setResult(json.result);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center" style={{ background: 'rgba(0,0,0,0.4)' }}>
      <div
        className="bg-card-bg border border-border-gray w-full sm:max-w-md rounded-t-xl sm:rounded-xl shadow-2xl overflow-y-auto max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Sparkles size={14} style={{ color: 'var(--accent-blue)' }} />
              <h2 className="text-[14px] font-semibold" style={{ color: 'var(--brand-navy)' }}>AI Follow-Up Email</h2>
            </div>
            <button onClick={onClose} aria-label="Close" className="p-1 rounded hover:bg-surface-gray transition-colors" style={{ color: 'var(--muted-text)' }}>
              <X size={16} />
            </button>
          </div>

          <ProGate isPro={isPro} onUpgrade={onUpgrade} label="AI Follow-Up Emails — Pro">
            <div className="space-y-4">
              <div>
                <p className="text-[12px] font-medium mb-2" style={{ color: 'var(--brand-navy)' }}>Email type</p>
                <div className="flex flex-wrap gap-1.5">
                  {EMAIL_TYPES.map(t => (
                    <button
                      key={t.id}
                      onClick={() => { setEmailType(t.id); setResult(null); }}
                      className="text-[11px] font-medium px-2.5 py-1 rounded-md border transition-colors"
                      style={{
                        background: emailType === t.id ? 'var(--accent-blue)' : 'var(--card-bg)',
                        color: emailType === t.id ? '#fff' : 'var(--brand-navy)',
                        borderColor: emailType === t.id ? 'var(--accent-blue)' : 'var(--border-gray)',
                      }}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {!result && (
                <button
                  onClick={() => generate()}
                  disabled={loading}
                  className="w-full h-9 text-[13px] font-medium text-white rounded-md transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  style={{ background: 'var(--accent-blue)' }}
                >
                  <Sparkles size={13} />
                  Generate Email
                </button>
              )}

              {loading && <AILoadingState label="Drafting your email…" lines={4} />}
              {error && <p className="text-[12px] text-error-text">{error}</p>}
              {result && !loading && (
                <>
                  <EmailDraft result={result} />
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide mb-1.5" style={{ color: 'var(--muted-text)' }}>
                      Regenerate tone
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {TONES.map(t => (
                        <button
                          key={t.id}
                          onClick={() => generate(t.id)}
                          className="flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-md border border-border-gray transition-colors hover:bg-surface-gray"
                          style={{ color: 'var(--brand-navy)' }}
                        >
                          <RotateCcw size={10} /> {t.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </ProGate>
        </div>
      </div>
    </div>
  );
}
