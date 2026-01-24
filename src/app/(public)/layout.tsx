import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function PublicLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex flex-col h-screen overflow-hidden bg-brand-black text-white">
            <main className="flex-1 relative flex flex-col min-h-0">
                {children}
            </main>

            {/* Footer Minimaliste */}
            <footer className="z-30 py-3 px-4 bg-brand-black border-t border-brand-gray-800 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                    <span className="text-lg font-bold bg-gradient-to-r from-brand-accent-cyan to-brand-accent-purple bg-clip-text text-transparent">
                        BetaGraph
                    </span>
                    <span className="text-xs text-brand-gray-500 hidden sm:inline">
                        — Visualiseur technique d&apos;escalade
                    </span>
                </div>

                <Link href="/create-boulder">
                    <Button variant="ghost" size="sm" className="text-xs text-brand-gray-300 hover:text-white">
                        Créer ma beta
                    </Button>
                </Link>
            </footer>
        </div>
    );
}
