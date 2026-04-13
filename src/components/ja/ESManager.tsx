'use client';

import { useState, useCallback } from 'react';
import { FileText, Copy } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useCharacterCount } from '@/lib/ja-utils';

interface ESContent {
  motivation: string;
  selfPR: string;
  gakuchika: string;
  other: string;
}

interface Props {
  applicationId: string;
  initialContent?: ESContent | null;
  isPro: boolean;
}

function SaveIndicator({ state }: { state: 'idle' | 'saving' | 'saved' | 'error' }) {
  if (state === 'idle') return null;
  const map = {
    saving: { text: '保存中', color: '#94A3B8' },
    saved:  { text: '保存済み ✓', color: '#22C55E' },
    error:  { text: '保存エラー', color: '#EF4444' },
  } as const;
  const cfg = map[state as keyof typeof map];
  if (!cfg) return null;
  return (
    <span style={{ fontSize: 11, color: cfg.color, letterSpacing: '0.05em', fontFamily: "'Noto Sans JP', sans-serif" }}>
      {cfg.text}
    </span>
  );
}

function CharCounter({ count, max }: { count: number; max: number }) {
  const over = count > max;
  const near = count >= max - 20 && count <= max;
  return (
    <span
      style={{
        fontSize: 11,
        color: over ? '#EF4444' : near ? '#F59E0B' : '#94A3B8',
        fontFamily: 'var(--font-geist), sans-serif',
        letterSpacing: 0,
      }}
    >
      {over && <span style={{ marginRight: 4, fontFamily: "'Noto Sans JP', sans-serif" }}>文字数オーバー</span>}
      {count} / {max}文字
    </span>
  );
}

function ESField({
  label,
  value,
  max,
  placeholder,
  onChange,
  onSave,
  saveState,
}: {
  label: string;
  value: string;
  max: number;
  placeholder: string;
  onChange: (v: string) => void;
  onSave: () => void;
  saveState: 'idle' | 'saving' | 'saved' | 'error';
}) {
  const { count, isOverLimit } = useCharacterCount(value, max);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!value) return;
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ marginBottom: 20 }}>
      {/* Label row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: 'var(--brand-navy)',
              letterSpacing: '0.05em',
              fontFamily: "'Noto Sans JP', sans-serif",
            }}
          >
            {label}
          </span>
          <SaveIndicator state={saveState} />
        </div>
        <button
          onClick={handleCopy}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            fontSize: 11,
            color: copied ? '#22C55E' : '#94A3B8',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '2px 6px',
            borderRadius: 4,
            fontFamily: "'Noto Sans JP', sans-serif",
            letterSpacing: '0.05em',
          }}
        >
          <Copy size={11} />
          {copied ? 'コピーしました' : 'コピー'}
        </button>
      </div>

      {/* Textarea */}
      <div style={{ position: 'relative' }}>
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onSave}
          placeholder={placeholder}
          rows={4}
          className="es-textarea"
          style={{
            width: '100%',
            minHeight: 100,
            borderRadius: 10,
            border: isOverLimit ? '1.5px solid #EF4444' : '1px solid var(--border-gray)',
            background: 'var(--surface-gray)',
            color: 'var(--brand-navy)',
            fontSize: 13,
            letterSpacing: '0.05em',
            lineHeight: 1.8,
            padding: '10px 12px 28px',
            fontFamily: "'Noto Sans JP', sans-serif",
            resize: 'vertical',
            outline: 'none',
            boxSizing: 'border-box',
          }}
        />
        {/* Character counter pinned to bottom-right of textarea */}
        <div
          style={{
            position: 'absolute',
            bottom: 8,
            right: 10,
            pointerEvents: 'none',
          }}
        >
          <CharCounter count={count} max={max} />
        </div>
      </div>
    </div>
  );
}

export default function ESManager({ applicationId, initialContent, isPro }: Props) {
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState<ESContent>({
    motivation: initialContent?.motivation ?? '',
    selfPR: initialContent?.selfPR ?? '',
    gakuchika: initialContent?.gakuchika ?? '',
    other: initialContent?.other ?? '',
  });
  const [saveStates, setSaveStates] = useState<Record<keyof ESContent, 'idle' | 'saving' | 'saved' | 'error'>>({
    motivation: 'idle',
    selfPR: 'idle',
    gakuchika: 'idle',
    other: 'idle',
  });

  const saveField = useCallback(
    async (field: keyof ESContent, value: string) => {
      setSaveStates((s) => ({ ...s, [field]: 'saving' }));
      try {
        const updatedContent = { ...content, [field]: value };
        await supabase
          .from('applications')
          .update({ es_content: updatedContent })
          .eq('id', applicationId);
        setSaveStates((s) => ({ ...s, [field]: 'saved' }));
        setTimeout(() => setSaveStates((s) => ({ ...s, [field]: 'idle' })), 2500);
      } catch {
        setSaveStates((s) => ({ ...s, [field]: 'error' }));
      }
    },
    [applicationId, content],
  );

  const fields: {
    key: keyof ESContent;
    label: string;
    placeholder: string;
    max: number;
  }[] = [
    {
      key: 'motivation',
      label: '志望動機',
      placeholder: 'この企業を志望する理由を入力してください',
      max: 400,
    },
    {
      key: 'selfPR',
      label: '自己PR',
      placeholder: '自身の強みや経験をPRしてください',
      max: 400,
    },
    {
      key: 'gakuchika',
      label: 'ガクチカ',
      placeholder: '学生時代に最も力を入れたことを入力してください',
      max: 400,
    },
    {
      key: 'other',
      label: 'その他（自由記述）',
      placeholder: 'その他の設問があれば入力してください',
      max: 600,
    },
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
          <FileText size={15} color="var(--muted-text)" />
          <span
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: 'var(--brand-navy)',
              letterSpacing: '0.05em',
              fontFamily: "'Noto Sans JP', sans-serif",
            }}
          >
            ES管理
          </span>
        </div>
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
      </button>

      {/* Body */}
      {open && (
        <div style={{ padding: '16px 16px 4px' }}>
          {fields.map((f) => (
            <ESField
              key={f.key}
              label={f.label}
              value={content[f.key]}
              max={f.max}
              placeholder={f.placeholder}
              onChange={(v) => setContent((c) => ({ ...c, [f.key]: v }))}
              onSave={() => saveField(f.key, content[f.key])}
              saveState={saveStates[f.key]}
            />
          ))}
        </div>
      )}
    </div>
  );
}
