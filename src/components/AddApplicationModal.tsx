'use client';

import { useState, useEffect, useRef } from 'react';
import { PipelineStage, Category } from '@/lib/types';
import { CATEGORIES } from '@/lib/constants';
import { X, Sparkles } from 'lucide-react';
import { useExtensionStatus } from '@/lib/extension-status-context';
import { capture } from '@/lib/analytics';

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
}

const inputCls = [
  'w-full px-3 bg-background border border-border-gray rounded-md text-sm',
  'focus:outline-none focus:border-accent-blue focus:ring-2 focus:ring-accent-blue/20',
  'placeholder:text-text-tertiary transition-colors',
  'h-9',
].join(' ');

function guessCategory(role: string): Category | '' {
  const r = role.toLowerCase();
  if (/engineer|software|swe|dev|backend|frontend|fullstack|ml\b|data eng/.test(r)) return 'Engineering';
  if (/product manager|product mgr|\bpm\b/.test(r)) return 'Product Management';
  if (/design|ux\b|ui\b/.test(r)) return 'Design';
  if (/data sci|analyst|analytics|machine learn/.test(r)) return 'Data Science';
  if (/financ|invest|banking|equity|trader/.test(r)) return 'Finance';
  if (/consult/.test(r)) return 'Consulting';
  if (/market/.test(r)) return 'Marketing';
  if (/research|policy/.test(r)) return 'Research & Policy';
  return '';
}

