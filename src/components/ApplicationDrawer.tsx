'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Application, PipelineStage, Tag } from '@/lib/types';
import { CATEGORIES } from '@/lib/constants';
import TagManager from '@/components/TagManager';
import OfferDetailsPanel from '@/components/OfferDetailsPanel';
import ContactLinkPanel from '@/components/ContactLinkPanel';
import { ExternalLink, X } from 'lucide-react';
import InterviewPrepPanel from '@/components/ai/InterviewPrepPanel';
import OfferIntelligencePanel from '@/components/ai/OfferIntelligencePanel';
import FollowUpEmailModal from '@/components/ai/FollowUpEmailModal';
import MockInterviewModal from '@/components/MockInterviewModal';
import InterviewTimeline from '@/components/InterviewTimeline';
import ESManager from '@/components/ja/ESManager';
import SPITracker from '@/components/ja/SPITracker';
import NaiteiManager from '@/components/ja/NaiteiManager';
import CompanyAvatar from '@/components/CompanyAvatar';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';

const inputCls = [
  'w-full px-3 bg-background border border-border-gray rounded-md text-sm',
  'focus:outline-none focus:border-accent-blue focus:ring-2 focus:ring-accent-blue/20',
  'placeholder:text-text-tertiary transition-colors',
  'h-9',
].join(' ');

// Stage variant → pill dot color CSS var
const STAGE_DOT: Record<string, string> = {
  'Wishlist':                   'var(--pill-neutral-dot)',
  'Applied':                    'var(--pill-slate-dot)',
  'OA / Online Assessment':     'var(--pill-indigo-dot)',
  'Phone / Recruiter Screen':   'var(--pill-violet-dot)',
  'Recruiter Screen':           'var(--pill-violet-dot)',
  'Final Round Interviews':     'var(--pill-amber-dot)',
  'Final Round':                'var(--pill-amber-dot)',
  'Technical / Case Interview': 'var(--pill-amber-dot)',
  'Offer':                      'var(--pill-green-dot)',
  'Offer — Negotiating':        'var(--pill-green-dot)',
  'Rejected':                   'var(--pill-red-dot)',
  'Declined':                   'var(--pill-neutral-dot)',
  'エントリー': 'var(--pill-neutral-dot)',
  '説明会':     'var(--pill-slate-dot)',
  'ES提出':     'var(--pill-indigo-dot)',
  'SPI':        'var(--pill-violet-dot)',
  '一次面接':   'var(--pill-violet-dot)',
  '二次面接':   'var(--pill-amber-dot)',
  '最終面接':   'var(--pill-amber-dot)',
  '内々定':     'var(--pill-green-dot)',
  '内定':       'var(--pill-green-dot)',
  '承諾':       'var(--pill-neutral-dot)',
};

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
  isShuukatsu?: boolean;
  allTags?: Tag[];
  onAllTagsChange?: (tags: Tag[]) => void;
  onTagsChange?: (applicationId: string, tags: Tag[]) => void;
}

type SaveStatus = 'idle' | 'saving' | 'saved';

