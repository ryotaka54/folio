'use client';

import { useState, useEffect, useRef, useCallback, ReactNode, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTheme } from 'next-themes';
import { Logo } from '@/components/Logo';
import { ProLogo } from '@/components/ProLogo';
import ThemeToggle from '@/components/ThemeToggle';
import LocaleSwitcher from '@/components/LocaleSwitcher';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { SCHOOL_YEARS, CAREER_LEVELS, RECRUITING_SEASONS, AI_FREE_DAILY_LIMIT, AI_PRO_DAILY_LIMIT } from '@/lib/constants';
import { isPro, FREE_TIER_LIMIT } from '@/lib/pro';
import UpgradeModal from '@/components/UpgradeModal';
import ReferralCard from '@/components/ReferralCard';

// ─── Section types ────────────────────────────────────────────────────────────

type Section = 'profile' | 'recruiting' | 'ai' | 'appearance' | 'account' | 'referrals' | 'data' | 'danger';

interface SectionMeta { id: Section; label: string; icon: ReactNode; danger?: boolean }

// ─── SVG icons ────────────────────────────────────────────────────────────────

const UserIcon = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
const BriefcaseIcon = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>;
const PaletteIcon = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="13.5" cy="6.5" r=".5"/><circle cx="17.5" cy="10.5" r=".5"/><circle cx="8.5" cy="7.5" r=".5"/><circle cx="6.5" cy="12.5" r=".5"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/></svg>;
const ShieldIcon = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>;

const TrashIcon = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>;
const DownloadIcon = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>;
const CheckIcon = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>;
const GearIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>;

export { GearIcon };

// ─── Sections list ────────────────────────────────────────────────────────────

const SECTIONS: SectionMeta[] = [
  { id: 'profile', label: 'Profile', icon: <UserIcon /> },
  { id: 'recruiting', label: 'Recruiting', icon: <BriefcaseIcon /> },
  { id: 'ai', label: 'AI Features', icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg> },
  { id: 'appearance', label: 'Appearance', icon: <PaletteIcon /> },
  { id: 'account', label: 'Account', icon: <ShieldIcon /> },
  { id: 'referrals', label: 'Referrals', icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg> },
  { id: 'data', label: 'Export Data', icon: <DownloadIcon /> },

  { id: 'danger', label: 'Danger Zone', icon: <TrashIcon />, danger: true },
];

// ─── Shared small components ──────────────────────────────────────────────────

function Toggle({ checked, onChange, disabled }: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      style={{ flexShrink: 0 }}
      className={`relative inline-flex h-5 w-9 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-accent-blue/30 ${checked ? 'bg-accent-blue' : 'bg-border-emphasis'} ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
    >
      <span className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${checked ? 'translate-x-4' : 'translate-x-0'}`} />
    </button>
  );
}

