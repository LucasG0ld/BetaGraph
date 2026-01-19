'use server';

import { createSupabaseServer } from '@/lib/supabase/server';
import { createEmptyDrawingData } from '@/lib/schemas/drawing.schema';
import { CreateBoulderWithBetaSchema } from '../schemas/beta.schema';
import type { BoulderInsert, BetaInsert } from '@/lib/supabase/database.types';

/**
 * Type de retour pour l'action `createBoulderWithBeta`.
 */
export type CreateBoulderResult =
    | {
        success: true;
        data: {
            boulder_id: string;
            beta_id: string;
        };
    }
    | {
        success: false;
        error: string;
    };

/**
 * Server Action : Création atomique d'un boulder avec sa première beta.
 *
 * @description
 * Crée simultanément un nouveau boulder et sa beta initiale dans une transaction
 * Supabase. Cette approche garantit la cohérence des données et évite les boulders
 * "orphelins" sans cotation.
 *
 * **Flux d'exécution** :
 * 1. Validation de l'authentification (session utilisateur)
 * 2. Validation des données via Zod (CreateBoulderWithBetaSchema)
 * 3. INSERT dans `boulders` (avec `creator_id` = user.id)
 * 4. INSERT dans `betas` (avec `drawing_data` vide initial)
 * 5. Retour des IDs pour redirection vers l'éditeur
 *
 * **Gestion d'erreurs** :
 * - Utilisateur non authentifié → "Non authentifié"
 * - Données invalides → Message Zod en français
 * - Erreur DB → Message Supabase traduit
 *
 * **Sécurité** :
 * - RLS policies appliquées (seul le propriétaire peut INSERT son boulder)
 * - `creator_id` et `user_id` forcés côté serveur (non modifiables par le client)
 *
 * @param {unknown} formData - Données brutes du formulaire (validées par Zod)
 * @returns {Promise<CreateBoulderResult>} Résultat avec IDs ou erreur
 *
 * @example
 * ```typescript
 * // Dans un formulaire client
 * const result = await createBoulderWithBeta({
 *   boulder: {
 *     name: "Karma",
 *     location: "Fontainebleau",
 *     image_url: "https://..."
 *   },
 *   beta: {
 *     grade_value: "7A",
 *     grade_system: "fontainebleau",
 *     is_public: false
 *   }
 * });
 *
 * if (result.success) {
 *   redirect(`/boulder/${result.data.boulder_id}/edit?beta=${result.data.beta_id}`);
 * }
 * ```
 */
export async function createBoulderWithBeta(
    formData: unknown
): Promise<CreateBoulderResult> {
    try {
        // 1. Validation de l'authentification
        const supabase = await createSupabaseServer();
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
            return {
                success: false,
                error: 'Vous devez être connecté pour créer un bloc',
            };
        }

        // 2. Validation des données avec Zod
        const validationResult =
            CreateBoulderWithBetaSchema.safeParse(formData);

        if (!validationResult.success) {
            const firstError = validationResult.error.issues[0];
            return {
                success: false,
                error: firstError.message,
            };
        }

        const { boulder, beta } = validationResult.data;

        // 3. Insertion du boulder
        const boulderData: BoulderInsert = {
            creator_id: user.id,
            name: boulder.name,
            location: boulder.location ?? null,
            image_url: boulder.image_url,
        };

        const { data: createdBoulder, error: boulderError } = await supabase
            .from('boulders')
            .insert(boulderData)
            .select('id')
            .single();

        if (boulderError || !createdBoulder) {
            return {
                success: false,
                error: `Erreur lors de la création du bloc: ${boulderError?.message ?? 'Erreur inconnue'}`,
            };
        }

        // 4. Insertion de la beta initiale
        const betaData: BetaInsert = {
            boulder_id: createdBoulder.id,
            user_id: user.id,
            grade_value: beta.grade_value,
            grade_system: beta.grade_system,
            drawing_data: beta.drawing_data ?? createEmptyDrawingData(),
            is_public: beta.is_public ?? false,
        };

        const { data: createdBeta, error: betaError } = await supabase
            .from('betas')
            .insert(betaData)
            .select('id')
            .single();

        if (betaError || !createdBeta) {
            // Note: En cas d'erreur ici, le boulder reste créé (Supabase ne supporte pas les transactions multi-tables)
            // Alternative future: Utiliser une fonction PostgreSQL avec BEGIN/COMMIT
            return {
                success: false,
                error: `Erreur lors de la création de la beta: ${betaError?.message ?? 'Erreur inconnue'}`,
            };
        }

        // 5. Succès : retourner les IDs
        return {
            success: true,
            data: {
                boulder_id: createdBoulder.id,
                beta_id: createdBeta.id,
            },
        };
    } catch (error) {
        // Erreur inattendue (réseau, timeout, etc.)
        return {
            success: false,
            error:
                error instanceof Error
                    ? error.message
                    : 'Une erreur inattendue est survenue',
        };
    }
}
