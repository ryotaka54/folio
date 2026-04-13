'use client';

import { useState, useCallback } from 'react';
import { ClipboardList } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { formatDateJa } from '@/lib/ja-utils';

type SPIFormat =
  | 'テストセンター'
  | 'WEBテスティング'
  | 'ペーパーテスト'
  | '玉手箱'
  | 'GAB'
  | 'TG-WEB'
  | 'その他';

type SPIResult = '通過' | '不通過' | '未受験';

interface SPIData {
  format: SPIFormat | '';
  examDate: string;
  result: SPIResult;
  memo: string;
}

interface Props {
  applicationId: string;
  initialData?: SPIData | null;
  isPro: boolean;
}

export default function SPITracker({ applicationId, initialData, isPro }: Props) {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<SPIData>({
    format: initialData?.format ?? '',
    examDate: initialData?.examDate ?? '',
    result: initialData?.result ?? '未受験',
    memo: initialData?.memo ?? '',
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const save = useCallback(
    async (updated: SPIData) => {
      setSaving(true);
      try {
        await supabase
          .from('applications')
          .update({ spi_result: updated })
          .eq('id', applicationId);
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
      } catch { /* silent */ }
      finally { setSaving(false); }
    },
    [applicationId],
  );

  const update = (patch: Partial<SPIData>) => {
    const next = { ...data, ...patch };
    setData(next);
    save(next);
  };

  const RESULT_OPTIONS: { label: SPIResult; color: string; bg: string }[] = [
    { label: '未受験', color: '#94A3B8', bg: '#F1F5F9' },
    { label: '通過',   color: '#16A34A', bg: '#DCFCE7' },
    { label: '不通過', color: '#DC2626', bg: '#FEE2E2' },
  ];

  if (!isPro) return null;

  return (
    <div
      style={{
        borderRadius: 12,
        border: '1px solid var(--border-gray)',
        overflow: 'hidden',
        marginBottom: 12,
      }}
    >
      {/* Header */}
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 16px',
          background: 'var(--surface-gray)',
          border: 'none',
          cursor: 'pointer',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <ClipboardList size={15} color="var(--muted-text)" />
          <span
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: 'var(--brand-navy)',
              letterSpacing: '0.05em',
              fontFamily: "'Noto Sans JP', sans-serif",
            }}
          >
            SPI・適性検査
          </span>
          {/* Result badge in header */}
          {data.result !== '未受験' && (
            <span
              style={{
                fontSize: 10,
                fontWeight: 600,
                color: data.result === '通過' ? '#16A34A' : '#DC2626',
                background: data.result === '通過' ? '#DCFCE7' : '#FEE2E2',
                borderRadius: 9999,
                padding: '1px 8px',
                fontFamily: "'Noto Sans JP', sans-serif",
              }}
            >
              {data.result}
            </span>
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

      {/* Body */}
      {open && (
        <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Test format */}
          <div>
            <label
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: 'var(--muted-text)',
                letterSpacing: '0.05em',
                display: 'block',
                marginBottom: 6,
                fontFamily: "'Noto Sans JP', sans-serif",
              }}
            >
              テスト形式
            </label>
            <select
              value={data.format}
              onChange={(e) => update({ format: e.target.value as SPIFormat })}
              style={{
                width: '100%',
                height: 38,
                borderRadius: 8,
                border: '1px solid var(--border-gray)',
                background: 'var(--surface-gray)',
                color: 'var(--brand-navy)',
                fontSize: 13,
                padding: '0 10px',
                fontFamily: "'Noto Sans JP', sans-serif",
                letterSpacing: '0.05em',
              }}
            >
              <option value="">選択してください</option>
              {(['テストセンター', 'WEBテスティング', 'ペーパーテスト', '玉手箱', 'GAB', 'TG-WEB', 'その他'] as SPIFormat[]).map(
                (f) => (
                  <option key={f} value={f}>{f}</option>
                ),
              )}
            </select>
          </div>

          {/* Exam date */}
          <div>
            <label
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: 'var(--muted-text)',
                letterSpacing: '0.05em',
                display: 'block',
                marginBottom: 6,
                fontFamily: "'Noto Sans JP', sans-serif",
              }}
            >
              受験日
              {data.examDate && (
                <span style={{ marginLeft: 8, fontWeight: 400, color: 'var(--brand-navy)' }}>
                  {formatDateJa(data.examDate)}
                </span>
              )}
            </label>
            <input
              type="date"
              value={data.examDate}
              onChange={(e) => update({ examDate: e.target.value })}
              style={{
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
              }}
            />
          </div>

          {/* Result toggle */}
          <div>
            <label
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: 'var(--muted-text)',
                letterSpacing: '0.05em',
                display: 'block',
                marginBottom: 8,
                fontFamily: "'Noto Sans JP', sans-serif",
              }}
            >
              結果
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              {RESULT_OPTIONS.map((opt) => (
                <button
                  key={opt.label}
                  onClick={() => update({ result: opt.label })}
                  style={{
                    flex: 1,
                    height: 36,
                    borderRadius: 8,
                    border: data.result === opt.label ? `2px solid ${opt.color}` : '1px solid var(--border-gray)',
                    background: data.result === opt.label ? opt.bg : 'var(--surface-gray)',
                    color: data.result === opt.label ? opt.color : 'var(--muted-text)',
                    fontSize: 13,
                    fontWeight: data.result === opt.label ? 600 : 400,
                    cursor: 'pointer',
                    letterSpacing: '0.05em',
                    fontFamily: "'Noto Sans JP', sans-serif",
                    transition: 'all 0.15s',
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Memo */}
          <div>
            <label
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: 'var(--muted-text)',
                letterSpacing: '0.05em',
                display: 'block',
                marginBottom: 6,
                fontFamily: "'Noto Sans JP', sans-serif",
              }}
            >
              メモ
            </label>
            <textarea
              value={data.memo}
              onChange={(e) => update({ memo: e.target.value.slice(0, 200) })}
              placeholder="受験時の感触・気づきなど"
              rows={3}
              style={{
                width: '100%',
                borderRadius: 8,
                border: '1px solid var(--border-gray)',
                background: 'var(--surface-gray)',
                color: 'var(--brand-navy)',
                fontSize: 13,
                padding: '8px 10px',
                fontFamily: "'Noto Sans JP', sans-serif",
                letterSpacing: '0.05em',
                lineHeight: 1.7,
                resize: 'vertical',
                boxSizing: 'border-box',
              }}
            />
            <div style={{ textAlign: 'right', marginTop: 2 }}>
              <span style={{ fontSize: 11, color: '#94A3B8', fontFamily: 'var(--font-geist), sans-serif' }}>
                {data.memo.length} / 200文字
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
