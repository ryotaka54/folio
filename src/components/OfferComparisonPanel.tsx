'use client';

import { useState } from 'react';
import { Application } from '@/lib/types';

interface Props {
  applications: Application[];
}

function fmt(n: number | null | undefined) {
  if (n == null || n === 0) return '—';
  return '$' + n.toLocaleString('en-US');
}

function totalComp(app: Application) {
  return (app.salary_max ?? 0)
    + Math.round((app.signing_bonus ?? 0) / 4)
    + (app.bonus_target ?? 0);
}

function deadlineDays(dateStr: string | null | undefined) {
  if (!dateStr) return null;
  const diff = Math.ceil((new Date(dateStr + 'T00:00:00').getTime() - Date.now()) / 86400000);
  return diff;
}

const OFFER_STAGES = new Set(['Offer', 'Offer — Negotiating', 'Accepted']);

export default function OfferComparisonPanel({ applications }: Props) {
  const offers = applications.filter(a => OFFER_STAGES.has(a.status));
  const [checked, setChecked] = useState<Set<string>>(new Set());

  if (offers.length === 0) {
    return (
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '80px 24px', textAlign: 'center' }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>🏆</div>
        <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--brand-navy)', marginBottom: 6 }}>No offers yet</p>
        <p style={{ fontSize: 13, color: 'var(--muted-text)' }}>
          When applications move to Offer or Offer — Negotiating, they'll appear here for comparison.
        </p>
      </div>
    );
  }

  const bestTc = Math.max(...offers.map(totalComp));

  const toggle = (id: string) => setChecked(prev => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  const comparing = offers.filter(a => checked.has(a.id));

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 24px 80px' }}>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--brand-navy)', margin: '0 0 4px', letterSpacing: '-0.02em' }}>
          Offer Comparison
        </h2>
        <p style={{ fontSize: 13, color: 'var(--muted-text)', margin: 0 }}>
          {offers.length} offer{offers.length !== 1 ? 's' : ''} · Check any two to compare side-by-side
        </p>
      </div>

      {/* Cards grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14, marginBottom: 32 }}>
        {offers.map(app => {
          const tc = totalComp(app);
          const isBest = tc > 0 && tc === bestTc && offers.filter(a => totalComp(a) === bestTc).length === 1;
          const days = deadlineDays(app.offer_deadline);
          const isChecked = checked.has(app.id);

          return (
            <div
              key={app.id}
              onClick={() => toggle(app.id)}
              style={{
                position: 'relative',
                padding: 16,
                borderRadius: 12,
                border: `2px solid ${isChecked ? 'var(--accent-blue)' : 'var(--border-gray)'}`,
                background: isChecked ? 'rgba(37,99,235,0.04)' : 'var(--card-bg)',
                cursor: 'pointer',
                transition: 'border-color 0.15s, background 0.15s',
              }}
            >
              {isBest && (
                <div style={{
                  position: 'absolute', top: 10, right: 10,
                  fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 99,
                  background: 'rgba(22,163,74,0.12)', color: '#16A34A', border: '1px solid rgba(22,163,74,0.25)',
                }}>
                  ⭐ Best TC
                </div>
              )}

              <div style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--brand-navy)', marginBottom: 2 }}>{app.company}</div>
                <div style={{ fontSize: 12, color: 'var(--muted-text)' }}>{app.role}</div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13 }}>
                <Row label="Base" value={app.salary_max ? `${fmt(app.salary_min)}–${fmt(app.salary_max)}` : fmt(app.salary_min)} />
                <Row label="Signing" value={fmt(app.signing_bonus)} />
                <Row label="Bonus target" value={fmt(app.bonus_target)} />
                {app.equity_shares && <Row label="Equity" value={`${app.equity_shares.toLocaleString()} shares`} />}
                {tc > 0 && (
                  <div style={{
                    marginTop: 4, padding: '6px 10px', borderRadius: 6,
                    background: 'rgba(22,163,74,0.07)', border: '1px solid rgba(22,163,74,0.15)',
                    display: 'flex', justifyContent: 'space-between',
                  }}>
                    <span style={{ fontSize: 12, color: 'var(--muted-text)' }}>~Total comp</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#16A34A' }}>${tc.toLocaleString()}</span>
                  </div>
                )}
                {days !== null && (
                  <div style={{
                    marginTop: 2,
                    fontSize: 11,
                    color: days <= 3 ? '#DC2626' : days <= 7 ? '#D97706' : 'var(--muted-text)',
                    fontWeight: days <= 7 ? 600 : 400,
                  }}>
                    {days < 0 ? 'Deadline passed' : days === 0 ? 'Due today' : `${days}d to decide`}
                  </div>
                )}
              </div>

              {/* Checkbox indicator */}
              <div style={{
                position: 'absolute', top: 12, left: 12,
                width: 16, height: 16, borderRadius: 4,
                border: `2px solid ${isChecked ? 'var(--accent-blue)' : 'var(--border-gray)'}`,
                background: isChecked ? 'var(--accent-blue)' : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {isChecked && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
              </div>
            </div>
          );
        })}
      </div>

      {/* Side-by-side diff table */}
      {comparing.length === 2 && (
        <div style={{ borderRadius: 12, border: '1px solid var(--border-gray)', overflow: 'hidden' }}>
          <div style={{
            display: 'grid', gridTemplateColumns: '160px 1fr 1fr',
            background: 'var(--surface-gray)', borderBottom: '1px solid var(--border-gray)',
          }}>
            <div style={{ padding: '10px 14px' }} />
            {comparing.map(app => (
              <div key={app.id} style={{ padding: '10px 14px', borderLeft: '1px solid var(--border-gray)' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--brand-navy)' }}>{app.company}</div>
                <div style={{ fontSize: 11, color: 'var(--muted-text)' }}>{app.role}</div>
              </div>
            ))}
          </div>
          {[
            { label: 'Base salary', fn: (a: Application) => a.salary_max ? `${fmt(a.salary_min)}–${fmt(a.salary_max)}` : fmt(a.salary_min) },
            { label: 'Signing bonus', fn: (a: Application) => fmt(a.signing_bonus) },
            { label: 'Annual bonus', fn: (a: Application) => fmt(a.bonus_target) },
            { label: 'Equity', fn: (a: Application) => a.equity_shares ? `${a.equity_shares.toLocaleString()} shares` : '—' },
            { label: 'Cliff', fn: (a: Application) => a.equity_cliff ? `${a.equity_cliff}mo` : '—' },
            { label: '~Total comp', fn: (a: Application) => { const tc = totalComp(a); return tc > 0 ? `$${tc.toLocaleString()}` : '—'; }, highlight: true },
            { label: 'Decision by', fn: (a: Application) => a.offer_deadline ? new Date(a.offer_deadline + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—' },
          ].map(({ label, fn, highlight }, i) => (
            <div key={label} style={{
              display: 'grid', gridTemplateColumns: '160px 1fr 1fr',
              borderTop: i > 0 ? '1px solid var(--border-gray)' : undefined,
              background: highlight ? 'rgba(22,163,74,0.04)' : 'var(--card-bg)',
            }}>
              <div style={{ padding: '10px 14px', fontSize: 12, color: 'var(--muted-text)', fontWeight: 500 }}>{label}</div>
              {comparing.map(app => {
                const val = fn(app);
                const other = fn(comparing.find(a => a.id !== app.id)!);
                const isBetter = highlight && val !== '—' && other !== '—' && val > other;
                return (
                  <div key={app.id} style={{
                    padding: '10px 14px',
                    borderLeft: '1px solid var(--border-gray)',
                    fontSize: 13,
                    fontWeight: highlight ? 700 : 400,
                    color: isBetter ? '#16A34A' : 'var(--brand-navy)',
                  }}>
                    {val}
                    {isBetter && <span style={{ marginLeft: 6, fontSize: 11 }}>⭐</span>}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}
      {comparing.length === 1 && (
        <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--muted-text)', marginTop: 8 }}>
          Select one more offer to compare side-by-side.
        </p>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontSize: 11, color: 'var(--muted-text)' }}>{label}</span>
      <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--brand-navy)' }}>{value}</span>
    </div>
  );
}
