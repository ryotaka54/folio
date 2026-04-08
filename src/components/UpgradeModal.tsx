'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { startCheckout, MONTHLY_PRICE_ID, ANNUAL_PRICE_ID, FREE_TIER_LIMIT } from '@/lib/pro';
import { ProLogo } from '@/components/ProLogo';

interface Props {
  open: boolean;
  onClose: () => void;
  /** Which trigger brought this up: hitting the cap, or opening billing settings */
  reason?: 'cap' | 'billing';
}

const FEATURES = [
  'Unlimited applications — no cap',
  'Priority support',
  'Early access to new features',
  'Pro badge in your dashboard',
];

export default function UpgradeModal({ open, onClose, reason = 'billing' }: Props) {
  const { user } = useAuth();
  const [plan, setPlan] = useState<'monthly' | 'annual'>('annual');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Trap focus / close on Escape
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [open, onClose]);

  if (!open) return null;

  const handleUpgrade = async () => {
    if (!user) return;
    setError(null);
    setLoading(true);

    // Fetch user email from Supabase auth
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
    if (err) {
      setError(err);
      setLoading(false);
    }
    // On success: browser redirects — no need to setLoading(false)
  };

  const savings = Math.round(100 - (48 / (6 * 12)) * 100);

  return (
    <div
      role="dialog"
      aria-modal
      aria-label="Upgrade to Applyd Pro"
      style={{ position: 'fixed', inset: 0, zIndex: 9100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
    >
      {/* Backdrop */}
      <div
        style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
        onClick={onClose}
        aria-hidden
      />

      {/* Card */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: 440,
          background: 'var(--card-bg)',
          border: '1px solid var(--border-gray)',
          borderRadius: 16,
          overflow: 'hidden',
          boxShadow: '0 24px 80px rgba(0,0,0,0.3)',
          animation: 'upgrade-modal-in 220ms cubic-bezier(0.34,1.2,0.64,1) both',
        }}
      >
        <style>{`@keyframes upgrade-modal-in{from{opacity:0;transform:scale(0.95) translateY(8px)}to{opacity:1;transform:scale(1) translateY(0)}}`}</style>

        {/* Header band */}
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
              You&apos;ve hit the <strong style={{ color: '#fff' }}>{FREE_TIER_LIMIT}-application free limit</strong>. Upgrade to keep tracking every opportunity.
            </p>
          ) : (
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.82)', lineHeight: 1.5 }}>
              Unlock unlimited applications and premium features.
            </p>
          )}
        </div>

        {/* Body */}
        <div style={{ padding: '20px 24px 24px' }}>
          {/* Plan toggle */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
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
                  }}>
                    SAVE {savings}%
                  </span>
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

          {/* Features */}
          <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 20px', display: 'flex', flexDirection: 'column', gap: 9 }}>
            {FEATURES.map(f => (
              <li key={f} style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                <span style={{ width: 18, height: 18, borderRadius: 999, background: 'rgba(37,99,235,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                </span>
                <span style={{ fontSize: 13, color: 'var(--body-text)' }}>{f}</span>
              </li>
            ))}
          </ul>

          {/* Error */}
          {error && (
            <p style={{ fontSize: 12, color: '#dc2626', marginBottom: 12, textAlign: 'center' }}>{error}</p>
          )}

          {/* CTA */}
          <button
            onClick={handleUpgrade}
            disabled={loading}
            style={{
              width: '100%', height: 44, background: loading ? 'var(--muted-text)' : '#2563eb',
              color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background 200ms ease, transform 120ms ease',
              letterSpacing: '-0.01em',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}
          >
            {loading ? (
              <>
                <svg style={{ animation: 'spin 0.8s linear infinite' }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                Redirecting…
              </>
            ) : (
              `Upgrade to Pro — ${plan === 'annual' ? '$48/year' : '$6/month'}`
            )}
          </button>
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

          <p style={{ fontSize: 11, color: 'var(--muted-text)', textAlign: 'center', marginTop: 10 }}>
            Cancel anytime · Secure checkout via Stripe
          </p>
        </div>
      </div>
    </div>
  );
}