export default function ApplicationDrawer({
  application, open, onClose, onUpdate, onDelete, stages,
  userId, isPro = false, onUpgrade = () => {}, isShuukatsu = false,
  allTags = [], onAllTagsChange, onTagsChange,
}: ApplicationDrawerProps) {
  const [showFollowUpEmail, setShowFollowUpEmail] = useState(false);
  const [showMockInterview, setShowMockInterview] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showInterviewPrep, setShowInterviewPrep] = useState(false);
  const [showCompanyDossier, setShowCompanyDossier] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const backdropRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const touchStartXRef = useRef<number>(0);
  const touchStartYRef = useRef<number>(0);
  const reduce = useReducedMotion();

  useEffect(() => {
    setShowDeleteConfirm(false);
    setShowInterviewPrep(false);
    setShowCompanyDossier(false);
    setSaveStatus('idle');
  }, [application?.id]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
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
    if (isShuukatsu) {
      return new Date(ts).toLocaleString('ja-JP', {
        year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
      });
    }
    return new Date(ts).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit',
    });
  };

  const drawerSpring = reduce
    ? { duration: 0.01 }
    : { type: 'spring' as const, stiffness: 300, damping: 32, mass: 0.9 };

  // Non-terminal stages for stepper
  const TERMINAL = new Set(['Rejected', 'Declined', 'Accepted', '承諾', '内定']);
  const stepperStages = stages.filter(s => !TERMINAL.has(s));

  return (
    <AnimatePresence>
      {open && application && (
        <div ref={backdropRef} className="fixed inset-0 z-50 flex justify-end">
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
              if ((dx > 80 && Math.abs(dy) < Math.abs(dx)) || (dy > 80 && Math.abs(dx) < Math.abs(dy))) onClose();
            }}
          >
            {/* Mobile drag handle */}
            <div className="flex justify-center pt-3 pb-1 sm:hidden" aria-hidden>
              <div style={{ width: 32, height: 4, borderRadius: 99, background: 'var(--border-gray)' }} />
            </div>

            <div className="p-4 sm:p-6 pb-[calc(1rem+env(safe-area-inset-bottom))]">
              {/* Header */}
              <div className="flex items-start gap-3 mb-5">
                <CompanyAvatar company={application.company} size={44} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 600, letterSpacing: '-0.01em', color: 'var(--brand-navy)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {application.company}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--muted-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {application.role}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                  {saveStatus === 'saving' && (
                    <span style={{ fontSize: 11, color: 'var(--muted-text)', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <svg className="animate-spin" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                      {isShuukatsu ? '保存中' : 'Saving'}
                    </span>
                  )}
                  {saveStatus === 'saved' && (
                    <span style={{ fontSize: 11, color: 'var(--green-success)', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                      {isShuukatsu ? '保存済み' : 'Saved'}
                    </span>
                  )}
                  <button onClick={onClose} aria-label="Close" className="p-1 rounded hover:bg-surface-gray transition-colors" style={{ color: 'var(--muted-text)' }}>
                    <X size={16} />
                  </button>
                </div>
              </div>

              {/* Stage stepper */}
              {!isShuukatsu && (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: `repeat(${stepperStages.length}, 1fr)`,
                  gap: 4,
                  marginBottom: 20,
                }}>
                  {stepperStages.map(stage => {
                    const isActive = application.status === stage;
                    const dot = STAGE_DOT[stage] ?? 'var(--pill-neutral-dot)';
                    return (
                      <button
                        key={stage}
                        onClick={() => immediateUpdate('status', stage)}
                        title={stage}
                        style={{
                          padding: '7px 4px 6px',
                          borderRadius: 6,
                          border: 'none',
                          background: isActive ? 'var(--bg-soft)' : 'transparent',
                          cursor: 'pointer',
                          fontFamily: 'inherit',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: 4,
                          position: 'relative',
                          overflow: 'hidden',
                          transition: 'background 0.12s',
                        }}
                        onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-soft)'; }}
                        onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
                      >
                        {/* Colored bar at top */}
                        <div style={{
                          position: 'absolute', top: 0, left: 0, right: 0,
                          height: 2,
                          background: isActive ? dot : 'var(--border-gray)',
                          borderRadius: '6px 6px 0 0',
                          transition: 'background 0.12s',
                        }} />
                        <span style={{
                          fontSize: 9,
                          fontWeight: isActive ? 600 : 400,
                          color: isActive ? 'var(--brand-navy)' : 'var(--muted-text)',
                          letterSpacing: '0.01em',
                          textAlign: 'center',
                          lineHeight: 1.2,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          maxWidth: '100%',
                        }}>
                          {stage.replace(' / Online Assessment', '').replace(' / Recruiter Screen', '').replace(' Interviews', '').replace(' — Negotiating', '')}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              <div className="space-y-4" style={{ fontFamily: isShuukatsu ? "'Noto Sans JP', sans-serif" : undefined }}>
                {/* Metadata grid — company, role, location, category */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label className="block text-[12px] font-medium mb-1" style={{ color: 'var(--muted-text)' }}>{isShuukatsu ? '企業名' : 'Company'}</label>
                    <input type="text" defaultValue={application.company} onChange={(e) => debouncedUpdate('company', e.target.value)} className={inputCls} />
                  </div>
                  <div>
                    <label className="block text-[12px] font-medium mb-1" style={{ color: 'var(--muted-text)' }}>{isShuukatsu ? '職種' : 'Role'}</label>
                    <input type="text" defaultValue={application.role} onChange={(e) => debouncedUpdate('role', e.target.value)} className={inputCls} />
                  </div>
                  <div>
                    <label className="block text-[12px] font-medium mb-1" style={{ color: 'var(--muted-text)' }}>{isShuukatsu ? '勤務地' : 'Location'}</label>
                    <input type="text" defaultValue={application.location || ''} onChange={(e) => debouncedUpdate('location', e.target.value)} className={inputCls} placeholder={isShuukatsu ? '例：東京' : 'e.g. New York'} />
                  </div>
                  <div>
                    <label className="block text-[12px] font-medium mb-1" style={{ color: 'var(--muted-text)' }}>{isShuukatsu ? 'カテゴリ' : 'Category'}</label>
                    <select defaultValue={application.category} onChange={(e) => immediateUpdate('category', e.target.value)} className={inputCls}>
                      <option value="">{isShuukatsu ? 'なし' : 'None'}</option>
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>

                {/* Deadline + Job link */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label className="block text-[12px] font-medium mb-1" style={{ color: 'var(--muted-text)' }}>{isShuukatsu ? '締め切り' : 'Deadline'}</label>
                    <input type="date" defaultValue={application.deadline || ''} onChange={(e) => e.target.value ? immediateUpdate('deadline', e.target.value) : onUpdate(application.id, { deadline: null })} className={inputCls} />
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                      <label className="block text-[12px] font-medium" style={{ color: 'var(--muted-text)' }}>{isShuukatsu ? '求人URL' : 'Job link'}</label>
                      {application.job_link && isValidUrl(application.job_link) && (
                        <a href={application.job_link} target="_blank" rel="noopener noreferrer" className="text-xs text-accent-blue hover:underline flex items-center gap-0.5">
                          {isShuukatsu ? '開く' : 'Open'} <ExternalLink size={10} className="inline" />
                        </a>
                      )}
                    </div>
                    <input type="url" defaultValue={application.job_link} onChange={(e) => debouncedUpdate('job_link', e.target.value)} className={inputCls} placeholder="https://..." />
                  </div>
                </div>

                {/* Shuukatsu status select (only shown in shuukatsu mode since no stepper) */}
                {isShuukatsu && (
                  <div>
                    <label className="block text-[12px] font-medium mb-1" style={{ color: 'var(--muted-text)' }}>ステータス</label>
                    <select defaultValue={application.status} onChange={(e) => immediateUpdate('status', e.target.value)} className={inputCls}>
                      {stages.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                )}

                {/* Notes */}
                <div>
                  <label className="block text-[12px] font-medium mb-1" style={{ color: 'var(--muted-text)' }}>{isShuukatsu ? 'メモ' : 'Notes'}</label>
                  <textarea
                    defaultValue={application.notes}
                    onChange={(e) => debouncedUpdate('notes', e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 bg-background border border-border-gray rounded-md text-sm focus:outline-none focus:border-accent-blue focus:ring-2 focus:ring-accent-blue/20 placeholder:text-text-tertiary transition-colors resize-none"
                    placeholder={isShuukatsu ? '面接メモ・志望理由など' : 'Interview prep notes, salary info, etc.'}
                  />
                </div>

                {/* Coach section */}
                {userId && (
                  <div style={{
                    border: '1px solid var(--border-gray)',
                    borderRadius: 10,
                    overflow: 'hidden',
                  }}>
                    <div style={{
                      padding: '10px 14px',
                      background: 'var(--bg-soft)',
                      borderBottom: '1px solid var(--border-gray)',
                      display: 'flex', alignItems: 'center', gap: 7,
                    }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--accent-blue)', flexShrink: 0 }}><path d="M12 2a10 10 0 1 0 10 10"/><path d="M12 12V7"/><path d="M17 2v5h5"/></svg>
                      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--brand-navy)', letterSpacing: '-0.01em' }}>Coach</span>
                      {!isPro && (
                        <span style={{ marginLeft: 'auto', fontSize: 10, fontWeight: 600, padding: '2px 6px', borderRadius: 4, background: 'rgba(37,99,235,0.1)', color: 'var(--accent-blue)' }}>Pro</span>
                      )}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, background: 'var(--border-gray)' }}>
                      {[
                        {
                          icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>,
                          label: isShuukatsu ? 'メール' : 'Follow-up email',
                          action: () => isPro ? setShowFollowUpEmail(true) : onUpgrade(),
                        },
                        {
                          icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>,
                          label: isShuukatsu ? '面接対策' : 'Interview prep',
                          action: () => isPro ? setShowInterviewPrep(v => !v) : onUpgrade(),
                        },
                        {
                          icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>,
                          label: isShuukatsu ? '会社情報' : 'Company dossier',
                          action: () => isPro ? setShowCompanyDossier(v => !v) : onUpgrade(),
                        },
                        {
                          icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/><line x1="8" y1="22" x2="16" y2="22"/></svg>,
                          label: isShuukatsu ? '模擬面接' : 'Mock interview',
                          action: () => isPro ? setShowMockInterview(true) : onUpgrade(),
                        },
                      ].map(({ icon, label, action }) => (
                        <button
                          key={label}
                          onClick={action}
                          style={{
                            padding: '11px 12px',
                            background: 'var(--bg)',
                            border: 'none',
                            cursor: 'pointer',
                            fontFamily: 'inherit',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 7,
                            fontSize: 12,
                            fontWeight: 500,
                            color: 'var(--brand-navy)',
                            textAlign: 'left',
                            transition: 'background 0.1s',
                          }}
                          onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-soft)'}
                          onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg)'}
                        >
                          <span style={{ color: 'var(--muted-text)', flexShrink: 0 }}>{icon}</span>
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Interview prep panel (expanded) */}
                {showInterviewPrep && userId && (
                  <InterviewPrepPanel
                    applicationId={application.id}
                    company={application.company}
                    role={application.role}
                    stage={application.status}
                    notes={application.notes || undefined}
                    jobLink={application.job_link || undefined}
                    isPro={isPro}
                    cached={(application.ai_interview_prep as Parameters<typeof InterviewPrepPanel>[0]['cached']) ?? null}
                    onUpgrade={onUpgrade}
                    isShuukatsu={isShuukatsu}
                  />
                )}

                {/* Company dossier panel (expanded) */}
                {showCompanyDossier && userId && (
                  <OfferIntelligencePanel
                    applicationId={application.id}
                    company={application.company}
                    role={application.role}
                    category={application.category || undefined}
                    location={application.location || undefined}
                    isPro={isPro}
                    cached={(application.ai_offer_intelligence as Parameters<typeof OfferIntelligencePanel>[0]['cached']) ?? null}
                    onUpgrade={onUpgrade}
                    isShuukatsu={isShuukatsu}
                  />
                )}

                {/* Interview Timeline */}
                <InterviewTimeline
                  steps={application.interview_steps || []}
                  onUpdate={(steps) => onUpdate(application.id, { interview_steps: steps })}
                  isShuukatsu={isShuukatsu}
                />

                {/* Offer Details Panel — EN only, offer stages */}
                {!isShuukatsu && ['Offer', 'Offer — Negotiating', 'Accepted'].includes(application.status) && (
                  <OfferDetailsPanel
                    application={application}
                    onUpdate={updates => onUpdate(application.id, updates)}
                  />
                )}

                {/* Shuukatsu Pro panels */}
                {isShuukatsu && application && (
                  <>
                    <ESManager
                      applicationId={application.id}
                      initialContent={(application as Application & { es_content?: { motivation: string; selfPR: string; gakuchika: string; other: string } }).es_content ?? null}
                      isPro={isPro}
                    />
                    <SPITracker
                      applicationId={application.id}
                      initialData={(application as Application & { spi_result?: unknown }).spi_result as Parameters<typeof SPITracker>[0]['initialData']}
                      isPro={isPro}
                    />
                    <NaiteiManager
                      applicationId={application.id}
                      stage={application.status}
                      initialData={(application as Application & { naitei_details?: { offerDate: string; acceptanceDeadline: string; conditions: string; department: string; compensation: string; comparisonNotes: string } }).naitei_details ?? null}
                      isPro={isPro}
                    />
                  </>
                )}

                {/* Follow-Up Email Modal */}
                {showFollowUpEmail && userId && (
                  <FollowUpEmailModal
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

                {/* Mock Interview Modal */}
                {showMockInterview && userId && (
                  <MockInterviewModal
                    company={application.company}
                    role={application.role}
                    notes={application.notes || undefined}
                    applicationId={application.id}
                    isPro={isPro}
                    onClose={() => setShowMockInterview(false)}
                    onUpgrade={() => { setShowMockInterview(false); onUpgrade(); }}
                  />
                )}

                {/* Recruiter Contact */}
                <div className="border-t border-border-gray pt-4 mt-4">
                  <div className="flex items-center gap-2 mb-3">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--muted-text)' }}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    <h3 className="text-[13px] font-semibold" style={{ color: 'var(--brand-navy)' }}>{isShuukatsu ? '採用担当者' : 'Recruiter'}</h3>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[12px] font-medium mb-1" style={{ color: 'var(--muted-text)' }}>{isShuukatsu ? '担当者名' : 'Name'}</label>
                      <input type="text" defaultValue={application.recruiter_name} onChange={(e) => debouncedUpdate('recruiter_name', e.target.value)} className={inputCls} placeholder={isShuukatsu ? '採用担当者名' : 'Recruiter name'} />
                    </div>
                    <div>
                      <label className="block text-[12px] font-medium mb-1" style={{ color: 'var(--muted-text)' }}>{isShuukatsu ? 'メールアドレス' : 'Email'}</label>
                      <input type="email" defaultValue={application.recruiter_email} onChange={(e) => debouncedUpdate('recruiter_email', e.target.value)} className={inputCls} placeholder="recruiter@company.com" />
                    </div>
                  </div>
                </div>

                {/* Tags */}
                {onTagsChange && (
                  <div className="border-t border-border-gray pt-4 mt-4">
                    <div className="flex items-center gap-2 mb-2">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--muted-text)' }}><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
                      <h3 className="text-[13px] font-semibold" style={{ color: 'var(--brand-navy)' }}>Tags</h3>
                    </div>
                    <TagManager
                      applicationId={application.id}
                      appliedTags={application.tags ?? []}
                      allTags={allTags}
                      onTagsChange={tags => onTagsChange(application.id, tags)}
                      onAllTagsChange={onAllTagsChange ?? (() => {})}
                    />
                  </div>
                )}

                {/* Contacts linked to this application */}
                {userId && (
                  <div className="border-t border-border-gray pt-4 mt-4">
                    <ContactLinkPanel applicationId={application.id} applications={[]} />
                  </div>
                )}

                {/* Timestamps */}
                <div className="border-t border-border-gray pt-4 mt-4">
                  <div className="flex justify-between text-[11px] text-muted-text">
                    <span>{isShuukatsu ? `作成日: ${formatTimestamp(application.created_at)}` : `Created ${formatTimestamp(application.created_at)}`}</span>
                    <span>{isShuukatsu ? `更新日: ${formatTimestamp(application.updated_at)}` : `Updated ${formatTimestamp(application.updated_at)}`}</span>
                  </div>
                </div>

                {/* Delete */}
                <div className="border-t border-border-gray pt-4 mt-4">
                  {!showDeleteConfirm ? (
                    <button onClick={() => setShowDeleteConfirm(true)} className="text-sm text-error-text hover:opacity-80 transition-opacity">
                      {isShuukatsu ? 'この選考を削除' : 'Delete this application'}
                    </button>
                  ) : (
                    <div className="bg-error-bg border border-error-border rounded-lg p-3">
                      <p className="text-[13px] mb-2" style={{ color: 'var(--error-text)' }}>
                        {isShuukatsu ? 'この選考を削除しますか？' : "Remove this application? You'll have a moment to undo."}
                      </p>
                      <div className="flex gap-2">
                        <button onClick={() => { onDelete(application.id); onClose(); }} className="px-3 py-1.5 bg-red-500 text-white text-[12px] font-medium rounded-md hover:bg-red-600 transition-colors">
                          {isShuukatsu ? '削除する' : 'Yes, delete'}
                        </button>
                        <button onClick={() => setShowDeleteConfirm(false)} className="px-3 py-1.5 text-[12px] font-medium rounded-md border border-border-gray transition-colors" style={{ background: 'var(--card-bg)', color: 'var(--brand-navy)' }}>
                          {isShuukatsu ? 'キャンセル' : 'Cancel'}
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
