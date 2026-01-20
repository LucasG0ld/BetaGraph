'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { DrawingCanvas } from '@/features/canvas/components/DrawingCanvas';
import { useLoadBeta } from '@/features/boulder/hooks/useLoadBeta';
import { useAutoSave } from '@/features/canvas/hooks/useAutoSave';
import { SaveIndicator } from '@/features/canvas/components/SaveIndicator';
import { ConflictResolutionModal } from '@/features/boulder/components/ConflictResolutionModal';

/**
 * Page de test - Canvas Phase 5 Complet
 * 
 * Test Phase 5.3-5.6 : Auto-save, Load, Résolution Conflits
 */
export default function CanvasPhase5TestPage() {
    const searchParams = useSearchParams();
    const betaId = searchParams.get('betaId');

    const [conflictResolved, setConflictResolved] = useState(false);

    // 1. Load beta au montage
    const { isLoading, error, data, hasLocalUnsavedChanges, serverData } = useLoadBeta(betaId);

    // 2. Auto-save (désactivé si conflit)
    const { saveStatus, errorMessage, forceSave } = useAutoSave(
        !serverData ? betaId : null
    );

    // Handler résolution conflit
    const handleResolveConflict = (choice: 'local' | 'server') => {
        console.log(`[Test] Conflit résolu: ${choice}`);
        setConflictResolved(true);

        if (choice === 'local') {
            // Force save immédiate
            void forceSave();
        }
    };

    // Loading state
    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-brand-gray-900">
                <div className="text-white text-xl">
                    ⏳ Chargement de la beta...
                </div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="flex h-screen items-center justify-center bg-brand-gray-900">
                <div className="text-center">
                    <div className="text-red-400 text-xl font-semibold mb-2">
                        ❌ Erreur
                    </div>
                    <div className="text-red-300">{error}</div>
                    <div className="mt-4 text-brand-gray-400 text-sm">
                        Beta ID fourni : {betaId || 'none'}
                    </div>
                </div>
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

    // Si pas de betaId, afficher message
    if (!betaId) {
        return (
            <div className="flex h-screen items-center justify-center bg-brand-gray-900">
                <div className="text-center max-w-md">
                    <div className="text-yellow-400 text-xl font-semibold mb-2">
                        ⚠️ Aucune beta spécifiée
                    </div>
                    <div className="text-brand-gray-300 mb-4">
                        Ajoutez <code className="bg-brand-gray-700 px-2 py-1 rounded">?betaId=XXX</code> à l&apos;URL
                    </div>
                    <a
                        href="/test/create-boulder"
                        className="text-brand-accent-cyan hover:underline"
                    >
                        → Créer un nouveau boulder
                    </a>
                </div>
            </div>
        );
    }

    // Normal editor view
    const imageUrl = data?.boulder_id
        ? 'https://images.unsplash.com/photo-1522163182402-834f871fd851?w=1200'
        : 'https://images.unsplash.com/photo-1522163182402-834f871fd851?w=1200';

    return (
        <div className="relative h-screen bg-brand-gray-900 flex flex-col">
            {/* Header */}
            <header className="flex-shrink-0 p-4 border-b border-white/10 bg-brand-gray-800">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold text-white">
                            🧪 Test Canvas Phase 5
                        </h1>
                        <p className="text-sm text-brand-gray-400">
                            Beta ID: {betaId}
                        </p>
                    </div>

                    {/* Status Indicators */}
                    <div className="flex items-center gap-4">
                        {hasLocalUnsavedChanges && (
                            <div className="text-xs text-yellow-400 flex items-center gap-1">
                                <span>⚠️</span>
                                <span>Modifications non sauvegardées</span>
                            </div>
                        )}

                        <div className="text-xs text-brand-gray-400">
                            Status: <span className="text-brand-accent-cyan">{saveStatus}</span>
                        </div>
                    </div>
                </div>
            </header>

            {/* Canvas */}
            <main className="flex-1 relative">
                <DrawingCanvas
                    imageUrl={imageUrl}
                    imageWidth={1200}
                    imageHeight={800}
                    className="absolute inset-0"
                />
            </main>

            {/* Save Indicator (toujours affiché) */}
            <SaveIndicator status={saveStatus} />

            {/* Error toast */}
            {errorMessage && (
                <div className="fixed bottom-20 right-4 max-w-sm rounded-lg border-2 border-red-500 bg-brand-gray-800 p-4 shadow-2xl z-40">
                    <p className="text-red-400 font-semibold flex items-center gap-2">
                        <span>❌</span>
                        <span>Erreur de sauvegarde</span>
                    </p>
                    <p className="text-brand-gray-300 text-sm mt-1">{errorMessage}</p>
                </div>
            )}

            {/* Test Instructions */}
            <footer className="flex-shrink-0 p-4 border-t border-white/10 bg-black/50">
                <div className="text-xs text-brand-gray-400 grid grid-cols-3 gap-4">
                    <div>
                        <span className="text-white font-medium">✏️ Test Auto-Save:</span>
                        <p>Dessinez → Attendez 5s → Vérifiez indicateur</p>
                    </div>
                    <div>
                        <span className="text-white font-medium">📥 Test Load:</span>
                        <p>Rechargez page → Dessins chargés</p>
                    </div>
                    <div>
                        <span className="text-white font-medium">⚠️ Test Conflit:</span>
                        <p>Modifiez dans Supabase → Rechargez</p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
