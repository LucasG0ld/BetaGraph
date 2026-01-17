"use client";

import { motion } from "framer-motion";
import { type ReactNode } from "react";

interface AuthLayoutProps {
    children: ReactNode;
    title: string;
    subtitle?: string;
}

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
    return (
        <div className="min-h-screen bg-brand-black flex items-center justify-center p-4">
            {/* Background gradient effects */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 -left-1/4 w-96 h-96 bg-brand-accent-cyan/5 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 -right-1/4 w-96 h-96 bg-brand-accent-neon/5 rounded-full blur-3xl" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="relative max-w-md w-full"
            >
                {/* Card container */}
                <div className="bg-brand-gray-900 border border-brand-gray-700 rounded-2xl p-8 shadow-2xl relative z-10">
                    {/* Title */}
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-white mb-2">{title}</h1>
                        {subtitle && <p className="text-brand-gray-300">{subtitle}</p>}
                    </div>

                    {/* Form content */}
                    {children}
                </div>

                {/* Decorative border glow */}
                <div className="absolute -inset-0.5 bg-gradient-to-r from-brand-accent-cyan/20 to-brand-accent-neon/20 rounded-2xl blur -z-0" />
            </motion.div>
        </div>
    );
}
