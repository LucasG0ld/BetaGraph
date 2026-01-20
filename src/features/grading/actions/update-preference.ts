'use server';

import { createSupabaseServer } from '@/lib/supabase/server';
import { z } from 'zod';
import { GradeSystemSchema } from '../constants/grades';

/**
 * Schéma de validation pour la mise à jour de préférence.
 */
const UpdatePreferenceSchema = z.object({
    preferredSystem: GradeSystemSchema,
});

/**
 * Résultat de la mise à jour de préférence.
 */
interface UpdatePreferenceResult {
    success: boolean;
    error?: string;
}

/**
 * Server Action pour mettre à jour la préférence de système de cotation.
 * 
 * @description
 * Met à jour la colonne `preferred_grading_system` dans la table `profiles`.
 * Nécessite une session utilisateur authentifiée.
 * 
 * @param preferredSystem - Le nouveau système préféré ('fontainebleau' | 'v_scale')
 * @returns Succès ou erreur
 * 
 * @example
 * ```tsx
 * const result = await updateUserPreference('v_scale');
 * if (result.success) {
 *   toast.success('Préférence sauvegardée');
 * }
 * ```
 */
export async function updateUserPreference(
    preferredSystem: 'fontainebleau' | 'v_scale'
): Promise<UpdatePreferenceResult> {
    try {
        // Validation Zod
        const parsed = UpdatePreferenceSchema.safeParse({ preferredSystem });
        if (!parsed.success) {
            return {
                success: false,
                error: 'Système de cotation invalide',
            };
        }

        // Client Supabase côté serveur
        const supabase = await createSupabaseServer();

        // Vérifier la session
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return {
                success: false,
                error: 'Vous devez être connecté pour modifier vos préférences',
            };
        }

        // Mise à jour du profil
        const { error: updateError } = await supabase
            .from('profiles')
            .update({ preferred_grading_system: parsed.data.preferredSystem })
            .eq('id', user.id);

        if (updateError) {
            console.error('[updateUserPreference] Update error:', updateError);
            return {
                success: false,
                error: 'Erreur lors de la sauvegarde de la préférence',
            };
        }

        return { success: true };
    } catch (error) {
        console.error('[updateUserPreference] Unexpected error:', error);
        return {
            success: false,
            error: 'Une erreur inattendue est survenue',
        };
    }
}

/**
 * Server Action pour récupérer la préférence utilisateur depuis la DB.
 * 
 * @description
 * Utilisé pour hydrater le store client avec la vraie valeur DB.
 * Retourne 'fontainebleau' par défaut si non connecté.
 * 
 * @returns Le système préféré de l'utilisateur
 */
export async function getUserPreference(): Promise<'fontainebleau' | 'v_scale'> {
    try {
        const supabase = await createSupabaseServer();

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return 'fontainebleau';
        }

        const { data: profile } = await supabase
            .from('profiles')
            .select('preferred_grading_system')
            .eq('id', user.id)
            .single();

        return profile?.preferred_grading_system ?? 'fontainebleau';
    } catch {
        return 'fontainebleau';
    }
}
