'use client';

import { useState, useRef, useCallback } from 'react';
import { Application } from '@/lib/types';
import { authFetch } from '@/lib/auth-fetch';

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
  if (n == null || n === 0) return '';
  return n.toLocaleString('en-US');
}

function fmtDisplay(n: number | null | undefined) {
  if (n == null || n === 0) return null;
  if (n >= 1000) return '$' + (n / 1000).toFixed(n % 1000 === 0 ? 0 : 1) + 'k';
  return '$' + n;
}

const inputCls = [
  'w-full h-9 px-3 rounded-md text-[13px] border transition-colors',
  'focus:outline-none focus:border-accent-blue focus:ring-2 focus:ring-accent-blue/20',
  'bg-background border-border-gray placeholder:text-text-tertiary',
].join(' ');

const urgencyColors = {
  danger:  { bg: 'rgba(220,38,38,0.1)',  text: '#DC2626', border: 'rgba(220,38,38,0.25)'  },
  warning: { bg: 'rgba(217,119,6,0.1)',  text: '#D97706', border: 'rgba(217,119,6,0.25)'  },
  safe:    { bg: 'rgba(22,163,74,0.1)',  text: '#16A34A', border: 'rgba(22,163,74,0.25)'  },
};

export default function OfferDetailsPanel({ application, onUpdate }: Props) {
  const [open, setOpen] = useState(true);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showParse, setShowParse] = useState(false);
  const [parseText, setParseText] = useState('');
  const [parsing, setParsing] = useState(false);
  const [parseError, setParseError] = useState('');
  const [parsedFields, setParsedFields] = useState<Partial<Application> | null>(null);
  const debounceRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const debouncedUpdate = useCallback((field: keyof Application, value: number | string | null) => {
    if (debounceRef.current[field as string]) clearTimeout(debounceRef.current[field as string]);
    debounceRef.current[field as string] = setTimeout(() => onUpdate({ [field]: value }), 800);
  }, [onUpdate]);

  const handleParse = async () => {
    if (!parseText.trim() || parsing) return;
    setParsing(true);
    setParseError('');
    try {
      const res = await authFetch('/api/ai/parse-offer', {
        method: 'POST',
        body: JSON.stringify({ text: parseText }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Parse failed');
      const data: Partial<Application> = json.data;
      // apply non-null extracted fields immediately
      const updates: Partial<Application> = {};
      for (const [k, v] of Object.entries(data)) {
        if (v != null) updates[k as keyof Application] = v as never;
      }
      if (Object.keys(updates).length > 0) {
        onUpdate(updates);
        setParsedFields(updates);
      }
      setShowParse(false);
      setParseText('');
      if (Object.keys(updates).length === 0) setParseError('No compensation details found in that text.');
    } catch {
      setParseError('Could not parse. Try pasting a cleaner excerpt.');
    } finally {
      setParsing(false);
    }
  };

  const deadline = deadlineCountdown(application.offer_deadline);
  const totalComp = (application.salary_max ?? 0)
    + Math.round((application.signing_bonus ?? 0) / 4)
    + (application.bonus_target ?? 0);

  const hasAnyData = !!(application.salary_max || application.signing_bonus ||
    application.bonus_target || application.equity_shares || application.offer_deadline);

  return (
    <div style={{ borderRadius: 12, border: '1px solid var(--border-gray)', overflow: 'hidden' }}>

      {/* ── Header ── */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 16px', background: 'linear-gradient(135deg, rgba(22,163,74,0.06), rgba(5,150,105,0.06))',
          border: 'none', cursor: 'pointer', fontFamily: 'inherit',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8.21 13.89L7 23l5-3 5 3-1.21-9.12"/><path d="M15 7a3 3 0 1 1-6 0 3 3 0 0 1 6 0z"/><path d="M21 7c0 4.97-4.03 9-9 9S3 11.97 3 7"/></svg>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--brand-navy)' }}>Offer Details</span>
          {totalComp > 0 && (
            <span style={{ fontSize: 12, fontWeight: 600, color: '#16A34A' }}>
              ~{fmtDisplay(totalComp)}/yr
            </span>
          )}
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
        <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* ── Parse offer letter ── */}
          {!showParse ? (
            <button
              onClick={() => setShowParse(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '9px 14px', borderRadius: 9,
                background: 'rgba(37,99,235,0.06)', border: '1px dashed rgba(37,99,235,0.3)',
                cursor: 'pointer', fontFamily: 'inherit', width: '100%',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(37,99,235,0.1)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(37,99,235,0.06)'; }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a10 10 0 1 0 10 10"/><path d="M12 8v4l2 2"/><path d="M18 2l4 4-4 4"/><path d="M22 6H14"/></svg>
              <span style={{ fontSize: 13, fontWeight: 500, color: '#2563EB' }}>
                {hasAnyData ? 'Re-parse offer letter' : 'Paste offer letter to auto-fill'}
              </span>
              <span style={{ fontSize: 12, color: 'var(--muted-text)', marginLeft: 2 }}>— AI extracts salary, bonus & equity</span>
            </button>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--muted-text)' }}>
                Paste your offer letter or compensation summary
              </label>
              <textarea
                autoFocus
                value={parseText}
                onChange={e => setParseText(e.target.value)}
                placeholder="e.g. Base salary: $145,000. Signing bonus: $20,000. Annual target bonus 10%. 1,200 RSUs over 4 years with 1-year cliff. Offer expires June 30th."
                rows={5}
                style={{
                  width: '100%', padding: '10px 12px', borderRadius: 8, fontSize: 13,
                  border: '1px solid var(--border-gray)', background: 'var(--background)',
                  color: 'var(--brand-navy)', resize: 'vertical', outline: 'none',
                  fontFamily: 'inherit', lineHeight: 1.5,
                  boxSizing: 'border-box',
                }}
                onFocus={e => { e.currentTarget.style.borderColor = '#2563EB'; }}
                onBlur={e => { e.currentTarget.style.borderColor = 'var(--border-gray)'; }}
              />
              {parseError && (
                <p style={{ fontSize: 12, color: '#EF4444', margin: 0 }}>{parseError}</p>
              )}
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={handleParse}
                  disabled={!parseText.trim() || parsing}
                  style={{
                    height: 34, padding: '0 16px', borderRadius: 8,
                    background: parsing ? 'rgba(37,99,235,0.5)' : '#2563EB',
                    color: '#fff', border: 'none', cursor: parsing ? 'default' : 'pointer',
                    fontSize: 13, fontWeight: 600, fontFamily: 'inherit',
                    display: 'flex', alignItems: 'center', gap: 6,
                    opacity: !parseText.trim() ? 0.5 : 1,
                  }}
                >
                  {parsing ? (
                    <>
                      <span style={{ width: 12, height: 12, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
                      Parsing…
                    </>
                  ) : 'Extract details'}
                </button>
                <button
                  onClick={() => { setShowParse(false); setParseText(''); setParseError(''); }}
                  style={{
                    height: 34, padding: '0 14px', borderRadius: 8, fontSize: 13,
                    border: '1px solid var(--border-gray)', background: 'transparent',
                    color: 'var(--muted-text)', cursor: 'pointer', fontFamily: 'inherit',
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* ── Parsed success banner ── */}
          {parsedFields && !showParse && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px',
              borderRadius: 8, background: 'rgba(22,163,74,0.08)', border: '1px solid rgba(22,163,74,0.2)',
            }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              <span style={{ fontSize: 12, color: '#16A34A', fontWeight: 500 }}>
                Auto-filled {Object.keys(parsedFields).length} field{Object.keys(parsedFields).length !== 1 ? 's' : ''} from your offer letter
              </span>
              <button
                onClick={() => setParsedFields(null)}
                style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#16A34A', fontSize: 14, lineHeight: 1, padding: 0 }}
              >×</button>
            </div>
          )}

          {/* ── Simple view: total comp + deadline ── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label className="block text-[12px] font-medium mb-1" style={{ color: 'var(--muted-text)' }}>
                Base salary (USD/yr)
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: 'var(--muted-text)', pointerEvents: 'none' }}>$</span>
                <input
                  type="number" min={0}
                  key={`salary-${application.id}-${application.salary_max}`}
                  defaultValue={application.salary_max ?? ''}
                  onChange={e => debouncedUpdate('salary_max', e.target.value === '' ? null : parseInt(e.target.value, 10))}
                  className={inputCls}
                  style={{ color: 'var(--brand-navy)', paddingLeft: 22 }}
                  placeholder="150,000"
                />
              </div>
            </div>
            <div>
              <label className="block text-[12px] font-medium mb-1" style={{ color: 'var(--muted-text)' }}>
                Decision deadline
              </label>
              <input
                type="date"
                key={`deadline-${application.id}-${application.offer_deadline}`}
                defaultValue={application.offer_deadline ?? ''}
                onChange={e => debouncedUpdate('offer_deadline', e.target.value || null)}
                className={inputCls}
                style={{ color: 'var(--brand-navy)' }}
              />
            </div>
          </div>

          {/* ── Total comp badge (shown when we have data) ── */}
          {totalComp > 0 && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 8,
              background: 'rgba(22,163,74,0.06)', border: '1px solid rgba(22,163,74,0.2)',
            }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#16A34A' }}>
                ~${fmt(totalComp)} / yr total comp
              </span>
              <span style={{ fontSize: 11, color: 'var(--muted-text)', marginLeft: 2 }}>(base + ¼ signing + bonus)</span>
            </div>
          )}

          {/* ── Advanced toggle ── */}
          <button
            onClick={() => setShowAdvanced(a => !a)}
            style={{
              display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none',
              cursor: 'pointer', padding: 0, fontFamily: 'inherit', color: 'var(--muted-text)',
            }}
          >
            <svg
              width="12" height="12" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              style={{ transform: showAdvanced ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.15s' }}
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
            <span style={{ fontSize: 12 }}>{showAdvanced ? 'Hide' : 'Show'} bonus & equity details</span>
          </button>

          {/* ── Advanced fields ── */}
          {showAdvanced && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingTop: 4 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label className="block text-[12px] font-medium mb-1" style={{ color: 'var(--muted-text)' }}>Signing bonus</label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: 'var(--muted-text)', pointerEvents: 'none' }}>$</span>
                    <input type="number" min={0}
                      key={`signing-${application.id}-${application.signing_bonus}`}
                      defaultValue={application.signing_bonus ?? ''}
                      onChange={e => debouncedUpdate('signing_bonus', e.target.value === '' ? null : parseInt(e.target.value, 10))}
                      className={inputCls} style={{ color: 'var(--brand-navy)', paddingLeft: 22 }} placeholder="20,000"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[12px] font-medium mb-1" style={{ color: 'var(--muted-text)' }}>Annual bonus target</label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: 'var(--muted-text)', pointerEvents: 'none' }}>$</span>
                    <input type="number" min={0}
                      key={`bonus-${application.id}-${application.bonus_target}`}
                      defaultValue={application.bonus_target ?? ''}
                      onChange={e => debouncedUpdate('bonus_target', e.target.value === '' ? null : parseInt(e.target.value, 10))}
                      className={inputCls} style={{ color: 'var(--brand-navy)', paddingLeft: 22 }} placeholder="15,000"
                    />
                  </div>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label className="block text-[12px] font-medium mb-1" style={{ color: 'var(--muted-text)' }}>Equity (shares / RSUs)</label>
                  <input type="number" min={0}
                    key={`equity-${application.id}-${application.equity_shares}`}
                    defaultValue={application.equity_shares ?? ''}
                    onChange={e => debouncedUpdate('equity_shares', e.target.value === '' ? null : parseInt(e.target.value, 10))}
                    className={inputCls} style={{ color: 'var(--brand-navy)' }} placeholder="1,200"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-medium mb-1" style={{ color: 'var(--muted-text)' }}>Cliff (months)</label>
                  <input type="number" min={0}
                    key={`cliff-${application.id}-${application.equity_cliff}`}
                    defaultValue={application.equity_cliff ?? ''}
                    onChange={e => debouncedUpdate('equity_cliff', e.target.value === '' ? null : parseInt(e.target.value, 10))}
                    className={inputCls} style={{ color: 'var(--brand-navy)' }} placeholder="12"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[12px] font-medium mb-1" style={{ color: 'var(--muted-text)' }}>Negotiation notes</label>
                <textarea
                  key={`notes-${application.id}`}
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
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
