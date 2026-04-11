'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { startCheckout, MONTHLY_PRICE_ID, ANNUAL_PRICE_ID, FREE_TIER_LIMIT } from '@/lib/pro';
import { ProLogo } from '@/components/ProLogo';

interface Props {
  open: boolean;
  onClose: () => void;
  reason?: 'cap' | 'billing';
}

const AI_FEATURES = [
  { icon: '🧠', name: 'Interview Intel', desc: 'Company-specific questions & strategy, auto-activated when you enter interview stages' },
  { icon: '✉️', name: 'Follow Up Writer', desc: 'Professional follow-up emails in one click — thank you, status check, negotiation, and more' },
  { icon: '📊', name: 'Strength Signal', desc: 'Know how competitive your application is before investing more time' },
  { icon: '💰', name: 'Offer Negotiation Guide', desc: 'Salary benchmarks and a word-for-word negotiation script when an offer arrives' },
  { icon: '📅', name: 'Weekly AI Coach', desc: 'Personalized Monday briefing built from your actual pipeline data' },
];

const BASE_FEATURES = [
  'Unlimited applications — no cap',
  'Email deadline reminders',
  'Advanced analytics',
  'Priority support',
];

export default function UpgradeModal({ open, onClose, reason = 'billing' }: Props) {
  const { user } = useAuth();
  const [plan, setPlan] = useState<'monthly' | 'annual'>('annual');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset loading state when modal closes or when user returns to tab
  useEffect(() => {
    if (!open) { setLoading(false); setError(null); return; }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    const onVisible = () => { if (!document.hidden) setLoading(false); };
    window.addEventListener('keydown', onKey);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [open, onClose]);

  if (!open) return null;

  const handleUpgrade = async () => {
    if (!user) return;
    setError(null);
    setLoading(true);
    const { supabase } = await import('@/lib/supabase');
    const { data: authData } = await supabase.auth.getUser();
    const email = authData.user?.email ?? '';
    const priceId = plan === 'monthly' ? MONTHLY_PRICE_ID : ANNUAL_PRICE_ID;
    if (!priceId) {
      setError('Checkout not configured. Please try again later.');
      setLoading(false);
      return;
    }
    const err = await startCheckout({ userId: user.id, email, priceId });
    if (err) { setError(err); setLoading(false); }
  };

  const savings = Math.round(100 - (48 / (6 * 12)) * 100);

  return (
    <div
      role="dialog"
      aria-modal
      aria-label="Upgrade to Applyd Pro"
      style={{ position: 'fixed', inset: 0, zIndex: 9100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, overflowY: 'auto' }}
    >
      <div
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
        onClick={onClose}
        aria-hidden
      />

      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: 460,
          background: 'var(--card-bg)',
          border: '1px solid var(--border-gray)',
          borderRadius: 16,
          overflow: 'hidden',
          boxShadow: '0 24px 80px rgba(0,0,0,0.3)',
          animation: 'upgrade-modal-in 220ms cubic-bezier(0.34,1.2,0.64,1) both',
          margin: 'auto',
        }}
      >
        <style>{`@keyframes upgrade-modal-in{from{opacity:0;transform:scale(0.95) translateY(8px)}to{opacity:1;transform:scale(1) translateY(0)}} @keyframes spin{to{transform:rotate(360deg)}}`}</style>

        {/* Header */}
        <div style={{ background: 'linear-gradient(135deg, #1e40af 0%, #2563eb 100%)', padding: '20px 24px 18px', position: 'relative' }}>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{ position: 'absolute', top: 12, right: 12, background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 6, width: 28, height: 28, cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <ProLogo size={36} />
            <p style={{ fontSize: 18, fontWeight: 700, color: '#fff', letterSpacing: '-0.03em' }}>Applyd Pro</p>
          </div>
          {reason === 'cap' ? (
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.82)', lineHeight: 1.5 }}>
              You&apos;ve tracked <strong style={{ color: '#fff' }}>{FREE_TIER_LIMIT} applications</strong> — more than most students ever log. Remove the cap and unlock the AI suite that turns applications into offers.
            </p>
          ) : (
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.82)', lineHeight: 1.5 }}>
              Unlock your AI recruiting companion — interview prep, follow-up emails, offer negotiation, and a personal weekly coach. Less than a coffee a month.
            </p>
          )}
        </div>

        {/* Body */}
        <div style={{ padding: '20px 24px 24px' }}>
          {/* Plan toggle */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
            {(['annual', 'monthly'] as const).map(p => (
              <button
                key={p}
                onClick={() => setPlan(p)}
                style={{
                  flex: 1, height: 56, borderRadius: 10, cursor: 'pointer',
                  border: `2px solid ${plan === p ? 'var(--accent-blue)' : 'var(--border-gray)'}`,
                  background: plan === p ? 'rgba(37,99,235,0.06)' : 'var(--background)',
                  transition: 'border-color 180ms ease, background 180ms ease',
                  position: 'relative',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1,
                }}
              >
                {p === 'annual' && (
                  <span style={{
                    position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)',
                    background: '#16a34a', color: '#fff', fontSize: 10, fontWeight: 700,
                    padding: '2px 7px', borderRadius: 99, whiteSpace: 'nowrap', letterSpacing: '0.02em',
                  }}>SAVE {savings}%</span>
                )}
                <span style={{ fontSize: 16, fontWeight: 700, color: plan === p ? 'var(--accent-blue)' : 'var(--brand-navy)', letterSpacing: '-0.02em' }}>
                  {p === 'annual' ? '$4' : '$6'}<span style={{ fontSize: 11, fontWeight: 500 }}>/mo</span>
                </span>
                <span style={{ fontSize: 11, color: 'var(--muted-text)' }}>
                  {p === 'annual' ? 'Billed $48/year' : 'Billed monthly'}
                </span>
              </button>
            ))}
          </div>

          {/* AI Features */}
          <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--accent-blue)', marginBottom: 10 }}>
            ✦ AI Suite — 5 features
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
            {AI_FEATURES.map(f => (
              <div key={f.name} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '8px 10px', borderRadius: 8, background: 'rgba(37,99,235,0.04)', border: '1px solid rgba(37,99,235,0.1)' }}>
                <span style={{ fontSize: 15, flexShrink: 0, marginTop: 1 }}>{f.icon}</span>
                <div>
                  <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--brand-navy)', marginBottom: 1 }}>{f.name}</p>
                  <p style={{ fontSize: 11, color: 'var(--muted-text)', lineHeight: 1.4 }}>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Base features */}
          <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 16px', display: 'flex', flexDirection: 'column', gap: 7 }}>
            {BASE_FEATURES.map(f => (
              <li key={f} style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                <span style={{ width: 16, height: 16, borderRadius: 999, background: 'rgba(37,99,235,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                </span>
                <span style={{ fontSize: 12, color: 'var(--body-text)' }}>{f}</span>
              </li>
            ))}
          </ul>

          {/* Social proof */}
          <p style={{ fontSize: 11, color: 'var(--muted-text)', fontStyle: 'italic', marginBottom: 16, lineHeight: 1.5, paddingLeft: 10, borderLeft: '2px solid var(--border-gray)' }}>
            Students who use the AI features report feeling significantly more prepared for interviews and more confident in negotiations.
          </p>

          {error && <p style={{ fontSize: 12, color: '#dc2626', marginBottom: 12, textAlign: 'center' }}>{error}</p>}

          <button
            onClick={handleUpgrade}
            disabled={loading}
            style={{
              width: '100%', height: 44, background: loading ? 'var(--muted-text)' : '#2563eb',
              color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background 200ms ease',
              letterSpacing: '-0.01em',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}
          >
            {loading ? (
              <>
                <svg style={{ animation: 'spin 0.8s linear infinite' }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                Redirecting…
              </>
            ) : `Upgrade to Pro — ${plan === 'annual' ? '$48/year' : '$6/month'}`}
          </button>

          <p style={{ fontSize: 11, color: 'var(--muted-text)', textAlign: 'center', marginTop: 8 }}>
            Less than a Chipotle bowl · Cancel anytime · Secure via Stripe
          </p>
        </div>
      </div>
    </div>
  );
}
