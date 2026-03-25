'use client';

import { useState, useEffect, useRef } from 'react';
import { PipelineStage, Category, Application } from '@/lib/types';
import { CATEGORIES } from '@/lib/constants';

interface AddApplicationModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: {
    company: string;
    role: string;
    category: Category | '';
    status: PipelineStage;
    deadline: string | null;
    job_link: string;
    notes: string;
  }) => void;
  stages: PipelineStage[];
}

export default function AddApplicationModal({ open, onClose, onSave, stages }: AddApplicationModalProps) {
  const [company, setCompany] = useState('');
  const [role, setRole] = useState('');
  const [category, setCategory] = useState<Category | ''>('');
  const [status, setStatus] = useState<PipelineStage>(stages[0]);
  const [deadline, setDeadline] = useState('');
  const [jobLink, setJobLink] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const backdropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setCompany('');
      setRole('');
      setCategory('');
      setStatus(stages[0]);
      setDeadline('');
      setJobLink('');
      setNotes('');
      setError('');
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!company.trim() || !role.trim()) {
      setError('Company and role are required');
      return;
    }
    onSave({
      company: company.trim(),
      role: role.trim(),
      category,
      status,
      deadline: deadline || null,
      job_link: jobLink,
      notes,
    });
    onClose();
  };

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop p-4 fade-in"
      onClick={(e) => { if (e.target === backdropRef.current) onClose(); }}
    >
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl modal-enter" onClick={(e) => e.stopPropagation()}>
        <div className="p-6">
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
                className="w-full px-3 py-2 border border-border-gray rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent-blue/30 focus:border-accent-blue transition-colors"
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
                className="w-full px-3 py-2 border border-border-gray rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent-blue/30 focus:border-accent-blue transition-colors"
                placeholder="e.g. SWE Intern"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="modal-category" className="block text-sm font-medium text-body-text mb-1">Category</label>
                <select
                  id="modal-category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value as Category | '')}
                  className="w-full px-3 py-2 border border-border-gray rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent-blue/30 focus:border-accent-blue transition-colors bg-white"
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
                  className="w-full px-3 py-2 border border-border-gray rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent-blue/30 focus:border-accent-blue transition-colors bg-white"
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
                className="w-full px-3 py-2 border border-border-gray rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent-blue/30 focus:border-accent-blue transition-colors"
              />
            </div>

            <div>
              <label htmlFor="modal-link" className="block text-sm font-medium text-body-text mb-1">Job posting link</label>
              <input
                id="modal-link"
                type="url"
                value={jobLink}
                onChange={(e) => setJobLink(e.target.value)}
                className="w-full px-3 py-2 border border-border-gray rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent-blue/30 focus:border-accent-blue transition-colors"
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
                className="w-full px-3 py-2 border border-border-gray rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent-blue/30 focus:border-accent-blue transition-colors"
                placeholder="Quick note..."
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-accent-blue text-white text-sm font-medium rounded-lg hover:bg-accent-blue/90 transition-colors mt-2"
            >
              Save Application
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
