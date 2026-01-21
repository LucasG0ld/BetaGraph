import { Card } from '@/components/ui/Card';
import { PlusSquare } from 'lucide-react';
import Link from 'next/link';

export function EmptyDashboard() {
    return (
        <Card className="flex flex-col items-center justify-center p-12 text-center bg-brand-gray-900/30 border-dashed border-brand-gray-700">
            <div className="h-16 w-16 mb-6 rounded-full bg-brand-gray-800 flex items-center justify-center">
                <PlusSquare className="h-8 w-8 text-brand-accent-cyan" />
            </div>

            <h3 className="text-xl font-bold text-white mb-2">
                Aucun bloc pour le moment
            </h3>
            <p className="text-brand-gray-400 mb-8 max-w-sm">
                Commencez votre collection en créant votre première bêta. Tracez vos lignes et analysez votre progression.
            </p>

            <Link
                href="/create-boulder"
                className="inline-flex items-center gap-2 px-6 py-3 bg-brand-accent-cyan text-brand-black font-bold rounded-lg hover:bg-brand-accent-cyan/90 transition-colors shadow-glow-cyan"
            >
                <PlusSquare className="h-4 w-4" />
                Créer un bloc
            </Link>
        </Card>
    );
}
