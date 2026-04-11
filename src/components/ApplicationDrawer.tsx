'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Application, PipelineStage } from '@/lib/types';
import { CATEGORIES } from '@/lib/constants';
import { ExternalLink, X, Mail } from 'lucide-react';
import InterviewPrepPanel from '@/components/ai/InterviewPrepPanel';
import OfferIntelligencePanel from '@/components/ai/OfferIntelligencePanel';
import FollowUpEmailModal from '@/components/ai/FollowUpEmailModal';
import InterviewTimeline from '@/components/InterviewTimeline';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';

const inputCls = [
  'w-full px-3 bg-background border border-border-gray rounded-md text-sm',
  'focus:outline-none focus:border-accent-blue focus:ring-2 focus:ring-accent-blue/20',
  'placeholder:text-text-tertiary transition-colors',
  'h-9',
].join(' ');

interface ApplicationDrawerProps {
  application: Application | null;
  open: boolean;
  onClose: () => void;
  onUpdate: (id: string, updates: Partial<Application>) => void;
  onDelete: (id: string) => Promise<void>;
  stages: PipelineStage[];
  userId?: string;
  isPro?: boolean;
  onUpgrade?: () => void;
}

type SaveStatus = 'idle' | 'saving' | 'saved';

export default function ApplicationDrawer({ application, open, onClose, onUpdate, onDelete, stages, userId, isPro = false, onUpgrade = () => {} }: ApplicationDrawerProps) {
  const [showFollowUpEmail, setShowFollowUpEmail] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const backdropRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const touchStartXRef = useRef<number>(0);
  const touchStartYRef = useRef<number>(0);
  const reduce = useReducedMotion();

  useEffect(() => {
    setShowDeleteConfirm(false);
    setSaveStatus('idle');
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
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    setSaveStatus('idle');
    debounceRef.current = setTimeout(() => {
      setSaveStatus('saving');
      onUpdate(application.id, { [field]: value });
      saveTimerRef.current = setTimeout(() => {
        setSaveStatus('saved');
        saveTimerRef.current = setTimeout(() => setSaveStatus('idle'), 2000);
      }, 500);
    }, 1000);
  }, [application, onUpdate]);

  const immediateUpdate = useCallback((field: string, value: string) => {
    if (!application) return;
    setSaveStatus('saving');
    onUpdate(application.id, { [field]: value });
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      setSaveStatus('saved');
      saveTimerRef.current = setTimeout(() => setSaveStatus('idle'), 2000);
    }, 400);
  }, [application, onUpdate]);

  const isValidUrl = (url: string) => {
    try { new URL(url); return true; } catch { return false; }
  };

  const formatTimestamp = (ts: string) => {
    return new Date(ts).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit',
    });
  };

  const drawerSpring = reduce
    ? { duration: 0.01 }
    : { type: 'spring' as const, stiffness: 300, damping: 32, mass: 0.9 };

  return (
    <AnimatePresence>
      {open && application && (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-50 flex justify-end"
    >
      <motion.div
        className="absolute inset-0 bg-brand-navy/20 backdrop z-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18 }}
        onClick={onClose}
      />
      <motion.div
        className="relative z-10 w-full sm:max-w-md bg-card-bg h-full overflow-y-auto"
        style={{ boxShadow: '-12px 0 48px rgba(0,0,0,0.14)' }}
        initial={reduce ? { opacity: 0 } : { x: '100%', opacity: 0 }}
        animate={reduce ? { opacity: 1 } : { x: 0, opacity: 1 }}
        exit={reduce ? { opacity: 0 } : { x: '100%', opacity: 0 }}
        transition={drawerSpring}
        onClick={(e) => e.stopPropagation()}
        onTouchStart={(e) => {
          touchStartXRef.current = e.touches[0].clientX;
          touchStartYRef.current = e.touches[0].clientY;
        }}
        onTouchEnd={(e) => {
          const dx = e.changedTouches[0].clientX - touchStartXRef.current;
          const dy = e.changedTouches[0].clientY - touchStartYRef.current;
          const isRightSwipe = dx > 80 && Math.abs(dy) < Math.abs(dx);
          const isDownSwipe = dy > 80 && Math.abs(dx) < Math.abs(dy);
          if (isRightSwipe || isDownSwipe) onClose();
        }}
      >
        {/* Mobile drag handle */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden" aria-hidden>
          <div style={{ width: 32, height: 4, borderRadius: 99, background: 'var(--border-gray)' }} />
        </div>
        <div className="p-4 sm:p-6 pb-[calc(1rem+env(safe-area-inset-bottom))]">
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-[15px] font-semibold" style={{ color: 'var(--brand-navy)', letterSpacing: '-0.01em' }}>
              Application Details
            </h2>
            <div className="flex items-center gap-3">
              {userId && (
                <button
                  onClick={() => setShowFollowUpEmail(true)}
                  className="flex items-center gap-1 text-[12px] font-medium px-2 py-1 rounded-md border border-border-gray hover:bg-surface-gray transition-colors"
                  style={{ color: 'var(--brand-navy)' }}
                  title="AI Follow-Up Email"
                >
                  <Mail size={12} />
                  Email
                </button>
              )}
              {saveStatus === 'saving' && (
                <span className="text-[12px] flex items-center gap-1" style={{ color: 'var(--muted-text)' }}>
                  <svg className="animate-spin" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                  Saving
                </span>
              )}
              {saveStatus === 'saved' && (
                <span className="text-[12px] flex items-center gap-1" style={{ color: 'var(--green-success)' }}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  Saved
                </span>
              )}
              <button onClick={onClose} aria-label="Close" className="p-1 rounded hover:bg-surface-gray transition-colors" style={{ color: 'var(--muted-text)' }}>
                <X size={16} />
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {/* Company */}
            <div>
              <label className="block text-[13px] font-medium mb-1" style={{ color: 'var(--brand-navy)' }}>Company</label>
              <input
                type="text"
                defaultValue={application.company}
                onChange={(e) => debouncedUpdate('company', e.target.value)}
                className={inputCls}
              />
            </div>

            {/* Role */}
            <div>
              <label className="block text-[13px] font-medium mb-1" style={{ color: 'var(--brand-navy)' }}>Role</label>
              <input
                type="text"
                defaultValue={application.role}
                onChange={(e) => debouncedUpdate('role', e.target.value)}
                className={inputCls}
              />
            </div>

            {/* Location */}
            <div>
              <label className="block text-[13px] font-medium mb-1" style={{ color: 'var(--brand-navy)' }}>Location</label>
              <input
                type="text"
                defaultValue={application.location || ''}
                onChange={(e) => debouncedUpdate('location', e.target.value)}
                className={inputCls}
                placeholder="e.g. New York, NY"
              />
            </div>

            {/* Category + Status */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[13px] font-medium mb-1" style={{ color: 'var(--brand-navy)' }}>Category</label>
                <select
                  defaultValue={application.category}
                  onChange={(e) => immediateUpdate('category', e.target.value)}
                  className={inputCls}
                >
                  <option value="">None</option>
                  {CATEGORIES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[13px] font-medium mb-1" style={{ color: 'var(--brand-navy)' }}>Status</label>
                <select
                  defaultValue={application.status}
                  onChange={(e) => immediateUpdate('status', e.target.value)}
                  className={inputCls}
                >
                  {stages.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Deadline */}
            <div>
              <label className="block text-[13px] font-medium mb-1" style={{ color: 'var(--brand-navy)' }}>Deadline</label>
              <input
                type="date"
                defaultValue={application.deadline || ''}
                onChange={(e) => e.target.value ? immediateUpdate('deadline', e.target.value) : onUpdate(application.id, { deadline: null })}
                className={inputCls}
              />
            </div>

            {/* Job Link */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[13px] font-medium" style={{ color: 'var(--brand-navy)' }}>Job posting link</label>
                {application.job_link && isValidUrl(application.job_link) && (
                  <a
                    href={application.job_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-accent-blue hover:underline flex items-center gap-0.5"
                  >
                    Open <ExternalLink size={10} className="inline" />
                  </a>
                )}
              </div>
              <input
                type="url"
                defaultValue={application.job_link}
                onChange={(e) => debouncedUpdate('job_link', e.target.value)}
                className={inputCls}
                placeholder="https://..."
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-[13px] font-medium mb-1" style={{ color: 'var(--brand-navy)' }}>Notes</label>
              <textarea
                defaultValue={application.notes}
                onChange={(e) => debouncedUpdate('notes', e.target.value)}
                rows={4}
                className="w-full px-3 py-2 bg-background border border-border-gray rounded-md text-sm focus:outline-none focus:border-accent-blue focus:ring-2 focus:ring-accent-blue/20 placeholder:text-text-tertiary transition-colors resize-none"
                placeholder="Interview prep notes, salary info, etc."
              />
            </div>

            {/* Interview Timeline */}
            <InterviewTimeline
              steps={application.interview_steps || []}
              onUpdate={(steps) => onUpdate(application.id, { interview_steps: steps })}
            />

            {/* AI Panels */}
            {userId && (() => {
              const isOfferStage = application.status === 'Offer' || application.status === 'Offer — Negotiating';
              const isInterviewStage = /interview|recruiter screen|phone|final round|oa \//i.test(application.status);
              return (
                <div className="space-y-2">
                  {isOfferStage && (
                    <OfferIntelligencePanel
                      userId={userId}
                      applicationId={application.id}
                      company={application.company}
                      role={application.role}
                      category={application.category || undefined}
                      location={application.location || undefined}
                      isPro={isPro}
                      cached={(application.ai_offer_intelligence as Parameters<typeof OfferIntelligencePanel>[0]['cached']) ?? null}
                      onUpgrade={onUpgrade}
                    />
                  )}
                  {(isInterviewStage || isOfferStage) && (
                    <InterviewPrepPanel
                      userId={userId}
                      applicationId={application.id}
                      company={application.company}
                      role={application.role}
                      stage={application.status}
                      notes={application.notes || undefined}
                      isPro={isPro}
                      cached={(application.ai_interview_prep as Parameters<typeof InterviewPrepPanel>[0]['cached']) ?? null}
                      onUpgrade={onUpgrade}
                    />
                  )}
                </div>
              );
            })()}

            {/* Follow-Up Email Modal */}
            {showFollowUpEmail && userId && (
              <FollowUpEmailModal
                userId={userId}
                company={application.company}
                role={application.role}
                stage={application.status}
                recruiterName={application.recruiter_name || undefined}
                recruiterEmail={application.recruiter_email || undefined}
                notes={application.notes || undefined}
                isPro={isPro}
                onUpgrade={onUpgrade}
                onClose={() => setShowFollowUpEmail(false)}
              />
            )}

            {/* Recruiter Contact */}
            <div className="border-t border-border-gray pt-4 mt-4">
              <div className="flex items-center gap-2 mb-3">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--muted-text)' }}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                <h3 className="text-[13px] font-semibold" style={{ color: 'var(--brand-navy)' }}>Recruiter</h3>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-[13px] font-medium mb-1" style={{ color: 'var(--brand-navy)' }}>Name</label>
                  <input
                    type="text"
                    defaultValue={application.recruiter_name}
                    onChange={(e) => debouncedUpdate('recruiter_name', e.target.value)}
                    className={inputCls}
                    placeholder="Recruiter name"
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-medium mb-1" style={{ color: 'var(--brand-navy)' }}>Email</label>
                  <input
                    type="email"
                    defaultValue={application.recruiter_email}
                    onChange={(e) => debouncedUpdate('recruiter_email', e.target.value)}
                    className={inputCls}
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
                  className="text-sm text-error-text hover:opacity-80 transition-opacity"
                >
                  Delete this application
                </button>
              ) : (
                <div className="bg-error-bg border border-error-border rounded-lg p-3">
                  <p className="text-[13px] mb-2" style={{ color: 'var(--error-text)' }}>Remove this application? You&apos;ll have a moment to undo.</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => { onDelete(application.id); onClose(); }}
                      className="px-3 py-1.5 bg-red-500 text-white text-[12px] font-medium rounded-md hover:bg-red-600 transition-colors"
                    >
                      Yes, delete
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      className="px-3 py-1.5 text-[12px] font-medium rounded-md border border-border-gray transition-colors"
                      style={{ background: 'var(--card-bg)', color: 'var(--brand-navy)' }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
      )}
    </AnimatePresence>
  );
}
