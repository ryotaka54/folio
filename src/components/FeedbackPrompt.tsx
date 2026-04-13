'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  userId: string;
  applicationCount: number;
}

const STORAGE_KEY = 'applyd_feedback_v1';
const TRIGGER_AT = 5; // show after Nth application

const RATINGS = [
  { emoji: '😍', label: 'Love it', value: 'love' },
  { emoji: '🤔', label: "It's okay", value: 'okay' },
  { emoji: '😕', label: 'Not great', value: 'meh' },
];

export default function FeedbackPrompt({ userId, applicationCount }: Props) {
  const [visible, setVisible] = useState(false);
  const [rating, setRating] = useState<string | null>(null);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Decide whether to show the prompt
  useEffect(() => {
    if (applicationCount < TRIGGER_AT) return;
    if (typeof window === 'undefined') return;
    const state = localStorage.getItem(STORAGE_KEY);
    if (state === 'done' || state === 'dismissed') return;

    // Delay slightly so it doesn't collide with the "added" toast
    const t = setTimeout(() => setVisible(true), 1500);
    return () => clearTimeout(t);
  }, [applicationCount]);

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, 'dismissed');
    setVisible(false);
  };

  const handleRating = (value: string) => {
    setRating(value);
  };

  const handleSubmit = async () => {
    if (!rating || submitting) return;
    setSubmitting(true);
    try {
      await supabase.from('feedback').insert({
        user_id: userId,
        rating,
        comment: comment.trim() || null,
        source: 'in_app_prompt_v1',
      });
    } catch {
      // Non-critical — don't surface errors to users
    } finally {
      localStorage.setItem(STORAGE_KEY, 'done');
      setSubmitted(true);
      setSubmitting(false);
      // Auto-close after showing thank-you
      setTimeout(() => setVisible(false), 2000);
    }
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.97 }}
          transition={{ type: 'spring', stiffness: 340, damping: 28 }}
          className="fixed bottom-20 lg:bottom-6 right-4 lg:right-6 z-40 w-[300px] rounded-2xl shadow-2xl overflow-hidden"
          style={{ background: 'var(--card-bg)', border: '1px solid var(--border-gray)' }}
          role="dialog"
          aria-label="Quick feedback"
        >
          {/* Top accent */}
          <div className="h-0.5 w-full" style={{ background: 'linear-gradient(90deg, var(--accent-blue), #6366f1)' }} />

          <div className="px-4 py-4">
            {submitted ? (
              /* ── Thank-you state ── */
              <div className="flex flex-col items-center py-2 gap-2 text-center">
                <span className="text-2xl">🙏</span>
                <p className="text-[13px] font-semibold" style={{ color: 'var(--brand-navy)' }}>
                  Thanks for the feedback!
                </p>
                <p className="text-[11px]" style={{ color: 'var(--muted-text)' }}>
                  It really helps us improve.
                </p>
              </div>
            ) : (
              /* ── Prompt state ── */
              <>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-[13px] font-semibold" style={{ color: 'var(--brand-navy)' }}>
                      How's Applyd working for you?
                    </p>
                    <p className="text-[11px] mt-0.5" style={{ color: 'var(--muted-text)' }}>
                      Takes 5 seconds — honest answers only.
                    </p>
                  </div>
                  <button
                    onClick={dismiss}
                    className="p-1 -mt-0.5 -mr-1 rounded hover:bg-surface-gray transition-colors flex-shrink-0"
                    style={{ color: 'var(--text-tertiary)' }}
                    aria-label="Dismiss"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                </div>

                {/* Emoji buttons */}
                <div className="flex gap-2 mb-3">
                  {RATINGS.map(r => (
                    <button
                      key={r.value}
                      onClick={() => handleRating(r.value)}
                      className="flex-1 flex flex-col items-center gap-1 py-2 rounded-xl border transition-all"
                      style={{
                        borderColor: rating === r.value ? 'var(--accent-blue)' : 'var(--border-gray)',
                        background: rating === r.value ? 'rgba(37,99,235,0.07)' : 'var(--surface-gray)',
                        transform: rating === r.value ? 'scale(1.05)' : 'scale(1)',
                      }}
                      aria-pressed={rating === r.value}
                      title={r.label}
                    >
                      <span className="text-xl leading-none">{r.emoji}</span>
                      <span
                        className="text-[9px] font-semibold"
                        style={{ color: rating === r.value ? 'var(--accent-blue)' : 'var(--text-tertiary)' }}
                      >
                        {r.label}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Optional free-text — only after rating selected */}
                <AnimatePresence>
                  {rating && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.18 }}
                    >
                      <textarea
                        value={comment}
                        onChange={e => setComment(e.target.value)}
                        placeholder={
                          rating === 'love'
                            ? 'What do you like most? (optional)'
                            : rating === 'okay'
                            ? "What could be better? (optional)"
                            : "What's not working? (optional)"
                        }
                        rows={2}
                        className="w-full px-3 py-2 rounded-lg text-[12px] resize-none focus:outline-none focus:ring-2 focus:ring-accent-blue/20 transition-colors mb-2.5"
                        style={{
                          background: 'var(--background)',
                          border: '1px solid var(--border-gray)',
                          color: 'var(--brand-navy)',
                        }}
                      />
                      <button
                        onClick={handleSubmit}
                        disabled={submitting}
                        className="w-full h-8 rounded-lg text-[12px] font-semibold text-white transition-opacity disabled:opacity-60"
                        style={{ background: 'var(--accent-blue)' }}
                      >
                        {submitting ? 'Sending…' : 'Send feedback'}
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
