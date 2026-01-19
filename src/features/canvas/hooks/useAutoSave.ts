import { useEffect, useRef, useState } from 'react';
import { useCanvasStore } from '../store/canvasStore';
import { saveBetaDrawing } from '@/features/boulder/actions/save-beta-drawing';

/**
 * Statut de la sauvegarde automatique.
 */
export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error' | 'conflict';

/**
 * Résultat du hook useAutoSave.
 */
export interface UseAutoSaveResult {
    /** Statut actuel de la sauvegarde */
    saveStatus: SaveStatus;
    /** Message d'erreur si status === 'error' */
    errorMessage: string | null;
    /** Force une sauvegarde immédiate (ignore l'intervalle) */
    forceSave: () => Promise<void>;
    /** Réinitialise le statut et l'erreur */
    resetStatus: () => void;
}

/**
 * Hook pour la sauvegarde automatique du Canvas vers le cloud.
 *
 * @description
 * Synchronise automatiquement les données de dessin (`drawingData`) avec Supabase
 * toutes les 5 secondes. Utilise un système de détection de modifications basé
 * sur un hash rapide pour éviter les uploads inutiles.
 *
 * **Fonctionnement** :
 * 1. Toutes les 5s : Vérifie si `drawingData` a changé
 * 2. Si changements ET `betaId` présent : Appelle `saveBetaDrawing`
 * 3. Met à jour `lastUpdatedAt` avec la réponse serveur
 * 4. Gère les conflits et erreurs
 *
 * **Détection de modifications** :
 * - Hash basé sur : `version` + nombre de `lines` + nombre de `shapes`
 * - O(1) complexity (pas de JSON.stringify)
 *
 * **Gestion fermeture onglet** :
 * - `beforeunload` warning si sauvegarde en cours
 * - localStorage backup automatique via Zustand Persist (fallback)
 *
 * @param {string | null} betaId - UUID de la beta à sauvegarder (null = mode hors ligne)
 * @returns {UseAutoSaveResult} Statut et actions de contrôle
 *
 * @example
 * ```typescript
 * function CanvasEditor({ betaId }: { betaId: string }) {
 *   const { saveStatus, errorMessage, forceSave } = useAutoSave(betaId);
 *
 *   return (
 *     <>
 *       <SaveIndicator status={saveStatus} />
 *       {errorMessage && <ErrorToast message={errorMessage} />}
 *       <button onClick={forceSave}>Sauvegarder maintenant</button>
 *     </>
 *   );
 * }
 * ```
 */
