'use client';

import { cn } from '@/lib/utils';
import { Home, Map, PlusSquare, User, type LucideIcon } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavItem {
    label: string;
    href: string;
    icon: LucideIcon;
}

const NAV_ITEMS: NavItem[] = [
    { label: 'Accueil', href: '/dashboard', icon: Home },
    { label: 'Explorer', href: '/explore', icon: Map },
    { label: 'Créer', href: '/create-boulder', icon: PlusSquare },
    { label: 'Profil', href: '/profile', icon: User },
];

export function Navbar({ className }: { className?: string }) {
    const pathname = usePathname();

    return (
        <nav
            className={cn(
                'sticky top-0 z-50 flex h-16 w-full items-center border-b border-brand-gray-700/50 bg-brand-black/80 backdrop-blur-md px-4 sm:px-6 lg:px-8',
                className
            )}
        >
            <div className="flex w-full items-center justify-between">
                {/* Logo */}
                <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-brand-accent-cyan to-brand-accent-primary" />
                    <span className="text-xl font-bold tracking-tight text-white">
                        BetaGraph
                    </span>
                </div>

                {/* Desktop Nav Items */}
                <div className="flex items-center gap-6">
                    {NAV_ITEMS.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href;

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    'group flex items-center gap-2 text-sm font-medium transition-colors hover:text-brand-accent-cyan',
                                    isActive
                                        ? 'text-brand-accent-cyan'
                                        : 'text-brand-gray-400'
                                )}
                            >
                                <Icon className="h-4 w-4" />
                                <span>{item.label}</span>
                            </Link>
                        );
                    })}
                </div>
            </div>
        </nav>
    );
}
