'use client';

import { useState } from 'react';
import { X, Copy, Check, Sparkles } from 'lucide-react';
import ProGate from '@/components/ProGate';
import { authFetch } from '@/lib/auth-fetch';

const EMAIL_TYPES = [
  { id: 'thank-you', label: 'Thank You' },
  { id: 'status-check', label: 'Status Check' },
  { id: 'withdraw', label: 'Withdraw' },
  { id: 'negotiate', label: 'Negotiate' },
  { id: 'referral', label: 'Ask for Referral' },
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

function Skeleton() {
  return (
    <div className="space-y-2 animate-pulse">
      <div className="h-3 rounded w-1/2" style={{ background: 'var(--surface-gray)' }} />
      <div className="h-3 rounded w-full" style={{ background: 'var(--surface-gray)' }} />
      <div className="h-3 rounded w-4/5" style={{ background: 'var(--surface-gray)' }} />
      <div className="h-3 rounded w-3/4" style={{ background: 'var(--surface-gray)' }} />
    </div>
  );
}

function EmailResult({ result }: { result: EmailResult }) {
  const [copied, setCopied] = useState(false);

  const copyAll = () => {
    const text = `Subject: ${result.subject}\n\n${result.body}`;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="space-y-3">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--muted-text)' }}>Subject</p>
        <p className="text-[13px] font-medium" style={{ color: 'var(--brand-navy)' }}>{result.subject}</p>
      </div>
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--muted-text)' }}>Body</p>
        <p className="text-[12px] leading-relaxed whitespace-pre-line" style={{ color: 'var(--brand-navy)' }}>{result.body}</p>
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

  const generate = async () => {
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await authFetch('/api/ai/follow-up-email', {
        method: 'POST',
        body: JSON.stringify({ company, role, stage, recruiterName, recruiterEmail, notes, emailType }),
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
            <button onClick={onClose} className="p-1 rounded hover:bg-surface-gray transition-colors" style={{ color: 'var(--muted-text)' }}>
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

              <button
                onClick={generate}
                disabled={loading}
                className="w-full h-9 text-[13px] font-medium text-white rounded-md transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ background: 'var(--accent-blue)' }}
              >
                {loading ? (
                  <>
                    <svg className="animate-spin" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                    Generating…
                  </>
                ) : (
                  <>
                    <Sparkles size={13} />
                    Generate Email
                  </>
                )}
              </button>

              {loading && <Skeleton />}
              {error && <p className="text-[12px] text-error-text">{error}</p>}
              {result && <EmailResult result={result} />}
            </div>
          </ProGate>
        </div>
      </div>
    </div>
  );
}
