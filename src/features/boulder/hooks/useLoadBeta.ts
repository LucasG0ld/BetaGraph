import { useEffect, useState } from 'react';
import { supabaseBrowser } from '@/lib/supabase/client';
import { useCanvasStore } from '@/features/canvas/store/canvasStore';
import type { DrawingData } from '@/lib/schemas/drawing.schema';

/**
 * Résultat du chargement d'une beta.
 */
export interface LoadBetaResult {
    /** Indique si le chargement est en cours */
    isLoading: boolean;
    /** Message d'erreur si le chargement a échoué */
    error: string | null;
    /** Données de la beta chargée depuis le serveur */
    data: BetaData | null;
    /** Flag indiquant des modifications locales non sauvegardées */
    hasLocalUnsavedChanges: boolean;
    /** Données serveur si conflit détecté (pour résolution manuelle) */
    serverData: BetaData | null;
}

/**
 * Données d'une beta (structure retournée par Supabase).
 */
export interface BetaData {
    id: string;
    boulder_id: string;
    user_id: string;
    grade_value: string;
    grade_system: 'fontainebleau' | 'v_scale';
    drawing_data: DrawingData;
    is_public: boolean;
    created_at: string;
    updated_at: string;
    boulder?: {
        name: string;
        location: string;
        image_url: string;
        // Add dimensions if they exist, otherwise we'll handle missing dims
    };
}

/**
 * Hook pour charger une beta depuis Supabase au démarrage.
 *
 * @description
 * Gère le chargement initial d'une beta avec comparaison intelligente entre
 * les données locales (localStorage via Zustand Persist) et les données serveur.
 *
 * **Flux d'exécution** :
 * 1. Au montage, fetch la beta depuis Supabase
 * 2. Récupère l'état actuel du store (chargé automatiquement par persist)
 * 3. **Comparaison timestamps** :
 *    - Pas de données locales → Charger serveur
 *    - `lastSyncedWithServer === server.updated_at` → Garder local (déjà sync)
 *    - `server.updated_at > local.lastModifiedLocally` → Charger serveur
 *    - `local.lastModifiedLocally > server.updated_at` → Garder local + flag unsaved
 * 4. Clear historique undo/redo (zundo) pour démarrer propre
 *
 * **Gestion de conflits** :
 * - Si conflit détecté, retourne `serverData` pour résolution manuelle (Phase 5.6)
 * - User choisit : garder local ou charger serveur
 *
 * @param {string | null} betaId - UUID de la beta à charger (null = mode création)
 * @returns {LoadBetaResult} État du chargement et données
 *
 * @example
 * ```typescript
 * function CanvasEditor({ betaId }: { betaId: string }) {
 *   const { isLoading, error, data, hasLocalUnsavedChanges, serverData } = useLoadBeta(betaId);
 *
 *   if (isLoading) return <Spinner />;
 *   if (error) return <ErrorMessage message={error} />;
 *
 *   if (serverData) {
 *     // Conflit détecté → Afficher modal résolution (Phase 5.6)
 *     return <ConflictModal localData={data} serverData={serverData} />;
 *   }
 *
 *   if (hasLocalUnsavedChanges) {
 *     return <Banner>Modifications locales non sauvegardées</Banner>;
 *   }
 *
 *   return <Canvas />;
 * }
 * ```
 */
