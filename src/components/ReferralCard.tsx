'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

interface ReferralData {
  code: string;
  referrals: { id: string; created_at: string }[];
  confirmedCount: number;
  rewardsGranted: number;
  progressInCurrentCycle: number;
  nextRewardAt: number;
  rewardEvery: number;
}

function CopyIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
    </svg>
  );
}

function GiftIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 12 20 22 4 22 4 12" /><rect x="2" y="7" width="20" height="5" />
      <line x1="12" y1="22" x2="12" y2="7" />
      <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
      <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

export default function ReferralCard() {
  const [data, setData] = useState<ReferralData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    try {
      const res = await fetch('/api/referral', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (!res.ok) throw new Error();
      setData(await res.json());
    } catch {
      setError('Could not load referral data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const referralLink = data
    ? `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://useapplyd.com'}/signup?ref=${data.code}`
    : '';

  const handleCopy = async () => {
    if (!referralLink) return;
    await navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (!referralLink) return;
    if (navigator.share) {
      navigator.share({
        title: 'Join me on Applyd',
        text: 'Track your internship and job applications with AI coaching — totally free. Use my link:',
        url: referralLink,
      }).catch(() => {});
    } else {
      handleCopy();
    }
  };

  if (loading) {
    return (
      <div className="rounded-xl border border-border-gray p-6 animate-pulse" style={{ background: 'var(--card-bg)' }}>
        <div className="h-5 w-48 rounded mb-2" style={{ background: 'var(--surface-gray)' }} />
        <div className="h-4 w-72 rounded mb-5" style={{ background: 'var(--surface-gray)' }} />
        <div className="h-11 rounded-lg" style={{ background: 'var(--surface-gray)' }} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-border-gray p-5 text-[13px]" style={{ background: 'var(--card-bg)', color: 'var(--muted-text)' }}>
        {error}
      </div>
    );
  }

  if (!data) return null;

  const { confirmedCount, progressInCurrentCycle, nextRewardAt, rewardEvery, rewardsGranted, referrals } = data;
  const pct = Math.min((progressInCurrentCycle / rewardEvery) * 100, 100);
  const remaining = rewardEvery - progressInCurrentCycle;

  return (
    <div className="space-y-3">
      {/* Main card */}
      <div
        className="rounded-xl border border-border-gray overflow-hidden"
        style={{ background: 'var(--card-bg)' }}
      >
        {/* Header gradient band */}
        <div
          className="px-5 py-4 flex items-start gap-3"
          style={{ background: 'linear-gradient(135deg, rgba(37,99,235,0.07) 0%, rgba(37,99,235,0.02) 100%)', borderBottom: '1px solid var(--border-gray)' }}
        >
          <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: 'var(--accent-blue)', color: '#fff' }}>
            <GiftIcon />
          </div>
          <div>
            <p className="text-[15px] font-semibold" style={{ color: 'var(--brand-navy)', letterSpacing: '-0.01em' }}>
              Invite friends. Earn free Pro.
            </p>
            <p className="text-[13px] mt-0.5" style={{ color: 'var(--muted-text)' }}>
              Every {rewardEvery} students who join using your link earn you 1 month of Pro — free, forever.
            </p>
          </div>
        </div>

        <div className="px-5 py-4 space-y-4">
          {/* Progress */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[12px] font-medium" style={{ color: 'var(--muted-text)' }}>
                Progress to next reward
              </span>
              <span className="text-[12px] font-semibold" style={{ color: 'var(--accent-blue)' }}>
                {progressInCurrentCycle} / {rewardEvery}
              </span>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--surface-gray)' }}>
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${pct}%`, background: 'var(--accent-blue)' }}
              />
            </div>
            <p className="text-[11px] mt-1.5" style={{ color: 'var(--text-tertiary)' }}>
              {pct >= 100
                ? '🎉 Reward earned! Check your Pro status above.'
                : remaining === 1
                ? `1 more referral until your next free month of Pro.`
                : `${remaining} more referrals until your next free month of Pro.`}
            </p>
          </div>

          {/* Referral link */}
          <div>
            <p className="text-[12px] font-medium mb-1.5" style={{ color: 'var(--muted-text)' }}>Your invite link</p>
            <div
              className="flex items-center gap-2 px-3 py-2.5 rounded-lg border"
              style={{ background: 'var(--surface-gray)', borderColor: 'var(--border-gray)' }}
            >
              <span
                className="flex-1 text-[12px] font-mono truncate"
                style={{ color: 'var(--brand-navy)' }}
              >
                {referralLink}
              </span>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[12px] font-medium flex-shrink-0 transition-colors"
                style={{
                  background: copied ? 'rgba(22,163,74,0.12)' : 'var(--background)',
                  color: copied ? 'var(--green-success)' : 'var(--brand-navy)',
                  border: `1px solid ${copied ? 'rgba(22,163,74,0.3)' : 'var(--border-gray)'}`,
                }}
              >
                {copied ? <><CheckIcon /> Copied!</> : <><CopyIcon /> Copy</>}
              </button>
            </div>
          </div>

          {/* Share buttons */}
          <div className="flex gap-2">
            <button
              onClick={handleShare}
              className="flex-1 flex items-center justify-center gap-2 h-9 rounded-lg text-[13px] font-medium text-white transition-colors"
              style={{ background: 'var(--accent-blue)' }}
            >
              <ShareIcon />
              Share link
            </button>
            <a
              href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`I've been using Applyd to track my recruiting — it's free and actually good. Join me 👇`)}&url=${encodeURIComponent(referralLink)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 h-9 px-4 rounded-lg text-[13px] font-medium border transition-colors"
              style={{ background: 'var(--surface-gray)', borderColor: 'var(--border-gray)', color: 'var(--brand-navy)' }}
            >
              {/* X / Twitter icon */}
              <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.259 5.63 5.905-5.63Zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
              Tweet
            </a>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Total referrals', value: confirmedCount },
          { label: 'Rewards earned', value: rewardsGranted },
          { label: 'Months of Pro', value: rewardsGranted },
        ].map(s => (
          <div
            key={s.label}
            className="rounded-lg border border-border-gray px-3 py-3 text-center"
            style={{ background: 'var(--card-bg)' }}
          >
            <div className="text-[22px] font-bold" style={{ color: 'var(--brand-navy)', letterSpacing: '-0.02em' }}>
              {s.value}
            </div>
            <div className="text-[10px] mt-0.5" style={{ color: 'var(--text-tertiary)' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Referral history */}
      {referrals.length > 0 && (
        <div className="rounded-xl border border-border-gray overflow-hidden" style={{ background: 'var(--card-bg)' }}>
          <div className="px-4 py-3 border-b border-border-gray">
            <p className="text-[13px] font-semibold" style={{ color: 'var(--brand-navy)' }}>
              Referral history
            </p>
          </div>
          <div className="divide-y divide-border-gray">
            {referrals.map((r, i) => (
              <div key={r.id} className="flex items-center gap-3 px-4 py-3">
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-white flex-shrink-0 text-[11px] font-bold" style={{ background: 'var(--accent-blue)' }}>
                  {i + 1}
                </div>
                <div className="flex-1">
                  <p className="text-[13px] font-medium" style={{ color: 'var(--brand-navy)' }}>
                    Student joined Applyd
                  </p>
                  <p className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
                    {new Date(r.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>
                <span
                  className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                  style={{ background: 'rgba(22,163,74,0.12)', color: 'var(--green-success)', border: '1px solid rgba(22,163,74,0.25)' }}
                >
                  Confirmed
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* How it works */}
      <div
        className="rounded-xl border border-border-gray px-5 py-4"
        style={{ background: 'var(--card-bg)' }}
      >
        <p className="text-[12px] font-semibold mb-3" style={{ color: 'var(--muted-text)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>How it works</p>
        <div className="space-y-3">
          {[
            { n: '1', text: 'Share your unique link with a friend who is job or internship hunting.' },
            { n: '2', text: 'They sign up and complete their profile using your link.' },
            { n: '3', text: 'Every 3 friends who join earns you 1 free month of Pro — automatically applied.' },
          ].map(step => (
            <div key={step.n} className="flex items-start gap-3">
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold mt-0.5"
                style={{ background: 'var(--accent-blue)', color: '#fff' }}
              >
                {step.n}
              </div>
              <p className="text-[13px] leading-snug" style={{ color: 'var(--muted-text)' }}>{step.text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
