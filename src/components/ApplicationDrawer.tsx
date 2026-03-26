'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Application, PipelineStage, Category } from '@/lib/types';
import { CATEGORIES } from '@/lib/constants';

interface ApplicationDrawerProps {
  application: Application | null;
  open: boolean;
  onClose: () => void;
  onUpdate: (id: string, updates: Partial<Application>) => void;
  onDelete: (id: string) => void;
  stages: PipelineStage[];
}

export default function ApplicationDrawer({ application, open, onClose, onUpdate, onDelete, stages }: ApplicationDrawerProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const backdropRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setShowDeleteConfirm(false);
  }, [application?.id]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (open) window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [open, onClose]);

  const debouncedUpdate = useCallback((field: string, value: string) => {
    if (!application) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      onUpdate(application.id, { [field]: value });
    }, 500);
  }, [application, onUpdate]);

  const immediateUpdate = useCallback((field: string, value: string) => {
    if (!application) return;
    onUpdate(application.id, { [field]: value });
  }, [application, onUpdate]);

  if (!open || !application) return null;

  const formatTimestamp = (ts: string) => {
    return new Date(ts).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit',
    });
  };

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-50 flex justify-end"
    >
      <div className="absolute inset-0 bg-brand-navy/20 backdrop" onClick={onClose} />
      <div className="w-full max-w-md bg-card-bg shadow-2xl h-full overflow-y-auto slide-in" onClick={(e) => e.stopPropagation()}>
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-brand-navy">Application Details</h2>
            <button onClick={onClose} className="text-muted-text hover:text-body-text p-1">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          <div className="space-y-4">
            {/* Company */}
            <div>
              <label className="block text-xs font-medium text-muted-text mb-1">Company</label>
              <input
                type="text"
                defaultValue={application.company}
                onChange={(e) => debouncedUpdate('company', e.target.value)}
                className="w-full px-3 py-2 border border-border-gray rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent-blue/30 focus:border-accent-blue transition-colors bg-background"
              />
            </div>

            {/* Role */}
            <div>
              <label className="block text-xs font-medium text-muted-text mb-1">Role</label>
              <input
                type="text"
                defaultValue={application.role}
                onChange={(e) => debouncedUpdate('role', e.target.value)}
                className="w-full px-3 py-2 border border-border-gray rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent-blue/30 focus:border-accent-blue transition-colors bg-background"
              />
            </div>

            {/* Category + Status */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-muted-text mb-1">Category</label>
                <select
                  defaultValue={application.category}
                  onChange={(e) => immediateUpdate('category', e.target.value)}
                  className="w-full px-3 py-2 border border-border-gray rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent-blue/30 focus:border-accent-blue transition-colors bg-background"
                >
                  <option value="">None</option>
                  {CATEGORIES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-text mb-1">Status</label>
                <select
                  defaultValue={application.status}
                  onChange={(e) => immediateUpdate('status', e.target.value)}
                  className="w-full px-3 py-2 border border-border-gray rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent-blue/30 focus:border-accent-blue transition-colors bg-background"
                >
                  {stages.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Deadline */}
            <div>
              <label className="block text-xs font-medium text-muted-text mb-1">Deadline</label>
              <input
                type="date"
                defaultValue={application.deadline || ''}
                onChange={(e) => immediateUpdate('deadline', e.target.value)}
                className="w-full px-3 py-2 border border-border-gray rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent-blue/30 focus:border-accent-blue transition-colors bg-background"
              />
            </div>

            {/* Job Link */}
            <div>
              <label className="block text-xs font-medium text-muted-text mb-1">Job posting link</label>
              <input
                type="url"
                defaultValue={application.job_link}
                onChange={(e) => debouncedUpdate('job_link', e.target.value)}
                className="w-full px-3 py-2 border border-border-gray rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent-blue/30 focus:border-accent-blue transition-colors bg-background"
                placeholder="https://..."
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-medium text-muted-text mb-1">Notes</label>
              <textarea
                defaultValue={application.notes}
                onChange={(e) => debouncedUpdate('notes', e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-border-gray rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent-blue/30 focus:border-accent-blue transition-colors resize-none bg-background"
                placeholder="Interview prep notes, salary info, etc."
              />
            </div>

            {/* Recruiter Contact */}
            <div className="border-t border-border-gray pt-4 mt-4">
              <h3 className="text-xs font-medium text-muted-text mb-3 uppercase tracking-wide">Recruiter Contact</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-muted-text mb-1">Name</label>
                  <input
                    type="text"
                    defaultValue={application.recruiter_name}
                    onChange={(e) => debouncedUpdate('recruiter_name', e.target.value)}
                    className="w-full px-3 py-2 border border-border-gray rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent-blue/30 focus:border-accent-blue transition-colors bg-background"
                    placeholder="Recruiter name"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-text mb-1">Email</label>
                  <input
                    type="email"
                    defaultValue={application.recruiter_email}
                    onChange={(e) => debouncedUpdate('recruiter_email', e.target.value)}
                    className="w-full px-3 py-2 border border-border-gray rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent-blue/30 focus:border-accent-blue transition-colors bg-background"
                    placeholder="recruiter@company.com"
                  />
                </div>
              </div>
            </div>

            {/* Timestamps */}
            <div className="border-t border-border-gray pt-4 mt-4">
              <div className="flex justify-between text-[11px] text-muted-text">
                <span>Created {formatTimestamp(application.created_at)}</span>
                <span>Updated {formatTimestamp(application.updated_at)}</span>
              </div>
            </div>

            {/* Delete */}
            <div className="border-t border-border-gray pt-4 mt-4">
              {!showDeleteConfirm ? (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="text-sm text-red-500 hover:text-red-600 transition-colors"
                >
                  Delete this application
                </button>
              ) : (
                <div className="bg-red-50 border border-red-100 rounded-lg p-3">
                  <p className="text-sm text-red-600 mb-2">Are you sure? This cannot be undone.</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => { onDelete(application.id); onClose(); }}
                      className="px-3 py-1.5 bg-red-500 text-white text-xs font-medium rounded-lg hover:bg-red-600 transition-colors"
                    >
                      Yes, delete
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      className="px-3 py-1.5 bg-card-bg text-body-text text-xs font-medium rounded-lg border border-border-gray hover:bg-surface-gray transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
