'use client';

import { useState, useEffect, useRef } from 'react';
import { PipelineStage, Category } from '@/lib/types';
import { X, Sparkles } from 'lucide-react';
import { useExtensionStatus } from '@/lib/extension-status-context';
import { capture } from '@/lib/analytics';
import StrengthSignal from '@/components/ai/StrengthSignal';

interface AddApplicationModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: {
    company: string;
    role: string;
    location: string;
    category: Category | '';
    status: PipelineStage;
    deadline: string | null;
    job_link: string;
    notes: string;
  }) => Promise<void>;
  stages: PipelineStage[];
  initialJobLink?: string;
  isPro?: boolean;
  onUpgrade?: () => void;
}

const inputCls = [
  'w-full px-3 bg-background border border-border-gray rounded-md',
  'text-[16px] sm:text-sm',
  'focus:outline-none focus:border-accent-blue focus:ring-2 focus:ring-accent-blue/20',
  'placeholder:text-text-tertiary transition-colors',
  'h-11 sm:h-9',
].join(' ');

// Category labels in Japanese (values stay English for DB compatibility)
const JA_CATEGORIES: { value: Category; label: string }[] = [
  { value: 'Engineering',        label: 'IT・エンジニア' },
  { value: 'Finance',            label: '金融' },
  { value: 'Consulting',         label: 'コンサル' },
  { value: 'Design',             label: 'デザイン' },
  { value: 'Product Management', label: '企画・PM' },
  { value: 'Data Science',       label: 'データ' },
  { value: 'Marketing',          label: 'マーケ' },
  { value: 'Other',              label: 'その他' },
];

