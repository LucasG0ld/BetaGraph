import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import React from 'react';

const badgeVariants = cva(
    'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
    {
        variants: {
            variant: {
                default:
                    'bg-brand-gray-800 text-white border border-brand-gray-700',
                solid:
                    'bg-brand-accent-cyan text-brand-black hover:bg-brand-accent-cyan/80',
                outline:
                    'text-brand-accent-cyan border border-brand-accent-cyan/50 hover:bg-brand-accent-cyan/10',
                neon:
                    'bg-brand-black text-brand-accent-neon border border-brand-accent-neon/50 shadow-glow-neon',
                glass:
                    'bg-white/10 text-white backdrop-blur-sm border border-white/20',
                error:
                    'bg-brand-black text-brand-accent-pink border border-brand-accent-pink/50 shadow-glow-pink',
            },
        },
        defaultVariants: {
            variant: 'default',
        },
    }
);

export interface BadgeProps
    extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> { }

export function Badge({ className, variant, ...props }: BadgeProps) {
    return (
        <div className={cn(badgeVariants({ variant }), className)} {...props} />
    );
}
