'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useToastStore, type Toast as ToastType } from '@/features/shared/store/useToastStore';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

/**
 * Single Toast Item
 */
function ToastItem({ toast, onRemove }: { toast: ToastType; onRemove: (id: string) => void }) {
    const isError = toast.type === 'error';
    const isSuccess = toast.type === 'success';

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20, scale: 0.9 }}
            className={cn(
                'pointer-events-auto flex items-center w-full max-w-sm rounded-lg border p-4 shadow-lg backdrop-blur-md',
                'bg-brand-black/90 border-brand-gray-700',
                isSuccess && 'border-brand-accent-neon/50 shadow-glow-neon',
                isError && 'border-brand-accent-pink/50 shadow-glow-pink',
                toast.type === 'info' && 'border-brand-accent-cyan/50 shadow-glow-cyan'
            )}
            role="alert"
        >
            <div className="flex-1 text-sm font-medium text-white">
                {toast.message}
            </div>
            <button
                onClick={() => onRemove(toast.id)}
                className="ml-4 text-brand-gray-400 hover:text-white"
            >
                ✕
            </button>
        </motion.div>
    );
}

/**
 * Global Toaster Container
 */
export function Toaster() {
    const { toasts, removeToast } = useToastStore();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    return createPortal(
        <div className="fixed bottom-0 right-0 z-[100] flex flex-col gap-2 p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]">
            <AnimatePresence mode="popLayout">
                {toasts.map((toast) => (
                    <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
                ))}
            </AnimatePresence>
        </div>,
        document.body
    );
}
