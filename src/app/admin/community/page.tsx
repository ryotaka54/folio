'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { Logo } from '@/components/Logo';
import ThemeToggle from '@/components/ThemeToggle';
import Toast from '@/components/Toast';
import { getChallengeDay, type CommunityIdea } from '@/lib/community';

type AdminIdea = CommunityIdea & { isUpdating?: boolean };

export default function AdminCommunityPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [isAdmin, setIsAdmin] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [ideas, setIdeas] = useState<AdminIdea[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const [featureName, setFeatureName] = useState('');
  const [featureDesc, setFeatureDesc] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const toastTimer = useRef<NodeJS.Timeout | null>(null);

  const showToast = useCallback((msg: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(msg);
    toastTimer.current = setTimeout(() => setToast(null), 4000);
  }, []);

  // ── Admin check
  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.replace('/login'); return; }

    supabase
      .from('users')
      .select('is_admin')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        if (!data?.is_admin) {
          router.replace('/dashboard');
        } else {
          setIsAdmin(true);
        }
        setAuthChecked(true);
      });
  }, [user, authLoading, router]);

  // ── Load all ideas
  const loadIdeas = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('community_ideas')
      .select('*')
      .order('vote_count', { ascending: false });
    if (data) setIdeas(data as AdminIdea[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (isAdmin) loadIdeas();
  }, [isAdmin, loadIdeas]);

  // ── Status update helper
  const updateStatus = useCallback(async (
    id: string,
    status: CommunityIdea['status'],
    extras: Partial<CommunityIdea> = {}
  ) => {
    setIdeas(prev => prev.map(i => i.id === id ? { ...i, isUpdating: true } : i));
    const { error } = await supabase
      .from('community_ideas')
      .update({ status, ...extras })
      .eq('id', id);
    if (error) {
      showToast(`Error: ${error.message}`);
      setIdeas(prev => prev.map(i => i.id === id ? { ...i, isUpdating: false } : i));
    } else {
      showToast(`Status updated to ${status}`);
      await loadIdeas();
    }
  }, [showToast, loadIdeas]);

  // ── Set as today's winner
  const setWinner = useCallback(async (id: string) => {
    const currentDay = getChallengeDay();
    await updateStatus(id, 'winning', { day_number: currentDay });
    // Update challenge_config
    await supabase
      .from('challenge_config')
      .update({ current_day_winner_id: id })
      .eq('id', 1);
    showToast('Set as today\'s winner and updated challenge config');
  }, [updateStatus, showToast]);

  // ── Mark as live with feature details
  const markLive = useCallback(async (id: string) => {
    if (!featureName.trim()) { showToast('Enter a feature name first'); return; }
    await updateStatus(id, 'live', {
      feature_name: featureName.trim(),
      feature_description: featureDesc.trim() || null,
      built_date: new Date().toISOString(),
    });
    setFeatureName('');
    setFeatureDesc('');
    setEditingId(null);
  }, [featureName, featureDesc, updateStatus, showToast]);

  // ── Screenshot upload
  const handleUpload = useCallback(async (id: string, file: File) => {
    setUploadingId(id);
    const ext = file.name.split('.').pop();
    const path = `community/${id}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from('screenshots')
      .upload(path, file, { upsert: true });
    if (uploadError) {
      showToast(`Upload failed: ${uploadError.message}`);
    } else {
      const { data: urlData } = supabase.storage.from('screenshots').getPublicUrl(path);
      await supabase
        .from('community_ideas')
        .update({ screenshot_url: urlData.publicUrl })
        .eq('id', id);
      showToast('Screenshot uploaded');
      await loadIdeas();
    }
    setUploadingId(null);
  }, [showToast, loadIdeas]);

  // ── Advance day (clears current winner)
  const advanceDay = useCallback(async () => {
    if (!confirm('Advance the day? This clears the current winner so a new one can be set.')) return;
    await supabase
      .from('challenge_config')
      .update({ current_day_winner_id: null })
      .eq('id', 1);
    showToast('Day advanced — set a new winner for today');
  }, [showToast]);

  // ── Loading states
  if (authLoading || !authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-6 h-6 rounded-full border-2 border-accent-blue border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!isAdmin) return null;

  const statusGroups: { label: string; statuses: CommunityIdea['status'][] }[] = [
    { label: 'Pending (voting)', statuses: ['pending'] },
    { label: 'Today\'s winner', statuses: ['winning'] },
    { label: 'Building', statuses: ['building'] },
    { label: 'Live', statuses: ['live'] },
    { label: 'Rejected', statuses: ['rejected'] },
  ];

  const currentDay = getChallengeDay();

  return (
    <div className="min-h-screen bg-background">
      <Toast message={toast} onDismiss={() => setToast(null)} />

      {/* Hidden file input */}
      <input
        ref={fileRef}
        type="file"
        accept="image/*,.gif"
        className="hidden"
        onChange={e => {
          const file = e.target.files?.[0];
          if (file && uploadingId) handleUpload(uploadingId, file);
          e.target.value = '';
        }}
      />

      {/* Nav */}
      <nav className="border-b border-border-gray bg-background sticky top-0 z-30">
        <div className="max-w-[1200px] mx-auto px-4 md:px-6 flex items-center justify-between h-[52px]">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2">
              <Logo size={24} variant="dark" />
            </Link>
            <div className="w-px h-4" style={{ background: 'var(--border-gray)' }} />
            <span className="text-[13px] font-semibold" style={{ color: 'var(--brand-navy)' }}>
              Admin · Community Challenge
            </span>
            <span
              className="text-[10px] font-medium px-2 py-0.5 rounded-full"
              style={{ background: 'rgba(37,99,235,0.10)', color: 'var(--accent-blue)' }}
            >
              Day {currentDay}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link href="/community" className="text-[12px]" style={{ color: 'var(--muted-text)' }}>
              View community page →
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-[1000px] mx-auto px-4 md:px-6 py-8">
        {/* Controls bar */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <h1 className="text-[20px] font-semibold" style={{ color: 'var(--brand-navy)', letterSpacing: '-0.02em' }}>
            Idea management
          </h1>
          <div className="flex items-center gap-2">
            <button
              onClick={loadIdeas}
              className="px-3 py-1.5 rounded-lg border text-[12px] font-medium transition-colors"
              style={{ borderColor: 'var(--border-gray)', color: 'var(--muted-text)', background: 'var(--surface-gray)' }}
            >
              Refresh
            </button>
            <button
              onClick={advanceDay}
              className="px-3 py-1.5 rounded-lg border text-[12px] font-medium transition-colors"
              style={{ borderColor: 'var(--amber-warning)', color: 'var(--amber-warning)', background: 'rgba(217,119,6,0.06)' }}
            >
              Advance day →
            </button>
          </div>
        </div>

        {loading ? (
          <div className="space-y-2">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-20 rounded-xl animate-pulse" style={{ background: 'var(--surface-gray)' }} />
            ))}
          </div>
        ) : (
          <div className="space-y-8">
            {statusGroups.map(group => {
              const groupIdeas = ideas.filter(i => group.statuses.includes(i.status));
              if (groupIdeas.length === 0) return null;
              return (
                <div key={group.label}>
                  <h2
                    className="text-[11px] font-semibold uppercase tracking-[0.08em] mb-3"
                    style={{ color: 'var(--text-tertiary)' }}
                  >
                    {group.label} ({groupIdeas.length})
                  </h2>
                  <div className="space-y-2">
                    {groupIdeas.map(idea => (
                      <div
                        key={idea.id}
                        className="rounded-xl border p-4"
                        style={{
                          background: 'var(--card-bg)',
                          borderColor: 'var(--border-gray)',
                          opacity: idea.isUpdating ? 0.5 : 1,
                        }}
                      >
                        {/* Idea text + meta */}
                        <div className="flex items-start gap-3 mb-3">
                          <div className="flex-1 min-w-0">
                            <p className="text-[13px] font-medium leading-snug mb-1" style={{ color: 'var(--brand-navy)' }}>
                              {idea.idea_text}
                            </p>
                            <div className="flex items-center gap-3 text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
                              {idea.tiktok_username && <span>@{idea.tiktok_username}</span>}
                              <span className="font-semibold" style={{ color: 'var(--brand-navy)' }}>
                                {idea.vote_count} votes
                              </span>
                              <span>{new Date(idea.date_submitted).toLocaleDateString()}</span>
                              {idea.day_number && <span>Day {idea.day_number}</span>}
                            </div>
                          </div>

                          {/* Action buttons */}
                          <div className="flex flex-wrap gap-1.5 flex-shrink-0">
                            {idea.status === 'pending' && (
                              <>
                                <button
                                  onClick={() => setWinner(idea.id)}
                                  className="px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors"
                                  style={{ background: 'rgba(217,119,6,0.10)', color: '#D97706', border: '1px solid rgba(217,119,6,0.25)' }}
                                >
                                  Set as winner
                                </button>
                                <button
                                  onClick={() => updateStatus(idea.id, 'rejected')}
                                  className="px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors"
                                  style={{ background: 'var(--error-bg)', color: 'var(--error-text)', border: '1px solid var(--error-border)' }}
                                >
                                  Reject
                                </button>
                              </>
                            )}
                            {idea.status === 'winning' && (
                              <button
                                onClick={() => updateStatus(idea.id, 'building')}
                                className="px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors"
                                style={{ background: 'rgba(37,99,235,0.10)', color: 'var(--accent-blue)', border: '1px solid rgba(37,99,235,0.25)' }}
                              >
                                Mark as building
                              </button>
                            )}
                            {(idea.status === 'building' || idea.status === 'winning') && (
                              <button
                                onClick={() => setEditingId(editingId === idea.id ? null : idea.id)}
                                className="px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors"
                                style={{ background: 'rgba(22,163,74,0.10)', color: '#16A34A', border: '1px solid rgba(22,163,74,0.25)' }}
                              >
                                Mark live →
                              </button>
                            )}
                            {idea.status === 'live' && (
                              <button
                                onClick={() => {
                                  setUploadingId(idea.id);
                                  fileRef.current?.click();
                                }}
                                disabled={uploadingId === idea.id}
                                className="px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors"
                                style={{ background: 'var(--surface-gray)', color: 'var(--muted-text)', border: '1px solid var(--border-gray)' }}
                              >
                                {uploadingId === idea.id ? 'Uploading…' : 'Upload screenshot'}
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Screenshot thumbnail */}
                        {idea.screenshot_url && (
                          <div className="mb-3">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={idea.screenshot_url}
                              alt="Feature screenshot"
                              className="h-20 rounded-lg object-cover border"
                              style={{ borderColor: 'var(--border-gray)' }}
                            />
                          </div>
                        )}

                        {/* Mark live form */}
                        {editingId === idea.id && (
                          <div className="mt-3 pt-3 border-t" style={{ borderColor: 'var(--border-gray)' }}>
                            <div className="flex gap-2 flex-wrap">
                              <input
                                value={featureName}
                                onChange={e => setFeatureName(e.target.value)}
                                placeholder="Feature name *"
                                className="flex-1 min-w-[160px] rounded-lg border px-3 py-1.5 text-[12px] outline-none"
                                style={{ background: 'var(--background)', borderColor: 'var(--border-gray)', color: 'var(--brand-navy)' }}
                              />
                              <input
                                value={featureDesc}
                                onChange={e => setFeatureDesc(e.target.value)}
                                placeholder="One-line description"
                                className="flex-1 min-w-[200px] rounded-lg border px-3 py-1.5 text-[12px] outline-none"
                                style={{ background: 'var(--background)', borderColor: 'var(--border-gray)', color: 'var(--brand-navy)' }}
                              />
                              <button
                                onClick={() => markLive(idea.id)}
                                className="px-3 py-1.5 rounded-lg text-[12px] font-medium"
                                style={{ background: '#16A34A', color: '#fff' }}
                              >
                                Confirm live
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

            {ideas.length === 0 && (
              <div
                className="rounded-xl border p-12 text-center"
                style={{ background: 'var(--card-bg)', borderColor: 'var(--border-gray)' }}
              >
                <p className="text-[13px]" style={{ color: 'var(--muted-text)' }}>
                  No ideas yet. Run the SQL seed in supabase/community.sql to add sample data.
                </p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