function Chip({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 h-8 rounded-md text-[13px] font-medium border transition-colors ${selected ? 'bg-accent-blue border-accent-blue text-white' : 'bg-background border-border-gray text-muted-text hover:border-accent-blue/40'}`}
    >
      {label}
    </button>
  );
}

function SavedIndicator({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <span className="inline-flex items-center gap-1 text-[12px] fade-in" style={{ color: 'var(--green-success)' }}>
      <CheckIcon /> Saved
    </span>
  );
}

function FieldLabel({ children }: { children: ReactNode }) {
  return <label className="block text-[12px] font-medium mb-1.5" style={{ color: 'var(--muted-text)' }}>{children}</label>;
}

function SectionCard({ title, description, children, danger }: { title?: string; description?: string; children: ReactNode; danger?: boolean }) {
  return (
    <div
      className="rounded-lg p-5 mb-4"
      style={{
        background: danger ? 'rgba(220,38,38,0.03)' : 'var(--card-bg)',
        border: `1px solid ${danger ? 'rgba(220,38,38,0.2)' : 'var(--border-gray)'}`,
      }}
    >
      {title && <p className="text-[14px] font-semibold mb-1" style={{ color: danger ? '#DC2626' : 'var(--brand-navy)' }}>{title}</p>}
      {description && <p className="text-[13px] mb-4" style={{ color: 'var(--muted-text)' }}>{description}</p>}
      {children}
    </div>
  );
}

function input(extra = '') {
  return `w-full h-9 px-3 rounded-md text-[13px] border transition-colors focus:outline-none focus:ring-2 focus:ring-accent-blue/20 focus:border-accent-blue bg-background border-border-gray ${extra}`;
}

// ─── Inline modal ─────────────────────────────────────────────────────────────

function Modal({ open, onClose, children }: { open: boolean; onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(2px)' }} onClick={onClose} aria-hidden />
      <div role="dialog" aria-modal style={{ position: 'relative', width: '100%', maxWidth: 420, background: 'var(--card-bg)', border: '1px solid var(--border-gray)', borderRadius: 12, padding: 24, boxShadow: '0 20px 60px rgba(0,0,0,0.25)', animation: 'tutorial-modal-in 200ms ease' }}>
        {children}
      </div>
    </div>
  );
}

// ─── Inline toast ─────────────────────────────────────────────────────────────

function InlineToast({ message, type, onDismiss }: { message: string | null; type: 'success' | 'error'; onDismiss: () => void }) {
  if (!message) return null;
  const isErr = type === 'error';
  return (
    <div
      className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] flex items-center gap-3 px-4 py-2.5 rounded-lg shadow-lg fade-in pointer-events-auto"
      style={{ background: isErr ? '#DC2626' : '#0F172A', color: '#F9FAFB', border: '1px solid rgba(255,255,255,0.08)' }}
    >
      {!isErr && <CheckIcon />}
      <span className="text-[13px] font-medium">{message}</span>
      <button onClick={onDismiss} className="ml-1 opacity-50 hover:opacity-100 transition-opacity" aria-label="Dismiss">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>
  );
}

// ─── Section: Profile ─────────────────────────────────────────────────────────

function ProfileSection({ showToast }: { showToast: (msg: string, type?: 'success' | 'error') => void }) {
  const { user, updateProfile } = useAuth();
  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState('');
  const [saving, setSaving] = useState(false);
  const dirty = name !== (user?.name ?? '');

  useEffect(() => {
    setName(user?.name ?? '');
    supabase.auth.getUser().then(({ data }) => {
      if (data.user?.email) setEmail(data.user.email);
    });
  }, [user?.name]);

  const handleSave = async () => {
    if (!dirty || saving) return;
    setSaving(true);
    const ok = await updateProfile({ name: name.trim() });
    setSaving(false);
    if (ok) showToast('Name updated');
    else showToast('Failed to save — check your connection', 'error');
  };

  const initials = (user?.name || email || '?').trim().split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div>
      <SectionCard title="Personal info">
        {/* Avatar */}
        <div className="flex items-center gap-4 mb-6">
          <div
            className="flex-shrink-0 w-14 h-14 rounded-full flex items-center justify-center text-white font-semibold text-lg"
            style={{ background: 'var(--accent-blue)' }}
          >
            {initials}
          </div>
          <div>
            <p className="text-[13px] font-medium" style={{ color: 'var(--brand-navy)' }}>{user?.name || 'Your name'}</p>
            <p className="text-[12px]" style={{ color: 'var(--muted-text)' }}>{email}</p>
            {/* TODO: Implement photo upload in a future version */}
          </div>
        </div>

        {/* Name */}
        <div className="mb-4">
          <FieldLabel>Full name</FieldLabel>
          <input
            className={input()}
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSave()}
            placeholder="Your name"
          />
        </div>

        <button
          onClick={handleSave}
          disabled={!dirty || saving}
          className="h-9 px-4 rounded-md text-[13px] font-medium text-white transition-colors bg-accent-blue hover:bg-accent-blue-hover disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {saving ? 'Saving…' : 'Save changes'}
        </button>
      </SectionCard>

      <SectionCard title="Email address">
        <FieldLabel>Email</FieldLabel>
        <div className="flex items-center gap-3">
          <input className={input('flex-1')} value={email} readOnly style={{ color: 'var(--muted-text)', cursor: 'default' }} />
          <span className="text-[12px] flex-shrink-0" style={{ color: 'var(--text-tertiary)' }}>Cannot be changed here</span>
        </div>
      </SectionCard>
    </div>
  );
}

// ─── Section: Recruiting preferences ─────────────────────────────────────────

function RecruitingSection({ showToast }: { showToast: (msg: string, type?: 'success' | 'error') => void }) {
  const { user, updateProfile } = useAuth();
  const router = useRouter();
  const [modeModal, setModeModal] = useState(false);
  const [pendingMode, setPendingMode] = useState<'internship' | 'job' | null>(null);
  const [savedField, setSavedField] = useState<string | null>(null);
  const [customSeason, setCustomSeason] = useState('');

  const flashSavedTimer = useRef<NodeJS.Timeout | null>(null);
  const flashSaved = (field: string) => {
    if (flashSavedTimer.current) clearTimeout(flashSavedTimer.current);
    setSavedField(field);
    flashSavedTimer.current = setTimeout(() => setSavedField(null), 2000);
  };

  const saveField = async (updates: Parameters<typeof updateProfile>[0], field: string) => {
    const ok = await updateProfile(updates);
    if (ok) flashSaved(field);
    else showToast('Failed to save — check your connection', 'error');
  };

  const handleModeChange = (mode: 'internship' | 'job') => {
    if (mode === user?.mode) return;
    setPendingMode(mode);
    setModeModal(true);
  };

  const confirmModeChange = async () => {
    if (!pendingMode) return;
    const ok = await updateProfile({ mode: pendingMode });
    setModeModal(false);
    setPendingMode(null);
    if (ok) { showToast('Tracking mode updated'); router.refresh(); }
    else showToast('Failed to update mode — check your connection', 'error');
  };

  const addCustomSeason = () => {
    const s = customSeason.trim();
    if (!s) return;
    saveField({ recruiting_season: s }, 'recruiting_season');
    setCustomSeason('');
  };

  const mode = user?.mode ?? 'internship';

  return (
    <div>
      {/* Mode */}
      <SectionCard title="Tracking mode" description="Choose what type of applications you are tracking.">
        <div className="flex gap-2">
          <button
            onClick={() => handleModeChange('internship')}
            className={`flex-1 h-10 rounded-md text-[13px] font-medium border transition-colors ${mode === 'internship' ? 'bg-accent-blue border-accent-blue text-white' : 'bg-background border-border-gray text-muted-text hover:border-accent-blue/40'}`}
          >
            Internship applications
          </button>
          <button
            onClick={() => handleModeChange('job')}
            className={`flex-1 h-10 rounded-md text-[13px] font-medium border transition-colors ${mode === 'job' ? 'bg-accent-blue border-accent-blue text-white' : 'bg-background border-border-gray text-muted-text hover:border-accent-blue/40'}`}
          >
            Full-time job applications
          </button>
        </div>
      </SectionCard>

      {/* School year / Career level */}
      <SectionCard
        title={mode === 'internship' ? 'School year' : 'Career level'}
        description={mode === 'internship' ? 'Which year are you in?' : 'Where are you in your career?'}
      >
        <div className="flex flex-wrap gap-2">
          {(mode === 'internship' ? SCHOOL_YEARS : CAREER_LEVELS).map(opt => (
            <Chip
              key={opt}
              label={opt}
              selected={(mode === 'internship' ? user?.school_year : user?.career_level) === opt}
              onClick={() => saveField(mode === 'internship' ? { school_year: opt } : { career_level: opt }, mode === 'internship' ? 'school_year' : 'career_level')}
            />
          ))}
          {savedField === 'school_year' || savedField === 'career_level' ? <SavedIndicator show /> : null}
        </div>
      </SectionCard>

      {/* Recruiting season (internship only) */}
      {mode === 'internship' && (
        <SectionCard title="Recruiting season" description="Which cycle are you tracking?">
          <div className="flex flex-wrap gap-2 mb-3">
            {RECRUITING_SEASONS.map(s => (
              <Chip
                key={s}
                label={s}
                selected={user?.recruiting_season === s}
                onClick={() => saveField({ recruiting_season: s }, 'recruiting_season')}
              />
            ))}
            {savedField === 'recruiting_season' && <SavedIndicator show />}
          </div>
          <div className="flex gap-2 mt-2">
            <input
              className={input('flex-1')}
              placeholder="Add custom season…"
              value={customSeason}
              onChange={e => setCustomSeason(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addCustomSeason()}
            />
            <button
              onClick={addCustomSeason}
              disabled={!customSeason.trim()}
              className="h-9 px-3 rounded-md text-[13px] font-medium border border-border-gray bg-surface-gray text-muted-text hover:border-accent-blue/40 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Add
            </button>
          </div>
          {user?.recruiting_season && !RECRUITING_SEASONS.includes(user.recruiting_season) && (
            <p className="mt-2 text-[12px]" style={{ color: 'var(--muted-text)' }}>
              Custom season: <span className="font-medium" style={{ color: 'var(--brand-navy)' }}>{user.recruiting_season}</span>
            </p>
          )}
        </SectionCard>
      )}

      {/* Target roles */}
      <SectionCard title="Target roles" description="What types of roles are you targeting? Used for future personalization.">
        <TargetField storageKey={`applyd_target_roles_${user?.id}`} placeholder="e.g. Software Engineering, Product Management, Design" />
      </SectionCard>

      {/* Target companies */}
      <SectionCard title="Target companies" description="Companies you are specifically targeting. Used for future personalization.">
        <TargetField storageKey={`applyd_target_companies_${user?.id}`} placeholder="e.g. Google, Stripe, Figma, OpenAI" />
      </SectionCard>

      {/* Mode change confirmation modal */}
      <Modal open={modeModal} onClose={() => { setModeModal(false); setPendingMode(null); }}>
        <h3 className="text-[16px] font-semibold mb-2" style={{ color: 'var(--brand-navy)' }}>Change tracking mode?</h3>
        <p className="text-[13px] mb-5 leading-relaxed" style={{ color: 'var(--muted-text)' }}>
          Changing your tracking mode will update your pipeline stages. Your existing applications will not be deleted but their stages may not match the new pipeline.
        </p>
        <div className="flex gap-2">
          <button
            onClick={confirmModeChange}
            className="flex-1 h-9 rounded-md text-[13px] font-semibold text-white bg-accent-blue hover:bg-accent-blue-hover transition-colors"
          >
            Confirm
          </button>
          <button
            onClick={() => { setModeModal(false); setPendingMode(null); }}
            className="flex-1 h-9 rounded-md text-[13px] font-medium border border-border-gray bg-surface-gray text-muted-text hover:border-accent-blue/40 transition-colors"
          >
            Cancel
          </button>
        </div>
      </Modal>
    </div>
  );
}

function TargetField({ storageKey, placeholder }: { storageKey: string; placeholder: string }) {
  const [value, setValue] = useState('');
  const [saved, setSaved] = useState(false);
  const savedTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (storageKey) setValue(localStorage.getItem(storageKey) ?? '');
    return () => { if (savedTimer.current) clearTimeout(savedTimer.current); };
  }, [storageKey]);

  const handleBlur = () => {
    if (!storageKey) return;
    localStorage.setItem(storageKey, value);
    if (savedTimer.current) clearTimeout(savedTimer.current);
    setSaved(true);
    savedTimer.current = setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div>
      <input
        className={input()}
        value={value}
        onChange={e => setValue(e.target.value)}
        onBlur={handleBlur}
        placeholder={placeholder}
      />
      <div className="mt-1.5 h-4"><SavedIndicator show={saved} /></div>
    </div>
  );
}

// ─── Section: Notifications ───────────────────────────────────────────────────
// TODO: Add email_notifications, deadline_reminders, weekly_digest columns to users table in Supabase.
// Currently saved to localStorage as fallback.

// ─── Section: AI Features ─────────────────────────────────────────────────────

function AISection() {
  const { user } = useAuth();
  const userIsPro = isPro(user);

  const AI_FEATURES = [
    { key: 'interview-prep', label: 'Interview Intel' },
    { key: 'follow-up-email', label: 'Follow Up Writer' },
    { key: 'strength-signal', label: 'Strength Signal' },
    { key: 'offer-intelligence', label: 'Offer Guide' },
    { key: 'weekly-coach', label: 'Weekly Coach' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <h2 style={{ fontSize: 15, fontWeight: 600, color: 'var(--brand-navy)', marginBottom: 4, letterSpacing: '-0.01em' }}>AI Features</h2>
        <p style={{ fontSize: 13, color: 'var(--muted-text)', lineHeight: 1.5 }}>
          {userIsPro
            ? 'Your AI suite is active. Features activate automatically as your applications move through stages.'
            : `You're on the free plan — ${AI_FREE_DAILY_LIMIT} AI uses per feature per day. Upgrade to Pro for ${AI_PRO_DAILY_LIMIT} uses per day.`}
        </p>
      </div>

      {/* Feature list */}
      <div style={{ borderRadius: 10, border: '1px solid var(--border-gray)', overflow: 'hidden' }}>
        {AI_FEATURES.map((f, i) => (
          <div
            key={f.key}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '12px 16px',
              borderTop: i > 0 ? '1px solid var(--border-gray)' : undefined,
              background: 'var(--card-bg)',
            }}
          >
            <span style={{ fontSize: 13, color: 'var(--brand-navy)', fontWeight: 500 }}>{f.label}</span>
            <span style={{
              fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 99,
              background: userIsPro ? 'rgba(22,163,74,0.1)' : 'var(--surface-gray)',
              color: userIsPro ? '#16A34A' : 'var(--muted-text)',
            }}>
              {userIsPro ? '20 uses/day' : '3 uses/day'}
            </span>
          </div>
        ))}
      </div>

      {/* Privacy note */}
      <div style={{ padding: '12px 14px', borderRadius: 8, border: '1px solid var(--border-gray)', background: 'var(--surface-gray)' }}>
        <p style={{ fontSize: 12, color: 'var(--muted-text)', lineHeight: 1.6 }}>
          All AI features are powered by Anthropic&apos;s Claude. Responses are generated in real time. Your application data is never used to train AI models.
        </p>
      </div>
    </div>
  );
}

