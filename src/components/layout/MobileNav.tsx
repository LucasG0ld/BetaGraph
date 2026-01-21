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

export function MobileNav({ className }: { className?: string }) {
    const pathname = usePathname();

    return (
        <nav
            className={cn(
                'fixed bottom-0 left-0 right-0 z-50 border-t border-brand-gray-700/50 bg-brand-black/80 backdrop-blur-md pb-safe',
                className
            )}
        >
            <div className="flex h-16 items-center justify-around px-2">
                {NAV_ITEMS.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                'flex flex-1 flex-col items-center justify-center gap-1 py-1 transition-colors',
                                isActive
                                    ? 'text-brand-accent-cyan'
                                    : 'text-brand-gray-400 hover:text-brand-gray-200'
                            )}
                        >
                            <div className={cn(
                                "relative p-1.5 rounded-full transition-all duration-300",
                                isActive && "bg-brand-accent-cyan/10 shadow-glow-cyan"
                            )}>
                                <Icon className="h-5 w-5" />
                            </div>
                            <span className="text-[10px] font-medium">
                                {item.label}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
