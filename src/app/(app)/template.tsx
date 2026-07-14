'use client';

import { motion, useReducedMotion } from 'framer-motion';

// IMPORTANT: Only animate opacity — never transform or filter here.
// Any CSS transform or filter on a parent creates a new containing block,
// which breaks position:fixed on dnd-kit DragOverlay and modals.
export default function Template({ children }: { children: React.ReactNode }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={reduce ? { duration: 0 } : { duration: 0.18, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );
}