// ─── Section: Appearance ──────────────────────────────────────────────────────

function AppearanceSection() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [themeSaved, setThemeSaved] = useState(false);
  const themeSavedTimer = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    setMounted(true);
    return () => { if (themeSavedTimer.current) clearTimeout(themeSavedTimer.current); };
  }, []);

  const handleTheme = (id: string) => {
    setTheme(id);
    if (themeSavedTimer.current) clearTimeout(themeSavedTimer.current);
    setThemeSaved(true);
    themeSavedTimer.current = setTimeout(() => setThemeSaved(false), 2000);
  };

  const themes = [
    { id: 'light', label: 'Light', preview: { bg: '#FFFFFF', border: '#E5E7EB', dot: '#2563EB' } },
    { id: 'dark', label: 'Dark', preview: { bg: '#0A0A0A', border: '#2C2C2E', dot: '#3B82F6' } },
  ];

  return (
    <div>
      <SectionCard title="Theme" description="Choose your preferred color scheme.">
        <div className="flex gap-3">
          {mounted && themes.map(t => {
            const active = theme === t.id;
            return (
              <button
                key={t.id}
                onClick={() => handleTheme(t.id)}
                className="flex-1 rounded-lg border-2 overflow-hidden transition-all"
                style={{ borderColor: active ? 'var(--accent-blue)' : 'var(--border-gray)' }}
              >
                {/* Theme preview */}
                <div
                  className="h-14 w-full"
                  style={{ background: t.preview.bg }}
                >
                  <div className="p-2 flex gap-1 pt-2.5 pl-2.5">
                    {[0,1,2].map(i => (
                      <div key={i} className="h-1.5 rounded-full" style={{ background: i === 0 ? t.preview.dot : t.preview.border, width: i === 0 ? 24 : 16 }} />
                    ))}
                  </div>
                  <div className="px-2 flex gap-1">
                    <div className="h-5 w-5 rounded" style={{ background: t.preview.border }} />
                    <div className="flex-1 flex flex-col gap-1 justify-center">
                      <div className="h-1 rounded" style={{ background: t.preview.border, width: '70%' }} />
                      <div className="h-1 rounded" style={{ background: t.preview.border, width: '50%' }} />
                    </div>
                  </div>
                </div>
                <div className="py-2 px-1 flex items-center justify-center gap-1.5" style={{ background: 'var(--card-bg)' }}>
                  {active && <div className="w-2 h-2 rounded-full" style={{ background: 'var(--accent-blue)' }} />}
                  <span className="text-[12px] font-medium" style={{ color: active ? 'var(--accent-blue)' : 'var(--muted-text)' }}>{t.label}</span>
                </div>
              </button>
            );
          })}
          {mounted && <div className="mt-3 h-4"><SavedIndicator show={themeSaved} /></div>}
        </div>
      </SectionCard>

      <SectionCard title="Language" description="Switch between English and Japanese (就活モード).">
        <LocaleSwitcher />
      </SectionCard>
    </div>
  );
}

