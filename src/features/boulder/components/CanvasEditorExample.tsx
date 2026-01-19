/**
 * Exemple d'intégration de ConflictResolutionModal
 * 
 * Ce fichier montre comment intégrer la modal dans une page d'éditeur canvas.
 */

'use client';

import { useState } from 'react';
import { useLoadBeta } from '@/features/boulder/hooks/useLoadBeta';
import { useAutoSave } from '@/features/canvas/hooks/useAutoSave';
import { SaveIndicator } from '@/features/canvas/components/SaveIndicator';
import { ConflictResolutionModal } from '@/features/boulder/components/ConflictResolutionModal';

interface CanvasEditorProps {
    betaId: string;
}

/**
 * Exemple de composant CanvasEditor avec gestion de conflits.
 * 
 * @example
 * ```tsx
 * export default function BetaPage({ params }: { params: { id: string } }) {
 *   return <CanvasEditor betaId={params.id} />;
 * }
 * ```
 */
export function CanvasEditor({ betaId }: CanvasEditorProps) {
    const [conflictResolved, setConflictResolved] = useState(false);

    // 1. Charger la beta au montage
    const { isLoading, error, data, hasLocalUnsavedChanges, serverData } = useLoadBeta(betaId);

    // 2. Auto-save (se déclenche seulement si pas de conflit)
    const { saveStatus, errorMessage, forceSave } = useAutoSave(
        !serverData ? betaId : null // Désactiver auto-save si conflit
    );

    // Gérer résolution de conflit
    const handleResolveConflict = (choice: 'local' | 'server') => {
        console.log(`Conflit résolu: ${choice} choisi`);
        setConflictResolved(true);

        // Optionnel : Force save immédiate si user a gardé sa version
        if (choice === 'local') {
            void forceSave();
        }
    };

    // Loading state
    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <div className="text-white">Chargement de la beta...</div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="flex h-screen items-center justify-center">
                <div className="text-red-400">Erreur: {error}</div>
            </div>
        );
    }

    // Conflict state (PRIORITAIRE)
    if (serverData && !conflictResolved) {
        return (
            <ConflictResolutionModal
                localData={data}
                serverData={serverData}
                onResolve={handleResolveConflict}
            />
        );
    }

    // Normal editor view
    return (
        <div className="relative h-screen bg-brand-gray-900">
            {/* Canvas Component (Phase 4) */}
            <div className="h-full">
                {/* Votre Canvas va ici */}
                <canvas className="h-full w-full" />
            </div>

            {/* Save Indicator (toujours affiché) */}
            <SaveIndicator status={saveStatus} />

            {/* Unsaved changes banner */}
            {hasLocalUnsavedChanges && (
                <div className="fixed bottom-16 right-4 rounded-lg border-2 border-yellow-500 bg-brand-gray-800 p-3 text-sm text-yellow-400">
                    <p className="font-semibold">⚠️ Modifications non sauvegardées</p>
                    <p className="text-xs text-brand-gray-300">
                        Vos changements seront envoyés au serveur automatiquement.
                    </p>
                </div>
            )}

            {/* Error toast (si save échoue) */}
            {errorMessage && (
                <div className="fixed bottom-16 right-4 rounded-lg border-2 border-red-500 bg-brand-gray-800 p-3 text-sm text-red-400">
                    <p className="font-semibold">❌ Erreur de sauvegarde</p>
                    <p className="text-xs text-brand-gray-300">{errorMessage}</p>
                </div>
            )}
        </div>
    );
}