export function useAutoSave(betaId: string | null): UseAutoSaveResult {
    // État du hook
    const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    // Timestamp de la dernière sauvegarde réussie (reçu du serveur)
    const lastUpdatedAtRef = useRef<string | null>(null);

    // Hash du dernier état sauvegardé (pour détecter les modifications)
    const lastSavedHashRef = useRef<string | null>(null);

    // Récupère drawingData depuis le store
    const drawingData = useCanvasStore((state) => state.drawingData);

    /**
     * Génère un hash rapide du drawingData pour détecter les modifications.
     * Utilise version + longueur lines + longueur shapes (O(1) complexity).
     */
    const generateHash = (data: typeof drawingData): string => {
        return `v${data.version}-l${data.lines.length}-s${data.shapes.length}`;
    };

    /**
     * Logique de sauvegarde (réutilisable pour auto-save et force save).
     */
    const performSave = async (): Promise<void> => {
        // Vérifications préalables
        if (!betaId) {
            // Mode hors ligne : ne rien faire
            return;
        }

        if (!lastUpdatedAtRef.current) {
            // Pas de timestamp initial → impossible de détecter conflit
            // Ce cas arrive au premier chargement avant le premier GET
            console.warn(
                '[useAutoSave] Pas de lastUpdatedAt initial. Sauvegarde ignorée.'
            );
            return;
        }

        const currentHash = generateHash(drawingData);

        // Vérifier si les données ont changé
        if (currentHash === lastSavedHashRef.current) {
            // Aucune modification → skip
            return;
        }

        // Début de la sauvegarde
        setSaveStatus('saving');
        setErrorMessage(null);

        try {
            const result = await saveBetaDrawing(
                betaId,
                drawingData,
                lastUpdatedAtRef.current
            );

            if (result.success) {
                // Sauvegarde réussie
                setSaveStatus('saved');
                lastUpdatedAtRef.current = result.data.updated_at;
                lastSavedHashRef.current = currentHash;

                // Retour à 'idle' après 2 secondes
                setTimeout(() => {
                    setSaveStatus((prev) => (prev === 'saved' ? 'idle' : prev));
                }, 2000);
            } else if (result.conflict) {
                // Conflit détecté
                setSaveStatus('conflict');
                setErrorMessage(
                    'Une version plus récente existe. Rechargez la page pour voir les modifications.'
                );

                // NOTE: Dans une implémentation complète, on afficherait un modal
                // avec les données serveur (result.serverData) pour résolution manuelle
            } else {
                // Erreur serveur
                setSaveStatus('error');
                setErrorMessage(result.error);
            }
        } catch (error) {
            // Erreur réseau ou inattendue
            setSaveStatus('error');
            setErrorMessage(
                error instanceof Error ? error.message : 'Erreur réseau'
            );
        }
    };

    /**
     * Force une sauvegarde immédiate (ignorant l'intervalle et la détection de hash).
     */
    const forceSave = async (): Promise<void> => {
        // Réinitialiser le hash pour forcer la sauvegarde même sans modification
        lastSavedHashRef.current = null;
        await performSave();
    };

    /**
     * Réinitialise le statut et l'erreur.
     */
    const resetStatus = (): void => {
        setSaveStatus('idle');
        setErrorMessage(null);
    };

    // ========================================================================
    // EFFET : Auto-save toutes les 5 secondes
    // ========================================================================

    useEffect(() => {
        // Ne démarrer l'intervalle que si betaId est présent
        if (!betaId) {
            return;
        }

        const intervalId = setInterval(() => {
            void performSave();
        }, 5000); // 5 secondes

        return () => clearInterval(intervalId);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [betaId, drawingData]); // Re-créer l'intervalle si betaId ou drawingData change

    // ========================================================================
    // EFFET : Warning si fermeture onglet pendant sauvegarde
    // ========================================================================

    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent): string | undefined => {
            if (saveStatus === 'saving') {
                const message =
                    'Sauvegarde en cours. Voulez-vous vraiment quitter ?';
                e.preventDefault();
                e.returnValue = message; // Chrome nécessite returnValue
                return message;
            }
            return undefined;
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [saveStatus]);

    // ========================================================================
    // EFFET : Initialiser lastUpdatedAt au montage
    // ========================================================================

    useEffect(() => {
        // Ce timestamp sera fourni par le hook useLoadBoulder (Phase 5.5)
        // Pour l'instant, utiliser un timestamp par défaut si non défini
        if (!lastUpdatedAtRef.current) {
            // Fallback temporaire : timestamp actuel
            // IMPORTANT: Ce sera remplacé par le vrai timestamp lors du chargement en 5.5
            lastUpdatedAtRef.current = new Date().toISOString();
        }
    }, []);

    return {
        saveStatus,
        errorMessage,
        forceSave,
        resetStatus,
    };
}

/**
 * Hook pour passer le timestamp initial au useAutoSave.
 * Appelé depuis le composant parent après le chargement initial de la beta.
 *
 * @description
 * Ce hook sera utilisé en Phase 5.5 pour initialiser le timestamp
 * après le chargement des données depuis Supabase.
 *
 * @param {string | null} updatedAt - Timestamp ISO 8601 du serveur
 *
 * @example
 * ```typescript
 * // Dans le composant parent (après useLoadBoulder)
 * const { data: beta } = useLoadBoulder(betaId);
 * useInitializeAutoSave(beta?.updated_at ?? null);
 * ```
 */
export function useInitializeAutoSave(updatedAt: string | null): void {
    // NOTE: Cette implémentation sera finalisée en Phase 5.5
    // Pour l'instant, elle sert de placeholder
    useEffect(() => {
        if (updatedAt) {
            // TODO Phase 5.5: Stocker dans un contexte global ou state manager
            console.log('[useInitializeAutoSave] Timestamp initial:', updatedAt);
        }
    }, [updatedAt]);
}
