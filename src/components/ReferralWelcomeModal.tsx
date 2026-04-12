'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

interface Props {
  onDone: () => void;
}

export default function ReferralWelcomeModal({ onDone }: Props) {
  const [link, setLink] = useState('');
  const [copied, setCopied] = useState(false);

  // Fetch (or generate) the user's referral code
  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      try {
        const res = await fetch('/api/referral', {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        const data = await res.json();
        if (data.code) {
          const base = process.env.NEXT_PUBLIC_APP_URL ?? 'https://useapplyd.com';
          setLink(`${base}/signup?ref=${data.code}`);
        }
      } catch { /* non-critical */ }
    })();
  }, []);

  const handleCopy = async () => {
    if (!link) return;
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="fixed inset-0 z-[9000] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.55)' }}
    >
      <div
        className="relative w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl"
        style={{ background: 'var(--card-bg)', border: '1px solid var(--border-gray)' }}
      >
        {/* Top accent bar */}
        <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg, var(--accent-blue), #6366f1)' }} />

        <div className="px-6 py-6">
          {/* Icon + headline */}
          <div className="flex items-start gap-4 mb-5">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'var(--accent-blue)', color: '#fff' }}
            >
              {/* Gift icon */}
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 12 20 22 4 22 4 12" /><rect x="2" y="7" width="20" height="5" />
                <line x1="12" y1="22" x2="12" y2="7" />
                <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
                <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
              </svg>
            </div>
            <div>
              <p className="text-[16px] font-bold" style={{ color: 'var(--brand-navy)', letterSpacing: '-0.02em' }}>
                Welcome to Applyd 🎉
              </p>
              <p className="text-[13px] mt-0.5" style={{ color: 'var(--muted-text)' }}>
                Invite friends and earn Pro for free.
              </p>
            </div>
          </div>

          {/* Reward description */}
          <div
            className="rounded-xl px-4 py-3.5 mb-4"
            style={{ background: 'rgba(37,99,235,0.06)', border: '1px solid rgba(37,99,235,0.15)' }}
          >
            <div className="flex items-center gap-3 mb-2.5">
              {[1, 2, 3].map(n => (
                <div key={n} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold text-white"
                    style={{ background: 'var(--accent-blue)' }}
                  >
                    {n}
                  </div>
                  {n < 3 && (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ position: 'absolute', display: 'none' }}><polyline points="9 18 15 12 9 6" /></svg>
                  )}
                </div>
              ))}
            </div>
            <p className="text-[13px] font-semibold text-center" style={{ color: 'var(--brand-navy)' }}>
              3 friends = 1 month of Pro — free
            </p>
            <p className="text-[11px] text-center mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
              Every time you hit 3 referrals, we extend your Pro subscription by 30 days. No limit.
            </p>
          </div>

          {/* Referral link */}
          {link && (
            <div className="mb-4">
              <p className="text-[11px] font-semibold mb-1.5 uppercase tracking-wide" style={{ color: 'var(--text-tertiary)' }}>Your invite link</p>
              <div
                className="flex items-center gap-2 px-3 py-2.5 rounded-lg"
                style={{ background: 'var(--surface-gray)', border: '1px solid var(--border-gray)' }}
              >
                <span className="flex-1 text-[11px] font-mono truncate" style={{ color: 'var(--brand-navy)' }}>{link}</span>
                <button
                  onClick={handleCopy}
                  className="flex-shrink-0 px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors"
                  style={{
                    background: copied ? 'rgba(22,163,74,0.12)' : 'var(--background)',
                    color: copied ? 'var(--green-success)' : 'var(--brand-navy)',
                    border: `1px solid ${copied ? 'rgba(22,163,74,0.3)' : 'var(--border-gray)'}`,
                  }}
                >
                  {copied ? '✓ Copied' : 'Copy'}
                </button>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={onDone}
              className="flex-1 h-10 rounded-xl text-[13px] font-medium border transition-colors"
              style={{ background: 'var(--surface-gray)', borderColor: 'var(--border-gray)', color: 'var(--muted-text)' }}
            >
              Skip for now
            </button>
            <Link
              href="/settings?section=referrals"
              onClick={onDone}
              className="flex-1 h-10 rounded-xl text-[13px] font-semibold text-white flex items-center justify-center transition-colors"
              style={{ background: 'var(--accent-blue)' }}
            >
              See my link →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