export default function AddApplicationModal({ open, onClose, onSave, stages, initialJobLink }: AddApplicationModalProps) {
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
  const userPickedCategory = useRef(false);
  const backdropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setCompany(''); setRole(''); setLocation('');
      setCategory(''); userPickedCategory.current = false;
      setStatus(defaultStatus);
      setDeadline(''); setNotes(''); setError('');
      setIsAutofilling(false); setIsSaving(false);
      setJobLink(initialJobLink || '');
      if (!isInstalled && hintCount < 3) {
        incrementHintCount();
      }
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (open) window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [open, onClose]);

  // Auto-suggest category from role text if user hasn't manually picked one
  useEffect(() => {
    if (!role || userPickedCategory.current) return;
    const suggestion = guessCategory(role);
    if (suggestion) setCategory(suggestion);
  }, [role]);

  if (!open) return null;

  const isValidUrl = (url: string) => { try { new URL(url); return true; } catch { return false; } };

  const handleAutofill = async () => {
    if (!isValidUrl(jobLink)) { setError('Please enter a valid URL first.'); return; }
    capture('autofill_used');
    setIsAutofilling(true); setError('');
    try {
      const res  = await fetch('/api/parse', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: jobLink }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Autofill failed');
      if (data.company)  setCompany(data.company);
      if (data.role)     setRole(data.role);
      if (data.location) setLocation(data.location);
      if (data.category) { setCategory(data.category as Category); userPickedCategory.current = true; }
      capture('autofill_success', { has_company: !!data.company, has_role: !!data.role, has_location: !!data.location });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Could not autofill. Fill in manually.';
      setError(msg);
      capture('autofill_error');
    } finally {
      setIsAutofilling(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company.trim() || !role.trim()) { setError('Company and role are required.'); return; }
    setIsSaving(true); setError('');
    try {
      await onSave({ company: company.trim(), role: role.trim(), location: location.trim(), category, status, deadline: deadline || null, job_link: jobLink, notes });
      onClose();
    } catch {
      setError('Failed to save. Please try again.');
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
      >
        {/* Mobile drag handle */}
        <div className="w-8 h-1 bg-border-gray rounded-full mx-auto mt-3 mb-1 sm:hidden" />

        <div className="p-5">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-[15px] font-semibold" style={{ color: 'var(--brand-navy)', letterSpacing: '-0.01em' }}>
              Add Application
            </h2>
            <button onClick={onClose} aria-label="Close" className="p-1 rounded hover:bg-surface-gray transition-colors" style={{ color: 'var(--muted-text)' }}>
              <X size={16} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {error && (
              <div className="text-[13px] px-3 py-2 rounded-md border bg-error-bg text-error-text border-error-border">
                {error}
              </div>
            )}

            {/* Job URL — first field, most valuable feature */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[13px] font-medium" style={{ color: 'var(--brand-navy)' }}>Job posting URL</label>
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
                      Scanning…
                    </span>
                  ) : <span className="flex items-center gap-1"><Sparkles size={11} />Autofill</span>}
                </button>
              </div>
              <input
                type="url"
                value={jobLink}
                onChange={e => setJobLink(e.target.value)}
                className={`${inputCls} ${isAutofilling ? 'opacity-50 pointer-events-none' : ''}`}
                placeholder="Paste a job link to autofill →"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-[13px] font-medium mb-1" style={{ color: 'var(--brand-navy)' }}>
                Company <span className="text-error-text opacity-60">*</span>
              </label>
              {isAutofilling && !company ? (
                <div className="h-9 rounded-md animate-pulse" style={{ background: 'var(--surface-gray)' }} />
              ) : (
                <input id="modal-company" type="text" value={company} onChange={e => setCompany(e.target.value)}
                  className={inputCls} placeholder="e.g. Google" />
              )}
            </div>

            <div>
              <label className="block text-[13px] font-medium mb-1" style={{ color: 'var(--brand-navy)' }}>
                Role <span className="text-error-text opacity-60">*</span>
              </label>
              {isAutofilling && !role ? (
                <div className="h-9 rounded-md animate-pulse" style={{ background: 'var(--surface-gray)' }} />
              ) : (
                <input id="modal-role" type="text" value={role}
                  onChange={e => setRole(e.target.value)}
                  className={inputCls} placeholder="e.g. SWE Intern" />
              )}
            </div>

            <div>
              <label className="block text-[13px] font-medium mb-1" style={{ color: 'var(--brand-navy)' }}>Location</label>
              {isAutofilling && !location ? (
                <div className="h-9 rounded-md animate-pulse" style={{ background: 'var(--surface-gray)' }} />
              ) : (
                <input id="modal-location" type="text" value={location} onChange={e => setLocation(e.target.value)}
                  className={inputCls} placeholder="e.g. New York, NY" />
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[13px] font-medium mb-1" style={{ color: 'var(--brand-navy)' }}>Category</label>
                <select
                  value={category}
                  onChange={e => { userPickedCategory.current = true; setCategory(e.target.value as Category | ''); }}
                  className={inputCls}
                >
                  <option value="">Select…</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[13px] font-medium mb-1" style={{ color: 'var(--brand-navy)' }}>Status</label>
                <select value={status} onChange={e => setStatus(e.target.value as PipelineStage)} className={inputCls}>
                  {stages.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[13px] font-medium mb-1" style={{ color: 'var(--brand-navy)' }}>Deadline</label>
              <input type="date" value={deadline} onChange={e => setDeadline(e.target.value)} className={inputCls} min={new Date().toISOString().split('T')[0]} />
            </div>

            <div>
              <label className="block text-[13px] font-medium mb-1" style={{ color: 'var(--brand-navy)' }}>Notes</label>
              <input type="text" value={notes} onChange={e => setNotes(e.target.value)}
                className={inputCls} placeholder="Quick note…" />
            </div>

            {/* Extension tip — shows first 3 times the modal opens, then disappears */}
            {!isInstalled && hintCount <= 3 && (
              <div style={{ borderTop: '1px solid var(--border-gray)', paddingTop: 12, marginTop: 4 }}>
                <p className="text-[11px]" style={{ color: 'var(--text-tertiary)', lineHeight: 1.5 }}>
                  ⚡ Tip — use the{' '}
                  <a
                    href="https://chromewebstore.google.com/detail/applyd"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: 'var(--muted-text)', textDecoration: 'underline', textUnderlineOffset: 2 }}
                  >
                    Applyd extension
                  </a>
                  {' '}to fill this form automatically from any job posting.
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={isSaving}
              className="w-full h-9 text-[14px] font-medium text-white rounded-md transition-colors disabled:opacity-50 mt-1 hover:[background:var(--accent-blue-hover)]"
              style={{ background: 'var(--accent-blue)' }}
            >
              {isSaving ? 'Saving…' : 'Save Application'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
