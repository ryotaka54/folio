'use client';

import { useState, useEffect, useCallback } from 'react';
import { Award } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { getNaiteiCountdown, formatDateJa } from '@/lib/ja-utils';

interface NaiteiData {
  offerDate: string;
  acceptanceDeadline: string;
  conditions: string;
  department: string;
  compensation: string;
  comparisonNotes: string;
}

interface Props {
  applicationId: string;
  stage: string;
  initialData?: NaiteiData | null;
  isPro: boolean;
}

// ── Confetti burst ────────────────────────────────────────────────────────────

function ConfettiBurst() {
  const pieces = Array.from({ length: 16 }, (_, i) => ({
    id: i,
    color: ['#EF4444', '#fff', '#1E3A8A', '#F59E0B', '#22C55E'][i % 5],
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 40}%`,
    delay: `${Math.random() * 0.4}s`,
    duration: `${0.8 + Math.random() * 0.6}s`,
  }));

  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
      {pieces.map((p) => (
        <div
          key={p.id}
          style={{
            position: 'absolute',
            width: 6,
            height: 6,
            borderRadius: 1,
            background: p.color,
            left: p.left,
            top: p.top,
            animation: `confetti-fall ${p.duration} ${p.delay} ease-in forwards`,
          }}
        />
      ))}
      <style>{`
        @keyframes confetti-fall {
          0%   { transform: translateY(-20px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(80px) rotate(720deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

// ── Countdown badge ───────────────────────────────────────────────────────────

function CountdownBadge({ deadline }: { deadline: string }) {
  const cd = getNaiteiCountdown(deadline);
  if (!cd) return null;

  const colors = {
    safe:    { bg: '#DCFCE7', text: '#16A34A', border: '#86EFAC' },
    warning: { bg: '#FEF3C7', text: '#D97706', border: '#FCD34D' },
    danger:  { bg: '#FEE2E2', text: '#DC2626', border: '#FCA5A5' },
  }[cd.urgency];

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '4px 14px',
        borderRadius: 9999,
        background: colors.bg,
        border: `1px solid ${colors.border}`,
      }}
    >
      <span
        style={{
          fontSize: 15,
          fontWeight: 700,
          color: colors.text,
          fontFamily: 'var(--font-geist), sans-serif',
          letterSpacing: '-0.02em',
        }}
      >
        あと{cd.days}日
      </span>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function NaiteiManager({ applicationId, stage, initialData, isPro }: Props) {
  const [open, setOpen] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [data, setData] = useState<NaiteiData>({
    offerDate: initialData?.offerDate ?? '',
    acceptanceDeadline: initialData?.acceptanceDeadline ?? '',
    conditions: initialData?.conditions ?? '',
    department: initialData?.department ?? '',
    compensation: initialData?.compensation ?? '',
    comparisonNotes: initialData?.comparisonNotes ?? '',
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const isNaiteiStage = stage === '内々定' || stage === '内定';

  // Show celebration once when component first mounts in an offer stage
  useEffect(() => {
    if (isNaiteiStage && !initialData?.offerDate) {
      setShowCelebration(true);
      const t = setTimeout(() => setShowCelebration(false), 3000);
      return () => clearTimeout(t);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const save = useCallback(
    async (updated: NaiteiData) => {
      setSaving(true);
      try {
        await supabase
          .from('applications')
          .update({ naitei_details: updated })
          .eq('id', applicationId);
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
      } catch { /* silent */ }
      finally { setSaving(false); }
    },
    [applicationId],
  );

  const update = (patch: Partial<NaiteiData>) => {
    const next = { ...data, ...patch };
    setData(next);
    save(next);
  };

  if (!isPro || !isNaiteiStage) return null;

  return (
    <div
      style={{
        borderRadius: 12,
        border: '1px solid var(--border-gray)',
        overflow: 'hidden',
        marginBottom: 12,
        position: 'relative',
      }}
    >
      {/* Confetti celebration */}
      {showCelebration && <ConfettiBurst />}

      {/* Header */}
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 16px',
          background: 'linear-gradient(135deg, rgba(34,197,94,0.06), rgba(16,185,129,0.06))',
          border: 'none',
          cursor: 'pointer',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Award size={15} color="#16A34A" />
          <span
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: 'var(--brand-navy)',
              letterSpacing: '0.05em',
              fontFamily: "'Noto Sans JP', sans-serif",
            }}
          >
            内定管理
          </span>
          {data.acceptanceDeadline && (
            <CountdownBadge deadline={data.acceptanceDeadline} />
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {saving && <span style={{ fontSize: 11, color: '#94A3B8', fontFamily: "'Noto Sans JP', sans-serif" }}>保存中</span>}
          {saved && <span style={{ fontSize: 11, color: '#22C55E', fontFamily: "'Noto Sans JP', sans-serif" }}>保存済み ✓</span>}
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--muted-text)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </button>

      {/* Celebration congratulations */}
      {showCelebration && open && (
        <div
          style={{
            padding: '10px 16px',
            background: 'rgba(34,197,94,0.06)',
            borderBottom: '1px solid rgba(34,197,94,0.15)',
          }}
        >
          <p
            style={{
              fontSize: 16,
              fontWeight: 600,
              color: '#2563EB',
              letterSpacing: '0.05em',
              margin: 0,
              fontFamily: "'Noto Sans JP', sans-serif",
              animation: 'fadeOut 1s 2s ease-out forwards',
            }}
          >
            内定おめでとうございます！🎉
          </p>
          <style>{`
            @keyframes fadeOut {
              from { opacity: 1; }
              to   { opacity: 0; }
            }
          `}</style>
        </div>
      )}

      {/* Body */}
      {open && (
        <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Offer date + Deadline row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>内定日</label>
              <input
                type="date"
                value={data.offerDate}
                onChange={(e) => update({ offerDate: e.target.value })}
                style={inputStyle}
              />
              {data.offerDate && (
                <p style={{ fontSize: 11, color: '#94A3B8', margin: '4px 0 0', fontFamily: "'Noto Sans JP', sans-serif" }}>
                  {formatDateJa(data.offerDate)}
                </p>
              )}
            </div>
            <div>
              <label style={labelStyle}>承諾期限</label>
              <input
                type="date"
                value={data.acceptanceDeadline}
                onChange={(e) => update({ acceptanceDeadline: e.target.value })}
                style={inputStyle}
              />
              {data.acceptanceDeadline && (
                <div style={{ marginTop: 6 }}>
                  <CountdownBadge deadline={data.acceptanceDeadline} />
                </div>
              )}
            </div>
          </div>

          {/* Conditions */}
          <Field label="内定条件" value={data.conditions} onChange={(v) => update({ conditions: v })} placeholder="内定条件・雇用形態など" />

          {/* Department */}
          <Field label="配属先" value={data.department} onChange={(v) => update({ department: v })} placeholder="配属予定部署・チームなど" />

          {/* Compensation */}
          <Field label="給与・待遇" value={data.compensation} onChange={(v) => update({ compensation: v })} placeholder="年収・福利厚生などのメモ" />

          {/* Comparison notes — most important for multiple offers */}
          <div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 6 }}>
              <label style={labelStyle}>他社との比較メモ</label>
              <span style={{ fontSize: 11, color: '#94A3B8', fontFamily: "'Noto Sans JP', sans-serif", letterSpacing: '0.05em' }}>
                複数内定の場合はここで整理しましょう
              </span>
            </div>
            <textarea
              value={data.comparisonNotes}
              onChange={(e) => update({ comparisonNotes: e.target.value })}
              placeholder="他社との比較ポイント・決め手になりそうな要素など"
              rows={4}
              style={{
                width: '100%',
                borderRadius: 8,
                border: '1.5px solid var(--accent-blue, #2563EB)',
                background: 'rgba(37,99,235,0.03)',
                color: 'var(--brand-navy)',
                fontSize: 13,
                padding: '10px 12px',
                fontFamily: "'Noto Sans JP', sans-serif",
                letterSpacing: '0.05em',
                lineHeight: 1.8,
                resize: 'vertical',
                boxSizing: 'border-box',
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

const labelStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
  color: 'var(--muted-text)',
  letterSpacing: '0.05em',
  display: 'block',
  marginBottom: 6,
  fontFamily: "'Noto Sans JP', sans-serif",
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  height: 38,
  borderRadius: 8,
  border: '1px solid var(--border-gray)',
  background: 'var(--surface-gray)',
  color: 'var(--brand-navy)',
  fontSize: 13,
  padding: '0 10px',
  fontFamily: 'var(--font-geist), sans-serif',
  boxSizing: 'border-box',
};

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={inputStyle}
      />
    </div>
  );
}
