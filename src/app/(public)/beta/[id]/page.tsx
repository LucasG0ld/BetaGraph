import { createSupabaseServer } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { PublicViewer } from '@/features/public/components/PublicViewer';
import type { Metadata } from 'next';

interface PageProps {
    params: Promise<{ id: string }>;
}

async function getBetaData(id: string) {
    const supabase = await createSupabaseServer();

    // Récupérer la beta avec les infos du boulder et du créateur
    // RLS va filtrer automatiquement :
    // - Si public : visible par tous
    // - Si privé : visible uniquement par le créateur
    const { data: beta, error } = await supabase
        .from('betas')
        .select(`
            *,
            boulder:boulders (*),
            user:profiles (*)
        `)
        .eq('id', id)
        .single();

    if (error || !beta || !beta.boulder) {
        return null;
    }

    return beta;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { id } = await params;
    const beta = await getBetaData(id);

    if (!beta || !beta.boulder) {
        return {
            title: 'Beta introuvable | BetaGraph',
        };
    }

    const title = `${beta.boulder.name} (${beta.grade_value})`;
    const description = `Découvre la méthode de ${beta.user?.username || 'Inconnu'} pour le bloc ${beta.boulder.name}. ${beta.boulder.location || ''}`;

    return {
        title: `${title} | BetaGraph`,
        description: description,
        openGraph: {
            title: title,
            description: description,
            images: beta.thumbnail_url ? [beta.thumbnail_url] : [beta.boulder.image_url],
            type: 'article',
        },
        twitter: {
            card: 'summary_large_image',
            title: title,
            description: description,
            images: beta.thumbnail_url ? [beta.thumbnail_url] : [beta.boulder.image_url],
        },
    };
}

export default async function PublicBetaPage({ params }: PageProps) {
    const { id } = await params;
    const beta = await getBetaData(id);

    if (!beta) {
        notFound();
    }

    return <PublicViewer beta={beta} />;
}
