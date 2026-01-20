'use client';

import { useCallback, useRef, useEffect } from 'react';
import { useGradingStore } from '../store/useGradingStore';
import { updateUserPreference, getUserPreference } from '../actions/update-preference';
import { type GradeSystem } from '../constants/grades';

interface UseGradingPreferenceSyncOptions {
    /** Délai de debounce pour la sauvegarde (ms) */
    debounceMs?: number;
    /** Callback en cas d'erreur */
    onError?: (error: string) => void;
    /** Callback après sauvegarde réussie */
    onSuccess?: () => void;
}

/**
 * Hook pour synchroniser les préférences de cotation avec la base de données.
 * 
 * @description
 * - Hydrate le store avec la valeur DB au montage
 * - Sauvegarde en DB avec debounce lors des changements
 * - Mise à jour optimiste du store local
 * 
 * @example
 * ```tsx
 * function SettingsPage() {
 *   const {
 *     preferredSystem,
 *     setPreferredSystem,
 *     isSyncing,
 *   } = useGradingPreferenceSync({
 *     onError: (err) => toast.error(err),
 *     onSuccess: () => toast.success('Préférence sauvegardée'),
 *   });
 * 
 *   return (
 *     <GradeSystemToggle
 *       value={preferredSystem}
 *       onChange={setPreferredSystem}
 *       disabled={isSyncing}
 *     />
 *   );
 * }
 * ```
 */
export function useGradingPreferenceSync(options: UseGradingPreferenceSyncOptions = {}) {
    const { debounceMs = 500, onError, onSuccess } = options;

    const preferredSystem = useGradingStore((s) => s.preferredSystem);
    const setStorePreference = useGradingStore((s) => s.setPreferredSystem);
    const hasHydrated = useGradingStore((s) => s.hasHydrated);

    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const isSyncingRef = useRef(false);
    const hasSyncedFromDBRef = useRef(false);

    // Hydrater depuis la DB au premier montage
    useEffect(() => {
        if (!hasHydrated || hasSyncedFromDBRef.current) return;

        async function syncFromDB() {
            try {
                const dbPreference = await getUserPreference();
                setStorePreference(dbPreference);
                hasSyncedFromDBRef.current = true;
            } catch {
                // Silently fail - use localStorage value
            }
        }

        void syncFromDB();
    }, [hasHydrated, setStorePreference]);

    // Setter avec sync DB (debounced)
    const setPreferredSystem = useCallback(
        (system: GradeSystem) => {
            // Mise à jour optimiste immédiate du store
            setStorePreference(system);

            // Annuler le timeout précédent
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }

            // Sauvegarder en DB après debounce
            timeoutRef.current = setTimeout(async () => {
                if (isSyncingRef.current) return;

                isSyncingRef.current = true;
                try {
                    const result = await updateUserPreference(system);
                    if (result.success) {
                        onSuccess?.();
                    } else {
                        onError?.(result.error ?? 'Erreur inconnue');
                    }
                } catch {
                    onError?.('Erreur de connexion');
                } finally {
                    isSyncingRef.current = false;
                }
            }, debounceMs);
        },
        [setStorePreference, debounceMs, onError, onSuccess]
    );

    // Cleanup
    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    return {
        preferredSystem,
        setPreferredSystem,
        hasHydrated,
        isSyncing: isSyncingRef.current,
    };
}