export function useLoadBeta(betaId: string | null): LoadBetaResult {
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [data, setData] = useState<BetaData | null>(null);
    const [hasLocalUnsavedChanges, setHasLocalUnsavedChanges] = useState(false);
    const [serverData, setServerData] = useState<BetaData | null>(null);

    // Récupère l'état actuel du store canvas
    const localDrawingData = useCanvasStore((state) => state.drawingData);
    const localLastModified = useCanvasStore((state) => state.lastModifiedLocally);
    const localLastSynced = useCanvasStore((state) => state.lastSyncedWithServer);
    const loadDrawingData = useCanvasStore((state) => state.loadDrawingData);

    useEffect(() => {
        // Mode création (pas de betaId) → Skip chargement
        if (!betaId) {
            setIsLoading(false);
            return;
        }

        const loadBeta = async () => {
            try {
                setIsLoading(true);
                setError(null);

                // 1. Fetch beta depuis Supabase
                const { data: fetchedBeta, error: fetchError } = await supabaseBrowser
                    .from('betas')
                    .select('*, boulder:boulders(*)')
                    .eq('id', betaId)
                    .maybeSingle();

                if (fetchError) {
                    setError(`Erreur de chargement: ${fetchError.message}`);
                    setIsLoading(false);
                    return;
                }

                if (!fetchedBeta) {
                    setError('Beta introuvable');
                    setIsLoading(false);
                    return;
                }

                setData(fetchedBeta);

                // 2. Vérifier s'il y a des données locales
                const hasLocalData =
                    localDrawingData &&
                    (localDrawingData.lines.length > 0 || localDrawingData.shapes.length > 0);

                // 3. Décision de chargement
                const decision = decideLoadStrategy({
                    hasLocalData,
                    localLastModified,
                    localLastSynced,
                    serverUpdatedAt: fetchedBeta.updated_at,
                });

                switch (decision) {
                    case 'LOAD_SERVER':
                        // Charger les données serveur
                        loadDrawingData(fetchedBeta.drawing_data, fetchedBeta.updated_at);

                        // Clear historique undo/redo pour démarrer propre
                        useCanvasStore.temporal.getState().clear();

                        setHasLocalUnsavedChanges(false);
                        setServerData(null);
                        break;

                    case 'KEEP_LOCAL':
                        // Garder les données locales (déjà synchronisées)
                        setHasLocalUnsavedChanges(false);
                        setServerData(null);
                        break;

                    case 'KEEP_LOCAL_UNSAVED':
                        // Garder local mais marquer comme non sauvegardé
                        setHasLocalUnsavedChanges(true);
                        setServerData(null);
                        break;

                    case 'PROMPT_USER':
                        // Conflit détecté → Laisser user choisir (Phase 5.6)
                        setHasLocalUnsavedChanges(true);
                        setServerData(fetchedBeta);
                        break;
                }

                setIsLoading(false);
            } catch (err) {
                setError(
                    err instanceof Error ? err.message : 'Erreur inattendue'
                );
                setIsLoading(false);
            }
        };

        void loadBeta();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [betaId]); // Ne relancer que si betaId change

    return {
        isLoading,
        error,
        data,
        hasLocalUnsavedChanges,
        serverData,
    };
}

/**
 * Décide de la stratégie de chargement en comparant timestamps local/serveur.
 */
function decideLoadStrategy(params: {
    hasLocalData: boolean;
    localLastModified: string | null;
    localLastSynced: string | null;
    serverUpdatedAt: string;
}): 'LOAD_SERVER' | 'KEEP_LOCAL' | 'KEEP_LOCAL_UNSAVED' | 'PROMPT_USER' {
    const { hasLocalData, localLastModified, localLastSynced, serverUpdatedAt } = params;

    // Cas 1 : Pas de données locales → Charger serveur
    if (!hasLocalData || !localLastModified) {
        return 'LOAD_SERVER';
    }

    // Cas 2 : Déjà synchronisé avec cette version serveur
    if (localLastSynced === serverUpdatedAt) {
        // Mais vérifier si modifié localement après le sync
        const localTime = new Date(localLastModified);
        const syncTime = new Date(localLastSynced);

        if (localTime > syncTime) {
            // Modifié après le dernier sync
            return 'KEEP_LOCAL_UNSAVED';
        }
        return 'KEEP_LOCAL';
    }

    // Cas 3 : Comparer timestamps
    const localTime = new Date(localLastModified);
    const serverTime = new Date(serverUpdatedAt);

    // Serveur plus récent ET jamais synchronisé → Demander à user
    if (serverTime > localTime && !localLastSynced) {
        return 'PROMPT_USER';
    }

    // Serveur plus récent ET déjà synchronisé avant → Charger serveur
    if (serverTime > localTime && localLastSynced) {
        return 'LOAD_SERVER';
    }

    // Local plus récent → Garder local + flag unsaved
    return 'KEEP_LOCAL_UNSAVED';
}

/**
 * Action pour forcer le chargement des données serveur.
 * Utilisé dans le ConflictModal (Phase 5.6) quand user choisit "Garder version serveur".
 *
 * @param {BetaData} beta - Données beta à charger
 *
 * @example
 * ```typescript
 * function ConflictModal({ serverData }: { serverData: BetaData }) {
 *   const handleKeepServer = () => {
 *     forceLoadServerData(serverData);
 *     closeModal();
 *   };
 *
 *   return <button onClick={handleKeepServer}>Charger version serveur</button>;
 * }
 * ```
 */
export function forceLoadServerData(beta: BetaData): void {
    const { loadDrawingData } = useCanvasStore.getState();

    // Charger les données serveur
    loadDrawingData(beta.drawing_data, beta.updated_at);

    // Clear historique undo/redo
    useCanvasStore.temporal.getState().clear();
}
