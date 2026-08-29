import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { STAGE_PILL_VARIANT, type PillVariant } from '@/lib/constants';

const badgeVariants = cva(
  'inline-flex items-center gap-[5px] whitespace-nowrap rounded-full font-medium leading-none tracking-[-0.005em]',
  {
    variants: {
      variant: {
        neutral: 'text-[var(--pill-neutral-fg)] bg-[var(--pill-neutral-bg)]',
        slate:   'text-[var(--pill-slate-fg)] bg-[var(--pill-slate-bg)]',
        indigo:  'text-[var(--pill-indigo-fg)] bg-[var(--pill-indigo-bg)]',
        violet:  'text-[var(--pill-violet-fg)] bg-[var(--pill-violet-bg)]',
        amber:   'text-[var(--pill-amber-fg)] bg-[var(--pill-amber-bg)]',
        green:   'text-[var(--pill-green-fg)] bg-[var(--pill-green-bg)]',
        red:     'text-[var(--pill-red-fg)] bg-[var(--pill-red-bg)]',
        pink:    'text-[var(--pill-pink-fg)] bg-[var(--pill-pink-bg)]',
      },
      size: {
        sm: 'text-[11px] px-[7px] py-[2px]',
        md: 'text-[12px] px-[9px] py-[3px]',
      },
    },
    defaultVariants: { variant: 'neutral', size: 'md' },
  },
);

interface BadgeProps
  extends React.ComponentProps<'span'>,
    VariantProps<typeof badgeVariants> {
  /** Show the small colored dot to the left of the label (default true). */
  dot?: boolean;
}

function Badge({ className, variant, size, dot = true, children, ...props }: BadgeProps) {
  const v = variant ?? 'neutral';
  return (
    <span className={cn(badgeVariants({ variant: v, size }), className)} {...props}>
      {dot && (
        <span
          className="h-[6px] w-[6px] flex-shrink-0 rounded-full"
          style={{ background: `var(--pill-${v}-dot)` }}
        />
      )}
      {children}
    </span>
  );
}

/** Badge pre-wired to a pipeline stage name — looks up its semantic color automatically. */
function StageBadge({ stage, size = 'md', className }: { stage: string; size?: 'sm' | 'md'; className?: string }) {
  const variant: PillVariant = STAGE_PILL_VARIANT[stage] ?? 'neutral';
  return (
    <Badge variant={variant} size={size} className={className}>
      {stage}
    </Badge>
  );
}

export { Badge, StageBadge, badgeVariants };
