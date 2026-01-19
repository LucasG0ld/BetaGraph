'use server';

import { createSupabaseServer } from '@/lib/supabase/server';
import { DrawingDataSchema, type DrawingData } from '@/lib/schemas/drawing.schema';

/**
 * Type de retour pour l'action `saveBetaDrawing`.
 */
export type SaveBetaDrawingResult =
    | {
        success: true;
        data: {
            updated_at: string;
        };
    }
    | {
        success: false;
        conflict: true;
        serverData: {
            drawing_data: DrawingData;
            updated_at: string;
        };
    }
    | {
        success: false;
        conflict: false;
        error: string;
    };

/**
 * Server Action : Sauvegarde des données de dessin (drawing_data) d'une beta.
 *
 * @description
 * Met à jour le champ `drawing_data` d'une beta existante avec gestion de conflits
 * via optimistic locking basé sur les timestamps.
 *
 * **Flux d'exécution** :
 * 1. Validation de l'authentification (session utilisateur)
 * 2. Validation des données de dessin via Zod (DrawingDataSchema)
 * 3. Récupération de la beta actuelle en base de données
 * 4. Vérification de l'ownership (user_id = authenticated user)
 * 5. Détection de conflit (comparaison timestamps)
 * 6. Si pas de conflit : UPDATE drawing_data
 * 7. Retour du nouveau timestamp `updated_at` généré par le trigger SQL
 *
 * **Gestion de conflit (Optimistic Locking)** :
 * - Client envoie `lastUpdatedAt` = timestamp reçu lors du dernier GET/POST
 * - Serveur compare avec `updated_at` actuel en base
 * - Si `server_updated_at > client_lastUpdatedAt` → Conflit détecté
 * - Retourne les données serveur pour résolution côté client
 *
 * **Sécurité** :
 * - RLS policies appliquées (seul le propriétaire peut UPDATE)
 * - `user_id` vérifié explicitement dans la WHERE clause
 * - Validation Zod stricte des données de dessin
 *
 * @param {string} betaId - UUID de la beta à mettre à jour
 * @param {DrawingData} drawingData - Nouvelles données de dessin validées
 * @param {string} lastUpdatedAt - Timestamp ISO 8601 du dernier état connu par le client
 * @returns {Promise<SaveBetaDrawingResult>} Résultat avec nouveau timestamp ou conflit
 *
 * @example
 * ```typescript
 * // Sauvegarde réussie
 * const result = await saveBetaDrawing(
 *   "beta-uuid-123",
 *   { version: 1, lines: [...], shapes: [...] },
 *   "2026-01-19T12:00:00Z"
 * );
 *
 * if (result.success) {
 *   console.log('Sauvegardé à:', result.data.updated_at);
 *   // Mettre à jour le state local avec le nouveau timestamp
 * }
 *
 * // Conflit détecté
 * if (!result.success && result.conflict) {
 *   console.log('Conflit détecté !');
 *   console.log('Données serveur:', result.serverData.drawing_data);
 *   console.log('Timestamp serveur:', result.serverData.updated_at);
 *   // Afficher modal de résolution
 * }
 * ```
 */
export async function saveBetaDrawing(
    betaId: string,
    drawingData: unknown,
    lastUpdatedAt: string
): Promise<SaveBetaDrawingResult> {
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
                conflict: false,
                error: 'Vous devez être connecté pour sauvegarder',
            };
        }

        // 2. Validation du betaId (format UUID)
        const uuidRegex =
            /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(betaId)) {
            return {
                success: false,
                conflict: false,
                error: "L'identifiant de la beta est invalide",
            };
        }

        // 3. Validation des données de dessin avec Zod
        const validationResult = DrawingDataSchema.safeParse(drawingData);

        if (!validationResult.success) {
            const firstError = validationResult.error.issues[0];
            return {
                success: false,
                conflict: false,
                error: `Données de dessin invalides: ${firstError.message}`,
            };
        }

        const validatedDrawingData = validationResult.data;

        // 4. Récupération de la beta actuelle pour vérification
        const { data: currentBeta, error: fetchError } = await supabase
            .from('betas')
            .select('user_id, updated_at, drawing_data')
            .eq('id', betaId)
            .single();

        if (fetchError || !currentBeta) {
            return {
                success: false,
                conflict: false,
                error: 'Beta introuvable ou supprimée',
            };
        }

        // 5. Vérification de l'ownership
        if (currentBeta.user_id !== user.id) {
            return {
                success: false,
                conflict: false,
                error: "Vous n'avez pas la permission de modifier cette beta",
            };
        }

        // 6. Détection de conflit (comparaison timestamps)
        const serverUpdatedAt = new Date(currentBeta.updated_at);
        const clientLastUpdatedAt = new Date(lastUpdatedAt);

        if (serverUpdatedAt > clientLastUpdatedAt) {
            // Conflit détecté : version serveur plus récente
            return {
                success: false,
                conflict: true,
                serverData: {
                    drawing_data: currentBeta.drawing_data as DrawingData,
                    updated_at: currentBeta.updated_at,
                },
            };
        }

        // 7. Mise à jour du drawing_data
        // Le trigger SQL `update_betas_updated_at` mettra à jour `updated_at` automatiquement
        const { data: updatedBeta, error: updateError } = await supabase
            .from('betas')
            .update({
                drawing_data: validatedDrawingData,
            })
            .eq('id', betaId)
            .eq('user_id', user.id) // Double vérification ownership (sécurité)
            .select('updated_at')
            .single();

        if (updateError || !updatedBeta) {
            return {
                success: false,
                conflict: false,
                error: `Erreur lors de la sauvegarde: ${updateError?.message ?? 'Erreur inconnue'}`,
            };
        }

        // 8. Succès : retourner le nouveau timestamp
        return {
            success: true,
            data: {
                updated_at: updatedBeta.updated_at,
            },
        };
    } catch (error) {
        // Erreur inattendue (réseau, timeout, etc.)
        return {
            success: false,
            conflict: false,
            error:
                error instanceof Error
                    ? error.message
                    : 'Une erreur inattendue est survenue',
        };
    }
}
