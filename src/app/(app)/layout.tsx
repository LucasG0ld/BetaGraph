'use client';

import { MobileNav } from '@/components/layout/MobileNav';
import { Navbar } from '@/components/layout/Navbar';
import { Toaster } from '@/components/ui/Toast';

export default function AppLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex min-h-screen flex-col bg-brand-black text-white">
            {/* Desktop Navigation */}
            <Navbar className="hidden md:flex" />

            {/* Main Content Area */}
            {/* pb-24 ensures content isn't hidden behind MobileNav */}
            <main className="flex-1 px-4 py-8 pb-24 sm:px-6 md:pb-8 lg:px-8">
                {children}
            </main>

            {/* Mobile Navigation */}
            <MobileNav className="md:hidden" />

            {/* Global Toaster */}
            <Toaster />
        </div>
    );
}
