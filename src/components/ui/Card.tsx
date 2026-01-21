import { cn } from '@/lib/utils';
import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    isLoading?: boolean;
    children?: React.ReactNode;
}

export function Card({ className, isLoading, children, ...props }: CardProps) {
    if (isLoading) {
        return (
            <SkeletonCard className={className} />
        );
    }

    return (
        <article
            className={cn(
                'relative group overflow-hidden rounded-xl border border-brand-gray-700/50 bg-brand-black',
                'transition-all duration-300 ease-out',
                'hover:border-brand-accent-cyan/50 hover:shadow-glow-cyan',
                className
            )}
            {...props}
        >
            {/* Glassmorphism Overlay (Optional, can be used by children) */}
            {children}
        </article>
    );
}

function SkeletonCard({ className }: { className?: string }) {
    return (
        <div
            className={cn(
                'rounded-xl border border-brand-gray-800 bg-brand-gray-900 animate-pulse',
                className
            )}
        >
            <div className="h-full w-full opacity-50 bg-brand-gray-800" />
        </div>
    );
}

export function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
    return <div className={cn("p-4 relative z-10", className)} {...props} />;
}

export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
    return <div className={cn("flex flex-col space-y-1.5 p-4", className)} {...props} />;
}

export function CardFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
    return <div className={cn("flex items-center p-4 pt-0", className)} {...props} />;
}
