'use client';

import { useState, useRef, useCallback } from 'react';
import { Application } from '@/lib/types';

interface Props {
  application: Application;
  onUpdate: (updates: Partial<Application>) => void;
}

function deadlineCountdown(dateStr: string | null | undefined) {
  if (!dateStr) return null;
  const d = new Date(dateStr + 'T00:00:00');
  const diff = Math.ceil((d.getTime() - Date.now()) / 86400000);
  if (diff < 0) return { label: 'Expired', urgency: 'danger' as const };
  if (diff === 0) return { label: 'Due today', urgency: 'danger' as const };
  if (diff <= 3) return { label: `${diff}d left`, urgency: 'danger' as const };
  if (diff <= 7) return { label: `${diff}d left`, urgency: 'warning' as const };
  return { label: `${diff}d left`, urgency: 'safe' as const };
}

function fmt(n: number | null | undefined) {
  if (n == null) return '';
  return n.toLocaleString('en-US');
}

const inputCls = [
  'w-full h-9 px-3 rounded-md text-[13px] border transition-colors',
  'focus:outline-none focus:border-accent-blue focus:ring-2 focus:ring-accent-blue/20',
  'bg-background border-border-gray placeholder:text-text-tertiary',
].join(' ');

export default function OfferDetailsPanel({ application, onUpdate }: Props) {
  const [open, setOpen] = useState(true);
  const debounceRef = useRef<Record<string, NodeJS.Timeout>>({});

  const debouncedUpdate = useCallback((field: keyof Application, value: number | string | null) => {
    if (debounceRef.current[field as string]) clearTimeout(debounceRef.current[field as string]);
    debounceRef.current[field as string] = setTimeout(() => {
      onUpdate({ [field]: value });
    }, 800);
  }, [onUpdate]);

  const numField = (field: keyof Application, value: number | null | undefined) => (
    <input
      type="number"
      min={0}
      defaultValue={value ?? ''}
      onChange={e => debouncedUpdate(field, e.target.value === '' ? null : parseInt(e.target.value, 10))}
      className={inputCls}
      style={{ color: 'var(--brand-navy)' }}
    />
  );

  const deadline = deadlineCountdown(application.offer_deadline);
  const totalComp = (application.salary_max ?? 0)
    + Math.round((application.signing_bonus ?? 0) / 4)
    + (application.bonus_target ?? 0);

  const urgencyColors = {
    danger:  { bg: 'rgba(220,38,38,0.1)',  text: '#DC2626',  border: 'rgba(220,38,38,0.25)'  },
    warning: { bg: 'rgba(217,119,6,0.1)',  text: '#D97706',  border: 'rgba(217,119,6,0.25)'  },
    safe:    { bg: 'rgba(22,163,74,0.1)',  text: '#16A34A',  border: 'rgba(22,163,74,0.25)'  },
  };

  return (
    <div style={{ borderRadius: 12, border: '1px solid var(--border-gray)', overflow: 'hidden' }}>
      {/* Header */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 16px',
          background: 'linear-gradient(135deg, rgba(22,163,74,0.06), rgba(5,150,105,0.06))',
          border: 'none',
          cursor: 'pointer',
          fontFamily: 'inherit',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8.21 13.89L7 23l5-3 5 3-1.21-9.12"/><path d="M15 7a3 3 0 1 1-6 0 3 3 0 0 1 6 0z"/><path d="M21 7c0 4.97-4.03 9-9 9S3 11.97 3 7"/></svg>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--brand-navy)' }}>Offer Details</span>
          {deadline && (
            <span style={{
              fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 99,
              background: urgencyColors[deadline.urgency].bg,
              color: urgencyColors[deadline.urgency].text,
              border: `1px solid ${urgencyColors[deadline.urgency].border}`,
            }}>
              {deadline.label}
            </span>
          )}
        </div>
        <svg
          width="14" height="14" viewBox="0 0 24 24" fill="none"
          stroke="var(--muted-text)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s', flexShrink: 0 }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Salary range */}
          <div>
            <label className="block text-[12px] font-medium mb-2" style={{ color: 'var(--muted-text)' }}>
              Base salary (USD / yr)
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <div>
                <label className="block text-[11px] mb-1" style={{ color: 'var(--text-tertiary)' }}>Min</label>
                {numField('salary_min', application.salary_min)}
              </div>
              <div>
                <label className="block text-[11px] mb-1" style={{ color: 'var(--text-tertiary)' }}>Max</label>
                {numField('salary_max', application.salary_max)}
              </div>
            </div>
          </div>

          {/* Bonuses */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label className="block text-[12px] font-medium mb-1" style={{ color: 'var(--muted-text)' }}>Signing bonus</label>
              {numField('signing_bonus', application.signing_bonus)}
            </div>
            <div>
              <label className="block text-[12px] font-medium mb-1" style={{ color: 'var(--muted-text)' }}>Annual bonus target</label>
              {numField('bonus_target', application.bonus_target)}
            </div>
          </div>

          {/* Equity */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label className="block text-[12px] font-medium mb-1" style={{ color: 'var(--muted-text)' }}>Equity (shares / RSUs)</label>
              {numField('equity_shares', application.equity_shares)}
            </div>
            <div>
              <label className="block text-[12px] font-medium mb-1" style={{ color: 'var(--muted-text)' }}>Cliff (months)</label>
              {numField('equity_cliff', application.equity_cliff)}
            </div>
          </div>

          {/* Total comp badge */}
          {totalComp > 0 && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '10px 14px', borderRadius: 8,
              background: 'rgba(22,163,74,0.06)', border: '1px solid rgba(22,163,74,0.2)',
            }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#16A34A' }}>
                ~${fmt(totalComp)} / yr total comp
              </span>
              <span style={{ fontSize: 11, color: 'var(--muted-text)', marginLeft: 2 }}>
                (base + ¼ signing + bonus)
              </span>
            </div>
          )}

          {/* Offer deadline */}
          <div>
            <label className="block text-[12px] font-medium mb-1" style={{ color: 'var(--muted-text)' }}>Decision deadline</label>
            <input
              type="date"
              defaultValue={application.offer_deadline ?? ''}
              onChange={e => debouncedUpdate('offer_deadline', e.target.value || null)}
              className={inputCls}
              style={{ color: 'var(--brand-navy)' }}
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-[12px] font-medium mb-1" style={{ color: 'var(--muted-text)' }}>Negotiation notes</label>
            <textarea
              defaultValue={application.offer_notes ?? ''}
              onChange={e => debouncedUpdate('offer_notes', e.target.value)}
              rows={3}
              placeholder="Counter-offer strategy, competing offers, perks to negotiate…"
              className="w-full px-3 py-2 rounded-md text-[13px] border bg-background border-border-gray focus:outline-none focus:border-accent-blue focus:ring-2 focus:ring-accent-blue/20 resize-none placeholder:text-text-tertiary"
              style={{ color: 'var(--brand-navy)' }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