// ─── Plan card (used inside AccountSection) ───────────────────────────────────

function PlanCard() {
  const { user } = useAuth();
  const userIsPro = isPro(user);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [loadingPortal, setLoadingPortal] = useState(false);

  const handleManage = async () => {
    if (!user) return;
    setLoadingPortal(true);
    try {
      const res = await fetch('/api/create-portal-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } finally {
      setLoadingPortal(false);
    }
  };

  return (
    <>
      <SectionCard title="Plan">
        {userIsPro ? (
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3">
              <ProLogo size={40} />
              <div>
                <p className="text-[13px] font-medium" style={{ color: 'var(--brand-navy)' }}>Applyd Pro</p>
                <p className="text-[12px]" style={{ color: 'var(--muted-text)' }}>
                  Unlimited applications · All features unlocked
                  {user?.pro_expires_at && (
                    <span> · Renews {new Date(user.pro_expires_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold" style={{ background: 'linear-gradient(135deg,#1e40af,#2563eb)', color: '#fff' }}>⚡ Pro</span>
              <button
                onClick={handleManage}
                disabled={loadingPortal}
                className="text-[12px] font-medium px-3 py-1 rounded-md border transition-colors hover:bg-surface-gray disabled:opacity-50"
                style={{ borderColor: 'var(--border-gray)', color: 'var(--muted-text)' }}
              >
                {loadingPortal ? 'Loading…' : 'Manage subscription'}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <p className="text-[13px] font-medium" style={{ color: 'var(--brand-navy)' }}>Free plan</p>
              <p className="text-[12px]" style={{ color: 'var(--muted-text)' }}>{FREE_TIER_LIMIT} applications included · Upgrade for unlimited</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold" style={{ background: 'var(--surface-gray)', color: 'var(--muted-text)', border: '1px solid var(--border-gray)' }}>Free</span>
              <button
                onClick={() => setShowUpgrade(true)}
                className="text-[12px] font-semibold px-3 py-1 rounded-md text-white transition-colors"
                style={{ background: 'var(--accent-blue)' }}
              >
                Upgrade ⚡
              </button>
            </div>
          </div>
        )}
      </SectionCard>
      <UpgradeModal open={showUpgrade} onClose={() => setShowUpgrade(false)} reason="billing" />
    </>
  );
}

// ─── Section: Account ─────────────────────────────────────────────────────────

function AccountSection({ showToast }: { showToast: (msg: string, type?: 'success' | 'error') => void }) {
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [pwError, setPwError] = useState('');
  const [savingPw, setSavingPw] = useState(false);
  const [extensionInstalled, setExtensionInstalled] = useState<boolean | null>(null);

  useEffect(() => {
    // Detect extension
    const stored = localStorage.getItem('applyd_extension_installed');
    if (stored === 'true') { setExtensionInstalled(true); return; }
    const timeout = setTimeout(() => { if (extensionInstalled === null) setExtensionInstalled(false); }, 1500);
    const handler = (e: MessageEvent) => {
      if (e.data?.type === 'APPLYD_EXTENSION_ACTIVE') {
        setExtensionInstalled(true);
        localStorage.setItem('applyd_extension_installed', 'true');
      }
    };
    window.addEventListener('message', handler);
    window.postMessage({ type: 'APPLYD_PING' }, '*');
    return () => { window.removeEventListener('message', handler); clearTimeout(timeout); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handlePasswordChange = async () => {
    setPwError('');
    if (!currentPw) { setPwError('Enter your current password.'); return; }
    if (newPw.length < 8) { setPwError('New password must be at least 8 characters.'); return; }
    if (newPw !== confirmPw) { setPwError('Passwords do not match.'); return; }
    setSavingPw(true);
    try {
      // Re-authenticate by signing in with current password first
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser?.email) throw new Error('No user');
      const { error: signInErr } = await supabase.auth.signInWithPassword({ email: authUser.email, password: currentPw });
      if (signInErr) { setPwError('Current password is incorrect.'); return; }
      const { error } = await supabase.auth.updateUser({ password: newPw });
      if (error) throw error;
      setCurrentPw(''); setNewPw(''); setConfirmPw('');
      showToast('Password updated successfully');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update password';
      setPwError(msg);
    } finally {
      setSavingPw(false);
    }
  };

  return (
    <div>
      {/* Change password */}
      <SectionCard title="Change password">
        <div className="space-y-3">
          <div>
            <FieldLabel>Current password</FieldLabel>
            <input className={input()} type="password" value={currentPw} onChange={e => setCurrentPw(e.target.value)} placeholder="••••••••" autoComplete="current-password" />
          </div>
          <div>
            <FieldLabel>New password</FieldLabel>
            <input className={input()} type="password" value={newPw} onChange={e => setNewPw(e.target.value)} placeholder="At least 8 characters" autoComplete="new-password" />
          </div>
          <div>
            <FieldLabel>Confirm new password</FieldLabel>
            <input className={input()} type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} placeholder="••••••••" autoComplete="new-password" />
          </div>
          {pwError && <p className="text-[13px]" style={{ color: 'var(--danger)' }}>{pwError}</p>}
          <button
            onClick={handlePasswordChange}
            disabled={savingPw || !currentPw || !newPw || !confirmPw}
            className="h-9 px-4 rounded-md text-[13px] font-medium text-white bg-accent-blue hover:bg-accent-blue-hover disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {savingPw ? 'Updating…' : 'Update password'}
          </button>
        </div>
      </SectionCard>

      {/* Connected accounts */}
      {/* TODO: Implement OAuth Google connection in a future version */}
      <SectionCard title="Sign-in method">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'var(--surface-gray)', border: '1px solid var(--border-gray)' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
          </div>
          <div>
            <p className="text-[13px] font-medium" style={{ color: 'var(--brand-navy)' }}>Email and password</p>
            <p className="text-[12px]" style={{ color: 'var(--muted-text)' }}>Your account uses email/password sign-in.</p>
          </div>
        </div>
      </SectionCard>

      {/* Billing */}
      <PlanCard />

      {/* Extension status */}
      <SectionCard title="Browser extension">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[13px] font-medium" style={{ color: 'var(--brand-navy)' }}>Applyd Chrome Extension</p>
            <p className="text-[12px]" style={{ color: 'var(--muted-text)' }}>Log any job posting in one click.</p>
          </div>
          {extensionInstalled === null ? (
            <span className="text-[12px]" style={{ color: 'var(--text-tertiary)' }}>Checking…</span>
          ) : extensionInstalled ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[12px] font-semibold" style={{ background: 'rgba(22,163,74,0.1)', color: '#16A34A', border: '1px solid rgba(22,163,74,0.2)' }}>
              <div className="w-1.5 h-1.5 rounded-full bg-green-success" /> Installed
            </span>
          ) : (
            <a
              href="https://chromewebstore.google.com/detail/ggmjnghbacddpbgimenpickockijboao"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[12px] font-semibold transition-colors"
              style={{ background: 'rgba(217,119,6,0.1)', color: '#D97706', border: '1px solid rgba(217,119,6,0.2)' }}
            >
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#D97706' }} /> Not installed → Install
            </a>
          )}
        </div>
      </SectionCard>
    </div>
  );
}

// ─── Section: Danger zone ─────────────────────────────────────────────────────

function DangerSection({ showToast }: { showToast: (msg: string, type?: 'success' | 'error') => void }) {
  const { user, signOut } = useAuth();
  const router = useRouter();

  const [clearModal, setClearModal] = useState(false);
  const [clearConfirm, setClearConfirm] = useState('');
  const [clearing, setClearing] = useState(false);

  const [deleteModal, setDeleteModal] = useState(false);
  const [deleteStep, setDeleteStep] = useState<1 | 2>(1);
  const [deleteEmail, setDeleteEmail] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    // getSession reads from localStorage — reliable, no network needed
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user?.email) setUserEmail(data.session.user.email);
    });
  }, []);

  const handleClearAll = async () => {
    if (!user?.id || clearing) return;
    setClearing(true);
    try {
      const { error } = await supabase.from('applications').delete().eq('user_id', user.id);
      if (error) throw error;
      setClearModal(false);
      setClearConfirm('');
      showToast('All applications cleared');
      router.push('/dashboard');
    } catch {
      showToast('Failed to clear applications', 'error');
    } finally {
      setClearing(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user?.id || deleting) return;
    setDeleting(true);
    try {
      // Delete all applications
      await supabase.from('applications').delete().eq('user_id', user.id);
      // Delete user profile row
      await supabase.from('users').delete().eq('id', user.id);
      // TODO: Also delete the Supabase Auth user record using an admin edge function
      // (requires SUPABASE_SERVICE_ROLE_KEY on a server-side route)
      await signOut();
      router.push('/?deleted=1');
    } catch {
      showToast('Failed to delete account — please contact support', 'error');
      setDeleting(false);
    }
  };

  return (
    <div>
      {/* Clear all applications */}
      <SectionCard title="Clear all applications" description="Delete every application in your account. Your profile and preferences will be kept. This cannot be undone." danger>
        <button
          onClick={() => setClearModal(true)}
          className="h-9 px-4 rounded-md text-[13px] font-semibold text-white transition-colors"
          style={{ background: 'var(--danger)' }}
        >
          Clear all applications
        </button>
      </SectionCard>

      {/* Delete account */}
      <SectionCard title="Delete account" description="Permanently delete your entire account, including your profile, all applications, and all preferences. This cannot be undone." danger>
        <button
          onClick={() => { setDeleteModal(true); setDeleteStep(1); setDeleteEmail(''); }}
          className="h-9 px-4 rounded-md text-[13px] font-semibold text-white transition-colors"
          style={{ background: 'var(--danger)' }}
        >
          Delete my account
        </button>
      </SectionCard>

      {/* Clear all modal */}
      <Modal open={clearModal} onClose={() => { setClearModal(false); setClearConfirm(''); }}>
        <h3 className="text-[16px] font-semibold mb-2" style={{ color: '#DC2626' }}>Clear all applications?</h3>
        <p className="text-[13px] mb-4 leading-relaxed" style={{ color: 'var(--muted-text)' }}>
          This will permanently delete all your applications. Your profile and settings will be kept. <strong style={{ color: 'var(--brand-navy)' }}>This cannot be undone.</strong>
        </p>
        <FieldLabel>Type <strong>DELETE</strong> to confirm</FieldLabel>
        <input
          className={`${input()} mb-4`}
          value={clearConfirm}
          onChange={e => setClearConfirm(e.target.value)}
          placeholder="DELETE"
        />
        <div className="flex gap-2">
          <button
            onClick={handleClearAll}
            disabled={clearConfirm !== 'DELETE' || clearing}
            className="flex-1 h-9 rounded-md text-[13px] font-semibold text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            style={{ background: 'var(--danger)' }}
          >
            {clearing ? 'Clearing…' : 'Clear all applications'}
          </button>
          <button
            onClick={() => { setClearModal(false); setClearConfirm(''); }}
            className="h-9 px-4 rounded-md text-[13px] font-medium border border-border-gray bg-surface-gray text-muted-text hover:border-accent-blue/40 transition-colors"
          >
            Cancel
          </button>
        </div>
      </Modal>

      {/* Delete account modal */}
      <Modal open={deleteModal} onClose={() => setDeleteModal(false)}>
        {deleteStep === 1 ? (
          <>
            <h3 className="text-[16px] font-semibold mb-2" style={{ color: '#DC2626' }}>Delete your account?</h3>
            <p className="text-[13px] mb-3 leading-relaxed" style={{ color: 'var(--muted-text)' }}>
              This will permanently delete:
            </p>
            <ul className="text-[13px] mb-4 space-y-1" style={{ color: 'var(--muted-text)' }}>
              <li>• Your profile and all personal information</li>
              <li>• All your tracked applications</li>
              <li>• All your settings and preferences</li>
            </ul>
            <p className="text-[13px] mb-5 font-semibold" style={{ color: '#DC2626' }}>This action is irreversible and cannot be undone.</p>
            <div className="flex gap-2">
              <button
                onClick={() => setDeleteStep(2)}
                className="flex-1 h-9 rounded-md text-[13px] font-semibold text-white transition-colors"
                style={{ background: 'var(--danger)' }}
              >
                Continue
              </button>
              <button
                onClick={() => setDeleteModal(false)}
                className="h-9 px-4 rounded-md text-[13px] font-medium border border-border-gray bg-surface-gray text-muted-text hover:border-accent-blue/40 transition-colors"
              >
                Cancel
              </button>
            </div>
          </>
        ) : (
          <>
            <h3 className="text-[16px] font-semibold mb-2" style={{ color: '#DC2626' }}>Final confirmation</h3>
            <p className="text-[13px] mb-4" style={{ color: 'var(--muted-text)' }}>
              {userEmail
                ? <>Type your email address <strong style={{ color: 'var(--brand-navy)' }}>{userEmail}</strong> to confirm deletion.</>
                : <>Type <strong style={{ color: 'var(--brand-navy)' }}>DELETE</strong> to confirm deletion.</>
              }
            </p>
            <input
              className={`${input()} mb-4`}
              value={deleteEmail}
              onChange={e => setDeleteEmail(e.target.value)}
              placeholder={userEmail || 'DELETE'}
              type={userEmail ? 'email' : 'text'}
            />
            <div className="flex gap-2">
              <button
                onClick={handleDeleteAccount}
                disabled={
                  (userEmail
                    ? deleteEmail.trim().toLowerCase() !== userEmail.toLowerCase()
                    : deleteEmail.trim() !== 'DELETE'
                  ) || deleting
                }
                className="flex-1 h-9 rounded-md text-[13px] font-semibold text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                style={{ background: 'var(--danger)' }}
              >
                {deleting ? 'Deleting…' : 'Delete my account'}
              </button>
              <button
                onClick={() => setDeleteModal(false)}
                className="h-9 px-4 rounded-md text-[13px] font-medium border border-border-gray bg-surface-gray text-muted-text hover:border-accent-blue/40 transition-colors"
              >
                Cancel
              </button>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
}

// ─── Section: Export Data ─────────────────────────────────────────────────────

function DataSection({ showToast }: { showToast: (msg: string, type?: 'success' | 'error') => void }) {
  const { user } = useAuth();
  const [exporting, setExporting] = useState<string | null>(null);

  const PLATFORMS = [
    {
      id: 'sheets',
      name: 'Google Sheets',
      hint: 'Sheets → File → Import → Upload',
      bg: 'rgba(52,168,83,0.08)',
      border: 'rgba(52,168,83,0.25)',
      color: '#1E7E34',
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden>
          <rect x="3" y="2" width="18" height="20" rx="2" fill="#34A853" opacity="0.15"/>
          <rect x="3" y="2" width="18" height="20" rx="2" stroke="#34A853" strokeWidth="1.5"/>
          <line x1="7" y1="8" x2="17" y2="8" stroke="#34A853" strokeWidth="1.5" strokeLinecap="round"/>
          <line x1="7" y1="12" x2="17" y2="12" stroke="#34A853" strokeWidth="1.5" strokeLinecap="round"/>
          <line x1="7" y1="16" x2="13" y2="16" stroke="#34A853" strokeWidth="1.5" strokeLinecap="round"/>
          <line x1="12" y1="6" x2="12" y2="20" stroke="#34A853" strokeWidth="1" strokeOpacity="0.4"/>
        </svg>
      ),
    },
    {
      id: 'excel',
      name: 'Microsoft Excel',
      hint: 'Excel opens .csv files natively',
      bg: 'rgba(33,115,70,0.08)',
      border: 'rgba(33,115,70,0.25)',
      color: '#166534',
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden>
          <rect x="3" y="2" width="18" height="20" rx="2" fill="#217346" opacity="0.15"/>
          <rect x="3" y="2" width="18" height="20" rx="2" stroke="#217346" strokeWidth="1.5"/>
          <path d="M7.5 8L12 12M12 12L16.5 8M12 12L7.5 16M12 12L16.5 16" stroke="#217346" strokeWidth="1.8" strokeLinecap="round"/>
        </svg>
      ),
    },
    {
      id: 'numbers',
      name: 'Apple Numbers',
      hint: 'Double-click the downloaded file',
      bg: 'rgba(0,128,0,0.07)',
      border: 'rgba(0,128,0,0.2)',
      color: '#15803D',
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden>
          <rect x="3" y="2" width="18" height="20" rx="2" fill="#16A34A" opacity="0.12"/>
          <rect x="3" y="2" width="18" height="20" rx="2" stroke="#16A34A" strokeWidth="1.5"/>
          <rect x="6.5" y="6.5" width="4" height="4" rx="0.5" fill="#16A34A" opacity="0.5"/>
          <rect x="13.5" y="6.5" width="4" height="4" rx="0.5" fill="#16A34A" opacity="0.5"/>
          <rect x="6.5" y="13.5" width="4" height="4" rx="0.5" fill="#16A34A" opacity="0.5"/>
          <rect x="13.5" y="13.5" width="4" height="4" rx="0.5" fill="#16A34A" opacity="0.3"/>
        </svg>
      ),
    },
  ];

  const handleExport = async (platformId: string) => {
    if (!user || exporting) return;
    setExporting(platformId);
    try {
      const { data, error } = await supabase
        .from('applications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;

      const headers = ['Company', 'Role', 'Status', 'Location', 'Category', 'Deadline', 'Job Link', 'Notes', 'Recruiter', 'Recruiter Email', 'Date Added'];
      const rows = (data ?? []).map((a: Record<string, unknown>) => [
        a.company, a.role, a.status, a.location, a.category ?? '',
        a.deadline ?? '', a.job_link ?? '',
        String(a.notes ?? '').replace(/\n/g, ' '),
        a.recruiter_name ?? '', a.recruiter_email ?? '',
        a.created_at ? new Date(String(a.created_at)).toLocaleDateString('en-US') : '',
      ]);

      const csv = [headers, ...rows]
        .map(row => row.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(','))
        .join('\n');

      const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `applyd-applications-${new Date().toISOString().split('T')[0]}.csv`;
      anchor.click();
      URL.revokeObjectURL(url);
      showToast(`Exported ${data?.length ?? 0} applications`);
    } catch {
      showToast('Export failed — check your connection', 'error');
    } finally {
      setExporting(null);
    }
  };

  return (
    <div>
      <SectionCard
        title="Export your data"
        description="Download all your applications as a spreadsheet. Choose the platform you use — all exports use CSV format, which every major spreadsheet app opens natively."
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          {PLATFORMS.map(p => (
            <button
              key={p.id}
              onClick={() => handleExport(p.id)}
              disabled={!!exporting}
              className="flex flex-col items-center gap-2.5 p-4 rounded-lg border text-center transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              style={{ background: p.bg, borderColor: p.border }}
            >
              {exporting === p.id ? (
                <div className="w-7 h-7 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: p.color, borderTopColor: 'transparent' }} />
              ) : (
                p.icon
              )}
              <div>
                <p className="text-[13px] font-semibold" style={{ color: p.color }}>{p.name}</p>
                <p className="text-[11px] mt-0.5 leading-snug" style={{ color: 'var(--text-tertiary)' }}>{p.hint}</p>
              </div>
            </button>
          ))}
        </div>
        <p className="text-[12px]" style={{ color: 'var(--text-tertiary)' }}>
          Exports include: company, role, status, location, category, deadline, job link, notes, recruiter info, and date added.
        </p>
      </SectionCard>
    </div>
  );
}



// ─── Main settings page ───────────────────────────────────────────────────────

const JA_SECTION_LABELS: Record<string, string> = {
  profile: 'プロフィール',
  recruiting: '就活設定',
  ai: 'AI機能',
  appearance: '表示設定',
  account: 'アカウント',
  referrals: '友達紹介',
  data: 'データ出力',
  danger: '危険な操作',
};

function SettingsPageInner() {
  const { user, loading } = useAuth();
  const isJa = user?.pipeline_type === 'shuukatsu';
  const router = useRouter();
  const searchParams = useSearchParams();
  const [section, setSection] = useState<Section>(() => {
    const s = searchParams.get('section');
    return (SECTIONS.find(x => x.id === s)?.id ?? 'profile') as Section;
  });
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auth guard
  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [user, loading, router]);

  const showToast = useCallback((msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    if (type === 'success') {
      toastTimer.current = setTimeout(() => setToast(null), 3000);
    }
  }, []);

  useEffect(() => () => { if (toastTimer.current) clearTimeout(toastTimer.current); }, []);

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-accent-blue border-t-transparent animate-spin" />
      </div>
    );
  }

  const sectionContent: Record<Section, ReactNode> = {
    profile: <ProfileSection showToast={showToast} />,
    recruiting: <RecruitingSection showToast={showToast} />,
    ai: <AISection />,
    appearance: <AppearanceSection />,
    account: <AccountSection showToast={showToast} />,
    referrals: (
      <div>
        <div className="mb-4">
          <h2 className="text-[16px] font-semibold" style={{ color: 'var(--brand-navy)', letterSpacing: '-0.01em' }}>Referrals</h2>
          <p className="text-[13px] mt-0.5" style={{ color: 'var(--muted-text)' }}>Invite friends to Applyd. Every 3 who join earns you 1 month of Pro free.</p>
        </div>
        <ReferralCard />
      </div>
    ),
    data: <DataSection showToast={showToast} />,

    danger: <DangerSection showToast={showToast} />,
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Toast */}
      <InlineToast
        message={toast?.msg ?? null}
        type={toast?.type ?? 'success'}
        onDismiss={() => setToast(null)}
      />

      {/* Nav */}
      <nav className="border-b border-border-gray bg-background sticky top-0 z-30 pt-[env(safe-area-inset-top)]" style={isJa ? { fontFamily: "'Noto Sans JP', sans-serif" } : undefined}>
        <div className="max-w-[960px] mx-auto px-4 md:px-6 flex items-center h-[52px] gap-2">
          <Link href={isJa ? '/ja' : '/'} className="flex items-center gap-2">
            <Logo size={22} variant="dark" />
            <span className="text-[15px] font-semibold" style={{ color: 'var(--brand-navy)', letterSpacing: '-0.02em' }}>Applyd</span>
          </Link>
          <span className="text-[13px]" style={{ color: 'var(--border-gray)' }}>/</span>
          <span className="text-[13px] font-medium" style={{ color: 'var(--muted-text)' }}>{isJa ? '設定' : 'Settings'}</span>
          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle />
            <Link href={isJa ? '/ja/dashboard' : '/dashboard'} className="text-[12px] font-medium transition-colors" style={{ color: 'var(--muted-text)' }}>
              {isJa ? '← ダッシュボード' : '← Dashboard'}
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-[960px] mx-auto px-4 md:px-6 py-8" style={isJa ? { fontFamily: "'Noto Sans JP', sans-serif" } : undefined}>
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-[22px] font-semibold tracking-tight mb-1" style={{ color: 'var(--brand-navy)', letterSpacing: '-0.02em' }}>{isJa ? '設定' : 'Settings'}</h1>
          <p className="text-[14px]" style={{ color: 'var(--muted-text)' }}>{isJa ? 'アカウントと設定を管理します。' : 'Manage your account and preferences.'}</p>
        </div>

        {/* Mobile tab row */}
        <div className="lg:hidden flex gap-1 overflow-x-auto pb-3 mb-6 -mx-4 px-4" style={{ scrollbarWidth: 'none' }}>
          {SECTIONS.map(s => (
            <button
              key={s.id}
              onClick={() => setSection(s.id)}
              className="flex-shrink-0 flex items-center gap-1.5 h-8 px-3 rounded-full text-[12px] font-medium border transition-colors"
              style={{
                background: section === s.id ? 'var(--accent-blue)' : 'var(--surface-gray)',
                borderColor: section === s.id ? 'var(--accent-blue)' : 'var(--border-gray)',
                color: section === s.id ? '#fff' : s.danger ? '#DC2626' : 'var(--muted-text)',
              }}
            >
              {s.icon}
              {isJa ? JA_SECTION_LABELS[s.id] : s.label}
            </button>
          ))}
        </div>

        {/* Desktop: two-column layout */}
        <div className="flex gap-8">
          {/* Sidebar — desktop only */}
          <aside className="hidden lg:block w-48 flex-shrink-0">
            <nav className="sticky top-[68px] space-y-0.5">
              {SECTIONS.map(s => (
                <button
                  key={s.id}
                  onClick={() => setSection(s.id)}
                  className="w-full flex items-center gap-2.5 h-9 px-3 rounded-md text-[13px] font-medium text-left transition-colors"
                  style={{
                    background: section === s.id ? 'var(--surface-gray)' : 'transparent',
                    color: section === s.id
                      ? s.danger ? '#DC2626' : 'var(--brand-navy)'
                      : s.danger ? '#DC2626' : 'var(--muted-text)',
                    border: section === s.id ? '1px solid var(--border-gray)' : '1px solid transparent',
                  }}
                >
                  <span style={{ opacity: section === s.id ? 1 : 0.65 }}>{s.icon}</span>
                  {isJa ? JA_SECTION_LABELS[s.id] : s.label}
                </button>
              ))}
            </nav>
          </aside>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {sectionContent[section]}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense>
      <SettingsPageInner />
    </Suspense>
  );
}
