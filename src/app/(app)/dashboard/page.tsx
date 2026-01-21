import { SectionHeader } from '@/components/ui/SectionHeader';
import { BoulderCard } from '@/features/boulder/components/BoulderCard';
import { EmptyDashboard } from '@/features/dashboard/components/EmptyDashboard';
import { createSupabaseServer } from '@/lib/supabase/server';
import type { Database } from '@/types/database.types';
import { redirect } from 'next/navigation';

type BetaWithBoulder = Database['public']['Tables']['betas']['Row'] & {
    boulders: Database['public']['Tables']['boulders']['Row'] | null;
};

export default async function DashboardPage() {
    // 1. Check Auth & Get User
    const supabase = await createSupabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        redirect('/login');
    }

    // 2. Fetch User's Betas (and joined Boulders)
    const { data: betasData, error: dbError } = await supabase
        .from('betas')
        .select(`
            *,
            boulders:boulders(*)
        `)
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

    if (dbError) {
        console.error('Error fetching dashboard data:', dbError);
        // Fallback simple en cas d'erreur
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] text-red-400">
                <p>Une erreur est survenue lors du chargement des données.</p>
            </div>
        );
    }

    // 3. Client-Side Dedup (Keep only latest beta per boulder)
    // Map guarantees insertion order iteration in ES6+, but we use a Set to track seen IDs for clarity
    const seenBoulderIds = new Set<string>();
    const latestBetas: BetaWithBoulder[] = [];

    // betasData is already ordered by updated_at DESC
    for (const beta of (betasData as BetaWithBoulder[])) {
        if (!beta.boulders) continue; // Skip orphaned betas

        if (!seenBoulderIds.has(beta.boulder_id)) {
            seenBoulderIds.add(beta.boulder_id);
            latestBetas.push(beta);
        }
    }

    return (
        <div className="space-y-8">
            <SectionHeader
                title="Mes Bêtas"
                subtitle="Retrouvez vos derniers blocs travaillés et analysez votre progression."
            />

            {latestBetas.length === 0 ? (
                <EmptyDashboard />
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {latestBetas.map((beta, index) => (
                        <BoulderCard
                            key={beta.id}
                            beta={beta}
                            index={index}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
