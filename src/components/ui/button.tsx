import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue/50 disabled:pointer-events-none disabled:opacity-50 select-none active:scale-[0.97]',
  {
    variants: {
      variant: {
        default:     'bg-accent-blue text-white hover:bg-accent-blue-hover [transition:background_220ms_ease,transform_120ms_ease,box-shadow_220ms_ease] hover:shadow-[0_4px_14px_rgba(37,99,235,0.35)]',
        destructive: 'bg-red-600 text-white hover:bg-red-700 [transition:background_220ms_ease,transform_120ms_ease]',
        outline:     'border border-border-gray bg-background text-brand-navy hover:bg-surface-gray hover:border-border-emphasis [transition:background_220ms_ease,border-color_220ms_ease,transform_120ms_ease]',
        secondary:   'bg-surface-gray text-brand-navy hover:bg-border-gray [transition:background_220ms_ease,transform_120ms_ease]',
        ghost:       'text-muted-text hover:bg-surface-gray hover:text-brand-navy [transition:background_220ms_ease,color_220ms_ease,transform_120ms_ease]',
        link:        'text-accent-blue underline-offset-4 hover:underline [transition:color_220ms_ease]',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm:      'h-9 rounded-md px-3',
        lg:      'h-11 rounded-md px-8 text-base',
        icon:    'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = 'Button';

export { Button, buttonVariants };
