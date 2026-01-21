'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import React from 'react';

/**
 * LoadingScreen "Cyberpunk" Style
 * Uses SVG stroke animation for a tech feel.
 */
export function LoadingScreen({ className }: { className?: string }) {
    return (
        <div className={cn("flex flex-col items-center justify-center p-8", className)}>
            <div className="relative w-16 h-16">
                {/* Outer Ring */}
                <motion.div
                    className="absolute inset-0 border-2 border-brand-gray-700 rounded-full"
                    animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                />

                {/* Rotating Segment */}
                <motion.div
                    className="absolute inset-0 border-t-2 border-brand-accent-cyan rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                />

                {/* Inner Pulse */}
                <motion.div
                    className="absolute inset-4 bg-brand-accent-cyan/20 rounded-full blur-sm"
                    animate={{ opacity: [0.2, 0.8, 0.2] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                />
            </div>
            <div className="mt-4 text-xs font-mono text-brand-accent-cyan tracking-widest animate-pulse">
                INITIALIZING...
            </div>
        </div>
    );
}
