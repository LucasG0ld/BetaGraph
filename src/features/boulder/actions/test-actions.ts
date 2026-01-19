'use server';

import { createSupabaseServer } from '@/lib/supabase/server';
import { type DrawingData } from '@/lib/schemas/drawing.schema';

/**
 * Action de test pour simuler une mise à jour distante (conflit).
 * FORCE la mise à jour des données sans vérifier le timestamp.
 */
export async function forceUpdateBeta(betaId: string) {
    const supabase = await createSupabaseServer();

    // 1. Récupérer les données actuelles
    const { data: currentBeta, error: fetchError } = await supabase
        .from('betas')
        .select('drawing_data, user_id')
        .eq('id', betaId)
        .single();

    if (fetchError || !currentBeta) {
        return { success: false, error: 'Beta introuvable' };
    }

    const currentDrawingData = currentBeta.drawing_data as DrawingData;

    // 2. Modifier les données (Ajouter une forme "Server Update")
    // On simule une modification faite par un autre appareil
    const newDrawingData: DrawingData = {
        ...currentDrawingData,
        shapes: [
            ...currentDrawingData.shapes,
            {
                id: `server-update-${Date.now()}`,
                type: 'circle',
                center: { x: 50, y: 50 },
                radius: 5, // 5% de la largeur
                color: '#ef4444', // Rouge (Tailwind red-500)
            }
        ]
    };

    // 3. Update FORCÉ (sans clause where updated_at)
    const { data, error } = await supabase
        .from('betas')
        .update({
            drawing_data: newDrawingData,
            // updated_at sera mis à jour automatiquement par le trigger
        })
        .eq('id', betaId)
        .select('updated_at')
        .single();

    if (error) {
        return { success: false, error: error.message };
    }

    return { success: true, updatedAt: data.updated_at };
}
