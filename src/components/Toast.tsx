'use client';

import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';

interface ToastProps {
  message: string | null;
  onDismiss: () => void;
  onUndo?: () => void;
}

export default function Toast({ message, onDismiss, onUndo }: ToastProps) {
  const reduce = useReducedMotion();

  return (
    <AnimatePresence>
      {message && (
        <motion.div
          className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-2.5 rounded-lg shadow-lg pointer-events-auto"
          style={{ background: '#0F172A', color: '#F9FAFB', border: '1px solid rgba(255,255,255,0.08)' }}
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.95 }}
          animate={reduce ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
          exit={reduce ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.95 }}
          transition={reduce
            ? { duration: 0.01 }
            : { type: 'spring', stiffness: 400, damping: 28 }
          }
        >
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
      </svg>
      <span className="text-[13px] font-medium">{message}</span>
      {onUndo && (
        <button
          onClick={onUndo}
          className="text-[12px] font-semibold underline underline-offset-2 opacity-80 hover:opacity-100 transition-opacity"
        >
          Undo
        </button>
      )}
      <button
        onClick={onDismiss}
        className="ml-1 opacity-50 hover:opacity-100 transition-opacity"
        aria-label="Dismiss"
      >
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
