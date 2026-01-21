import { cn } from '@/lib/utils';
import React from 'react';

interface SectionHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
    title: string;
    subtitle?: string;
    align?: 'left' | 'center' | 'right';
}

/**
 * SectionHeader
 * Wrapper component for section titles.
 * Serves as an adapter for future animated text components (Vendor).
 */
export function SectionHeader({
    title,
    subtitle,
    align = 'left',
    className,
    ...props
}: SectionHeaderProps) {
    return (
        <div
            className={cn(
                "flex flex-col mb-8",
                {
                    'items-start text-left': align === 'left',
                    'items-center text-center': align === 'center',
                    'items-end text-right': align === 'right',
                },
                className
            )}
            {...props}
        >
            <h2 className={cn(
                "text-2xl md:text-3xl font-bold tracking-tight mb-2",
                "bg-gradient-to-r from-white via-white to-brand-gray-400 bg-clip-text text-transparent"
            )}>
                {title}
            </h2>
            {subtitle && (
                <p className="text-sm md:text-base text-brand-gray-400 max-w-lg">
                    {subtitle}
                </p>
            )}

            {/* Semantic Divider for "Tech" feel */}
            <div className="h-1 w-12 bg-brand-accent-cyan/50 mt-4 rounded-full shadow-glow-cyan" />
        </div>
    );
}
