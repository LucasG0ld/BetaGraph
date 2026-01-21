import { SectionHeader } from '@/components/ui/SectionHeader';
import { BoulderForm } from '@/features/boulder/components/BoulderForm';
import { createSupabaseServer } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function NewBoulderPage() {
    // 1. Vérification auth serveur (Redondant avec middleware mais Best Practice)
    const supabase = await createSupabaseServer();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
        redirect('/login');
    }

    return (
        <div className="container mx-auto max-w-4xl py-8">
            <SectionHeader
                title="Nouveau Bloc"
                subtitle="Capturez l'instant, tracez la ligne."
                align="center"
                className="mb-12"
            />

            <BoulderForm />
        </div>
    );
}