export default function JaAddApplicationModal({
  open, onClose, onSave, stages, initialJobLink, isPro = false, onUpgrade = () => {},
}: AddApplicationModalProps) {
  const defaultStatus = (stages.includes('Wishlist' as PipelineStage) ? 'Wishlist' : stages[0]) as PipelineStage;
  const { isInstalled, hintCount, incrementHintCount } = useExtensionStatus();

  const [company,  setCompany]  = useState('');
  const [role,     setRole]     = useState('');
  const [location, setLocation] = useState('');
  const [category, setCategory] = useState<Category | ''>('');
  const [status,   setStatus]   = useState<PipelineStage>(defaultStatus);
  const [deadline, setDeadline] = useState('');
  const [jobLink,  setJobLink]  = useState('');
  const [notes,    setNotes]    = useState('');
  const [error,    setError]    = useState('');
  const [isAutofilling, setIsAutofilling] = useState(false);
  const [isSaving,      setIsSaving]      = useState(false);
  const backdropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setCompany(''); setRole(''); setLocation('');
      setCategory('');
      setStatus(defaultStatus);
      setDeadline(''); setNotes(''); setError('');
      setIsAutofilling(false); setIsSaving(false);
      setJobLink(initialJobLink || '');
      if (!isInstalled && hintCount < 3) incrementHintCount();
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (open) window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [open, onClose]);

  if (!open) return null;

  const isValidUrl = (url: string) => { try { new URL(url); return true; } catch { return false; } };

  const handleAutofill = async () => {
    if (!isValidUrl(jobLink)) { setError('有効なURLを入力してください。'); return; }
    capture('autofill_used');
    setIsAutofilling(true); setError('');
    try {
      const res  = await fetch('/api/parse', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: jobLink }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '自動入力に失敗しました');
      if (data.company)  setCompany(data.company);
      if (data.role)     setRole(data.role);
      if (data.location) setLocation(data.location);
      if (data.category) setCategory(data.category as Category);
      capture('autofill_success', { has_company: !!data.company, has_role: !!data.role });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '自動入力できませんでした。手動で入力してください。');
      capture('autofill_error');
    } finally {
      setIsAutofilling(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company.trim() || !role.trim()) { setError('企業名と職種は必須です。'); return; }
    setIsSaving(true); setError('');
    try {
      await onSave({ company: company.trim(), role: role.trim(), location: location.trim(), category, status, deadline: deadline || null, job_link: jobLink, notes });
      onClose();
    } catch {
      setError('保存に失敗しました。もう一度お試しください。');
      setIsSaving(false);
    }
  };

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center fade-in"
      style={{ background: 'rgba(0,0,0,0.4)' }}
      onClick={e => { if (e.target === backdropRef.current) onClose(); }}
    >
      <div
        className="bg-card-bg border border-border-gray w-full sm:max-w-md shadow-lg modal-enter max-h-[92vh] overflow-y-auto rounded-t-xl sm:rounded-xl"
        onClick={e => e.stopPropagation()}
        style={{ fontFamily: "'Noto Sans JP', sans-serif" }}
      >
        {/* Mobile drag handle */}
        <div className="w-8 h-1 bg-border-gray rounded-full mx-auto mt-3 mb-1 sm:hidden" />

        <div className="p-5">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-[15px] font-semibold" style={{ color: 'var(--brand-navy)', letterSpacing: '-0.01em' }}>
              選考を追加
            </h2>
            <button onClick={onClose} aria-label="閉じる" className="p-1 rounded hover:bg-surface-gray transition-colors" style={{ color: 'var(--muted-text)' }}>
              <X size={16} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {error && (
              <div className="text-[13px] px-3 py-2 rounded-md border bg-error-bg text-error-text border-error-border">
                {error}
              </div>
            )}

            {/* Job URL */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[13px] font-medium" style={{ color: 'var(--brand-navy)' }}>求人URL</label>
                <button
                  type="button"
                  onClick={handleAutofill}
                  disabled={!isValidUrl(jobLink) || isAutofilling}
                  className="text-[12px] font-medium px-2.5 py-1 rounded-md text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ background: 'var(--accent-blue)' }}
                >
                  {isAutofilling ? (
                    <span className="flex items-center gap-1">
                      <svg className="animate-spin" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                      取得中...
                    </span>
                  ) : <span className="flex items-center gap-1"><Sparkles size={11} />自動入力</span>}
                </button>
              </div>
              <input
                type="url"
                value={jobLink}
                onChange={e => setJobLink(e.target.value)}
                className={`${inputCls} ${isAutofilling ? 'opacity-50 pointer-events-none' : ''}`}
                placeholder="求人リンクを貼ると自動で入力されます →"
                autoFocus
              />
            </div>

            {/* Company */}
            <div>
              <label className="block text-[13px] font-medium mb-1" style={{ color: 'var(--brand-navy)' }}>
                企業名 <span className="text-error-text opacity-60">*</span>
              </label>
              {isAutofilling && !company ? (
                <div className="h-9 rounded-md animate-pulse" style={{ background: 'var(--surface-gray)' }} />
              ) : (
                <input type="text" value={company} onChange={e => setCompany(e.target.value)}
                  className={inputCls} placeholder="例：メルカリ、Recruit、DeNA" />
              )}
            </div>

            {/* Strength signal */}
            {company.trim() && role.trim() && (
              <StrengthSignal
                company={company}
                role={role}
                category={category || undefined}
                location={location || undefined}
                isPro={isPro}
                onUpgrade={onUpgrade}
              />
            )}

            {/* Role */}
            <div>
              <label className="block text-[13px] font-medium mb-1" style={{ color: 'var(--brand-navy)' }}>
                職種 <span className="text-error-text opacity-60">*</span>
              </label>
              {isAutofilling && !role ? (
                <div className="h-9 rounded-md animate-pulse" style={{ background: 'var(--surface-gray)' }} />
              ) : (
                <input type="text" value={role} onChange={e => setRole(e.target.value)}
                  className={inputCls} placeholder="例：エンジニア、マーケティング" />
              )}
            </div>

            {/* Location */}
            <div>
              <label className="block text-[13px] font-medium mb-1" style={{ color: 'var(--brand-navy)' }}>勤務地</label>
              {isAutofilling && !location ? (
                <div className="h-9 rounded-md animate-pulse" style={{ background: 'var(--surface-gray)' }} />
              ) : (
                <input type="text" value={location} onChange={e => setLocation(e.target.value)}
                  className={inputCls} placeholder="例：東京、リモート" />
              )}
            </div>

            {/* Category */}
            <div>
              <label className="block text-[13px] font-medium mb-2" style={{ color: 'var(--brand-navy)' }}>カテゴリ</label>
              {/* Mobile: horizontal scrollable pills */}
              <div className="flex gap-2 overflow-x-auto pb-1 sm:hidden" style={{ scrollbarWidth: 'none' }}>
                {JA_CATEGORIES.map(c => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setCategory(c.value)}
                    className="flex-shrink-0 px-3 py-1.5 rounded-full text-[12px] font-medium border transition-colors tap-compact min-h-0"
                    style={{
                      minHeight: 36,
                      background: category === c.value ? 'var(--accent-blue)' : 'var(--surface-gray)',
                      borderColor: category === c.value ? 'var(--accent-blue)' : 'var(--border-gray)',
                      color: category === c.value ? '#fff' : 'var(--muted-text)',
                    }}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
              {/* Desktop: select dropdown */}
              <select
                className={`hidden sm:block ${inputCls}`}
                value={category}
                onChange={e => setCategory(e.target.value as Category | '')}
              >
                <option value="">選択...</option>
                {JA_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="block text-[13px] font-medium mb-2" style={{ color: 'var(--brand-navy)' }}>選考ステータス</label>
              <div className="flex gap-2 overflow-x-auto pb-1 sm:hidden" style={{ scrollbarWidth: 'none' }}>
                {stages.map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStatus(s)}
                    className="flex-shrink-0 px-3 py-1.5 rounded-full text-[12px] font-medium border transition-colors tap-compact min-h-0"
                    style={{
                      minHeight: 36,
                      background: status === s ? 'var(--accent-blue)' : 'var(--surface-gray)',
                      borderColor: status === s ? 'var(--accent-blue)' : 'var(--border-gray)',
                      color: status === s ? '#fff' : 'var(--muted-text)',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
              <select
                className={`hidden sm:block ${inputCls}`}
                value={status}
                onChange={e => setStatus(e.target.value as PipelineStage)}
              >
                {stages.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            {/* Deadline */}
            <div>
              <label className="block text-[13px] font-medium mb-1" style={{ color: 'var(--brand-navy)' }}>締め切り</label>
              <input type="date" value={deadline} onChange={e => setDeadline(e.target.value)} className={inputCls} min={new Date().toISOString().split('T')[0]} />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-[13px] font-medium mb-1" style={{ color: 'var(--brand-navy)' }}>メモ</label>
              <input type="text" value={notes} onChange={e => setNotes(e.target.value)}
                className={inputCls} placeholder="簡単なメモ..." />
            </div>

            {/* Extension tip */}
            {!isInstalled && hintCount <= 3 && (
              <div style={{ borderTop: '1px solid var(--border-gray)', paddingTop: 12, marginTop: 4 }}>
                <p className="text-[11px]" style={{ color: 'var(--text-tertiary)', lineHeight: 1.5 }}>
                  ⚡ Applydの{' '}
                  <a
                    href="https://chromewebstore.google.com/detail/ggmjnghbacddpbgimenpickockijboao"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: 'var(--muted-text)', textDecoration: 'underline', textUnderlineOffset: 2 }}
                  >
                    ブラウザ拡張機能
                  </a>
                  {' '}を使えば、求人ページから直接自動で入力できます。
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={isSaving}
              className="w-full text-[15px] sm:text-[14px] font-semibold text-white rounded-xl sm:rounded-md transition-colors disabled:opacity-50 mt-2 active:opacity-80"
              style={{ background: 'var(--accent-blue)', minHeight: 52, height: 52 }}
            >
              {isSaving ? '保存中...' : '追加する'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
