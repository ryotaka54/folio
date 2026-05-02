'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Contact, Application, RelationshipType } from '@/lib/types';
import { STAGE_COLORS } from '@/lib/constants';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { X } from 'lucide-react';
import { authFetch } from '@/lib/auth-fetch';

const REL_OPTIONS: { value: RelationshipType; label: string }[] = [
  { value: 'recruiter', label: 'Recruiter' },
  { value: 'referral',  label: 'Referral' },
  { value: 'employee',  label: 'Employee' },
  { value: 'alumni',    label: 'Alumni' },
  { value: 'other',     label: 'Other' },
];

const inputCls = [
  'w-full h-9 px-3 bg-background border border-border-gray rounded-md text-sm',
  'focus:outline-none focus:border-accent-blue focus:ring-2 focus:ring-accent-blue/20',
  'placeholder:text-text-tertiary transition-colors',
].join(' ');

type SaveStatus = 'idle' | 'saving' | 'saved';

interface ContactDrawerProps {
  contact: Contact | null;
  open: boolean;
  onClose: () => void;
  onUpdate: (id: string, updates: Partial<Contact>) => void;
  onDelete: (id: string) => void;
  applications: Application[];
}

export default function ContactDrawer({ contact, open, onClose, onUpdate, onDelete, applications }: ContactDrawerProps) {
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [linkedAppIds, setLinkedAppIds] = useState<string[]>([]);
  const [linkSearch, setLinkSearch] = useState('');
  const [linkOpen, setLinkOpen] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    setShowDeleteConfirm(false);
    setLinkSearch('');
    setLinkOpen(false);
    setSaveStatus('idle');
    setLinkedAppIds(contact?.application_ids ?? []);
  }, [contact?.id]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (open) window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [open, onClose]);

  const debouncedUpdate = useCallback((field: keyof Contact, value: string | null) => {
    if (!contact) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    setSaveStatus('idle');
    debounceRef.current = setTimeout(() => {
      setSaveStatus('saving');
      onUpdate(contact.id, { [field]: value });
      saveTimerRef.current = setTimeout(() => {
        setSaveStatus('saved');
        saveTimerRef.current = setTimeout(() => setSaveStatus('idle'), 2000);
      }, 500);
    }, 800);
  }, [contact, onUpdate]);

  const immediateUpdate = useCallback((field: keyof Contact, value: string) => {
    if (!contact) return;
    setSaveStatus('saving');
    onUpdate(contact.id, { [field]: value });
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      setSaveStatus('saved');
      saveTimerRef.current = setTimeout(() => setSaveStatus('idle'), 2000);
    }, 400);
  }, [contact, onUpdate]);

  const linkApp = async (appId: string) => {
    if (!contact || linkedAppIds.includes(appId)) return;
    setLinkedAppIds(prev => [...prev, appId]);
    setLinkSearch('');
    setLinkOpen(false);
    await authFetch(`/api/contacts/${contact.id}/applications`, {
      method: 'POST',
      body: JSON.stringify({ application_id: appId }),
    });
  };

  const unlinkApp = async (appId: string) => {
    if (!contact) return;
    setLinkedAppIds(prev => prev.filter(id => id !== appId));
    await authFetch(`/api/contacts/${contact.id}/applications`, {
      method: 'DELETE',
      body: JSON.stringify({ application_id: appId }),
    });
  };

  const drawerSpring = reduce
    ? { duration: 0.01 }
    : { type: 'spring' as const, stiffness: 300, damping: 32, mass: 0.9 };

  const linkedApps = applications.filter(a => linkedAppIds.includes(a.id));
  const unlinkableApps = applications.filter(a =>
    !linkedAppIds.includes(a.id) &&
    a.company.toLowerCase().includes(linkSearch.toLowerCase())
  );

  return (
    <AnimatePresence>
      {open && contact && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <motion.div
            className="absolute inset-0 bg-brand-navy/20 backdrop z-0"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
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
            onClick={e => e.stopPropagation()}
          >
            <div className="p-4 sm:p-6 pb-[calc(1rem+env(safe-area-inset-bottom))]">
              {/* Header */}
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--brand-navy)', margin: 0, letterSpacing: '-0.01em' }}>
                    {contact.name}
                  </h2>
                  {(contact.role || contact.company) && (
                    <p style={{ fontSize: 12, color: 'var(--muted-text)', margin: '2px 0 0' }}>
                      {[contact.role, contact.company].filter(Boolean).join(' · ')}
                    </p>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {saveStatus === 'saving' && (
                    <span style={{ fontSize: 11, color: 'var(--muted-text)', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <svg className="animate-spin" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                      Saving
                    </span>
                  )}
                  {saveStatus === 'saved' && (
                    <span style={{ fontSize: 11, color: 'var(--green-success)', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                      Saved
                    </span>
                  )}
                  <button onClick={onClose} className="p-1 rounded hover:bg-surface-gray transition-colors" style={{ color: 'var(--muted-text)' }}>
                    <X size={16} />
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                {/* Name + relationship type */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label className="block text-[12px] font-medium mb-1" style={{ color: 'var(--muted-text)' }}>Name</label>
                    <input type="text" defaultValue={contact.name} onChange={e => debouncedUpdate('name', e.target.value)} className={inputCls} style={{ color: 'var(--brand-navy)' }} />
                  </div>
                  <div>
                    <label className="block text-[12px] font-medium mb-1" style={{ color: 'var(--muted-text)' }}>Relationship</label>
                    <select defaultValue={contact.relationship_type} onChange={e => immediateUpdate('relationship_type', e.target.value)} className={inputCls} style={{ color: 'var(--brand-navy)' }}>
                      {REL_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>
                </div>

                {/* Company + role */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label className="block text-[12px] font-medium mb-1" style={{ color: 'var(--muted-text)' }}>Company</label>
                    <input type="text" defaultValue={contact.company} onChange={e => debouncedUpdate('company', e.target.value)} className={inputCls} placeholder="Company name" style={{ color: 'var(--brand-navy)' }} />
                  </div>
                  <div>
                    <label className="block text-[12px] font-medium mb-1" style={{ color: 'var(--muted-text)' }}>Role / Title</label>
                    <input type="text" defaultValue={contact.role} onChange={e => debouncedUpdate('role', e.target.value)} className={inputCls} placeholder="e.g. Engineering Manager" style={{ color: 'var(--brand-navy)' }} />
                  </div>
                </div>

                {/* Email + phone */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label className="block text-[12px] font-medium mb-1" style={{ color: 'var(--muted-text)' }}>Email</label>
                    <input type="email" defaultValue={contact.email} onChange={e => debouncedUpdate('email', e.target.value)} className={inputCls} placeholder="name@company.com" style={{ color: 'var(--brand-navy)' }} />
                  </div>
                  <div>
                    <label className="block text-[12px] font-medium mb-1" style={{ color: 'var(--muted-text)' }}>Phone</label>
                    <input type="tel" defaultValue={contact.phone} onChange={e => debouncedUpdate('phone', e.target.value)} className={inputCls} placeholder="+1 (555) 000-0000" style={{ color: 'var(--brand-navy)' }} />
                  </div>
                </div>

                {/* LinkedIn + last contact */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label className="block text-[12px] font-medium mb-1" style={{ color: 'var(--muted-text)' }}>LinkedIn URL</label>
                    <input type="url" defaultValue={contact.linkedin_url} onChange={e => debouncedUpdate('linkedin_url', e.target.value)} className={inputCls} placeholder="https://linkedin.com/in/…" style={{ color: 'var(--brand-navy)' }} />
                  </div>
                  <div>
                    <label className="block text-[12px] font-medium mb-1" style={{ color: 'var(--muted-text)' }}>Last contact</label>
                    <input type="date" defaultValue={contact.last_contact_date ?? ''} onChange={e => debouncedUpdate('last_contact_date', e.target.value || null)} className={inputCls} style={{ color: 'var(--brand-navy)' }} />
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-[12px] font-medium mb-1" style={{ color: 'var(--muted-text)' }}>Notes</label>
                  <textarea
                    defaultValue={contact.notes}
                    onChange={e => debouncedUpdate('notes', e.target.value)}
                    rows={3}
                    placeholder="Conversation notes, shared connections, topics to follow up on…"
                    className="w-full px-3 py-2 bg-background border border-border-gray rounded-md text-sm focus:outline-none focus:border-accent-blue focus:ring-2 focus:ring-accent-blue/20 placeholder:text-text-tertiary resize-none"
                    style={{ color: 'var(--brand-navy)' }}
                  />
                </div>

                {/* Linked Applications */}
                <div className="border-t border-border-gray pt-4">
                  <div className="flex items-center gap-2 mb-3">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--muted-text)' }}><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
                    <h3 className="text-[13px] font-semibold" style={{ color: 'var(--brand-navy)' }}>Linked Applications</h3>
                  </div>

                  {linkedApps.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 10 }}>
                      {linkedApps.map(app => {
                        const color = STAGE_COLORS[app.status] || '#6B7280';
                        return (
                          <div key={app.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border-gray)', background: 'var(--surface-gray)' }}>
                            <div>
                              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--brand-navy)' }}>{app.company}</div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                                <span style={{ fontSize: 11, color: 'var(--muted-text)' }}>{app.role}</span>
                                <span style={{ fontSize: 10, fontWeight: 600, padding: '1px 6px', borderRadius: 99, background: `${color}18`, color, border: `1px solid ${color}33` }}>{app.status}</span>
                              </div>
                            </div>
                            <button onClick={() => unlinkApp(app.id)} style={{ fontSize: 11, color: 'var(--muted-text)', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 6px' }}>Unlink</button>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Link application search */}
                  <div style={{ position: 'relative' }}>
                    <input
                      type="text"
                      value={linkSearch}
                      onChange={e => { setLinkSearch(e.target.value); setLinkOpen(true); }}
                      onFocus={() => setLinkOpen(true)}
                      placeholder="Search applications to link…"
                      className={inputCls}
                      style={{ color: 'var(--brand-navy)' }}
                    />
                    {linkOpen && unlinkableApps.length > 0 && (
                      <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50, marginTop: 4, background: 'var(--card-bg)', border: '1px solid var(--border-gray)', borderRadius: 8, boxShadow: '0 4px 16px rgba(0,0,0,0.1)', overflow: 'hidden', maxHeight: 180, overflowY: 'auto' }}>
                        {unlinkableApps.slice(0, 8).map(app => (
                          <button
                            key={app.id}
                            onMouseDown={e => { e.preventDefault(); linkApp(app.id); }}
                            style={{ display: 'flex', flexDirection: 'column', width: '100%', padding: '8px 12px', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' }}
                            onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = 'var(--surface-gray)'}
                            onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = 'transparent'}
                          >
                            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--brand-navy)' }}>{app.company}</span>
                            <span style={{ fontSize: 11, color: 'var(--muted-text)' }}>{app.role} · {app.status}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Timestamps */}
                <div className="border-t border-border-gray pt-4">
                  <div className="flex justify-between text-[11px] text-muted-text">
                    <span>Created {new Date(contact.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    <span>Updated {new Date(contact.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  </div>
                </div>

                {/* Delete */}
                <div className="border-t border-border-gray pt-4">
                  {!showDeleteConfirm ? (
                    <button onClick={() => setShowDeleteConfirm(true)} className="text-sm hover:opacity-80 transition-opacity" style={{ color: 'var(--danger)' }}>
                      Delete this contact
                    </button>
                  ) : (
                    <div className="bg-error-bg border border-error-border rounded-lg p-3">
                      <p className="text-[13px] mb-2" style={{ color: 'var(--error-text)' }}>Delete {contact.name}? This cannot be undone.</p>
                      <div className="flex gap-2">
                        <button onClick={() => { onDelete(contact.id); onClose(); }} className="px-3 py-1.5 bg-red-500 text-white text-[12px] font-medium rounded-md">
                          Yes, delete
                        </button>
                        <button onClick={() => setShowDeleteConfirm(false)} className="px-3 py-1.5 text-[12px] font-medium rounded-md border border-border-gray" style={{ background: 'var(--card-bg)', color: 'var(--brand-navy)' }}>
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
