'use client';

import { useState, useEffect, useRef, useCallback, ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { Logo } from '@/components/Logo';
import ThemeToggle from '@/components/ThemeToggle';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { SCHOOL_YEARS, CAREER_LEVELS, RECRUITING_SEASONS } from '@/lib/constants';

// ─── Section types ────────────────────────────────────────────────────────────

type Section = 'profile' | 'recruiting' | 'notifications' | 'appearance' | 'data' | 'account' | 'danger';

interface SectionMeta { id: Section; label: string; icon: ReactNode; danger?: boolean }

// ─── SVG icons ────────────────────────────────────────────────────────────────

const UserIcon = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
const BriefcaseIcon = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>;
const BellIcon = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>;
const PaletteIcon = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="13.5" cy="6.5" r=".5"/><circle cx="17.5" cy="10.5" r=".5"/><circle cx="8.5" cy="7.5" r=".5"/><circle cx="6.5" cy="12.5" r=".5"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/></svg>;
const DatabaseIcon = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>;
const ShieldIcon = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>;
const TrashIcon = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>;
const CheckIcon = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>;
const GearIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>;

export { GearIcon };

// ─── Sections list ────────────────────────────────────────────────────────────

const SECTIONS: SectionMeta[] = [
  { id: 'profile', label: 'Profile', icon: <UserIcon /> },
  { id: 'recruiting', label: 'Recruiting', icon: <BriefcaseIcon /> },
  { id: 'notifications', label: 'Notifications', icon: <BellIcon /> },
  { id: 'appearance', label: 'Appearance', icon: <PaletteIcon /> },
  { id: 'data', label: 'Data', icon: <DatabaseIcon /> },
  { id: 'account', label: 'Account', icon: <ShieldIcon /> },
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
    try {
      await updateProfile({ name: name.trim() });
      showToast('Name updated successfully');
    } catch {
      showToast('Failed to update name', 'error');
    } finally {
      setSaving(false);
    }
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

  const flashSaved = (field: string) => {
    setSavedField(field);
    setTimeout(() => setSavedField(null), 2000);
  };

  const saveField = (updates: Parameters<typeof updateProfile>[0], field: string) => {
    updateProfile(updates);
    flashSaved(field);
  };

  const handleModeChange = (mode: 'internship' | 'job') => {
    if (mode === user?.mode) return;
    setPendingMode(mode);
    setModeModal(true);
  };

  const confirmModeChange = () => {
    if (!pendingMode) return;
    updateProfile({ mode: pendingMode });
    setModeModal(false);
    setPendingMode(null);
    showToast('Tracking mode updated');
    router.refresh();
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

  useEffect(() => {
    if (storageKey) setValue(localStorage.getItem(storageKey) ?? '');
  }, [storageKey]);

  const handleBlur = () => {
    if (!storageKey) return;
    localStorage.setItem(storageKey, value);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
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

function NotificationsSection({ userId }: { userId: string }) {
  const key = `applyd_notifications_${userId}`;
  const load = () => {
    try { return JSON.parse(localStorage.getItem(key) || '{}'); } catch { return {}; }
  };

  const [emailOn, setEmailOn] = useState(() => load().emailOn ?? true);
  const [reminders, setReminders] = useState<string[]>(() => load().reminders ?? ['7d', '3d', 'day']);
  const [digest, setDigest] = useState(() => load().digest ?? false);

  const save = useCallback((patch: object) => {
    const current = load();
    localStorage.setItem(key, JSON.stringify({ ...current, ...patch }));
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleReminder = (r: string) => {
    const next = reminders.includes(r) ? reminders.filter(x => x !== r) : [...reminders, r];
    setReminders(next);
    save({ reminders: next });
  };

  return (
    <div>
      <SectionCard title="Email notifications" description="Receive email reminders for upcoming deadlines.">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[13px] font-medium" style={{ color: 'var(--brand-navy)' }}>Deadline reminders</p>
            <p className="text-[12px]" style={{ color: 'var(--muted-text)' }}>Get notified before application deadlines.</p>
          </div>
          <Toggle checked={emailOn} onChange={v => { setEmailOn(v); save({ emailOn: v }); }} />
        </div>

        {emailOn && (
          <div className="mt-4 pt-4 border-t border-border-gray">
            <p className="text-[12px] font-medium mb-3" style={{ color: 'var(--muted-text)' }}>Send reminders:</p>
            {[
              { id: '7d', label: '7 days before deadline' },
              { id: '3d', label: '3 days before deadline' },
              { id: 'day', label: 'Day of deadline' },
            ].map(opt => (
              <label key={opt.id} className="flex items-center gap-3 mb-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={reminders.includes(opt.id)}
                  onChange={() => toggleReminder(opt.id)}
                  className="w-4 h-4 rounded border-border-gray accent-accent-blue cursor-pointer"
                />
                <span className="text-[13px]" style={{ color: 'var(--body-text)' }}>{opt.label}</span>
              </label>
            ))}
          </div>
        )}
      </SectionCard>

      <SectionCard title="Weekly digest" description="A weekly summary of your application activity.">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[13px] font-medium" style={{ color: 'var(--brand-navy)' }}>Weekly summary email</p>
            <p className="text-[12px]" style={{ color: 'var(--muted-text)' }}>Sent every Monday morning.</p>
          </div>
          <Toggle checked={digest} onChange={v => { setDigest(v); save({ digest: v }); }} />
        </div>
      </SectionCard>

      <div className="rounded-lg px-4 py-3 text-[12px]" style={{ background: 'var(--surface-gray)', color: 'var(--muted-text)', border: '1px solid var(--border-gray)' }}>
        Note: Notification delivery requires server-side setup. Settings saved locally for now.
      </div>
    </div>
  );
}

// ─── Section: Appearance ──────────────────────────────────────────────────────

function AppearanceSection() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const themes = [
    { id: 'light', label: 'Light', preview: { bg: '#FFFFFF', border: '#E5E7EB', dot: '#2563EB' } },
    { id: 'dark', label: 'Dark', preview: { bg: '#0A0A0A', border: '#2C2C2E', dot: '#3B82F6' } },
    { id: 'system', label: 'System', preview: { bg: 'linear-gradient(135deg, #FFFFFF 50%, #0A0A0A 50%)', border: '#9CA3AF', dot: '#6B7280' } },
  ];

  return (
    <div>
      <SectionCard title="Theme" description="Choose your preferred color scheme.">
        <div className="flex gap-3">
          {mounted && themes.map(t => {
            const active = theme === t.id || (!theme && t.id === 'system');
            return (
              <button
                key={t.id}
                onClick={() => setTheme(t.id)}
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
        </div>
      </SectionCard>

      <SectionCard title="Language" description="Interface language preference.">
        <div className="flex items-center gap-3">
          {/* TODO: Implement full i18n. Currently stores preference only. */}
          <select
            defaultValue="en"
            className={input('flex-1')}
            onChange={e => localStorage.setItem('applyd_language', e.target.value)}
            style={{ color: 'var(--body-text)' }}
          >
            <option value="en">English</option>
            <option value="ja">日本語</option>
          </select>
          <span className="text-[12px] flex-shrink-0" style={{ color: 'var(--text-tertiary)' }}>More languages coming soon</span>
        </div>
      </SectionCard>
    </div>
  );
}

// ─── Section: Data ────────────────────────────────────────────────────────────

function DataSection({ showToast }: { showToast: (msg: string, type?: 'success' | 'error') => void }) {
  const { user } = useAuth();
  const [exporting, setExporting] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importPreview, setImportPreview] = useState<string[][] | null>(null);
  const [importCols, setImportCols] = useState<string[]>([]);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = async () => {
    if (!user?.id || exporting) return;
    setExporting(true);
    try {
      const { data, error } = await supabase
        .from('applications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const cols = ['company', 'role', 'category', 'status', 'location', 'deadline', 'notes', 'recruiter_name', 'recruiter_email', 'job_link', 'created_at', 'updated_at'];
      const escape = (v: unknown) => {
        const s = v == null ? '' : String(v);
        return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s;
      };
      const rows = (data ?? []).map(app => cols.map(c => escape((app as Record<string, unknown>)[c])).join(','));
      const csv = [cols.join(','), ...rows].join('\n');

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `applyd-applications-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('Export downloaded');
    } catch {
      showToast('Export failed — please try again', 'error');
    } finally {
      setExporting(false);
    }
  };

  const parseCSV = (text: string): string[][] => {
    const lines = text.split(/\r?\n/).filter(l => l.trim());
    return lines.map(line => {
      const cols: string[] = [];
      let cur = '', inQ = false;
      for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') { inQ = !inQ; }
        else if (ch === ',' && !inQ) { cols.push(cur.trim()); cur = ''; }
        else { cur += ch; }
      }
      cols.push(cur.trim());
      return cols;
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportFile(file);
    setImportResult(null);
    const reader = new FileReader();
    reader.onload = ev => {
      const text = ev.target?.result as string;
      const rows = parseCSV(text);
      if (rows.length < 2) { showToast('CSV has no data rows', 'error'); return; }
      setImportCols(rows[0]);
      setImportPreview(rows.slice(1, 6));
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (!importFile || !user?.id || importing) return;
    setImporting(true);
    setImportResult(null);
    try {
      const text = await importFile.text();
      const rows = parseCSV(text);
      if (rows.length < 2) { showToast('CSV has no data rows', 'error'); return; }
      const headers = rows[0].map(h => h.toLowerCase().trim());
      const col = (name: string) => {
        const i = headers.indexOf(name);
        return (row: string[]) => (i >= 0 ? (row[i] ?? '') : '');
      };

      const now = new Date().toISOString();
      let imported = 0, skipped = 0;
      const batch = rows.slice(1).map(row => {
        const company = col('company')(row);
        const role = col('role')(row);
        if (!company || !role) { skipped++; return null; }
        return {
          user_id: user.id,
          company,
          role,
          category: col('category')(row) || '',
          status: col('status')(row) || 'Applied',
          location: col('location')(row) || '',
          deadline: col('deadline')(row) || null,
          notes: col('notes')(row) || '',
          recruiter_name: col('recruiter_name')(row) || '',
          recruiter_email: col('recruiter_email')(row) || '',
          job_link: col('job_link')(row) || '',
          created_at: now,
          updated_at: now,
        };
      }).filter(Boolean);

      if (batch.length > 0) {
        const { error } = await supabase.from('applications').insert(batch as object[]);
        if (error) throw error;
        imported = batch.length;
      }

      setImportResult(`Imported ${imported} application${imported !== 1 ? 's' : ''}${skipped > 0 ? `, skipped ${skipped} row${skipped !== 1 ? 's' : ''} (missing company or role)` : ''}.`);
      setImportFile(null);
      setImportPreview(null);
      setImportCols([]);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch {
      showToast('Import failed — please check your CSV format', 'error');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div>
      {/* Export */}
      <SectionCard title="Export my data" description="Download all your applications as a CSV file. Compatible with Google Sheets and Excel.">
        <button
          onClick={handleExport}
          disabled={exporting}
          className="h-9 px-4 rounded-md text-[13px] font-medium text-white transition-colors bg-accent-blue hover:bg-accent-blue-hover disabled:opacity-40"
        >
          {exporting ? 'Generating…' : 'Download CSV'}
        </button>
      </SectionCard>

      {/* Import */}
      <SectionCard title="Import applications" description="Upload a CSV with columns: company, role, category, status, location, deadline, notes. Company and role are required.">
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          className="hidden"
          id="import-file"
        />
        {!importPreview ? (
          <label
            htmlFor="import-file"
            className="inline-flex items-center gap-2 h-9 px-4 rounded-md text-[13px] font-medium border border-border-gray bg-background text-muted-text hover:border-accent-blue/40 cursor-pointer transition-colors"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
            Choose CSV file
          </label>
        ) : (
          <div>
            <p className="text-[12px] font-medium mb-2" style={{ color: 'var(--muted-text)' }}>Preview (first {importPreview.length} rows):</p>
            <div className="overflow-x-auto rounded-md border border-border-gray mb-4">
              <table className="text-[12px] w-full">
                <thead>
                  <tr style={{ background: 'var(--surface-gray)', color: 'var(--muted-text)' }}>
                    {importCols.slice(0, 5).map((c, i) => <th key={i} className="px-3 py-2 text-left font-medium">{c}</th>)}
                    {importCols.length > 5 && <th className="px-3 py-2 text-left font-medium">+{importCols.length - 5} more</th>}
                  </tr>
                </thead>
                <tbody>
                  {importPreview.map((row, i) => (
                    <tr key={i} className="border-t border-border-gray" style={{ color: 'var(--body-text)' }}>
                      {row.slice(0, 5).map((cell, j) => <td key={j} className="px-3 py-2 truncate max-w-[120px]">{cell || '—'}</td>)}
                      {importCols.length > 5 && <td className="px-3 py-2" style={{ color: 'var(--text-tertiary)' }}>…</td>}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleImport}
                disabled={importing}
                className="h-9 px-4 rounded-md text-[13px] font-semibold text-white bg-accent-blue hover:bg-accent-blue-hover disabled:opacity-40 transition-colors"
              >
                {importing ? 'Importing…' : `Import ${importFile?.name}`}
              </button>
              <button
                onClick={() => { setImportFile(null); setImportPreview(null); setImportCols([]); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                className="h-9 px-3 rounded-md text-[13px] font-medium border border-border-gray bg-background text-muted-text hover:border-accent-blue/40 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
        {importResult && (
          <p className="mt-3 text-[13px] font-medium" style={{ color: 'var(--green-success)' }}>{importResult}</p>
        )}
      </SectionCard>

      {/* Application history */}
      <SectionCard title="Application history" description="Keep completed recruiting cycles visible in your dashboard. When off, archived cycles are hidden from the main view.">
        <div className="flex items-center justify-between">
          <p className="text-[13px]" style={{ color: 'var(--brand-navy)' }}>Keep application history</p>
          <Toggle
            checked={typeof window !== 'undefined' ? (localStorage.getItem('applyd_keep_history') ?? 'true') === 'true' : true}
            onChange={v => localStorage.setItem('applyd_keep_history', String(v))}
          />
        </div>
      </SectionCard>
    </div>
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
      <SectionCard title="Plan">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[13px] font-medium" style={{ color: 'var(--brand-navy)' }}>Free plan</p>
            <p className="text-[12px]" style={{ color: 'var(--muted-text)' }}>Unlimited applications, full pipeline, all features — always free.</p>
          </div>
          <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold" style={{ background: 'var(--surface-gray)', color: 'var(--muted-text)', border: '1px solid var(--border-gray)' }}>Free</span>
        </div>
      </SectionCard>

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
              href="https://chromewebstore.google.com/detail/applyd"
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
    supabase.auth.getUser().then(({ data }) => {
      if (data.user?.email) setUserEmail(data.user.email);
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
              Type your email address <strong style={{ color: 'var(--brand-navy)' }}>{userEmail}</strong> to confirm deletion.
            </p>
            <input
              className={`${input()} mb-4`}
              value={deleteEmail}
              onChange={e => setDeleteEmail(e.target.value)}
              placeholder={userEmail}
              type="email"
            />
            <div className="flex gap-2">
              <button
                onClick={handleDeleteAccount}
                disabled={deleteEmail.trim().toLowerCase() !== userEmail.toLowerCase() || deleting}
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

// ─── Main settings page ───────────────────────────────────────────────────────

export default function SettingsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [section, setSection] = useState<Section>('profile');
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
    notifications: <NotificationsSection userId={user.id} />,
    appearance: <AppearanceSection />,
    data: <DataSection showToast={showToast} />,
    account: <AccountSection showToast={showToast} />,
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
      <nav className="border-b border-border-gray bg-background sticky top-0 z-30 pt-[env(safe-area-inset-top)]">
        <div className="max-w-[960px] mx-auto px-4 md:px-6 flex items-center h-[52px] gap-2">
          <Link href="/" className="flex items-center gap-2">
            <Logo size={22} variant="dark" />
            <span className="text-[15px] font-semibold" style={{ color: 'var(--brand-navy)', letterSpacing: '-0.02em' }}>Applyd</span>
          </Link>
          <span className="text-[13px]" style={{ color: 'var(--border-gray)' }}>/</span>
          <span className="text-[13px] font-medium" style={{ color: 'var(--muted-text)' }}>Settings</span>
          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle />
            <Link href="/dashboard" className="text-[12px] font-medium transition-colors" style={{ color: 'var(--muted-text)' }}>
              ← Dashboard
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-[960px] mx-auto px-4 md:px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-[22px] font-semibold tracking-tight mb-1" style={{ color: 'var(--brand-navy)', letterSpacing: '-0.02em' }}>Settings</h1>
          <p className="text-[14px]" style={{ color: 'var(--muted-text)' }}>Manage your account and preferences.</p>
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
              {s.label}
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
                  {s.label}
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
