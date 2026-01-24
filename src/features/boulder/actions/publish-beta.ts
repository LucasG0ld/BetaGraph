'use server';

import { createSupabaseServer } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const publishSchema = z.object({
    betaId: z.string().uuid(),
    thumbnailUrl: z.string().url(),
});

export type PublishState = {
    success?: boolean;
    error?: string;
};

/**
 * Publie une beta (rend publique) et met à jour sa miniature.
 */
export async function publishBeta(
    betaId: string,
    thumbnailUrl: string
): Promise<PublishState> {
    const validation = publishSchema.safeParse({ betaId, thumbnailUrl });

    if (!validation.success) {
        return { error: 'Données invalides' };
    }

    const supabase = await createSupabaseServer();

    // Vérifier l'auth (RLS le fera aussi, mais bon)
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
        return { error: 'Non authentifié' };
    }

    // Update DB
    const { error: dbError } = await supabase
        .from('betas')
        .update({
            is_public: true,
            thumbnail_url: thumbnailUrl,
            updated_at: new Date().toISOString(),
        })
        .eq('id', betaId)
        .eq('user_id', user.id); // Sécurité extra

    if (dbError) {
        console.error('Error publishing beta:', dbError);
        return { error: 'Erreur lors de la publication' };
    }

    // Revalidation
    revalidatePath('/dashboard');
    revalidatePath(`/boulder/${betaId}`); // Si on a une page publique
    revalidatePath(`/beta/${betaId}`); // Au cas où

    return { success: true };
}
