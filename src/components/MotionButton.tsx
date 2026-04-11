'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { forwardRef } from 'react';

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  children: React.ReactNode;
  variant?: 'default' | 'icon';
};

export const MotionButton = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ children, className, variant = 'default', ...props }, ref) => {
    const reduce = useReducedMotion();
    const isIcon = variant === 'icon';

    return (
      <motion.button
        ref={ref}
        className={className}
        whileHover={reduce ? undefined : { scale: isIcon ? 1.08 : 1.01 }}
        whileTap={reduce ? undefined : { scale: isIcon ? 0.92 : 0.97 }}
        transition={{ type: 'spring', stiffness: isIcon ? 600 : 500, damping: isIcon ? 25 : 30 }}
        {...(props as React.ComponentPropsWithoutRef<typeof motion.button>)}
      >
        {children}
      </motion.button>
    );
  }
);
MotionButton.displayName = 'MotionButton';
