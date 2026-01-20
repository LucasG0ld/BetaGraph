'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { type GradeSystem } from '../constants/grades';

/**
 * État du store des préférences de cotation.
 */
interface GradingPreferencesState {
    /** Système de cotation préféré de l'utilisateur */
    preferredSystem: GradeSystem;
    /** Indique si le store a été hydraté depuis localStorage */
    hasHydrated: boolean;
}

/**
 * Actions du store des préférences de cotation.
 */
interface GradingPreferencesActions {
    /** Change le système de cotation préféré */
    setPreferredSystem: (system: GradeSystem) => void;
    /** Marque le store comme hydraté (appelé après chargement localStorage) */
    setHasHydrated: (state: boolean) => void;
    /** Réinitialise au défaut (fontainebleau) */
    reset: () => void;
}

type GradingPreferencesStore = GradingPreferencesState & GradingPreferencesActions;

const DEFAULT_SYSTEM: GradeSystem = 'fontainebleau';

/**
 * Store Zustand pour les préférences de cotation utilisateur.
 * 
 * @description
 * - Persist dans localStorage pour persistance locale
 * - Gère l'hydration pour éviter le mismatch SSR/client
 * - Synchronisé avec la DB via Server Action (appel externe)
 * 
 * @example
 * ```tsx
 * // Dans un composant client
 * const { preferredSystem, setPreferredSystem, hasHydrated } = useGradingStore();
 * 
 * // Attendre l'hydration avant d'afficher
 * if (!hasHydrated) return <Skeleton />;
 * 
 * // Changer la préférence
 * setPreferredSystem('v_scale');
 * ```
 */
export const useGradingStore = create<GradingPreferencesStore>()(
    persist(
        (set) => ({
            // State
            preferredSystem: DEFAULT_SYSTEM,
            hasHydrated: false,

            // Actions
            setPreferredSystem: (system) => set({ preferredSystem: system }),
            setHasHydrated: (state) => set({ hasHydrated: state }),
            reset: () => set({ preferredSystem: DEFAULT_SYSTEM }),
        }),
        {
            name: 'betagraph-grading-preferences',
            storage: createJSONStorage(() => localStorage),
            // Ne persister que la préférence, pas le flag d'hydration
            partialize: (state) => ({ preferredSystem: state.preferredSystem }),
            // Callback appelé après hydration depuis localStorage
            onRehydrateStorage: () => (state) => {
                state?.setHasHydrated(true);
            },
        }
    )
);

/**
 * Hook pour accéder uniquement au système préféré.
 * Optimisé pour éviter les re-renders inutiles.
 */
export function usePreferredSystem(): GradeSystem {
    return useGradingStore((state) => state.preferredSystem);
}

/**
 * Hook pour vérifier si le store est hydraté.
 * Utilisé pour éviter le mismatch SSR.
 */
export function useHasHydrated(): boolean {
    return useGradingStore((state) => state.hasHydrated);
}

/**
 * Sélecteurs pour usage externe (non-React).
 */
export const gradingStoreSelectors = {
    getPreferredSystem: () => useGradingStore.getState().preferredSystem,
    setPreferredSystem: (system: GradeSystem) =>
        useGradingStore.getState().setPreferredSystem(system),
};
