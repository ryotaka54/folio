'use client';

import { useState, useEffect, useRef } from 'react';
import { PipelineStage, Category } from '@/lib/types';
import { CATEGORIES } from '@/lib/constants';

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
}

export default function AddApplicationModal({ open, onClose, onSave, stages }: AddApplicationModalProps) {
  const [company, setCompany] = useState('');
  const [role, setRole] = useState('');
  const [location, setLocation] = useState('');
  const [category, setCategory] = useState<Category | ''>('');
  const [status, setStatus] = useState<PipelineStage>(stages.includes('Applied' as PipelineStage) ? 'Applied' as PipelineStage : stages[0]);
  const [deadline, setDeadline] = useState('');
  const [jobLink, setJobLink] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [isAutofilling, setIsAutofilling] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const backdropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setCompany('');
      setRole('');
      setLocation('');
      setCategory('');
      setStatus(stages.includes('Applied' as PipelineStage) ? 'Applied' as PipelineStage : stages[0]);
      setDeadline('');
      setJobLink('');
      setNotes('');
      setError('');
      setIsAutofilling(false);
      setIsSaving(false);
    }
  }, [open, stages]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (open) window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [open, onClose]);

  if (!open) return null;

  const isValidUrl = (url: string) => {
    try { new URL(url); return true; } catch { return false; }
  };

  const handleAutofill = async () => {
    if (!isValidUrl(jobLink)) {
      setError('Please enter a valid URL before autofilling.');
      return;
    }
    setIsAutofilling(true);
    setError('');
    try {
      const res = await fetch('/api/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: jobLink }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Autofill failed');
      }
      if (data.company) setCompany(data.company);
      if (data.role) setRole(data.role);
      if (data.location) setLocation(data.location);
      if (data.category) setCategory(data.category as Category);
    } catch (e: any) {
      setError(e.message || 'Could not autofill from this URL. Please fill in manually.');
    } finally {
      setIsAutofilling(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company.trim() || !role.trim()) {
      setError('Company and role are required');
      return;
    }
    setIsSaving(true);
    setError('');
    try {
      await onSave({
        company: company.trim(),
        role: role.trim(),
        location: location.trim(),
        category,
        status,
        deadline: deadline || null,
        job_link: jobLink,
        notes,
      });
      onClose();
    } catch {
      setError('Failed to save application. Please try again.');
      setIsSaving(false);
    }
  };

  const showAutofill = isValidUrl(jobLink) && !isAutofilling;

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/30 backdrop fade-in"
      onClick={(e) => { if (e.target === backdropRef.current) onClose(); }}
    >
      <div className="bg-card-bg rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md shadow-xl modal-enter max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="p-5 sm:p-6">
          {/* Drag handle for mobile */}
          <div className="w-10 h-1 bg-border-gray rounded-full mx-auto mb-4 sm:hidden" />
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold text-brand-navy">Add Application</h2>
            <button onClick={onClose} className="text-muted-text hover:text-body-text p-1">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 text-red-600 text-sm px-3 py-2 rounded-lg border border-red-100">{error}</div>
            )}

            <div>
              <label htmlFor="modal-company" className="block text-sm font-medium text-body-text mb-1">
                Company <span className="text-red-400">*</span>
              </label>
              <input
                id="modal-company"
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="w-full px-3 py-2.5 sm:py-2 border border-border-gray rounded-lg text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-accent-blue/30 focus:border-accent-blue transition-colors bg-background"
                placeholder="e.g. Google"
                autoFocus
              />
            </div>

            <div>
              <label htmlFor="modal-role" className="block text-sm font-medium text-body-text mb-1">
                Role <span className="text-red-400">*</span>
              </label>
              <input
                id="modal-role"
                type="text"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-3 py-2.5 sm:py-2 border border-border-gray rounded-lg text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-accent-blue/30 focus:border-accent-blue transition-colors bg-background"
                placeholder="e.g. SWE Intern"
              />
            </div>

            <div>
              <label htmlFor="modal-location" className="block text-sm font-medium text-body-text mb-1">Location</label>
              <input
                id="modal-location"
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-3 py-2.5 sm:py-2 border border-border-gray rounded-lg text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-accent-blue/30 focus:border-accent-blue transition-colors bg-background"
                placeholder="e.g. New York, NY"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="modal-category" className="block text-sm font-medium text-body-text mb-1">Category</label>
                <select
                  id="modal-category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value as Category | '')}
                  className="w-full px-3 py-2.5 sm:py-2 border border-border-gray rounded-lg text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-accent-blue/30 focus:border-accent-blue transition-colors bg-background"
                >
                  <option value="">Select...</option>
                  {CATEGORIES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="modal-status" className="block text-sm font-medium text-body-text mb-1">Status</label>
                <select
                  id="modal-status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as PipelineStage)}
                  className="w-full px-3 py-2.5 sm:py-2 border border-border-gray rounded-lg text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-accent-blue/30 focus:border-accent-blue transition-colors bg-background"
                >
                  {stages.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="modal-deadline" className="block text-sm font-medium text-body-text mb-1">Deadline</label>
              <input
                id="modal-deadline"
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full px-3 py-2.5 sm:py-2 border border-border-gray rounded-lg text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-accent-blue/30 focus:border-accent-blue transition-colors bg-background"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="modal-link" className="block text-sm font-medium text-body-text">Job posting link</label>
                {showAutofill && (
                  <button
                    type="button"
                    onClick={handleAutofill}
                    className="text-xs font-medium text-accent-blue hover:text-accent-blue/80 transition-colors flex items-center gap-1"
                  >
                    ✨ Autofill details
                  </button>
                )}
                {isAutofilling && (
                  <span className="text-xs text-muted-text flex items-center gap-1">
                    <svg className="animate-spin" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                    Scanning...
                  </span>
                )}
              </div>
              <input
                id="modal-link"
                type="url"
                value={jobLink}
                onChange={(e) => setJobLink(e.target.value)}
                className={`w-full px-3 py-2.5 sm:py-2 border border-border-gray rounded-lg text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-accent-blue/30 focus:border-accent-blue transition-colors bg-background ${isAutofilling ? 'opacity-50 pointer-events-none' : ''}`}
                placeholder="https://..."
              />
            </div>

            <div>
              <label htmlFor="modal-notes" className="block text-sm font-medium text-body-text mb-1">Notes</label>
              <input
                id="modal-notes"
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2.5 sm:py-2 border border-border-gray rounded-lg text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-accent-blue/30 focus:border-accent-blue transition-colors bg-background"
                placeholder="Quick note..."
              />
            </div>

            <button
              type="submit"
              disabled={isSaving}
              className="w-full py-2.5 bg-accent-blue text-white text-sm font-medium rounded-lg hover:bg-accent-blue/90 transition-colors mt-2 disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Save Application'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
