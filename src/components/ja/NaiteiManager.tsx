'use client';

import { useState, useEffect, useCallback } from 'react';
import { Award } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { getNaiteiCountdown, formatDateJa } from '@/lib/ja-utils';
import { authFetch } from '@/lib/auth-fetch';

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
            position: 'absolute', width: 6, height: 6, borderRadius: 1,
            background: p.color, left: p.left, top: p.top,
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
    safe:    { bg: 'rgba(22,163,74,0.12)',  text: '#16A34A', border: 'rgba(22,163,74,0.3)'  },
    warning: { bg: 'rgba(217,119,6,0.12)',  text: '#D97706', border: 'rgba(217,119,6,0.3)'  },
    danger:  { bg: 'rgba(220,38,38,0.12)',  text: '#DC2626', border: 'rgba(220,38,38,0.3)'  },
  }[cd.urgency];

  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '4px 14px', borderRadius: 9999,
      background: colors.bg, border: `1px solid ${colors.border}`,
    }}>
      <span style={{
        fontSize: 15, fontWeight: 700, color: colors.text,
        fontFamily: 'var(--font-geist), sans-serif', letterSpacing: '-0.02em',
      }}>
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

  // Parse offer letter state
  const [showParse, setShowParse] = useState(false);
  const [parseText, setParseText] = useState('');
  const [parsing, setParsing] = useState(false);
  const [parseError, setParseError] = useState('');
  const [parsedCount, setParsedCount] = useState<number | null>(null);

  const isNaiteiStage = stage === '内々定' || stage === '内定';

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

  const handleParse = async () => {
    if (!parseText.trim() || parsing) return;
    setParsing(true);
    setParseError('');
    try {
      const res = await authFetch('/api/ai/parse-offer', {
        method: 'POST',
        body: JSON.stringify({ text: parseText, lang: 'ja' }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? '解析に失敗しました');

      const extracted: Partial<NaiteiData> = {};
      const d = json.data as {
        compensation?: string | null;
        conditions?: string | null;
        department?: string | null;
        offerDate?: string | null;
        acceptanceDeadline?: string | null;
      };

      if (d.compensation)        extracted.compensation        = d.compensation;
      if (d.conditions)          extracted.conditions          = d.conditions;
      if (d.department)          extracted.department          = d.department;
      if (d.offerDate)           extracted.offerDate           = d.offerDate;
      if (d.acceptanceDeadline)  extracted.acceptanceDeadline  = d.acceptanceDeadline;

      const count = Object.keys(extracted).length;
      if (count === 0) {
        setParseError('内定通知書の詳細が見つかりませんでした。別のテキストを試してください。');
        return;
      }

      update(extracted);
      setParsedCount(count);
      setShowParse(false);
      setParseText('');
    } catch {
      setParseError('解析できませんでした。テキストを整理して再試行してください。');
    } finally {
      setParsing(false);
    }
  };

  const hasData = !!(data.compensation || data.conditions || data.department ||
    data.offerDate || data.acceptanceDeadline);

  if (!isPro || !isNaiteiStage) return null;

  return (
    <div style={{
      borderRadius: 12, border: '1px solid var(--border-gray)',
      overflow: 'hidden', marginBottom: 12, position: 'relative',
    }}>
      {showCelebration && <ConfettiBurst />}

      {/* ── Header ── */}
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 16px',
          background: 'linear-gradient(135deg, rgba(34,197,94,0.06), rgba(16,185,129,0.06))',
          border: 'none', cursor: 'pointer', fontFamily: "'Noto Sans JP', sans-serif",
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Award size={15} color="#16A34A" />
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--brand-navy)', letterSpacing: '0.05em' }}>
            内定管理
          </span>
          {data.acceptanceDeadline && <CountdownBadge deadline={data.acceptanceDeadline} />}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {saving && <span style={{ fontSize: 11, color: '#94A3B8' }}>保存中</span>}
          {saved && <span style={{ fontSize: 11, color: '#22C55E' }}>保存済み ✓</span>}
          <svg
            width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke="var(--muted-text)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </button>

      {/* ── Celebration ── */}
      {showCelebration && open && (
        <div style={{ padding: '10px 16px', background: 'rgba(34,197,94,0.06)', borderBottom: '1px solid rgba(34,197,94,0.15)' }}>
          <p style={{
            fontSize: 16, fontWeight: 600, color: '#2563EB', letterSpacing: '0.05em',
            margin: 0, fontFamily: "'Noto Sans JP', sans-serif",
            animation: 'fadeOut 1s 2s ease-out forwards',
          }}>
            内定おめでとうございます！🎉
          </p>
          <style>{`@keyframes fadeOut { from { opacity: 1; } to { opacity: 0; } }`}</style>
        </div>
      )}

      {/* ── Body ── */}
      {open && (
        <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 14, fontFamily: "'Noto Sans JP', sans-serif" }}>

          {/* ── AI parse button ── */}
          {!showParse ? (
            <button
              onClick={() => setShowParse(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '9px 14px', borderRadius: 9,
                background: 'rgba(37,99,235,0.06)', border: '1px dashed rgba(37,99,235,0.3)',
                cursor: 'pointer', fontFamily: "'Noto Sans JP', sans-serif", width: '100%',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(37,99,235,0.1)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(37,99,235,0.06)'; }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a10 10 0 1 0 10 10"/><path d="M12 8v4l2 2"/><path d="M18 2l4 4-4 4"/><path d="M22 6H14"/></svg>
              <span style={{ fontSize: 13, fontWeight: 500, color: '#2563EB' }}>
                {hasData ? '内定通知書を再読み込み' : '内定通知書を貼り付けてAIで自動入力'}
              </span>
              <span style={{ fontSize: 12, color: 'var(--muted-text)', marginLeft: 2 }}>— 年収・条件・期限を自動抽出</span>
            </button>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted-text)', letterSpacing: '0.05em' }}>
                内定通知書・条件通知書のテキストを貼り付けてください
              </label>
              <textarea
                autoFocus
                value={parseText}
                onChange={e => setParseText(e.target.value)}
                placeholder="例）年収450万円（月給25万円）、賞与年2回（夏・冬各1.5ヶ月）、固定残業代20時間分含む。内定承諾期限：2026年6月30日。配属予定：デジタルソリューション部門。"
                rows={5}
                style={{
                  width: '100%', padding: '10px 12px', borderRadius: 8, fontSize: 13,
                  border: '1px solid var(--border-gray)', background: 'var(--background)',
                  color: 'var(--brand-navy)', resize: 'vertical', outline: 'none',
                  fontFamily: "'Noto Sans JP', sans-serif", lineHeight: 1.8, letterSpacing: '0.03em',
                  boxSizing: 'border-box',
                }}
                onFocus={e => { e.currentTarget.style.borderColor = '#2563EB'; }}
                onBlur={e => { e.currentTarget.style.borderColor = 'var(--border-gray)'; }}
              />
              {parseError && (
                <p style={{ fontSize: 12, color: '#EF4444', margin: 0, fontFamily: "'Noto Sans JP', sans-serif" }}>{parseError}</p>
              )}
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={handleParse}
                  disabled={!parseText.trim() || parsing}
                  style={{
                    height: 34, padding: '0 16px', borderRadius: 8,
                    background: parsing ? 'rgba(37,99,235,0.5)' : '#2563EB',
                    color: '#fff', border: 'none', cursor: parsing ? 'default' : 'pointer',
                    fontSize: 13, fontWeight: 600, fontFamily: "'Noto Sans JP', sans-serif",
                    display: 'flex', alignItems: 'center', gap: 6,
                    opacity: !parseText.trim() ? 0.5 : 1,
                  }}
                >
                  {parsing ? (
                    <>
                      <span style={{ width: 12, height: 12, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
                      解析中…
                    </>
                  ) : '自動入力する'}
                </button>
                <button
                  onClick={() => { setShowParse(false); setParseText(''); setParseError(''); }}
                  style={{
                    height: 34, padding: '0 14px', borderRadius: 8, fontSize: 13,
                    border: '1px solid var(--border-gray)', background: 'transparent',
                    color: 'var(--muted-text)', cursor: 'pointer', fontFamily: "'Noto Sans JP', sans-serif",
                  }}
                >
                  キャンセル
                </button>
              </div>
            </div>
          )}

          {/* ── Parsed success ── */}
          {parsedCount !== null && !showParse && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px',
              borderRadius: 8, background: 'rgba(22,163,74,0.08)', border: '1px solid rgba(22,163,74,0.2)',
            }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              <span style={{ fontSize: 12, color: '#16A34A', fontWeight: 600, fontFamily: "'Noto Sans JP', sans-serif" }}>
                {parsedCount}件の項目を自動入力しました
              </span>
              <button
                onClick={() => setParsedCount(null)}
                style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#16A34A', fontSize: 14, lineHeight: 1, padding: 0 }}
              >×</button>
            </div>
          )}

          {/* ── Offer date + deadline ── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>内定日</label>
              <input
                type="date" value={data.offerDate}
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
                type="date" value={data.acceptanceDeadline}
                onChange={(e) => update({ acceptanceDeadline: e.target.value })}
                style={inputStyle}
              />
              {data.acceptanceDeadline && (
                <div style={{ marginTop: 6 }}><CountdownBadge deadline={data.acceptanceDeadline} /></div>
              )}
            </div>
          </div>

          {/* ── Compensation (most important field) ── */}
          <div>
            <label style={labelStyle}>給与・待遇</label>
            <textarea
              value={data.compensation}
              onChange={(e) => update({ compensation: e.target.value })}
              placeholder="例）年収500万円（月給28万円）、賞与年2回3ヶ月分、固定残業40時間含む、交通費全額支給"
              rows={3}
              style={{
                width: '100%', borderRadius: 8, border: '1px solid var(--border-gray)',
                background: 'var(--surface-gray)', color: 'var(--brand-navy)',
                fontSize: 13, padding: '10px 12px',
                fontFamily: "'Noto Sans JP', sans-serif",
                letterSpacing: '0.04em', lineHeight: 1.8, resize: 'vertical', boxSizing: 'border-box',
              }}
            />
          </div>

          {/* ── Conditions ── */}
          <Field label="内定条件" value={data.conditions} onChange={(v) => update({ conditions: v })} placeholder="例）2027年3月卒業見込み、健康診断結果が良好であること" />

          {/* ── Department ── */}
          <Field label="配属先" value={data.department} onChange={(v) => update({ department: v })} placeholder="例）プロダクト開発部 バックエンドチーム" />

          {/* ── Comparison notes ── */}
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
              placeholder="他社との比較ポイント・決め手になりそうな要素・懸念点など"
              rows={4}
              style={{
                width: '100%', borderRadius: 8,
                border: '1.5px solid var(--accent-blue, #2563EB)',
                background: 'rgba(37,99,235,0.03)', color: 'var(--brand-navy)',
                fontSize: 13, padding: '10px 12px',
                fontFamily: "'Noto Sans JP', sans-serif",
                letterSpacing: '0.05em', lineHeight: 1.8, resize: 'vertical', boxSizing: 'border-box',
              }}
            />
          </div>
        </div>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

const labelStyle: React.CSSProperties = {
  fontSize: 12, fontWeight: 600, color: 'var(--muted-text)',
  letterSpacing: '0.05em', display: 'block', marginBottom: 6,
  fontFamily: "'Noto Sans JP', sans-serif",
};

const inputStyle: React.CSSProperties = {
  width: '100%', height: 38, borderRadius: 8,
  border: '1px solid var(--border-gray)', background: 'var(--surface-gray)',
  color: 'var(--brand-navy)', fontSize: 13, padding: '0 10px',
  fontFamily: 'var(--font-geist), sans-serif', boxSizing: 'border-box',
};

function Field({
  label, value, onChange, placeholder,
}: {
  label: string; value: string; onChange: (v: string) => void; placeholder: string;
}) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <input
        type="text" value={value} onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder} style={inputStyle}
      />
    </div>
  );
}
