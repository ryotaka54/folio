'use client';

import { useState } from 'react';
import { Application } from '@/lib/types';

interface Props { applications: Application[] }

const OFFER_STAGES = new Set(['Offer', 'Offer — Negotiating', 'Accepted', '内々定', '内定']);

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  'Offer':              { bg: 'rgba(22,163,74,0.12)',  color: '#16A34A' },
  'Offer — Negotiating':{ bg: 'rgba(217,119,6,0.12)',  color: '#D97706' },
  'Accepted':           { bg: 'rgba(37,99,235,0.12)',  color: '#2563EB' },
  '内々定':              { bg: 'rgba(22,163,74,0.12)',  color: '#16A34A' },
  '内定':               { bg: 'rgba(37,99,235,0.12)',  color: '#2563EB' },
};

function initials(name: string) {
  return name.trim().split(/\s+/).map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

function fmt(n: number | null | undefined) {
  if (n == null || n === 0) return null;
  if (n >= 1000) return '$' + (n / 1000).toFixed(n % 1000 === 0 ? 0 : 1) + 'k';
  return '$' + n.toLocaleString('en-US');
}

function fmtFull(n: number | null | undefined) {
  if (n == null || n === 0) return '—';
  return '$' + n.toLocaleString('en-US');
}

function totalComp(app: Application) {
  return (app.salary_max ?? 0) + Math.round((app.signing_bonus ?? 0) / 4) + (app.bonus_target ?? 0);
}

function deadlineDays(dateStr: string | null | undefined) {
  if (!dateStr) return null;
  return Math.ceil((new Date(dateStr + 'T00:00:00').getTime() - Date.now()) / 86400000);
}

// deterministic hue from company name
function companyHue(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffff;
  return h % 360;
}

export default function OfferComparisonPanel({ applications }: Props) {
  const offers = applications.filter(a => OFFER_STAGES.has(a.status));
  const [checked, setChecked] = useState<Set<string>>(new Set());

  if (offers.length === 0) {
    return (
      <div style={{ maxWidth: 560, margin: '80px auto', padding: '0 24px', textAlign: 'center' }}>
        <div style={{
          width: 64, height: 64, borderRadius: 16, margin: '0 auto 20px',
          background: 'linear-gradient(135deg, rgba(22,163,74,0.15), rgba(37,99,235,0.15))',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28,
        }}>🏆</div>
        <p style={{ fontSize: 17, fontWeight: 700, color: 'var(--brand-navy)', margin: '0 0 8px', letterSpacing: '-0.01em' }}>No offers yet</p>
        <p style={{ fontSize: 14, color: 'var(--muted-text)', lineHeight: 1.6 }}>
          When applications reach <strong>Offer</strong> or <strong>Offer — Negotiating</strong>, they appear here so you can compare compensation side-by-side.
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
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '28px 24px 80px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 24, gap: 12, flexWrap: 'wrap' }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--brand-navy)', margin: '0 0 3px', letterSpacing: '-0.02em' }}>
            Offer Comparison
          </h2>
          <p style={{ fontSize: 13, color: 'var(--muted-text)', margin: 0 }}>
            {offers.length} active offer{offers.length !== 1 ? 's' : ''} — select any two to compare compensation
          </p>
        </div>
        {checked.size > 0 && (
          <button
            onClick={() => setChecked(new Set())}
            style={{ fontSize: 12, color: 'var(--muted-text)', background: 'none', border: '1px solid var(--border-gray)', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontFamily: 'inherit' }}
          >
            Clear selection
          </button>
        )}
      </div>

      {/* Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16, marginBottom: 32 }}>
        {offers.map(app => {
          const tc = totalComp(app);
          const isBest = tc > 0 && tc === bestTc && offers.filter(a => totalComp(a) === bestTc).length === 1;
          const days = deadlineDays(app.offer_deadline);
          const isChecked = checked.has(app.id);
          const hue = companyHue(app.company);
          const statusStyle = STATUS_STYLE[app.status] ?? STATUS_STYLE['Offer'];

          return (
            <div
              key={app.id}
              onClick={() => toggle(app.id)}
              style={{
                position: 'relative',
                borderRadius: 14,
                border: `2px solid ${isChecked ? '#2563EB' : 'var(--border-gray)'}`,
                background: 'var(--card-bg)',
                cursor: 'pointer',
                transition: 'border-color 0.15s, box-shadow 0.15s',
                boxShadow: isChecked ? '0 0 0 3px rgba(37,99,235,0.12)' : '0 1px 4px rgba(0,0,0,0.06)',
                overflow: 'hidden',
              }}
            >
              {/* Top accent strip */}
              <div style={{
                height: 4,
                background: `linear-gradient(90deg, hsl(${hue},70%,52%), hsl(${(hue + 40) % 360},65%,58%))`,
              }} />

              <div style={{ padding: '16px 16px 14px' }}>
                {/* Header row */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 14 }}>
                  {/* Avatar */}
                  <div style={{
                    width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                    background: `linear-gradient(135deg, hsl(${hue},65%,48%), hsl(${(hue + 40) % 360},60%,54%))`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 14, fontWeight: 800, color: '#fff', letterSpacing: '-0.01em',
                  }}>
                    {initials(app.company)}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--brand-navy)', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{app.company}</div>
                    <div style={{ fontSize: 12, color: 'var(--muted-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{app.role}</div>
                  </div>

                  {/* Checkbox */}
                  <div style={{
                    width: 20, height: 20, borderRadius: 6, flexShrink: 0,
                    border: `2px solid ${isChecked ? '#2563EB' : 'var(--border-gray)'}`,
                    background: isChecked ? '#2563EB' : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'background 0.12s, border-color 0.12s',
                  }}>
                    {isChecked && <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
                  </div>
                </div>

                {/* TC hero number */}
                {tc > 0 && (
                  <div style={{
                    padding: '10px 14px', borderRadius: 10, marginBottom: 12,
                    background: isBest
                      ? 'linear-gradient(135deg, rgba(22,163,74,0.1), rgba(16,185,129,0.08))'
                      : 'var(--surface-gray)',
                    border: isBest ? '1px solid rgba(22,163,74,0.25)' : '1px solid var(--border-gray)',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  }}>
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', color: isBest ? '#16A34A' : 'var(--muted-text)', marginBottom: 2 }}>
                        {isBest ? '⭐ BEST TOTAL COMP' : 'TOTAL COMP'}
                      </div>
                      <div style={{ fontSize: 22, fontWeight: 800, color: isBest ? '#16A34A' : 'var(--brand-navy)', letterSpacing: '-0.02em', lineHeight: 1 }}>
                        ${tc.toLocaleString()}
                      </div>
                    </div>
                    <span style={{
                      fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 6,
                      background: statusStyle.bg, color: statusStyle.color,
                    }}>
                      {app.status}
                    </span>
                  </div>
                )}

                {/* Compensation breakdown */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  {app.salary_max != null && app.salary_max > 0 && (
                    <CompRow label="Base" value={app.salary_min ? `${fmt(app.salary_min)} – ${fmt(app.salary_max)}` : fmt(app.salary_max) ?? '—'} />
                  )}
                  {(app.salary_max == null || app.salary_max === 0) && app.salary_min != null && app.salary_min > 0 && (
                    <CompRow label="Base" value={fmt(app.salary_min) ?? '—'} />
                  )}
                  {app.signing_bonus != null && app.signing_bonus > 0 && (
                    <CompRow label="Signing" value={fmt(app.signing_bonus) ?? '—'} />
                  )}
                  {app.bonus_target != null && app.bonus_target > 0 && (
                    <CompRow label="Bonus target" value={fmt(app.bonus_target) ?? '—'} />
                  )}
                  {app.equity_shares != null && app.equity_shares > 0 && (
                    <CompRow label="Equity" value={`${app.equity_shares.toLocaleString()} shares`} />
                  )}
                  {tc === 0 && app.salary_min == null && (
                    <p style={{ fontSize: 12, color: 'var(--muted-text)', fontStyle: 'italic', margin: 0 }}>
                      No comp details — open the drawer to add salary info.
                    </p>
                  )}
                </div>

                {/* Deadline */}
                {days !== null && (
                  <div style={{
                    marginTop: 12, display: 'flex', alignItems: 'center', gap: 6,
                    padding: '6px 10px', borderRadius: 8,
                    background: days <= 3 ? 'rgba(220,38,38,0.08)' : days <= 7 ? 'rgba(217,119,6,0.08)' : 'var(--surface-gray)',
                    border: days <= 3 ? '1px solid rgba(220,38,38,0.2)' : days <= 7 ? '1px solid rgba(217,119,6,0.2)' : '1px solid var(--border-gray)',
                  }}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ color: days <= 3 ? '#DC2626' : days <= 7 ? '#D97706' : 'var(--muted-text)', flexShrink: 0 }}><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
                    <span style={{ fontSize: 11, fontWeight: 600, color: days <= 3 ? '#DC2626' : days <= 7 ? '#D97706' : 'var(--muted-text)' }}>
                      {days < 0 ? 'Deadline passed' : days === 0 ? 'Due today' : `${days}d to decide`}
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Compare nudge */}
      {comparing.length === 1 && (
        <div style={{ textAlign: 'center', padding: '16px', marginBottom: 24, borderRadius: 10, border: '1px dashed var(--border-gray)' }}>
          <p style={{ fontSize: 13, color: 'var(--muted-text)', margin: 0 }}>
            Select one more offer to see a side-by-side comparison
          </p>
        </div>
      )}

      {/* Side-by-side diff table */}
      {comparing.length === 2 && (
        <div style={{ borderRadius: 14, border: '1px solid var(--border-gray)', overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          {/* Compare header */}
          <div style={{
            display: 'grid', gridTemplateColumns: '180px 1fr 1fr',
            background: 'var(--surface-gray)', borderBottom: '2px solid var(--border-gray)',
          }}>
            <div style={{ padding: '14px 16px', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: 'var(--muted-text)' }}>COMPARISON</div>
            {comparing.map((app, i) => {
              const hue = companyHue(app.company);
              return (
                <div key={app.id} style={{ padding: '14px 16px', borderLeft: '1px solid var(--border-gray)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 30, height: 30, borderRadius: 8,
                      background: `linear-gradient(135deg, hsl(${hue},65%,48%), hsl(${(hue + 40) % 360},60%,54%))`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 11, fontWeight: 800, color: '#fff', flexShrink: 0,
                    }}>
                      {initials(app.company)}
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--brand-navy)' }}>{app.company}</div>
                      <div style={{ fontSize: 11, color: 'var(--muted-text)' }}>{app.role}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Rows */}
          {[
            { label: 'Base salary', key: 'base', fn: (a: Application) => fmtFull(a.salary_max ?? a.salary_min), num: (a: Application) => a.salary_max ?? a.salary_min ?? 0 },
            { label: 'Signing bonus', key: 'sign', fn: (a: Application) => fmtFull(a.signing_bonus), num: (a: Application) => a.signing_bonus ?? 0 },
            { label: 'Annual bonus', key: 'bonus', fn: (a: Application) => fmtFull(a.bonus_target), num: (a: Application) => a.bonus_target ?? 0 },
            { label: 'Equity', key: 'equity', fn: (a: Application) => a.equity_shares ? `${a.equity_shares.toLocaleString()} shares` : '—', num: (a: Application) => a.equity_shares ?? 0 },
            { label: 'Vesting cliff', key: 'cliff', fn: (a: Application) => a.equity_cliff ? `${a.equity_cliff} months` : '—', num: () => 0 },
            { label: 'Total comp', key: 'tc', fn: (a: Application) => { const tc = totalComp(a); return tc > 0 ? `$${tc.toLocaleString()}` : '—'; }, num: totalComp, highlight: true },
            { label: 'Decision by', key: 'deadline', fn: (a: Application) => a.offer_deadline ? new Date(a.offer_deadline + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—', num: () => 0 },
          ].map(({ label, key, fn, num, highlight }, i) => {
            const vals = comparing.map(fn);
            const nums = comparing.map(num);
            const winnerIdx = nums[0] !== nums[1] ? (nums[0] > nums[1] ? 0 : 1) : -1;
            return (
              <div key={key} style={{
                display: 'grid', gridTemplateColumns: '180px 1fr 1fr',
                borderTop: '1px solid var(--border-gray)',
                background: highlight ? 'rgba(22,163,74,0.03)' : 'var(--card-bg)',
              }}>
                <div style={{ padding: '12px 16px', fontSize: 12, color: 'var(--muted-text)', fontWeight: 500, display: 'flex', alignItems: 'center' }}>{label}</div>
                {comparing.map((app, ci) => {
                  const isWinner = highlight && winnerIdx === ci;
                  return (
                    <div key={app.id} style={{
                      padding: '12px 16px',
                      borderLeft: '1px solid var(--border-gray)',
                      fontSize: highlight ? 15 : 13,
                      fontWeight: highlight ? 800 : 400,
                      color: isWinner ? '#16A34A' : 'var(--brand-navy)',
                      display: 'flex', alignItems: 'center', gap: 6,
                    }}>
                      {fn(app)}
                      {isWinner && <span style={{ fontSize: 12 }}>⭐</span>}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function CompRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontSize: 11, color: 'var(--muted-text)', fontWeight: 500 }}>{label}</span>
      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--brand-navy)' }}>{value}</span>
    </div>
  );
}
